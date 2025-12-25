/**
 * StateManager - Centralized state management
 * 
 * SOLID Principles:
 * - SRP: Only handles state storage and notification
 * - OCP: State structure can be extended without modifying manager
 * - DIP: Components depend on StateManager interface
 * 
 * Pattern: Observer pattern with immutable state updates
 */

import { eventBus, Events } from './EventBus.js';

/**
 * @typedef {Object} AppState
 * @property {string[]} words - Word dictionary
 * @property {string[]} heroWords - Highlighted words (appear bigger)
 * @property {HTMLImageElement|null} image - Source image
 * @property {number} density - Word density (0-255)
 * @property {number} fontSize - Base font size
 * @property {number} canvasWidth - Output width in pixels
 * @property {number} canvasHeight - Output height in pixels
 * @property {string} color - Single color hex value
 * @property {string} colorMode - 'single' | 'source' | 'random' | 'palette'
 * @property {string[]} customPalette - Custom color palette
 * @property {number} imageScale - Image scale percentage (50-200)
 * @property {number} imageOffsetX - Horizontal offset in pixels
 * @property {number} imageOffsetY - Vertical offset in pixels
 * @property {number} threshold - Brightness threshold (0-100)
 * @property {number} edges - Edge detection strength (0-10)
 * @property {boolean} negative - Invert colors
 * @property {string} negativeColor - Color for negative fill
 * @property {number} margin - Border margin percentage (0-50)
 */

/** @type {AppState} */
const defaultState = {
    words: ['Love', 'Hope', 'Dream', 'Life', 'Art', 'Code', 'Future', 'Create', 'Vision', 'Soul'],
    heroWords: [],
    image: null,
    density: 120,
    fontSize: 60,
    canvasWidth: 2400,
    canvasHeight: 3600,
    color: '#000000',
    colorMode: 'source',
    customPalette: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
    imageScale: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    threshold: 44,
    edges: 2,
    negative: false,
    negativeColor: '#555555',
    margin: 0,
};

export class StateManager {
    constructor() {
        /** @type {AppState} */
        this._state = { ...defaultState };

        /** @type {Set<Function>} */
        this._subscribers = new Set();
    }

    /**
     * Get the current state (returns a shallow copy for immutability)
     * @returns {AppState}
     */
    getState() {
        return { ...this._state };
    }

    /**
     * Get a specific state property
     * @param {keyof AppState} key - State key
     * @returns {*} State value
     */
    get(key) {
        return this._state[key];
    }

    /**
     * Update state with partial values
     * @param {Partial<AppState>} updates - Partial state updates
     * @param {boolean} silent - If true, don't emit events
     */
    setState(updates, silent = false) {
        const prevState = { ...this._state };
        const changedKeys = [];

        Object.entries(updates).forEach(([key, value]) => {
            if (this._state[key] !== value) {
                this._state[key] = value;
                changedKeys.push(key);
            }
        });

        if (changedKeys.length > 0 && !silent) {
            // Notify subscribers
            this._subscribers.forEach(callback => {
                try {
                    callback(this._state, prevState, changedKeys);
                } catch (error) {
                    console.error('Error in state subscriber:', error);
                }
            });

            // Emit global event
            eventBus.emit(Events.STATE_CHANGED, {
                current: this._state,
                previous: prevState,
                changed: changedKeys
            });
        }
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - (currentState, prevState, changedKeys) => void
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this._subscribers.add(callback);
        return () => this._subscribers.delete(callback);
    }

    /**
     * Reset state to defaults
     * @param {string[]} preserveKeys - Keys to preserve during reset
     */
    reset(preserveKeys = []) {
        const preserved = {};
        preserveKeys.forEach(key => {
            preserved[key] = this._state[key];
        });

        this._state = { ...defaultState, ...preserved };

        eventBus.emit(Events.STATE_RESET, this._state);
    }

    /**
     * Get serializable state for presets (excludes non-serializable values like Image)
     * @returns {Object} Serializable state
     */
    getSerializableState() {
        const { image, ...serializable } = this._state;
        return serializable;
    }

    /**
     * Load state from serialized object
     * @param {Object} serializedState - Serialized state object
     */
    loadSerializedState(serializedState) {
        // Don't overwrite image
        const { image: _, ...updates } = serializedState;
        this.setState(updates);
    }
}

// Singleton instance
export const stateManager = new StateManager();

// Export default state for reference
export { defaultState };
