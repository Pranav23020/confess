/**
 * Logger utility - Only logs in development mode
 * Prevents information leakage in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
    /**
     * Standard log - only in development
     */
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    /**
     * Error log - always log (critical for debugging)
     */
    error: (...args) => {
        console.error(...args);
    },

    /**
     * Warning log - only in development
     */
    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    /**
     * Info log - only in development
     */
    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    /**
     * Debug log - only in development
     */
    debug: (...args) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    }
};

export default logger;
