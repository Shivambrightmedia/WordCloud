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
    wordItems: [], // Array of {text, color, repeat} for per-word settings
    wordColors: {}, // Map of word -> color for per-word coloring
    image: null,
    density: 120,
    fontSize: 60,
    fontFamily: 'Outfit',
    fontWeight: 700,
    customFonts: {}, // Map of font name -> data URL for custom uploaded fonts
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
    // Logo/Overlay settings
    logoImage: null,
    logoDataUrl: null,
    logoPosition: 'center',
    logoScale: 30,
    logoOpacity: 100,
    logoOffsetX: 0,
    logoOffsetY: 0,
    // Export settings (default JPEG for 90%+ smaller file size)
    exportFormat: 'jpeg',
    exportQuality: 0.92,
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
     * Get serializable state for presets (excludes non-serializable values like HTMLImageElement)
     * Preserves logoDataUrl and all logo transform settings so logo stays permanently with presets!
     * @returns {Object} Serializable state
     */
    getSerializableState() {
        // Exclude raw HTMLImageElements (image, logoImage), but KEEP logoDataUrl
        const { image, logoImage, ...serializable } = this._state;
        return serializable;
    }

    /**
     * Load state from serialized object
     * @param {Object} serializedState - Serialized state object
     */
    loadSerializedState(serializedState) {
        // Don't overwrite main portrait image
        const { image: _, logoImage: __, ...updates } = serializedState;

        // If preset has NO logoDataUrl (e.g. older preset), preserve existing uploaded logo!
        if (updates.logoDataUrl === undefined && this._state.logoDataUrl) {
            updates.logoDataUrl = this._state.logoDataUrl;
            updates.logoImage = this._state.logoImage;
        }

        this.setState(updates);

        // If preset contains a saved logoDataUrl, recreate the logoImage element
        if (updates.logoDataUrl) {
            const img = new Image();
            img.onload = () => {
                this.setState({ logoImage: img });
            };
            img.src = updates.logoDataUrl;
        }
    }
}

// Singleton instance
export const stateManager = new StateManager();

// Export default state for reference
export { defaultState };
