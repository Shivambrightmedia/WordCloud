/**
 * ImageCustomizer - Image customization controls (threshold, edges, etc.)
 * 
 * SOLID: SRP - Only handles image customization UI
 */

import { BaseComponent } from './BaseComponent.js';
import { Events } from '../core/EventBus.js';
import { imageProcessor } from '../services/ImageProcessor.js';

export class ImageCustomizer extends BaseComponent {
    constructor() {
        super('ImageCustomizer');

        // Element references
        this.thresholdInput = null;
        this.thresholdValue = null;
        this.edgesInput = null;
        this.edgesValue = null;
        this.negativeToggle = null;
        this.negativeColor = null;
        this.marginInput = null;
        this.marginValue = null;
        this.togglePreviewBtn = null;
        this.previewPanel = null;
        this.previewCanvas = null;
        this.showOriginalBtn = null;

        this._showingOriginal = false;
    }

    cacheElements() {
        this.thresholdInput = this.$('thresholdInput');
        this.thresholdValue = this.$('thresholdValue');
        this.edgesInput = this.$('edgesInput');
        this.edgesValue = this.$('edgesValue');
        this.negativeToggle = this.$('negativeToggle');
        this.negativeColor = this.$('negativeColor');
        this.marginInput = this.$('marginInput');
        this.marginValue = this.$('marginValue');
        this.togglePreviewBtn = this.$('togglePreviewBtn');
        this.previewPanel = this.$('imagePreviewPanel');
        this.previewCanvas = this.$('previewCanvas');
        this.showOriginalBtn = this.$('showOriginalBtn');
    }

    bindEvents() {
        // Threshold slider
        this.addListener(this.thresholdInput, 'input', (e) => {
            const value = parseInt(e.target.value);
            this.setState({ threshold: value });
            this.thresholdValue.textContent = `${value}%`;
            this.updatePreview();
        });

        // Edges slider
        this.addListener(this.edgesInput, 'input', (e) => {
            const value = parseInt(e.target.value);
            this.setState({ edges: value });
            this.edgesValue.textContent = value;
            this.updatePreview();
        });

        // Negative toggle
        this.addListener(this.negativeToggle, 'change', (e) => {
            this.setState({ negative: e.target.checked });
            this.updatePreview();
        });

        // Negative color
        this.addListener(this.negativeColor, 'input', (e) => {
            this.setState({ negativeColor: e.target.value });
            if (this.state.negative) {
                this.updatePreview();
            }
        });

        // Margin slider
        this.addListener(this.marginInput, 'input', (e) => {
            const value = parseInt(e.target.value);
            this.setState({ margin: value });
            this.marginValue.textContent = `${value}%`;
            this.updatePreview();
        });

        // Toggle preview button
        this.addListener(this.togglePreviewBtn, 'click', () => {
            this.togglePreview();
        });

        // Show original button (hold to show)
        this.addListener(this.showOriginalBtn, 'mousedown', () => {
            this._showingOriginal = true;
            this.updatePreview(true);
        });

        this.addListener(this.showOriginalBtn, 'mouseup', () => {
            this._showingOriginal = false;
            this.updatePreview(false);
        });

        this.addListener(this.showOriginalBtn, 'mouseleave', () => {
            if (this._showingOriginal) {
                this._showingOriginal = false;
                this.updatePreview(false);
            }
        });

        // +/- adjustment buttons
        document.querySelectorAll('.adjust-btn').forEach(btn => {
            this.addListener(btn, 'click', () => {
                const targetId = btn.dataset.target;
                const delta = parseInt(btn.dataset.delta);
                const input = document.getElementById(targetId);
                if (input) {
                    let newValue = parseInt(input.value) + delta;
                    newValue = Math.max(parseInt(input.min), Math.min(parseInt(input.max), newValue));
                    input.value = newValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        });

        // Listen for image loaded
        this.on(Events.IMAGE_LOADED, () => {
            if (!this.previewPanel.classList.contains('hidden')) {
                this.updatePreview();
            }
        });
    }

    /**
     * Toggle preview visibility
     */
    togglePreview() {
        const isVisible = !this.previewPanel.classList.contains('hidden');

        if (isVisible) {
            this.previewPanel.classList.add('hidden');
            this.togglePreviewBtn.textContent = 'Show Preview';
            this.togglePreviewBtn.classList.remove('active');
        } else {
            this.previewPanel.classList.remove('hidden');
            this.togglePreviewBtn.textContent = 'Hide Preview';
            this.togglePreviewBtn.classList.add('active');
            this.updatePreview();
        }
    }

    /**
     * Update the preview canvas
     * @param {boolean} showOriginal - Show original image without processing
     */
    updatePreview(showOriginal = false) {
        const { image, threshold, edges, negative, negativeColor, margin } = this.state;

        if (!image) return;

        const canvas = this.previewCanvas;
        const ctx = canvas.getContext('2d');

        // Set preview size maintaining aspect ratio
        const previewSize = 200;
        const imgAspect = image.width / image.height;

        if (imgAspect > 1) {
            canvas.width = previewSize;
            canvas.height = Math.round(previewSize / imgAspect);
        } else {
            canvas.height = previewSize;
            canvas.width = Math.round(previewSize * imgAspect);
        }

        // Calculate margin
        const marginPx = Math.round(Math.min(canvas.width, canvas.height) * (margin / 100));
        const drawWidth = canvas.width - (marginPx * 2);
        const drawHeight = canvas.height - (marginPx * 2);

        // Clear and draw
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, marginPx, marginPx, drawWidth, drawHeight);

        // If showing original, stop here
        if (showOriginal) return;

        // Get and process image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (edges > 0) {
            imageProcessor.applyEdgeDetection(imageData, edges);
        }

        imageProcessor.applyThreshold(imageData, threshold);

        if (negative) {
            imageProcessor.applyNegative(imageData, threshold, negativeColor);
        }

        ctx.putImageData(imageData, 0, 0);

        this.emit(Events.UI_PREVIEW_UPDATE, { imageData });
    }

    render() {
        // Sync UI with current state
        const state = this.state;

        this.thresholdInput.value = state.threshold;
        this.thresholdValue.textContent = `${state.threshold}%`;

        this.edgesInput.value = state.edges;
        this.edgesValue.textContent = state.edges;

        this.negativeToggle.checked = state.negative;
        this.negativeColor.value = state.negativeColor;

        this.marginInput.value = state.margin;
        this.marginValue.textContent = `${state.margin}%`;
    }
}

// Factory function  
export function createImageCustomizer() {
    const component = new ImageCustomizer();
    component.init();
    return component;
}
