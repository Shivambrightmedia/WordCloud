/**
 * ColorSettings - Color mode and palette controls
 * 
 * SOLID: SRP - Only handles color settings UI
 */

import { BaseComponent } from './BaseComponent.js';

export class ColorSettings extends BaseComponent {
    constructor() {
        super('ColorSettings');

        this.colorInput = null;
        this.colorModeRadios = null;
        this.customPaletteArea = null;
        this.paletteColorsContainer = null;
        this.addPaletteColorBtn = null;
    }

    cacheElements() {
        this.colorInput = this.$('colorInput');
        this.colorModeRadios = document.querySelectorAll('input[name="colorMode"]');
        this.customPaletteArea = this.$('customPaletteArea');
        this.paletteColorsContainer = this.$('paletteColorsContainer');
        this.addPaletteColorBtn = this.$('addPaletteColorBtn');
    }

    bindEvents() {
        // Single color picker
        this.addListener(this.colorInput, 'input', (e) => {
            this.setState({ color: e.target.value });
        });

        // Color mode radios
        this.colorModeRadios.forEach(radio => {
            this.addListener(radio, 'change', (e) => {
                const colorMode = e.target.value;
                this.setState({ colorMode });

                // Show/hide palette area
                this.customPaletteArea.style.display =
                    colorMode === 'palette' ? 'block' : 'none';
            });
        });

        // Add palette color button
        this.addListener(this.addPaletteColorBtn, 'click', () => {
            this.addPaletteColor('#00ff00');
        });

        // Initialize existing palette listeners
        this.initPaletteListeners();
    }

    /**
     * Initialize listeners for existing palette color inputs
     */
    initPaletteListeners() {
        const pickers = this.paletteColorsContainer.querySelectorAll('.paletteColor');
        pickers.forEach(picker => {
            this.addListener(picker, 'input', () => this.syncPaletteToState());
        });

        const removeBtns = this.paletteColorsContainer.querySelectorAll('.remove-color-btn');
        removeBtns.forEach(btn => {
            this.addListener(btn, 'click', (e) => {
                e.target.closest('.palette-item').remove();
                this.syncPaletteToState();
            });
        });
    }

    /**
     * Add a new color to the palette
     * @param {string} defaultColor - Default hex color
     */
    addPaletteColor(defaultColor) {
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.style.cssText = 'position: relative;';

        item.innerHTML = `
      <input type="color" class="paletteColor" value="${defaultColor}" style="height: 32px; width: 40px; cursor: pointer;">
      <button class="remove-color-btn" style="position: absolute; top: -5px; right: -5px; width: 16px; height: 16px; border-radius: 50%; border: none; background: #ff4444; color: white; font-size: 10px; cursor: pointer; line-height: 1;">×</button>
    `;

        this.paletteColorsContainer.appendChild(item);

        // Add listeners
        const picker = item.querySelector('.paletteColor');
        this.addListener(picker, 'input', () => this.syncPaletteToState());

        const removeBtn = item.querySelector('.remove-color-btn');
        this.addListener(removeBtn, 'click', (e) => {
            e.target.closest('.palette-item').remove();
            this.syncPaletteToState();
        });

        this.syncPaletteToState();
    }

    /**
     * Sync palette UI to state
     */
    syncPaletteToState() {
        const pickers = this.paletteColorsContainer.querySelectorAll('.paletteColor');
        const customPalette = Array.from(pickers).map(p => p.value);
        this.setState({ customPalette });
    }

    render() {
        const { color, colorMode } = this.state;

        this.colorInput.value = color;

        // Set correct radio button
        this.colorModeRadios.forEach(radio => {
            radio.checked = radio.value === colorMode;
        });

        // Show/hide palette area
        this.customPaletteArea.style.display =
            colorMode === 'palette' ? 'block' : 'none';
    }
}

// Factory function
export function createColorSettings() {
    const component = new ColorSettings();
    component.init();
    return component;
}
