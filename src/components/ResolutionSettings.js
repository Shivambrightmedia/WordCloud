/**
 * ResolutionSettings - Resolution and image transform controls
 * 
 * SOLID: SRP - Only handles resolution/transform settings
 */

import { BaseComponent } from './BaseComponent.js';
import { debounce } from '../utils/debounce.js';

export class ResolutionSettings extends BaseComponent {
    constructor() {
        super('ResolutionSettings');

        this.resolutionSelect = null;
        this.customResolution = null;
        this.customWidth = null;
        this.customHeight = null;
        this.imageScaleInput = null;
        this.imageOffsetXInput = null;
        this.imageOffsetYInput = null;
        this.scaleValue = null;
        this.offsetValue = null;
        this.densityInput = null;
        this.fontSizeInput = null;
    }

    cacheElements() {
        this.resolutionSelect = this.$('resolutionSelect');
        this.customResolution = this.$('customResolution');
        this.customWidth = this.$('customWidth');
        this.customHeight = this.$('customHeight');
        this.imageScaleInput = this.$('imageScaleInput');
        this.imageOffsetXInput = this.$('imageOffsetXInput');
        this.imageOffsetYInput = this.$('imageOffsetYInput');
        this.scaleValue = this.$('scaleValue');
        this.offsetValue = this.$('offsetValue');
        this.densityInput = this.$('densityInput');
        this.fontSizeInput = this.$('fontSizeInput');
    }

    bindEvents() {
        // Resolution dropdown
        this.addListener(this.resolutionSelect, 'change', (e) => {
            this.handleResolutionChange(e.target.value);
        });

        // Custom resolution inputs
        this.addListener(this.customWidth, 'input', () => this.updateCustomResolution());
        this.addListener(this.customHeight, 'input', () => this.updateCustomResolution());

        // Image scale
        this.addListener(this.imageScaleInput, 'input', (e) => {
            const scale = parseInt(e.target.value);
            this.setState({ imageScale: scale });
            this.scaleValue.textContent = `Scale: ${scale}%`;
        });

        // Image offset X
        this.addListener(this.imageOffsetXInput, 'input', () => {
            this.updateOffset();
        });

        // Image offset Y
        this.addListener(this.imageOffsetYInput, 'input', () => {
            this.updateOffset();
        });

        // Density (with debounce for live preview)
        const debouncedDensity = debounce((value) => {
            this.setState({ density: value });
        }, 300);

        this.addListener(this.densityInput, 'input', (e) => {
            debouncedDensity(parseInt(e.target.value));
        });

        // Font size (with debounce for live preview)
        const debouncedFontSize = debounce((value) => {
            this.setState({ fontSize: value });
        }, 300);

        this.addListener(this.fontSizeInput, 'input', (e) => {
            debouncedFontSize(parseInt(e.target.value));
        });
    }

    /**
     * Handle resolution dropdown change
     * @param {string} value - Selected value
     */
    handleResolutionChange(value) {
        if (value === 'custom') {
            this.customResolution.style.display = 'block';
            this.updateCustomResolution();
        } else {
            this.customResolution.style.display = 'none';
            const [w, h] = value.split('x').map(Number);
            this.setState({ canvasWidth: w, canvasHeight: h });
        }
    }

    /**
     * Update custom resolution from inputs
     */
    updateCustomResolution() {
        const w = parseInt(this.customWidth.value) || 2400;
        const h = parseInt(this.customHeight.value) || 3600;

        this.setState({
            canvasWidth: Math.min(10000, Math.max(100, w)),
            canvasHeight: Math.min(10000, Math.max(100, h))
        });
    }

    /**
     * Update offset values
     */
    updateOffset() {
        const x = parseInt(this.imageOffsetXInput.value);
        const y = parseInt(this.imageOffsetYInput.value);

        this.setState({ imageOffsetX: x, imageOffsetY: y });
        this.offsetValue.textContent = `Offset: X=${x}, Y=${y}`;
    }

    render() {
        const state = this.state;

        // Resolution
        const resString = `${state.canvasWidth}x${state.canvasHeight}`;
        let matched = false;

        for (const opt of this.resolutionSelect.options) {
            if (opt.value === resString) {
                this.resolutionSelect.value = resString;
                matched = true;
                break;
            }
        }

        if (!matched) {
            this.resolutionSelect.value = 'custom';
            this.customResolution.style.display = 'block';
            this.customWidth.value = state.canvasWidth;
            this.customHeight.value = state.canvasHeight;
        } else {
            this.customResolution.style.display = 'none';
        }

        // Scale and offset
        this.imageScaleInput.value = state.imageScale;
        this.scaleValue.textContent = `Scale: ${state.imageScale}%`;

        this.imageOffsetXInput.value = state.imageOffsetX;
        this.imageOffsetYInput.value = state.imageOffsetY;
        this.offsetValue.textContent = `Offset: X=${state.imageOffsetX}, Y=${state.imageOffsetY}`;

        // Density and font size
        this.densityInput.value = state.density;
        this.fontSizeInput.value = state.fontSize;
    }
}

// Factory function
export function createResolutionSettings() {
    const component = new ResolutionSettings();
    component.init();
    return component;
}
