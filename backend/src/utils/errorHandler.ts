import { QueryFailedError } from 'typeorm';

export class DatabaseError extends Error {
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class ErrorHandler {
    /**
     * Handle database errors and convert them to meaningful error messages
     */
    static handleDatabaseError(error: unknown, operation: string): never {
        if (error instanceof QueryFailedError) {
            // PostgreSQL duplicate key violation
            if ((error as any).code === '23505') {
                throw new DatabaseError('A record with this data already exists', error);
            }

            // PostgreSQL foreign key violation
            if ((error as any).code === '23503') {
                throw new DatabaseError('Referenced record does not exist', error);
            }

            // PostgreSQL check constraint violation
            if ((error as any).code === '23514') {
                throw new DatabaseError('Data validation constraint violated', error);
            }

            throw new DatabaseError(`Database query failed during ${operation}`, error);
        }

        if (error instanceof Error) {
            throw new DatabaseError(`${operation} failed: ${error.message}`, error);
        }

        throw new DatabaseError(`${operation} failed with unknown error`, error);
    }

    /**
     * Wrap repository operations with error handling
     */
    static async wrapDatabaseOperation<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            this.handleDatabaseError(error, operationName);
        }
    }

    /**
     * Ensure a result exists or throw NotFoundError
     */
    static ensureFound<T>(result: T | null | undefined, entityName: string): T {
        if (!result) {
            throw new NotFoundError(`${entityName} not found`);
        }
        return result;
    }

    /**
     * Validate input and throw ValidationError if invalid
     */
    static validateInput(condition: boolean, message: string): void {
        if (!condition) {
            throw new ValidationError(message);
        }
    }
}
