interface ErrorSchema {
    name: string;
    message: string;
    stack?: string;
};

export interface ErrorLog {
    timestamp: string;
    error: ErrorSchema;
    context: any[];
}

class ErrorHandler {
    private errors: ErrorLog[] = [];

    constructor(
        private readonly maxErrors: number = 100,
    ) {}

    /**
     * Logs an error message along with useful debug information and context.
     *
     * @param error - The error to log. Can be an Error object, string, or any other type.
     * @param context - Additional context information to help debug the error.
     */
    logError(error: any, ...context: any[]) {
        const timestamp = new Date().toISOString();

        let errorDetails: ErrorSchema = {
            name: '',
            message: '',
            stack: undefined
        };

        // Extract error details
        if (error instanceof Error) {

            let stack: any = error.stack;
            if (typeof stack === 'string') stack = stack.split("\n");

            errorDetails = {
                name: error.name,
                message: error.message,
                stack: stack
            };
        } else if (typeof error === 'string') {
            errorDetails = {
                name: 'Error',
                message: error
            };
        } else {
            errorDetails = {
                name: 'UnknownError',
                message: 'An unknown error occurred'
            };
        }

        // Create the error log entry as a JSON object
        const errorLog: ErrorLog = {
            timestamp,
            error: errorDetails,
            context: this.processContext(context)
        };

        // Store the error log
        this.errors.push(errorLog);

        // Store only recent errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift(); // Remove the oldest log
        }

        // Log to console for immediate debugging
        console.error(JSON.stringify(errorLog, null, 2)); 
    }

    /**
     * Returns a list of all logged errors.
     *
     * @returns An array of error logs in JSON format.
     */
    getErrors(): ErrorLog[] {
        return this.errors;
    }

    /**
     * Helper function to handle circular references in JSON.stringify.
     *
     * @returns A replacer function for JSON.stringify.
     */
    private getCircularReplacer() {
        const seen = new WeakSet();
        return (key: any, value: any) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return '[Circular]';
                seen.add(value);
            }
            return value;
        };
    }

    /**
     * Processes context objects, ensuring they are stringifiable and handles circular references.
     *
     * @param context - The context information to process.
     * @returns An array of stringified context objects.
     */
    private processContext(context: any[]): any[] {
        return context.map((item, index) => {
            try {
                return JSON.parse(JSON.stringify(item, this.getCircularReplacer()));
            } catch (contextError) {
                return `[Context ${index} failed to stringify: ${contextError}]`;
            }
        });
    }
}

// Singleton instance of ErrorHandler
export const errorHandler = new ErrorHandler();
