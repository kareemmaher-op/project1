import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

interface DecodedToken {
    oid: string;
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    aud: string;
    iss: string;
    exp: number;
}

export class JwtValidator {
    private static jwksClients: Map<string, jwksClient.JwksClient> = new Map();

    /**
     * Get or create JWKS client for a specific tenant
     */
    private static getJwksClient(cacheKey: string, jwksUri: string): jwksClient.JwksClient {
        if (!this.jwksClients.has(cacheKey)) {
            const client = jwksClient({
                jwksUri,
                cache: true,
                cacheMaxAge: 86400000, // 24 hours
                rateLimit: true,
                jwksRequestsPerMinute: 10
            });
            this.jwksClients.set(cacheKey, client);
        }
        return this.jwksClients.get(cacheKey)!;
    }

    /**
     * Get signing key from JWKS endpoint
     */
    private static async getSigningKey(cacheKey: string, jwksUri: string, kid: string): Promise<string> {
        const client = this.getJwksClient(cacheKey, jwksUri);

        return new Promise((resolve, reject) => {
            client.getSigningKey(kid, (err, key) => {
                if (err) {
                    reject(err);
                    return;
                }
                const signingKey = key?.getPublicKey();
                if (!signingKey) {
                    reject(new Error('Unable to get signing key'));
                    return;
                }
                resolve(signingKey);
            });
        });
    }

    /**
     * Validate JWT token from Azure Entra ID
     */
    static async validateToken(token: string): Promise<DecodedToken> {
        try {
            // Decode token without verification to get header
            const decodedHeader = jwt.decode(token, { complete: true });

            if (!decodedHeader || typeof decodedHeader === 'string') {
                throw new Error('Invalid token format');
            }

            const { header, payload } = decodedHeader;

            if (!header.kid) {
                throw new Error('Token missing key ID (kid)');
            }

            if (!payload || typeof payload === 'string') {
                throw new Error('Invalid token payload');
            }

            // Get tenant ID from environment or token
            const tenantId = process.env.ENTRA_TENANT_ID;
            if (!tenantId) {
                throw new Error('ENTRA_TENANT_ID not configured');
            }

            // Determine the correct JWKS endpoint based on configuration and token issuer
            const configuredAuthority = process.env.ENTRA_AUTHORITY?.replace(/\/$/, '');
            const ciamDomain = process.env.ENTRA_CIAM_DOMAIN; // e.g. testexternaltenant12.ciamlogin.com
            const tokenIssuer = typeof (payload as any).iss === 'string' ? (payload as any).iss as string : undefined;

            const issuerBaseFromToken = tokenIssuer?.replace(/\/v2\.0$/, '') ?? null;

            let jwksAuthorityBase: string;
            if (configuredAuthority) {
                jwksAuthorityBase = configuredAuthority;
            } else if (ciamDomain) {
                jwksAuthorityBase = `https://${ciamDomain}/${tenantId}`;
            } else if (issuerBaseFromToken) {
                jwksAuthorityBase = issuerBaseFromToken;
            } else {
                jwksAuthorityBase = `https://login.microsoftonline.com/${tenantId}`;
            }

            const jwksUri = `${jwksAuthorityBase}/discovery/v2.0/keys`;
            const jwksCacheKey = `${tenantId}|${jwksAuthorityBase}`;

            // Get signing key
            const signingKey = await this.getSigningKey(jwksCacheKey, jwksUri, header.kid);

            // Build the exact expected issuer. Prefer explicit ENTRA_AUTHORITY if provided,
            // otherwise require CIAM domain + tenantId when ENTRA_CIAM_DOMAIN is set.

            let validIssuers: string[] = [];
            if (configuredAuthority) {
                validIssuers = [`${configuredAuthority}/v2.0`];
            } else if (ciamDomain) {
                validIssuers = [`https://${ciamDomain}/${tenantId}/v2.0`];
                // Include alternate CIAM host pattern where tenant ID forms the subdomain
                const tenantIdSubdomainIssuer = `https://${tenantId}.ciamlogin.com/${tenantId}/v2.0`;
                if (!validIssuers.includes(tenantIdSubdomainIssuer)) {
                    validIssuers.push(tenantIdSubdomainIssuer);
                }
                // If a B2C/CIAM user flow (policy) is provided, include the tfp issuer form
                const policy = process.env.ENTRA_B2C_POLICY; // e.g. B2C_1_signup_signin
                if (policy) {
                    // CIAM/B2C tokens may present issuer with tfp path including primary domain and policy
                    const primaryDomain = process.env.ENTRA_PRIMARY_DOMAIN || `${tenantId}`; // fallback to tenantId if not provided
                    // Common patterns:
                    // - https://{ciamDomain}/{tenantId}/v2.0 (already covered)
                    // - https://{ciamDomain}/{primaryDomain}/{policy}/v2.0
                    validIssuers.push(`https://${ciamDomain}/${primaryDomain}/${policy}/v2.0`);
                    // Also include b2clogin pattern for tenants that issue via b2clogin domain
                    const b2cLoginDomain = process.env.ENTRA_B2C_LOGIN_DOMAIN || `${(primaryDomain.split('.')[0] || 'unknown')}.b2clogin.com`;
                    validIssuers.push(`https://${b2cLoginDomain}/${primaryDomain}/${policy}/v2.0`);
                    // Add tenantId subdomain variant with policy as well
                    validIssuers.push(`https://${tenantId}.ciamlogin.com/${primaryDomain}/${policy}/v2.0`);
                }
            } else {
                // As a safe default, only allow the standard Entra authority for this tenant
                validIssuers = [`https://login.microsoftonline.com/${tenantId}/v2.0`];
            }

            if (tokenIssuer && !validIssuers.includes(tokenIssuer)) {
                validIssuers.push(tokenIssuer);
            }

            validIssuers = Array.from(new Set(validIssuers));

            const tokenIss = tokenIssuer;
            console.log('Token payload issuer:', tokenIss);
            console.log('Accepted issuer(s):', validIssuers.join(', '));

            // Verify token
            const verified = jwt.verify(token, signingKey, {
                algorithms: ['RS256'],
                audience: process.env.ENTRA_CLIENT_ID,
                issuer: (validIssuers.length === 1 ? validIssuers[0] : (validIssuers as [string, ...string[]]))
            }) as unknown as DecodedToken;

            return verified;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token has expired');
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error(`Invalid token: ${error.message}`);
            } else if (error instanceof Error) {
                throw new Error(`Token validation failed: ${error.message}`);
            } else {
                throw new Error('Token validation failed');
            }
        }
    }

    /**
     * Extract bearer token from Authorization header
     */
    static extractBearerToken(authHeader: string | null): string | null {
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
            return null;
        }

        return parts[1];
    }

    /**
     * Validate and decode token from Authorization header
     */
    static async validateAuthHeader(authHeader: string | null): Promise<DecodedToken> {
        const token = this.extractBearerToken(authHeader);

        if (!token) {
            throw new Error('No valid bearer token found');
        }

        return await this.validateToken(token);
    }
}
