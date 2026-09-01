/**
 * OverlaySettings - Logo/overlay image upload and positioning
 * 
 * SOLID: SRP - Only handles overlay/logo settings
 */

import { BaseComponent } from './BaseComponent.js';
import { Events } from '../core/EventBus.js';

export class OverlaySettings extends BaseComponent {
    constructor() {
        super('OverlaySettings');

        this.logoInput = null;
        this.logoPreview = null;
        this.logoPreviewContainer = null;
        this.removeLogoBtn = null;
        this.logoUploadText = null;
        this.logoControls = null;
        this.logoScaleInput = null;
        this.logoOpacityInput = null;
        this.logoOffsetX = null;
        this.logoOffsetY = null;
        this.positionBtns = null;
    }

    cacheElements() {
        this.logoInput = this.$('logoInput');
        this.logoPreview = this.$('logoPreview');
        this.logoPreviewContainer = this.$('logoPreviewContainer');
        this.removeLogoBtn = this.$('removeLogoBtn');
        this.logoUploadText = this.$('logoUploadText');
        this.logoControls = this.$('logoControls');
        this.logoScaleInput = this.$('logoScaleInput');
        this.logoOpacityInput = this.$('logoOpacityInput');
        this.logoOffsetX = this.$('logoOffsetX');
        this.logoOffsetY = this.$('logoOffsetY');
        this.positionBtns = document.querySelectorAll('.pos-btn');
    }

    bindEvents() {
        // Logo file input
        if (this.logoInput) {
            this.addListener(this.logoInput, 'change', (e) => {
                this.handleLogoUpload(e);
            });
        }

        // Remove logo button
        if (this.removeLogoBtn) {
            this.addListener(this.removeLogoBtn, 'click', () => {
                this.removeLogo();
            });
        }

        // Position buttons
        this.positionBtns.forEach(btn => {
            this.addListener(btn, 'click', (e) => {
                const pos = e.currentTarget.dataset.pos;
                this.setPosition(pos);
            });
        });

        // Scale slider
        if (this.logoScaleInput) {
            this.addListener(this.logoScaleInput, 'input', (e) => {
                const value = parseInt(e.target.value);
                const scaleValue = this.$('logoScaleValue');
                if (scaleValue) scaleValue.textContent = `${value}%`;
                this.setState({ logoScale: value });
            });
        }

        // Opacity slider
        if (this.logoOpacityInput) {
            this.addListener(this.logoOpacityInput, 'input', (e) => {
                const value = parseInt(e.target.value);
                const opacityValue = this.$('logoOpacityValue');
                if (opacityValue) opacityValue.textContent = `${value}%`;
                this.setState({ logoOpacity: value });
            });
        }

        // Offset inputs
        if (this.logoOffsetX) {
            this.addListener(this.logoOffsetX, 'input', (e) => {
                this.setState({ logoOffsetX: parseInt(e.target.value) || 0 });
            });
        }

        if (this.logoOffsetY) {
            this.addListener(this.logoOffsetY, 'input', (e) => {
                this.setState({ logoOffsetY: parseInt(e.target.value) || 0 });
            });
        }

        // Re-render when preset is loaded
        this.on(Events.PRESET_LOADED, () => {
            this.loadLogoFromState();
            this.render();
        });
    }

    /**
     * Handle logo file upload
     * @param {Event} e - File input change event
     */
    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate image file
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Store in state
                this.setState({
                    logoImage: img,
                    logoDataUrl: event.target.result
                });

                // Show preview
                this.showLogoPreview(event.target.result);

                console.log('✅ Logo uploaded successfully');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    }

    /**
     * Show logo preview in UI
     * @param {string} dataUrl - Image data URL
     */
    showLogoPreview(dataUrl) {
        if (this.logoPreview) {
            this.logoPreview.src = dataUrl;
        }
        if (this.logoPreviewContainer) {
            this.logoPreviewContainer.classList.remove('hidden');
        }
        if (this.logoControls) {
            this.logoControls.classList.remove('hidden');
        }
        if (this.logoUploadText) {
            this.logoUploadText.textContent = 'Change Logo';
        }
    }

    /**
     * Remove logo
     */
    removeLogo() {
        this.setState({
            logoImage: null,
            logoDataUrl: null
        });

        if (this.logoPreviewContainer) {
            this.logoPreviewContainer.classList.add('hidden');
        }
        if (this.logoControls) {
            this.logoControls.classList.add('hidden');
        }
        if (this.logoUploadText) {
            this.logoUploadText.textContent = 'Upload Logo (PNG)';
        }

        console.log('🗑️ Logo removed');
    }

    /**
     * Set logo position
     * @param {string} pos - Position string (e.g., 'top-left', 'center')
     */
    setPosition(pos) {
        // Update active button
        this.positionBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.pos === pos);
        });

        this.setState({ logoPosition: pos });
    }

    /**
     * Load logo from state (for preset loading)
     */
    loadLogoFromState() {
        const { logoDataUrl } = this.state;

        if (logoDataUrl) {
            // Recreate image from data URL
            const img = new Image();
            img.onload = () => {
                this.setState({ logoImage: img }, true); // Silent update
                this.showLogoPreview(logoDataUrl);
            };
            img.src = logoDataUrl;
        } else {
            this.removeLogo();
        }
    }

    render() {
        const state = this.state;

        // Logo scale
        if (this.logoScaleInput && state.logoScale) {
            this.logoScaleInput.value = state.logoScale;
            const scaleValue = this.$('logoScaleValue');
            if (scaleValue) scaleValue.textContent = `${state.logoScale}%`;
        }

        // Logo opacity
        if (this.logoOpacityInput && state.logoOpacity) {
            this.logoOpacityInput.value = state.logoOpacity;
            const opacityValue = this.$('logoOpacityValue');
            if (opacityValue) opacityValue.textContent = `${state.logoOpacity}%`;
        }

        // Logo offset
        if (this.logoOffsetX) {
            this.logoOffsetX.value = state.logoOffsetX || 0;
        }
        if (this.logoOffsetY) {
            this.logoOffsetY.value = state.logoOffsetY || 0;
        }

        // Position buttons
        this.positionBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.pos === state.logoPosition);
        });

        // Show/hide controls based on whether logo exists
        if (state.logoImage && this.logoControls) {
            this.logoControls.classList.remove('hidden');
        }
    }
}

// Factory function
export function createOverlaySettings() {
    const component = new OverlaySettings();
    component.init();
    return component;
}
