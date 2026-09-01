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

    /**
     * Download portrait as vector SVG (Infinite resolution, razor sharp, zero blur)
     * @param {Array} placedWords - Array of placed word objects
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} filename - Output filename
     */
    downloadSVG(placedWords = [], width = 2400, height = 3600, filename = 'word-portrait-vector') {
        if (!placedWords || placedWords.length === 0) {
            alert('Please generate a portrait first.');
            return;
        }

        let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g text-anchor="middle" dominant-baseline="central">
`;

        for (const w of placedWords) {
            const safeText = String(w.text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');

            svgContent += `    <text x="${w.x}" y="${w.y}" font-family="'${w.fontFamily}', sans-serif" font-weight="${w.fontWeight}" font-size="${w.fontSize}px" fill="${w.color}">${safeText}</text>\n`;
        }

        svgContent += `  </g>\n</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}-${Date.now()}.svg`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
}

// Singleton instance
export const exportService = new ExportService();
