/**
 * Color utility functions - Single Responsibility: Color parsing and manipulation
 */

/**
 * Parse a hex color string to RGB values
 * @param {string} hex - Hex color string (with or without #)
 * @returns {{r: number, g: number, b: number}} RGB values
 */
export function hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    return {
        r: parseInt(cleanHex.substring(0, 2), 16),
        g: parseInt(cleanHex.slice(2, 4), 16),
        b: parseInt(cleanHex.slice(4, 6), 16)
    };
}

/**
 * Convert RGB values to hex string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string with #
 */
export function rgbToHex(r, g, b) {
    const toHex = (n) => {
        const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate luminance/brightness of RGB values
 * Uses standard formula: 0.299*R + 0.587*G + 0.114*B
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {number} Brightness value (0-255)
 */
export function calculateBrightness(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min = 0, max = 255) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Generate a random color
 * @returns {{r: number, g: number, b: number}} Random RGB values
 */
export function randomColor() {
    return {
        r: Math.floor(Math.random() * 200),
        g: Math.floor(Math.random() * 200),
        b: Math.floor(Math.random() * 200)
    };
}

/**
 * Pick a random color from a palette array
 * @param {string[]} palette - Array of hex color strings
 * @returns {{r: number, g: number, b: number}} RGB values
 */
export function randomFromPalette(palette) {
    if (!palette || palette.length === 0) {
        return { r: 0, g: 0, b: 0 };
    }
    const hex = palette[Math.floor(Math.random() * palette.length)];
    return hexToRgb(hex);
}
