/**
 * ImageProcessor - Image processing service
 * 
 * SOLID Principles:
 * - SRP: Only handles image processing algorithms
 * - OCP: Can add new filters without modifying existing code
 * - DIP: Depends on state interface, not concrete implementation
 */

import { calculateBrightness, hexToRgb, clamp } from '../utils/colorUtils.js';

export class ImageProcessor {
    /**
     * Check if a pixel represents human skin tone using YCbCr chromaticity
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {boolean} True if skin tone
     */
    /**
     * Check if a pixel represents human facial skin tone
     * Uses saturation, chromaticity, and spatial prior (face is in upper body)
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @param {number} y - Current pixel Y position
     * @param {number} height - Total image height
     * @returns {boolean} True if facial skin tone
     */
    isSkinPixel(r, g, b, y = 0, height = 1000) {
        // Spatial prior: chest/shoulders/suit in bottom 45% are clothes, not face
        if (y > height * 0.55) return false;

        // Neutral grey check: grey suit / white shirt have low saturation (max - min < 20)
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (max - min < 20) return false;

        // Skin must have dominant red component
        if (r <= g || r <= b) return false;

        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

        return cb >= 75 && cb <= 130 && cr >= 135 && cr <= 175;
    }

    /**
     * Apply Sobel edge detection to image data
     * @param {ImageData} imageData - Canvas image data
     * @param {number} strength - Edge strength (0-10)
     * @param {boolean} faceProtect - Whether to soften facial skin wrinkles
     */
    applyEdgeDetection(imageData, strength, faceProtect = true) {
        if (strength <= 0) return;

        const { width, height, data } = imageData;
        const copy = new Uint8ClampedArray(data);

        // Sobel kernels
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        const baseFactor = strength / 5;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gxR = 0, gyR = 0;
                let gxG = 0, gyG = 0;
                let gxB = 0, gyB = 0;

                // Apply kernel
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);

