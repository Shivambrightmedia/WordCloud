/**
 * PresetService - Preset management service
 * 
 * SOLID Principles:
 * - SRP: Only handles preset persistence and retrieval
 * - OCP: Storage mechanism can be extended (localStorage, API, etc.)
 * - DIP: Depends on StateManager interface
 */

import { stateManager } from '../core/StateManager.js';
import { eventBus, Events } from '../core/EventBus.js';

const STORAGE_KEY = 'wordPortrait_presets';
const LEGACY_KEY = 'wordPortrait_preset';

export class PresetService {
    constructor() {
        /** @type {Object<string, Object>} */
        this._presets = this._loadFromStorage();
    }

    /**
     * Load presets from localStorage
     * @returns {Object<string, Object>} Presets object
     * @private
     */
    _loadFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }

            // Migration: Check for old singular preset
            const old = localStorage.getItem(LEGACY_KEY);
            if (old) {
                const parsed = JSON.parse(old);
                const migrated = { 'Previous Settings': parsed };
                this._saveToStorage(migrated);
                return migrated;
            }
        } catch (error) {
            console.error('Error loading presets:', error);
        }
        return {};
    }

    /**
     * Save presets to localStorage
     * @param {Object<string, Object>} presets - Presets to save
     * @private
     */
    _saveToStorage(presets) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
        } catch (error) {
            console.error('Error saving presets:', error);
        }
    }

    /**
     * Get all preset names
     * @returns {string[]} Array of preset names
     */
    getPresetNames() {
        return Object.keys(this._presets);
    }

    /**
     * Get a specific preset
     * @param {string} name - Preset name
     * @returns {Object|null} Preset data or null
     */
    getPreset(name) {
        return this._presets[name] || null;
    }

    /**
     * Get preset details for display
     * @param {string} name - Preset name
     * @returns {string} Formatted preset details
     */
    getPresetDetails(name) {
        const preset = this._presets[name];
        if (!preset) return 'Preset not found';

        return `Res: ${preset.canvasWidth}x${preset.canvasHeight} px | Font: ${preset.fontSize} | Threshold: ${preset.threshold}%`;
    }

    /**
     * Save current state as a preset
     * @param {string} name - Preset name
     * @returns {boolean} Success status
     */
    savePreset(name) {
        if (!name || name.trim() === '') {
            return false;
        }

        this._presets[name] = stateManager.getSerializableState();
        this._saveToStorage(this._presets);

        eventBus.emit(Events.PRESET_SAVED, { name, preset: this._presets[name] });
        return true;
    }

    /**
     * Load a preset into state
     * @param {string} name - Preset name
     * @returns {boolean} Success status
     */
    loadPreset(name) {
        const preset = this._presets[name];
        if (!preset) {
            return false;
        }

        stateManager.loadSerializedState(preset);

        eventBus.emit(Events.PRESET_LOADED, { name, preset });
        return true;
    }

    /**
     * Delete a preset
     * @param {string} name - Preset name
     * @returns {boolean} Success status
     */
    deletePreset(name) {
        if (!this._presets[name]) {
            return false;
        }

        delete this._presets[name];
        this._saveToStorage(this._presets);

        eventBus.emit(Events.PRESET_DELETED, { name });
        return true;
    }

    /**
     * Check if a preset exists
     * @param {string} name - Preset name
     * @returns {boolean} Whether preset exists
     */
    hasPreset(name) {
        return name in this._presets;
    }

    /**
     * Export presets as JSON string
     * @returns {string} JSON string of all presets
     */
    exportPresets() {
        return JSON.stringify(this._presets, null, 2);
    }

    /**
     * Import presets from JSON string
     * @param {string} jsonString - JSON string of presets
     * @param {boolean} merge - Whether to merge with existing presets
     * @returns {boolean} Success status
     */
    importPresets(jsonString, merge = true) {
        try {
            const imported = JSON.parse(jsonString);
            if (merge) {
                this._presets = { ...this._presets, ...imported };
            } else {
                this._presets = imported;
            }
            this._saveToStorage(this._presets);
            return true;
        } catch (error) {
            console.error('Error importing presets:', error);
            return false;
        }
    }
}

// Singleton instance
export const presetService = new PresetService();
