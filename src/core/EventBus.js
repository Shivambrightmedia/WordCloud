/**
 * EventBus - Pub/Sub pattern for decoupled communication
 * 
 * SOLID Principles:
 * - SRP: Only handles event subscription and publishing
 * - OCP: Can add new events without modifying existing code
 * - DIP: Components depend on EventBus interface, not each other
 */
export class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function for cleanup
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event only once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for "${event}":`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name (optional, clears all if not provided)
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Event name constants for type safety
export const Events = {
    // State events
    STATE_CHANGED: 'state:changed',
    STATE_RESET: 'state:reset',

    // Image events
    IMAGE_LOADED: 'image:loaded',
    IMAGE_PROCESSED: 'image:processed',

    // Generation events
    GENERATION_START: 'generation:start',
    GENERATION_PROGRESS: 'generation:progress',
    GENERATION_COMPLETE: 'generation:complete',
    GENERATION_ERROR: 'generation:error',

    // UI events
    UI_PREVIEW_UPDATE: 'ui:preview:update',
    UI_LOADING_SHOW: 'ui:loading:show',
    UI_LOADING_HIDE: 'ui:loading:hide',

    // Preset events
    PRESET_SAVED: 'preset:saved',
    PRESET_LOADED: 'preset:loaded',
    PRESET_DELETED: 'preset:deleted',
};

// Create singleton instance
export const eventBus = new EventBus();
