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
    { scale: 5.5, attempts: 1500, padding: 2, minClearanceFactor: 0.48, isGiant: true },
    { scale: 4.0, attempts: 3500, padding: 2, minClearanceFactor: 0.45, isGiant: true },
    { scale: 2.8, attempts: 8000, padding: 1, minClearanceFactor: 0.40, isGiant: true },
    { scale: 2.0, attempts: 20000, padding: 1, minClearanceFactor: 0.35 },
    { scale: 1.4, attempts: 40000, padding: 1, minClearanceFactor: 0.28 },
    { scale: 1.0, attempts: 65000, padding: 1, minClearanceFactor: 0.20 },
    { scale: 0.70, attempts: 90000, padding: 0, minClearanceFactor: 0.14 },
    { scale: 0.48, attempts: 130000, padding: 0, minClearanceFactor: 0.08 },
    { scale: 0.32, attempts: 160000, padding: 0, minClearanceFactor: 0.04 },
    { scale: 0.22, attempts: 190000, padding: 0, minClearanceFactor: 0.02 },
    { scale: 0.15, attempts: 220000, padding: 0, minClearanceFactor: 0.01 }
];

export class WordPlacer {
    constructor() {
        /** @type {PlacementConfig[]} */
        this.sizeTiers = DEFAULT_SIZE_TIERS;

        /** @type {HTMLCanvasElement|null} */
        this.metricsCanvas = null;

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
     * Initialize metrics helper canvas with willReadFrequently
     * @returns {CanvasRenderingContext2D}
     */
    getMetricsContext() {
        if (!this.metricsCtx) {
            this.metricsCanvas = document.createElement('canvas');
            this.metricsCanvas.width = 512;
            this.metricsCanvas.height = 256;
            this.metricsCtx = this.metricsCanvas.getContext('2d', { willReadFrequently: true });
        }
        return this.metricsCtx;
    }

    /**
     * Fast 2-pass Euclidean Distance Transform
     * Calculates clearance distance (in pixels) to the nearest background pixel.
     * @param {Uint8ClampedArray} imageData - Mask data
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} density - Density threshold
     * @returns {Float32Array} Distance map
     */
    computeDistanceMap(imageData, width, height, density) {
        const dist = new Float32Array(width * height);
        const INF = 999999;

        // Initialize: mask area = INF, background = 0
        for (let y = 0; y < height; y++) {
            const row = y * width;
            for (let x = 0; x < width; x++) {
                if (imageProcessor.checkMask(imageData, x, y, width, density)) {
                    dist[row + x] = INF;
                } else {
                    dist[row + x] = 0;
                }
            }
        }

        // Pass 1: Top-Left to Bottom-Right
        for (let y = 0; y < height; y++) {
            const row = y * width;
            for (let x = 0; x < width; x++) {
                const idx = row + x;
                if (dist[idx] > 0) {
                    let d = dist[idx];
                    if (x > 0) d = Math.min(d, dist[idx - 1] + 1);
                    if (y > 0) d = Math.min(d, dist[idx - width] + 1);
                    if (x > 0 && y > 0) d = Math.min(d, dist[idx - width - 1] + 1.414);
                    if (x < width - 1 && y > 0) d = Math.min(d, dist[idx - width + 1] + 1.414);
                    dist[idx] = d;
                }
            }
        }

        // Pass 2: Bottom-Right to Top-Left
        for (let y = height - 1; y >= 0; y--) {
            const row = y * width;
            for (let x = width - 1; x >= 0; x--) {
                const idx = row + x;
                if (dist[idx] > 0) {
                    let d = dist[idx];
                    if (x < width - 1) d = Math.min(d, dist[idx + 1] + 1);
                    if (y < height - 1) d = Math.min(d, dist[idx + width] + 1);
                    if (x < width - 1 && y < height - 1) d = Math.min(d, dist[idx + width + 1] + 1.414);
                    if (x > 0 && y < height - 1) d = Math.min(d, dist[idx + width - 1] + 1.414);
                    dist[idx] = d;
                }
            }
        }

        return dist;
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

        // Fast scan with step=2 for efficiency
        for (let y = startY; y < endY; y += 2) {
            const rowIdx = y * width;
            for (let x = startX; x < endX; x += 2) {
                if (grid[rowIdx + x] === 1) return true;
            }
        }
        return false;
    }

    /**
     * Mark rectangular box in collision grid (for tiny filler text)
     */
    markGridBox(grid, cx, cy, boxW, boxH, width, height, padding = 0) {
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
     * Mark ONLY the actual glyph / letter ink strokes into the collision grid.
     * This leaves the empty whitespace surrounding letters open so small words can nest directly beside and around big words!
     * @param {Uint8Array} grid - Collision grid
     * @param {string} word - Word text
     * @param {string} font - Canvas font string
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} boxW - Box width
     * @param {number} boxH - Box height
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} padding - Padding in px around glyph strokes
     */
    markGridGlyphs(grid, word, font, cx, cy, boxW, boxH, width, height, padding = 1) {
        // For tiny micro words, bounding box is faster and sufficient
        if (boxW < 24 || boxH < 14) {
            this.markGridBox(grid, cx, cy, boxW, boxH, width, height, padding);
            return;
        }

        const mCanvas = this.metricsCanvas;
        const mCtx = this.metricsCtx;
        const padBoxW = boxW + 8;
        const padBoxH = boxH + 8;

        if (mCanvas.width < padBoxW || mCanvas.height < padBoxH) {
            mCanvas.width = Math.max(mCanvas.width, padBoxW + 64);
            mCanvas.height = Math.max(mCanvas.height, padBoxH + 64);
        }

        mCtx.clearRect(0, 0, padBoxW, padBoxH);
        mCtx.font = font;
        mCtx.textBaseline = 'middle';
        mCtx.textAlign = 'center';
        mCtx.fillStyle = '#000000';
        mCtx.fillText(word, padBoxW / 2, padBoxH / 2);

        const imgData = mCtx.getImageData(0, 0, padBoxW, padBoxH);
        const data = imgData.data;

        const startX = Math.floor(cx - padBoxW / 2);
        const startY = Math.floor(cy - padBoxH / 2);

        for (let ly = 0; ly < padBoxH; ly += 2) {
            const gy = startY + ly;
            if (gy < 0 || gy >= height) continue;
            const gridRow = gy * width;
            const imgRow = ly * padBoxW;

            for (let lx = 0; lx < padBoxW; lx += 2) {
                const gx = startX + lx;
                if (gx < 0 || gx >= width) continue;

                // Check pixel alpha of drawn text stroke
                if (data[(imgRow + lx) * 4 + 3] > 40) {
                    if (padding === 0) {
                        grid[gridRow + gx] = 1;
                        if (gx + 1 < width) grid[gridRow + gx + 1] = 1;
                        if (gy + 1 < height) {
                            grid[gridRow + width + gx] = 1;
                            if (gx + 1 < width) grid[gridRow + width + gx + 1] = 1;
                        }
                    } else {
                        // Mark with padding
                        for (let py = -padding; py <= padding; py++) {
                            const ny = gy + py;
                            if (ny < 0 || ny >= height) continue;
                            const r = ny * width;
                            for (let px = -padding; px <= padding; px++) {
                                const nx = gx + px;
                                if (nx >= 0 && nx < width) {
                                    grid[r + nx] = 1;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Check if entire word fits inside the mask
     * For thin lines/collar strokes (isThinEdge = true), only checks the center line so words can trace along thin strokes
     * @param {Uint8ClampedArray} data - Image data
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} boxW - Box width
     * @param {number} boxH - Box height
     * @param {number} width - Canvas width
     * @param {number} density - Density threshold
     * @param {boolean} isThinEdge - Whether placing on thin edge/contour
     * @returns {boolean} True if word fits
     */
    checkPlacementBounds(data, cx, cy, boxW, boxH, width, density, isThinEdge = false) {
        if (isThinEdge) {
            // For thin lines / collar contours: check center and mid-points
            return imageProcessor.checkMask(data, cx, cy, width, density);
        }

        const halfW = boxW / 2;
        const halfH = boxH / 2;
        const startX = Math.floor(cx - halfW);
        const startY = Math.floor(cy - halfH);
        const endX = Math.floor(cx + halfW);
        const endY = Math.floor(cy + halfH);
        const midX = Math.floor(cx);
        const midY = Math.floor(cy);

        const checkPoints = [
            [startX, startY], [midX, startY], [endX, startY],
            [startX, midY],   [midX, midY],   [endX, midY],
            [startX, endY],   [midX, endY],   [endX, endY],
            [Math.floor(cx - halfW * 0.5), midY],
            [Math.floor(cx + halfW * 0.5), midY]
        ];

        for (let i = 0; i < checkPoints.length; i++) {
            const [px, py] = checkPoints[i];
            if (!imageProcessor.checkMask(data, px, py, width, density)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get word color based on color mode
     * @param {string} colorMode - Color mode
     * @param {Object} pixelColor - Pixel color at position
     * @param {string} singleColor - Single color hex
     * @param {string[]} palette - Custom palette
     * @param {string} word - Current word being placed
     * @param {Object} wordColors - Map of word to color hex
     * @returns {{r: number, g: number, b: number}} RGB color
     */
    getWordColor(colorMode, pixelColor, singleColor, palette, word = '', wordColors = {}) {
        // Check for per-word color first
        if (colorMode === 'perWord' && word && wordColors[word]) {
            return hexToRgb(wordColors[word]);
        }

        switch (colorMode) {
            case 'source':
                return { r: pixelColor.r, g: pixelColor.g, b: pixelColor.b };
            case 'random':
                return randomColor();
            case 'palette':
                return randomFromPalette(palette);
            case 'perWord':
                if (word && wordColors[word]) {
                    return hexToRgb(wordColors[word]);
                }
                return randomColor();
            case 'single':
            default:
                return hexToRgb(singleColor);
        }
    }

    /**
     * Place words on the canvas using Distance-Transform Space Fitting (WordArt.com style)
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
            fontFamily = 'Outfit',
            fontWeight = 700,
            density,
            colorMode,
            color,
            customPalette,
            wordColors = {},
            wordItems = []
        } = options;

        // Step 1: Pre-calculate distance-to-boundary clearance map
        const distMap = this.computeDistanceMap(imageData, width, height, density);

        // Step 2: Create collision grid
        const grid = new Uint8Array(width * height);
        const metricsCtx = this.getMetricsContext();

        // Vector words list for high-res SVG export
        this.placedWords = [];

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

        const placedCount = {};

        // Step 3: Process each size tier from largest to smallest
        for (const tier of this.sizeTiers) {
            let fontSizePx = Math.floor(fontSize * tier.scale);
            if (fontSizePx < 6) fontSizePx = 6;
            if (fontSizePx > width * 0.85) fontSizePx = Math.floor(width * 0.85);

            const font = `${fontWeight} ${fontSizePx}px '${fontFamily}'`;
            ctx.font = font;
            metricsCtx.font = font;

            const isGiantTier = tier.isGiant || tier.scale >= 2.5;
            const isThinEdge = tier.isThinEdge || tier.scale <= 0.35;
            const tierPadding = tier.padding !== undefined ? tier.padding : (tier.scale >= 2.0 ? 1 : 0);
            const minClearanceFactor = isThinEdge ? 0 : (tier.minClearanceFactor || 0.25);
            const requiredClearance = Math.floor(fontSizePx * minClearanceFactor);
            const attempts = tier.attempts;

            for (let i = 0; i < attempts; i++) {
                const rx = Math.floor(Math.random() * width);
                const ry = Math.floor(Math.random() * height);
                const posIdx = ry * width + rx;

                // SPACE-FITTING CHECK: Location MUST have enough distance to edge for this font size!
                if (requiredClearance > 0 && distMap[posIdx] < requiredClearance) continue;

                // Check brightness threshold: giant words only in solid dark areas
                if (isGiantTier) {
                    const { brightness } = imageProcessor.getPixelColor(imageData, rx, ry, width);
                    if (brightness > 115) continue;
                }

                // Pick word: prioritize Hero Words for giant tiers
                let word;
                if (heroWords.length > 0 && isGiantTier) {
                    word = heroWords[Math.floor(Math.random() * heroWords.length)];
                } else {
                    word = words[Math.floor(Math.random() * words.length)];
                }

                if (!word) continue;

                const measure = metricsCtx.measureText(word);
                const boxW = Math.ceil(measure.width);
                const boxH = Math.ceil(fontSizePx * 0.82);

                // Multi-point boundary check (relaxed for thin edge / collar line tiers)
                if (!this.checkPlacementBounds(imageData, rx, ry, boxW, boxH, width, density, isThinEdge)) continue;

                // Collision check against already placed words
                if (!this.checkCollision(grid, rx, ry, boxW, boxH, width, height)) {
                    // Get color
                    const pixelColor = imageProcessor.getPixelColor(imageData, rx, ry, width);
                    const wordColor = this.getWordColor(colorMode, pixelColor, color, customPalette, word, wordColors);

                    // Shading based on brightness: light face areas get low alpha (0.12 - 0.35), dark areas get full alpha (0.8 - 1.0)
                    let alpha;
                    if (colorMode === 'source') {
                        alpha = 1.0;
                    } else {
                        const darkness = 1 - (pixelColor.brightness / 255);
                        alpha = Math.max(0.15, Math.min(1.0, darkness * 1.15));
                    }

                    const colorStr = `rgba(${wordColor.r}, ${wordColor.g}, ${wordColor.b}, ${alpha.toFixed(2)})`;

                    // Draw word
                    ctx.fillStyle = colorStr;
                    ctx.fillText(word, rx, ry);

                    // Record vector word
                    this.placedWords.push({
                        text: word,
                        x: rx,
                        y: ry,
                        fontFamily: fontFamily || 'Outfit',
                        fontWeight: fontWeight || 700,
                        fontSize: fontSizePx,
                        color: colorStr
                    });

                    // Mark grid with glyph stroke accuracy so smaller words can nest around & beside
                    this.markGridGlyphs(grid, word, font, rx, ry, boxW, boxH, width, height, tierPadding);

                    placedCount[word] = (placedCount[word] || 0) + 1;
                }
            }
        }

        // Step 4: Thin Line & Shirt Collar Sweep
        // Directly detects unvisited thin line/collar pixels and places micro-words along them
        const edgeWords = words.length > 0 ? words : ['Art', 'Life', 'Soul', 'Code'];
        const edgeFontSizePx = Math.max(7, Math.floor(fontSize * 0.18));
        const edgeFont = `${fontWeight} ${edgeFontSizePx}px '${fontFamily}'`;
        ctx.font = edgeFont;
        metricsCtx.font = edgeFont;

        const stepY = Math.max(4, Math.floor(edgeFontSizePx * 0.7));
        const stepX = Math.max(6, Math.floor(edgeFontSizePx * 1.1));

        for (let y = 4; y < height - 4; y += stepY) {
            const rowIdx = y * width;
            for (let x = 4; x < width - 4; x += stepX) {
                const posIdx = rowIdx + x;

                // Check if this pixel is a dark stroke pixel that hasn't received any word yet
                if (grid[posIdx] === 0 && imageProcessor.checkMask(imageData, x, y, width, density)) {
                    const pixelColor = imageProcessor.getPixelColor(imageData, x, y, width);
                    // Dark line / collar stroke
                    if (pixelColor.brightness < 185) {
                        const word = edgeWords[Math.floor(Math.random() * edgeWords.length)];
                        const measure = metricsCtx.measureText(word);
                        const boxW = Math.ceil(measure.width);
                        const boxH = Math.ceil(edgeFontSizePx * 0.82);

                        if (!this.checkCollision(grid, x, y, boxW, boxH, width, height)) {
                            const wordColor = this.getWordColor(colorMode, pixelColor, color, customPalette, word, wordColors);
                            const darkness = 1 - (pixelColor.brightness / 255);
                            const alpha = colorMode === 'source' ? 1.0 : Math.max(0.40, Math.min(1.0, darkness * 1.2));
                            const colorStr = `rgba(${wordColor.r}, ${wordColor.g}, ${wordColor.b}, ${alpha.toFixed(2)})`;

                            ctx.fillStyle = colorStr;
                            ctx.fillText(word, x, y);

                            this.placedWords.push({
                                text: word,
                                x: x,
                                y: y,
                                fontFamily: fontFamily || 'Outfit',
                                fontWeight: fontWeight || 700,
                                fontSize: edgeFontSizePx,
                                color: colorStr
                            });

                            this.markGridBox(grid, x, y, boxW, boxH, width, height, 0);
                        }
                    }
                }
            }
        }

        return this.placedWords;
    }
}

// Singleton instance
export const wordPlacer = new WordPlacer();
