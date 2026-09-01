/**
 * ExportService - Export/Download service
 * 
 * SOLID Principles:
 * - SRP: Only handles export functionality
 * - OCP: Can add new export formats
 */

export class ExportService {
    /**
     * Download canvas as PNG
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} filename - Filename (without extension)
     * @param {number} quality - Quality (0-1)
     */
    downloadPNG(canvas, filename = 'word-portrait', quality = 1.0) {
        const link = document.createElement('a');
        link.download = `${filename}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', quality);
        link.click();
    }

    /**
     * Download as pure Vector SVG (infinite crispness / zero blur at any zoom)
     * @param {Array} placedWords - Array of placed word objects
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} filename - Filename
     */
    downloadSVG(placedWords, width, height, filename = 'word-portrait-vector') {
        if (!placedWords || placedWords.length === 0) {
            console.warn('No placed words to export to SVG');
            return;
        }

        const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n` +
            `  <rect width="100%" height="100%" fill="#ffffff"/>\n` +
            `  <g text-anchor="middle" dominant-baseline="central">\n`;

        const svgContent = placedWords.map(w => {
            const escaped = (w.text || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            return `    <text x="${w.x}" y="${w.y}" font-family="'${w.fontFamily}', sans-serif" font-weight="${w.fontWeight || 700}" font-size="${w.fontSize}" fill="${w.color}">${escaped}</text>`;
        }).join('\n');

        const svgFooter = `\n  </g>\n</svg>`;
        const fullSvg = svgHeader + svgContent + svgFooter;

        const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}-${Date.now()}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Download canvas as JPEG
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} filename - Filename (without extension)
     * @param {number} quality - Quality (0-1)
     */
    downloadJPEG(canvas, filename = 'word-portrait', quality = 0.92) {
        const link = document.createElement('a');
        link.download = `${filename}-${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', quality);
        link.click();
    }

    /**
     * Get canvas as Blob
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} type - MIME type
     * @param {number} quality - Quality (0-1)
     * @returns {Promise<Blob>} Blob promise
     */
    async getBlob(canvas, type = 'image/png', quality = 1.0) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                blob => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
                type,
                quality
            );
        });
    }

    /**
     * Get canvas as Data URL
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} type - MIME type
     * @param {number} quality - Quality (0-1)
     * @returns {string} Data URL
     */
    getDataURL(canvas, type = 'image/png', quality = 1.0) {
        return canvas.toDataURL(type, quality);
    }

    /**
     * Copy canvas to clipboard
     * @param {HTMLCanvasElement} canvas - Canvas to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(canvas) {
        try {
            const blob = await this.getBlob(canvas, 'image/png');
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
}

// Singleton instance
export const exportService = new ExportService();