                        gxR += copy[idx] * sobelX[kernelIdx];
                        gyR += copy[idx] * sobelY[kernelIdx];
                        gxG += copy[idx + 1] * sobelX[kernelIdx];
                        gyG += copy[idx + 1] * sobelY[kernelIdx];
                        gxB += copy[idx + 2] * sobelX[kernelIdx];
                        gyB += copy[idx + 2] * sobelY[kernelIdx];
                    }
                }

                const idx = (y * width + x) * 4;
                const isSkin = faceProtect && this.isSkinPixel(copy[idx], copy[idx + 1], copy[idx + 2], y, height);
                // Soften edges on face to prevent fake wrinkles; keep 100% sharp on suit/lapels
                const factor = isSkin ? baseFactor * 0.15 : baseFactor;

                // Gradient magnitude
                const magR = Math.sqrt(gxR * gxR + gyR * gyR) * factor;
                const magG = Math.sqrt(gxG * gxG + gyG * gyG) * factor;
                const magB = Math.sqrt(gxB * gxB + gyB * gyB) * factor;

                // Blend edge with original (darken edges)
                data[idx] = Math.max(0, copy[idx] - magR);
                data[idx + 1] = Math.max(0, copy[idx + 1] - magG);
                data[idx + 2] = Math.max(0, copy[idx + 2] - magB);
            }
        }
    }

    /**
     * Apply threshold to image data - pixels above threshold become white
     * Dual-thresholding protects face highlights while preserving clothes
     * @param {ImageData} imageData - Canvas image data
     * @param {number} thresholdPercent - Threshold percentage (0-100)
     * @param {boolean} faceProtect - Whether to protect face highlights and boost clothes
     */
    applyThreshold(imageData, thresholdPercent, faceProtect = true) {
        const { width, height, data } = imageData;
        const clothesCutoff = Math.round(255 * (thresholdPercent / 100));

        // When faceProtect is ON:
        // Clothes use the full user slider (so suit fills in as slider increases).
        // Face skin uses a protected lighter threshold (~68% of clothes, capped at 118)
        // so cheeks & forehead remain clean highlights even when slider is high!
        const faceCutoff = faceProtect
            ? Math.min(118, Math.round(clothesCutoff * 0.68))
            : clothesCutoff;

        for (let y = 0; y < height; y++) {
            const rowIdx = y * width * 4;
            for (let x = 0; x < width; x++) {
                const i = rowIdx + x * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = calculateBrightness(r, g, b);

                const isSkin = faceProtect && this.isSkinPixel(r, g, b, y, height);
                const cutoff = isSkin ? faceCutoff : clothesCutoff;

                if (brightness > cutoff) {
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                }
            }
        }
    }

    /**
     * Apply negative effect to non-white pixels
     * @param {ImageData} imageData - Canvas image data
     * @param {number} thresholdPercent - Threshold percentage (0-100)
     * @param {string} negativeColor - Hex color for negative blend
     */
    applyNegative(imageData, thresholdPercent, negativeColor) {
        const { data } = imageData;
        const thresholdValue = Math.round(255 * (thresholdPercent / 100));
        const { r: negR, g: negG, b: negB } = hexToRgb(negativeColor);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = calculateBrightness(r, g, b);

            if (brightness <= thresholdValue) {
                data[i] = clamp(255 - r + negR);
                data[i + 1] = clamp(255 - g + negG);
                data[i + 2] = clamp(255 - b + negB);
            }
        }
    }

    /**
     * Process image with all customization options
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLImageElement} image - Source image
     * @param {Object} options - Processing options
     * @returns {ImageData} Processed image data
     */
    processImage(ctx, image, options) {
        const {
            width,
            height,
            scale = 100,
            offsetX = 0,
            offsetY = 0,
            margin = 0,
            threshold = 44,
            edges = 0,
            negative = false,
            negativeColor = '#555555',
            faceProtect = true
        } = options;

        // Calculate dimensions with margin
        const marginPx = Math.round(Math.min(width, height) * (margin / 100));
        const imgAspect = image.width / image.height;
        const canvasAspect = width / height;

        let drawW, drawH, curX, curY;

        if (imgAspect > canvasAspect) {
            drawH = height - (marginPx * 2);
            drawW = drawH * imgAspect;
            curX = (width - drawW) / 2;
            curY = marginPx;
        } else {
            drawW = width - (marginPx * 2);
            drawH = drawW / imgAspect;
            curX = marginPx;
            curY = (height - drawH) / 2;
        }

        // Apply scale
        const scaleFactor = scale / 100;
        drawW *= scaleFactor;
        drawH *= scaleFactor;

        // Recenter after scaling
        curX = (width - drawW) / 2;
        curY = (height - drawH) / 2;

        // Apply offset
        curX += offsetX;
        curY += offsetY;

        // Draw white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image
        ctx.drawImage(image, curX, curY, drawW, drawH);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, width, height);

        // Apply filters
        if (edges > 0) {
            this.applyEdgeDetection(imageData, edges, faceProtect);
        }

        this.applyThreshold(imageData, threshold, faceProtect);

        if (negative) {
            this.applyNegative(imageData, threshold, negativeColor);
        }

        return imageData;
    }

    /**
     * Check if a pixel position is within the mask (dark enough for word placement)
     * @param {Uint8ClampedArray} data - Image data array
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Image width
     * @param {number} density - Density threshold
     * @returns {boolean} Whether the position is valid for word placement
     */
    checkMask(data, x, y, width, density = 248) {
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;

        if (idx < 0 || idx >= data.length) return false;

        // Check alpha (transparent pixels are background)
        if (data[idx + 3] < 10) return false;

        // Check brightness: allow text placement on light face areas (< 248)
        const brightness = calculateBrightness(data[idx], data[idx + 1], data[idx + 2]);
        const maxThreshold = Math.max(density, 246);
        return brightness < maxThreshold;
    }

    /**
     * Get pixel color at position
     * @param {Uint8ClampedArray} data - Image data array
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Image width
     * @returns {{r: number, g: number, b: number, brightness: number}} Color values
     */
    getPixelColor(data, x, y, width) {
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = calculateBrightness(r, g, b);

        return { r, g, b, brightness };
    }
}

// Singleton instance
export const imageProcessor = new ImageProcessor();
