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
}

// Singleton instance
export const exportService = new ExportService();
