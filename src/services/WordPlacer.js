/**
 * WordPlacer - Word placement algorithm service
 * 
 * SOLID Principles:
 * - SRP: Only handles word placement logic
 * - OCP: Can add new placement strategies via Strategy pattern
 * - DIP: Depends on ImageProcessor interface
 */

import { imageProcessor } from './ImageProcessor.js';
import { randomColor, randomFromPalette, hexToRgb } from '../utils/colorUtils.js';

/**
 * @typedef {Object} PlacementConfig
 * @property {number} scale - Font scale multiplier
 * @property {number} minPx - Minimum pixel size (optional)
 * @property {number} attempts - Number of placement attempts
 */

/** @type {PlacementConfig[]} */
const DEFAULT_SIZE_TIERS = [
    { scale: 4.0, attempts: 200 },
    { scale: 2.5, attempts: 1000 },
    { scale: 1.5, attempts: 5000 },
    { scale: 1.0, attempts: 15000 },
    { scale: 0.8, attempts: 40000 }
];

export class WordPlacer {
    constructor() {
        /** @type {PlacementConfig[]} */
        this.sizeTiers = DEFAULT_SIZE_TIERS;

        /** @type {CanvasRenderingContext2D|null} */
        this.metricsCtx = null;
    }

    /**
     * Set custom size tiers
     * @param {PlacementConfig[]} tiers - Array of placement configurations
     */
    setSizeTiers(tiers) {
        this.sizeTiers = tiers;
    }

    /**
     * Initialize metrics helper canvas
     * @returns {CanvasRenderingContext2D}
     */
    getMetricsContext() {
        if (!this.metricsCtx) {
            const canvas = document.createElement('canvas');
            this.metricsCtx = canvas.getContext('2d');
        }
        return this.metricsCtx;
    }

    /**
     * Check if a word placement collides with existing placements
     * @param {Uint8Array} grid - Collision grid
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} boxW - Box width
     * @param {number} boxH - Box height
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {boolean} True if collision detected
     */
    checkCollision(grid, cx, cy, boxW, boxH, width, height) {
        const startX = Math.floor(cx - boxW / 2);
        const startY = Math.floor(cy - boxH / 2);
        const endX = startX + boxW;
        const endY = startY + boxH;

        if (startX < 0 || startY < 0 || endX >= width || endY >= height) return true;

        // Scan grid with stride=2 for performance
        for (let y = startY; y < endY; y += 2) {
            const rowIdx = y * width;
            for (let x = startX; x < endX; x += 2) {
                if (grid[rowIdx + x] === 1) return true;
            }
        }
        return false;
    }

    /**
     * Mark grid cells as occupied
     * @param {Uint8Array} grid - Collision grid
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} boxW - Box width
     * @param {number} boxH - Box height
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} padding - Extra padding around word
     */
    markGrid(grid, cx, cy, boxW, boxH, width, height, padding = 2) {
        const startX = Math.floor(cx - boxW / 2);
        const startY = Math.floor(cy - boxH / 2);
        const endX = startX + boxW;
        const endY = startY + boxH;

        for (let y = startY - padding; y < endY + padding; y++) {
            if (y < 0 || y >= height) continue;
            const rowIdx = y * width;
            for (let x = startX - padding; x < endX + padding; x++) {
                if (x < 0 || x >= width) continue;
                grid[rowIdx + x] = 1;
            }
        }
    }

    /**
     * Check if entire word fits inside the mask
     * @param {Uint8ClampedArray} data - Image data
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} boxW - Box width
     * @param {number} boxH - Box height
     * @param {number} width - Canvas width
     * @param {number} density - Density threshold
     * @returns {boolean} True if word fits
     */
    checkPlacementBounds(data, cx, cy, boxW, boxH, width, density) {
        const startX = Math.floor(cx - boxW / 2);
        const startY = Math.floor(cy - boxH / 2);
        const endX = startX + boxW;
        const endY = startY + boxH;

        // Check corners and center
        const checkPoints = [
            [startX, startY],      // Top-Left
            [endX, startY],        // Top-Right
            [startX, endY],        // Bottom-Left
            [endX, endY],          // Bottom-Right
            [cx, cy]               // Center
        ];

        return checkPoints.every(([x, y]) =>
            imageProcessor.checkMask(data, x, y, width, density)
        );
    }

