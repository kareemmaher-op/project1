import { HttpRequest, InvocationContext } from '@azure/functions';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private static limits: Map<string, RateLimitEntry> = new Map();
    private static readonly CLEANUP_INTERVAL = 60000; // 1 minute
    private static cleanupTimer: NodeJS.Timeout | null = null;

    /**
     * Rate limit configuration per endpoint
     */
    private static readonly DEFAULT_LIMIT = 100; // requests per window
    private static readonly DEFAULT_WINDOW = 60000; // 1 minute in ms

    private static readonly ENDPOINT_LIMITS: Record<string, { limit: number; window: number }> = {
        'POST:/api/auth/users': { limit: 10, window: 60000 }, // 10 registrations per minute
        'POST:/api/cases': { limit: 50, window: 60000 }, // 50 case creations per minute
        'POST:/api/patients': { limit: 50, window: 60000 },
        'POST:/api/medications': { limit: 100, window: 60000 },
        'POST:/api/add-emergency-contacts': { limit: 30, window: 60000 },
        'POST:/api/notification-preferences': { limit: 50, window: 60000 },
        'POST:/api/invite-member': { limit: 20, window: 60000 },
    };

    /**
     * Initialize cleanup timer
     */
    private static startCleanup(): void {
        if (!this.cleanupTimer) {
            this.cleanupTimer = setInterval(() => {
                this.cleanup();
            }, this.CLEANUP_INTERVAL);
        }
    }

    /**
     * Clean up expired rate limit entries
     */
    private static cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }

    /**
     * Get rate limit key from request
     */
    private static getKey(request: HttpRequest, identifier: string): string {
        const method = request.method;
        const path = request.url.split('?')[0]; // Remove query params
        return `${identifier}:${method}:${path}`;
    }

    /**
     * Get identifier from request (IP or user ID)
     */
    private static getIdentifier(request: HttpRequest): string {
        // Try to get user OID from authenticated request
        const userOid = request.headers.get('x-user-oid');
        if (userOid) {
            return `user:${userOid}`;
        }

        // Fallback to IP address
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        return `ip:${ip}`;
    }

    /**
     * Get rate limit for specific endpoint
     */
    private static getLimitForEndpoint(method: string, path: string): { limit: number; window: number } {
        const key = `${method}:${path}`;
        return this.ENDPOINT_LIMITS[key] || { limit: this.DEFAULT_LIMIT, window: this.DEFAULT_WINDOW };
    }

    /**
     * Check if request should be rate limited
     */
    static checkLimit(request: HttpRequest, context: InvocationContext): { allowed: boolean; remaining: number; resetTime: number } {
        this.startCleanup();

        const identifier = this.getIdentifier(request);
        const key = this.getKey(request, identifier);
        const now = Date.now();

        const method = request.method;
        const path = request.url.split('?')[0];
        const { limit, window } = this.getLimitForEndpoint(method, path);

        const entry = this.limits.get(key);

        if (!entry || now > entry.resetTime) {
            // First request or expired window - create new entry
            const resetTime = now + window;
            this.limits.set(key, { count: 1, resetTime });
            context.log(`Rate limit: ${identifier} - ${key}: 1/${limit} (reset: ${new Date(resetTime).toISOString()})`);
            return { allowed: true, remaining: limit - 1, resetTime };
        }

        if (entry.count >= limit) {
            // Rate limit exceeded
            context.warn(`Rate limit exceeded: ${identifier} - ${key}: ${entry.count}/${limit}`);
            return { allowed: false, remaining: 0, resetTime: entry.resetTime };
        }

        // Increment count
        entry.count++;
        this.limits.set(key, entry);
        context.log(`Rate limit: ${identifier} - ${key}: ${entry.count}/${limit}`);
        return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime };
    }

    /**
     * Middleware wrapper that applies rate limiting
     */
    static withRateLimit(handler: (request: HttpRequest, context: InvocationContext) => Promise<any>) {
        return async (request: HttpRequest, context: InvocationContext) => {
            const { allowed, remaining, resetTime } = this.checkLimit(request, context);

            if (!allowed) {
                const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
                return {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': retryAfter.toString(),
                        'X-RateLimit-Limit': this.getLimitForEndpoint(request.method, request.url.split('?')[0]).limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
                    },
                    body: JSON.stringify({
                        success: false,
                        message: 'Too many requests. Please try again later.',
                        retryAfter: retryAfter
                    })
                };
            }

            // Add rate limit headers to response
            const response = await handler(request, context);

            if (response && response.headers) {
                response.headers['X-RateLimit-Limit'] = this.getLimitForEndpoint(request.method, request.url.split('?')[0]).limit.toString();
                response.headers['X-RateLimit-Remaining'] = remaining.toString();
                response.headers['X-RateLimit-Reset'] = new Date(resetTime).toISOString();
            }

            return response;
        };
    }

    /**
     * Reset rate limits for a specific identifier (for testing)
     */
    static reset(identifier?: string): void {
        if (identifier) {
            for (const [key] of this.limits.entries()) {
                if (key.startsWith(identifier)) {
                    this.limits.delete(key);
                }
            }
        } else {
            this.limits.clear();
        }
    }
}
