/**
 * FontSettings - Font family, weight, and custom font controls
 * 
 * SOLID: SRP - Only handles font settings UI
 */

import { BaseComponent } from './BaseComponent.js';
import { Events } from '../core/EventBus.js';

export class FontSettings extends BaseComponent {
    constructor() {
        super('FontSettings');

        this.fontFamilyRadios = null;
        this.fontWeightSelect = null;
        this.customFontInput = null;
        this.customFontsList = null;

        /** @type {Map<string, string>} Map of font name to data URL */
        this.customFonts = new Map();
    }

    cacheElements() {
        this.fontFamilyRadios = document.querySelectorAll('input[name="fontFamily"]');
        this.fontWeightSelect = this.$('fontWeightSelect');
        this.customFontInput = this.$('customFontInput');
        this.customFontsList = this.$('customFontsList');
    }

    bindEvents() {
        // Font family radios
        this.fontFamilyRadios.forEach(radio => {
            this.addListener(radio, 'change', (e) => {
                this.setState({ fontFamily: e.target.value });
            });
        });

        // Font weight select
        if (this.fontWeightSelect) {
            this.addListener(this.fontWeightSelect, 'change', (e) => {
                this.setState({ fontWeight: parseInt(e.target.value) });
            });
        }

        // Custom font upload
        if (this.customFontInput) {
            this.addListener(this.customFontInput, 'change', (e) => {
                this.handleFontUpload(e);
            });
        }

        // Re-render when preset is loaded
        this.on(Events.PRESET_LOADED, () => {
            this.loadCustomFontsFromState();
            this.render();
        });
    }

    /**
     * Handle font file upload
     * @param {Event} e - File input change event
     */
    async handleFontUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Extract font name from filename
        const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');

        try {
            // Read file as data URL
            const dataUrl = await this.readFileAsDataURL(file);

            // Load the font using FontFace API
            const fontFace = new FontFace(fontName, `url(${dataUrl})`);
            await fontFace.load();

            // Add to document fonts
            document.fonts.add(fontFace);

            // Store in our map
            this.customFonts.set(fontName, dataUrl);

            // Add to UI
            this.addCustomFontToUI(fontName);

            // Auto-select the new font
            this.setState({
                fontFamily: fontName,
                customFonts: this.serializeCustomFonts()
            });

            console.log(`✅ Custom font "${fontName}" loaded successfully`);

        } catch (error) {
            console.error('Error loading font:', error);
            alert(`Failed to load font: ${error.message}`);
        }

        // Reset file input
        e.target.value = '';
    }

    /**
     * Read file as data URL
     * @param {File} file - Font file
     * @returns {Promise<string>} Data URL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Add custom font option to UI
     * @param {string} fontName - Font name
     */
    addCustomFontToUI(fontName) {
        if (!this.customFontsList) return;

        const item = document.createElement('label');
        item.className = 'custom-font-item';
        item.innerHTML = `
            <input type="radio" name="fontFamily" value="${fontName}">
            <span class="font-name" style="font-family: '${fontName}', sans-serif;">${fontName}</span>
            <button class="remove-font-btn" data-font="${fontName}" title="Remove font">✕</button>
        `;

        // Bind radio change event
        const radio = item.querySelector('input[type="radio"]');
        radio.addEventListener('change', (e) => {
            this.setState({ fontFamily: e.target.value });
        });

        // Bind remove button
        const removeBtn = item.querySelector('.remove-font-btn');
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.removeCustomFont(fontName, item);
        });

        this.customFontsList.appendChild(item);
    }

    /**
     * Remove a custom font
     * @param {string} fontName - Font name to remove
     * @param {HTMLElement} element - DOM element to remove
     */
    removeCustomFont(fontName, element) {
        // Remove from map
        this.customFonts.delete(fontName);

        // Remove from DOM
        element.remove();

        // Update state
        this.setState({ customFonts: this.serializeCustomFonts() });

        // If this font was selected, switch to default
        if (this.state.fontFamily === fontName) {
            this.setState({ fontFamily: 'Outfit' });
            // Update the default radio
            const defaultRadio = document.querySelector('input[name="fontFamily"][value="Outfit"]');
            if (defaultRadio) defaultRadio.checked = true;
        }

        console.log(`🗑️ Custom font "${fontName}" removed`);
    }

    /**
     * Serialize custom fonts for saving in state/presets
     * @returns {Object} Serialized custom fonts
     */
    serializeCustomFonts() {
        const serialized = {};
        this.customFonts.forEach((dataUrl, name) => {
            serialized[name] = dataUrl;
        });
        return serialized;
    }

    /**
     * Load custom fonts from state (for preset loading)
     */
    async loadCustomFontsFromState() {
        const { customFonts } = this.state;
        if (!customFonts || Object.keys(customFonts).length === 0) return;

        // Clear existing custom fonts UI
        if (this.customFontsList) {
            this.customFontsList.innerHTML = '';
        }
        this.customFonts.clear();

        // Load each font
        for (const [fontName, dataUrl] of Object.entries(customFonts)) {
            try {
                const fontFace = new FontFace(fontName, `url(${dataUrl})`);
                await fontFace.load();
                document.fonts.add(fontFace);
                this.customFonts.set(fontName, dataUrl);
                this.addCustomFontToUI(fontName);
                console.log(`✅ Restored custom font "${fontName}"`);
            } catch (error) {
                console.error(`Failed to restore font "${fontName}":`, error);
            }
        }
    }

    render() {
        const { fontFamily, fontWeight } = this.state;

        // Update all font radios (including dynamically added ones)
        document.querySelectorAll('input[name="fontFamily"]').forEach(radio => {
            radio.checked = radio.value === fontFamily;
        });

        // Set font weight select
        if (this.fontWeightSelect) {
            this.fontWeightSelect.value = fontWeight.toString();
        }
    }
}

// Factory function
export function createFontSettings() {
    const component = new FontSettings();
    component.init();
    return component;
}