    /**
     * Get word color based on color mode
     * @param {string} colorMode - Color mode
     * @param {Object} pixelColor - Pixel color at position
     * @param {string} singleColor - Single color hex
     * @param {string[]} palette - Custom palette
     * @returns {{r: number, g: number, b: number}} RGB color
     */
    getWordColor(colorMode, pixelColor, singleColor, palette) {
        switch (colorMode) {
            case 'source':
                return { r: pixelColor.r, g: pixelColor.g, b: pixelColor.b };
            case 'random':
                return randomColor();
            case 'palette':
                return randomFromPalette(palette);
            case 'single':
            default:
                return hexToRgb(singleColor);
        }
    }

    /**
     * Place words on the canvas
     * @param {CanvasRenderingContext2D} ctx - Main canvas context
     * @param {Uint8ClampedArray} imageData - Processed image data
     * @param {Object} options - Placement options
     */
    placeWords(ctx, imageData, options) {
        const {
            width,
            height,
            words,
            heroWords = [],
            fontSize,
            density,
            colorMode,
            color,
            customPalette
        } = options;

        // Create collision grid
        const grid = new Uint8Array(width * height);
        const metricsCtx = this.getMetricsContext();

        // Setup canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Setup shadow for source mode
        if (colorMode === 'source') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Process each size tier
        for (const tier of this.sizeTiers) {
            let fontSizePx = Math.floor(fontSize * tier.scale);

            // Safety cap
            if (fontSizePx > width * 0.8) fontSizePx = Math.floor(width * 0.8);

            const font = `700 ${fontSizePx}px 'Outfit'`;
            ctx.font = font;
            metricsCtx.font = font;

            const isGiantTier = tier.scale >= 3.0;
            const attempts = Math.min(tier.attempts, 50000);

            for (let i = 0; i < attempts; i++) {
                // Pick random position
                const rx = Math.floor(Math.random() * width);
                const ry = Math.floor(Math.random() * height);

                // Check if position is in mask
                if (!imageProcessor.checkMask(imageData, rx, ry, width, density)) continue;

                // For giant words, only place in very dark areas
                if (isGiantTier) {
                    const { brightness } = imageProcessor.getPixelColor(imageData, rx, ry, width);
                    if (brightness > 100) continue;
                }

                // Pick word - hero words for giant tiers
                const word = (isGiantTier && heroWords.length > 0)
                    ? heroWords[Math.floor(Math.random() * heroWords.length)]
                    : words[Math.floor(Math.random() * words.length)];

                const measure = metricsCtx.measureText(word);
                const boxW = Math.ceil(measure.width);
                const boxH = Math.ceil(fontSizePx * 0.8);

                // Check bounds
                if (!this.checkPlacementBounds(imageData, rx, ry, boxW, boxH, width, density)) continue;

                // Check collision
                if (!this.checkCollision(grid, rx, ry, boxW, boxH, width, height)) {
                    // Get color
                    const pixelColor = imageProcessor.getPixelColor(imageData, rx, ry, width);
                    const wordColor = this.getWordColor(colorMode, pixelColor, color, customPalette);

                    // Calculate alpha
                    const alpha = colorMode === 'source' ? 1.0 : (1 - (pixelColor.brightness / 255));

                    // Draw word
                    ctx.fillStyle = `rgba(${wordColor.r}, ${wordColor.g}, ${wordColor.b}, ${alpha.toFixed(2)})`;
                    ctx.fillText(word, rx, ry);

                    // Mark grid
                    this.markGrid(grid, rx, ry, boxW, boxH, width, height);
                }
            }
        }
    }
}

// Singleton instance
export const wordPlacer = new WordPlacer();
