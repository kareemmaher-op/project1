import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getDatabase } from '../database/config/database';

interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    checks: {
        database: {
            status: 'up' | 'down';
            responseTime?: number;
            error?: string;
        };
        memory: {
            status: 'ok' | 'warning' | 'critical';
            used: number;
            total: number;
            percentage: number;
        };
    };
}

/**
 * Health check endpoint - /api/health
 */
export async function healthCheck(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Health check requested');

    try {
        // Check database connection
        const dbCheck = await checkDatabase();

        // Check memory usage
        const memoryCheck = checkMemory();

        // Determine overall health status
        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        if (dbCheck.status === 'down' || memoryCheck.status === 'critical') {
            overallStatus = 'unhealthy';
        } else if (memoryCheck.status === 'warning') {
            overallStatus = 'degraded';
        }

        const result: HealthCheckResult = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            checks: {
                database: dbCheck,
                memory: memoryCheck,
            },
        };

        const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

        return {
            status: statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            body: JSON.stringify(result, null, 2),
        };
    } catch (error) {
        context.error('Health check failed:', error);

        const errorResult: HealthCheckResult = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            checks: {
                database: {
                    status: 'down',
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                memory: checkMemory(),
            },
        };

        return {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            body: JSON.stringify(errorResult, null, 2),
        };
    }
}

/**
 * Simple liveness check - /api/health/live
 */
export async function livenessCheck(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Liveness check requested');

    return {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            status: 'alive',
            timestamp: new Date().toISOString(),
        }),
    };
}

/**
 * Readiness check - /api/health/ready
 */
export async function readinessCheck(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Readiness check requested');

    try {
        // Check if database is ready
        const dbCheck = await checkDatabase();

        if (dbCheck.status === 'up') {
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'ready',
                    timestamp: new Date().toISOString(),
                    checks: {
                        database: dbCheck,
                    },
                }),
            };
        } else {
            return {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'not_ready',
                    timestamp: new Date().toISOString(),
                    checks: {
                        database: dbCheck,
                    },
                }),
            };
        }
    } catch (error) {
        context.error('Readiness check failed:', error);

        return {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
}

/**
 * Check database connection
 */
async function checkDatabase(): Promise<{ status: 'up' | 'down'; responseTime?: number; error?: string }> {
    const startTime = Date.now();

    try {
        const db = await getDatabase();
        await db.query('SELECT 1');
        const responseTime = Date.now() - startTime;

        return {
            status: 'up',
            responseTime,
        };
    } catch (error) {
        return {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check memory usage
 */
function checkMemory(): { status: 'ok' | 'warning' | 'critical'; used: number; total: number; percentage: number } {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const percentage = (usedMemory / totalMemory) * 100;

    let status: 'ok' | 'warning' | 'critical' = 'ok';

    if (percentage > 90) {
        status = 'critical';
    } else if (percentage > 75) {
        status = 'warning';
    }

    return {
        status,
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(percentage * 100) / 100,
    };
}

// Register health check endpoints
app.http('healthCheck', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: healthCheck,
});

app.http('livenessCheck', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health/live',
    handler: livenessCheck,
});

app.http('readinessCheck', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health/ready',
    handler: readinessCheck,
});
