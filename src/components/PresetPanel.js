/**
 * PresetPanel - Preset management UI
 * 
 * SOLID: SRP - Only handles preset UI
 */

import { BaseComponent } from './BaseComponent.js';
import { presetService } from '../services/PresetService.js';
import { Events } from '../core/EventBus.js';

export class PresetPanel extends BaseComponent {
    constructor() {
        super('PresetPanel');

        this.saveBtn = null;
        this.loadBtn = null;
        this.deleteBtn = null;
        this.presetSelect = null;
        this.presetDetails = null;
    }

    cacheElements() {
        this.saveBtn = this.$('savePresetBtn');
        this.loadBtn = this.$('loadPresetBtn');
        this.deleteBtn = this.$('deletePresetBtn');
        this.presetSelect = this.$('presetSelect');
        this.presetDetails = this.$('presetDetails');
    }

    bindEvents() {
        this.addListener(this.saveBtn, 'click', () => this.savePreset());
        this.addListener(this.loadBtn, 'click', () => this.loadPreset());
        this.addListener(this.deleteBtn, 'click', () => this.deletePreset());
        this.addListener(this.presetSelect, 'change', () => this.updateDetails());

        // Listen for preset events
        this.on(Events.PRESET_SAVED, () => this.updatePresetList());
        this.on(Events.PRESET_DELETED, () => this.updatePresetList());
    }

    /**
     * Save current settings as preset
     */
    savePreset() {
        const name = prompt('Enter a name for this preset:', 'My Custom Style');
        if (!name) return;

        if (presetService.savePreset(name)) {
            this.presetSelect.value = name;
            this.updateDetails();
            alert(`Preset "${name}" saved!`);
        }
    }

    /**
     * Load selected preset
     */
    loadPreset() {
        const name = this.presetSelect.value;
        if (!name) {
            alert('Please select a preset from the dropdown first.');
            return;
        }

        if (presetService.loadPreset(name)) {
            alert(`Preset "${name}" loaded successfully!`);
            // Trigger re-render of all components
            this.emit(Events.PRESET_LOADED, { name });
        } else {
            alert('Error loading preset.');
        }
    }

    /**
     * Delete selected preset
     */
    deletePreset() {
        const name = this.presetSelect.value;
        if (!name) return;

        if (confirm(`Are you sure you want to delete preset "${name}"?`)) {
            presetService.deletePreset(name);
            this.presetSelect.value = '';
            this.updateDetails();
        }
    }

    /**
     * Update preset dropdown list
     */
    updatePresetList() {
        const names = presetService.getPresetNames();

        // Clear options except first
        while (this.presetSelect.options.length > 1) {
            this.presetSelect.remove(1);
        }

        // Add preset options
        names.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            this.presetSelect.appendChild(opt);
        });
    }

    /**
     * Update details display
     */
    updateDetails() {
        const name = this.presetSelect.value;
        if (!name) {
            this.presetDetails.textContent = 'Select a preset to view details...';
            return;
        }

        this.presetDetails.textContent = presetService.getPresetDetails(name);
    }

    render() {
        this.updatePresetList();
        this.updateDetails();
    }
}

// Factory function
export function createPresetPanel() {
    const component = new PresetPanel();
    component.init();
    return component;
}
