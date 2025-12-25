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
     * Apply Sobel edge detection to image data
     * @param {ImageData} imageData - Canvas image data
     * @param {number} strength - Edge strength (0-10)
     */
    applyEdgeDetection(imageData, strength) {
        if (strength <= 0) return;

        const { width, height, data } = imageData;
        const copy = new Uint8ClampedArray(data);

        // Sobel kernels
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        const factor = strength / 5;

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

                // Gradient magnitude
                const magR = Math.sqrt(gxR * gxR + gyR * gyR) * factor;
                const magG = Math.sqrt(gxG * gxG + gyG * gyG) * factor;
                const magB = Math.sqrt(gxB * gxB + gyB * gyB) * factor;

                const idx = (y * width + x) * 4;

                // Blend edge with original (darken edges)
                data[idx] = Math.max(0, copy[idx] - magR);
                data[idx + 1] = Math.max(0, copy[idx + 1] - magG);
                data[idx + 2] = Math.max(0, copy[idx + 2] - magB);
            }
        }
    }

    /**
     * Apply threshold to image data - pixels above threshold become white
     * @param {ImageData} imageData - Canvas image data
     * @param {number} thresholdPercent - Threshold percentage (0-100)
     */
    applyThreshold(imageData, thresholdPercent) {
        const { data } = imageData;
        const thresholdValue = Math.round(255 * (thresholdPercent / 100));

        for (let i = 0; i < data.length; i += 4) {
            const brightness = calculateBrightness(data[i], data[i + 1], data[i + 2]);

            if (brightness > thresholdValue) {
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
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
            negativeColor = '#555555'
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
            this.applyEdgeDetection(imageData, edges);
        }

        this.applyThreshold(imageData, threshold);

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
    checkMask(data, x, y, width, density) {
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;

        if (idx < 0 || idx >= data.length) return false;

        // Check alpha
        if (data[idx + 3] < 10) return false;

        // Check brightness
        const brightness = calculateBrightness(data[idx], data[idx + 1], data[idx + 2]);
        return brightness < density;
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
