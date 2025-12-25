/**
 * Global Error Handler
 * Catches unhandled errors and provides user-friendly feedback
 */

import { eventBus, Events } from './EventBus.js';

class ErrorHandler {
    constructor() {
        this._errors = [];
        this._maxErrors = 50;
    }

    /**
     * Initialize global error handling
     */
    init() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message), {
                source: 'window.onerror',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(
                event.reason || new Error('Promise rejected'),
                { source: 'unhandledrejection' }
            );
        });

        console.log('🛡️ Error handler initialized');
    }

    /**
     * Handle an error
     * @param {Error} error - The error object
     * @param {Object} context - Additional context
     */
    handleError(error, context = {}) {
        const errorInfo = {
            message: error.message || 'Unknown error',
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...context
        };

        // Store error
        this._errors.push(errorInfo);
        if (this._errors.length > this._maxErrors) {
            this._errors.shift();
        }

        // Log to console
        console.error('🚨 Error caught:', errorInfo);

        // Emit event for UI handling
        eventBus.emit(Events.GENERATION_ERROR, errorInfo);

        // In production, send to error tracking service
        if (import.meta.env.PROD) {
            this.reportError(errorInfo);
        }
    }

    /**
     * Report error to tracking service (placeholder)
     * @param {Object} errorInfo - Error information
     */
    reportError(errorInfo) {
        // TODO: Implement error reporting (Sentry, LogRocket, etc.)
        // Example:
        // fetch('/api/errors', {
        //   method: 'POST',
        //   body: JSON.stringify(errorInfo)
        // });
    }

    /**
     * Show user-friendly error message
     * @param {string} message - User-friendly message
     * @param {string} type - 'error' | 'warning' | 'info'
     */
    showUserError(message, type = 'error') {
        // For now, use alert. In production, use a toast/notification system
        if (type === 'error') {
            alert(`Error: ${message}`);
        } else if (type === 'warning') {
            console.warn(message);
        }
    }

    /**
     * Get all logged errors
     * @returns {Object[]}
     */
    getErrors() {
        return [...this._errors];
    }

    /**
     * Clear error log
     */
    clearErrors() {
        this._errors = [];
    }
}

// Singleton instance
export const errorHandler = new ErrorHandler();
