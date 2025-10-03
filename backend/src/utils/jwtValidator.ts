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
    private static getJwksClient(tenantId: string): jwksClient.JwksClient {
        if (!this.jwksClients.has(tenantId)) {
            const client = jwksClient({
                jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
                cache: true,
                cacheMaxAge: 86400000, // 24 hours
                rateLimit: true,
                jwksRequestsPerMinute: 10
            });
            this.jwksClients.set(tenantId, client);
        }
        return this.jwksClients.get(tenantId)!;
    }

    /**
     * Get signing key from JWKS endpoint
     */
    private static async getSigningKey(tenantId: string, kid: string): Promise<string> {
        const client = this.getJwksClient(tenantId);

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

            // Get signing key
            const signingKey = await this.getSigningKey(tenantId, header.kid);

            // Verify token
            const verified = jwt.verify(token, signingKey, {
                algorithms: ['RS256'],
                audience: process.env.ENTRA_CLIENT_ID,
                issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`
            }) as DecodedToken;

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
