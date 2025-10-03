import { InvocationContext } from '@azure/functions';

/**
 * Application Insights Logger
 *
 * This is a lightweight wrapper for Application Insights logging.
 * To enable full Application Insights:
 * 1. Install: npm install applicationinsights
 * 2. Set APPLICATIONINSIGHTS_CONNECTION_STRING in .env
 * 3. Uncomment the initialization code below
 */

export class AppInsightsLogger {
    private static initialized = false;
    private static appInsights: any = null;

    /**
     * Initialize Application Insights
     */
    static initialize(): void {
        if (this.initialized) {
            return;
        }

        const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

        if (connectionString) {
            try {
                // Uncomment when applicationinsights package is installed:
                // const appInsights = require('applicationinsights');
                // appInsights.setup(connectionString)
                //     .setAutoDependencyCorrelation(true)
                //     .setAutoCollectRequests(true)
                //     .setAutoCollectPerformance(true, true)
                //     .setAutoCollectExceptions(true)
                //     .setAutoCollectDependencies(true)
                //     .setAutoCollectConsole(true)
                //     .setUseDiskRetryCaching(true)
                //     .setSendLiveMetrics(false)
                //     .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
                //     .start();
                //
                // this.appInsights = appInsights.defaultClient;
                // this.initialized = true;
                // console.log('Application Insights initialized');

                console.log('Application Insights connection string found but package not installed');
                console.log('Run: npm install applicationinsights');
            } catch (error) {
                console.error('Failed to initialize Application Insights:', error);
            }
        } else {
            console.log('Application Insights not configured (no connection string)');
        }
    }

    /**
     * Track custom event
     */
    static trackEvent(name: string, properties?: Record<string, any>, context?: InvocationContext): void {
        if (context) {
            context.log(`[Event] ${name}`, properties);
        }

        if (this.appInsights) {
            this.appInsights.trackEvent({ name, properties });
        }
    }

    /**
     * Track exception
     */
    static trackException(error: Error, properties?: Record<string, any>, context?: InvocationContext): void {
        if (context) {
            context.error(`[Exception] ${error.message}`, properties);
        }

        if (this.appInsights) {
            this.appInsights.trackException({ exception: error, properties });
        }
    }

    /**
     * Track metric
     */
    static trackMetric(name: string, value: number, properties?: Record<string, any>, context?: InvocationContext): void {
        if (context) {
            context.log(`[Metric] ${name}: ${value}`, properties);
        }

        if (this.appInsights) {
            this.appInsights.trackMetric({ name, value, properties });
        }
    }

    /**
     * Track request
     */
    static trackRequest(
        name: string,
        url: string,
        duration: number,
        resultCode: number,
        success: boolean,
        properties?: Record<string, any>,
        context?: InvocationContext
    ): void {
        if (context) {
            context.log(`[Request] ${name} - ${url} - ${resultCode} - ${duration}ms`);
        }

        if (this.appInsights) {
            this.appInsights.trackRequest({
                name,
                url,
                duration,
                resultCode,
                success,
                properties,
            });
        }
    }

    /**
     * Track dependency
     */
    static trackDependency(
        name: string,
        commandName: string,
        duration: number,
        success: boolean,
        dependencyTypeName?: string,
        properties?: Record<string, any>,
        context?: InvocationContext
    ): void {
        if (context) {
            context.log(`[Dependency] ${name} - ${commandName} - ${duration}ms - ${success ? 'success' : 'failed'}`);
        }

        if (this.appInsights) {
            this.appInsights.trackDependency({
                name,
                data: commandName,
                duration,
                success,
                dependencyTypeName: dependencyTypeName || 'HTTP',
                properties,
            });
        }
    }

    /**
     * Flush all telemetry
     */
    static flush(): Promise<void> {
        return new Promise((resolve) => {
            if (this.appInsights) {
                this.appInsights.flush({
                    callback: () => resolve(),
                });
            } else {
                resolve();
            }
        });
    }
}

// Auto-initialize on module load
AppInsightsLogger.initialize();
