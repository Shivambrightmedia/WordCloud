/**
 * CanvasRenderer - Main canvas rendering and generation
 * 
 * SOLID: SRP - Only handles canvas rendering
 */

import { BaseComponent } from './BaseComponent.js';
import { Events } from '../core/EventBus.js';
import { imageProcessor } from '../services/ImageProcessor.js';
import { wordPlacer } from '../services/WordPlacer.js';
import { exportService } from '../services/ExportService.js';

export class CanvasRenderer extends BaseComponent {
    constructor() {
        super('CanvasRenderer');

        this.mainCanvas = null;
        this.processingCanvas = null;
        this.ctx = null;
        this.procCtx = null;
        this.generateBtn = null;
        this.downloadBtn = null;
        this.loading = null;
        this.emptyState = null;

        this._isGenerating = false;
    }

    cacheElements() {
        this.mainCanvas = this.$('mainCanvas');
        this.processingCanvas = this.$('processingCanvas');
        this.ctx = this.mainCanvas.getContext('2d');
        this.procCtx = this.processingCanvas.getContext('2d');
        this.generateBtn = this.$('generateBtn');
        this.downloadBtn = this.$('downloadBtn');
        this.loading = this.$('loadingIndicator');
        this.emptyState = this.$('emptyState');
    }

    bindEvents() {
        this.addListener(this.generateBtn, 'click', () => this.generate());
        this.addListener(this.downloadBtn, 'click', () => this.download());

        // Listen for generation events
        this.on(Events.GENERATION_START, () => this.showLoading());
        this.on(Events.GENERATION_COMPLETE, () => this.hideLoading());
        this.on(Events.GENERATION_ERROR, (error) => {
            this.hideLoading();
            console.error('Generation error:', error);
        });
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.loading.classList.remove('hidden');
        this.emptyState.classList.add('hidden');
        this._isGenerating = true;
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.loading.classList.add('hidden');
        this._isGenerating = false;
    }

    /**
     * Generate the word portrait
     */
    async generate() {
        const { image } = this.state;

        if (!image) {
            alert('Please upload an image first.');
            return;
        }

        if (this._isGenerating) {
            console.warn('Generation already in progress');
            return;
        }

        this.emit(Events.GENERATION_START);

        try {
            // Wait for fonts to load
            await document.fonts.ready;

            // Use setTimeout to allow UI to update
            setTimeout(() => {
                this.processGeneration();
            }, 100);
        } catch (error) {
            this.emit(Events.GENERATION_ERROR, error);
        }
    }

    /**
     * Process the actual generation
     */
    processGeneration() {
        const startTime = performance.now();
        const state = this.state;

        const { canvasWidth, canvasHeight, image } = state;

        // Setup canvases
        this.mainCanvas.width = canvasWidth;
        this.mainCanvas.height = canvasHeight;
        this.processingCanvas.width = canvasWidth;
        this.processingCanvas.height = canvasHeight;

        // Process image
        const imageData = imageProcessor.processImage(this.procCtx, image, {
            width: canvasWidth,
            height: canvasHeight,
            scale: state.imageScale,
            offsetX: state.imageOffsetX,
            offsetY: state.imageOffsetY,
            margin: state.margin,
            threshold: state.threshold,
            edges: state.edges,
            negative: state.negative,
            negativeColor: state.negativeColor
        });

        // Place words
        wordPlacer.placeWords(this.ctx, imageData.data, {
            width: canvasWidth,
            height: canvasHeight,
            words: state.words,
            heroWords: state.heroWords,
            fontSize: state.fontSize,
            density: state.density,
            colorMode: state.colorMode,
            color: state.color,
            customPalette: state.customPalette
        });

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`Generation took ${duration}s`);

        // Enable download button
        this.downloadBtn.disabled = false;

        // Scroll to canvas
        this.mainCanvas.scrollIntoView({ behavior: 'smooth' });

        this.emit(Events.GENERATION_COMPLETE, { duration });
    }

    /**
     * Download the generated image
     */
    download() {
        exportService.downloadPNG(this.mainCanvas, 'word-portrait');
    }

    render() {
        // Initial render - nothing to do
    }
}

// Factory function
export function createCanvasRenderer() {
    const component = new CanvasRenderer();
    component.init();
    return component;
}
