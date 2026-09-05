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
        if (canvas.toBlob) {
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `${filename}-${Date.now()}.png`;
                    link.href = url;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                } else {
                    this._fallbackDownload(canvas.toDataURL('image/png', quality), `${filename}-${Date.now()}.png`);
                }
            }, 'image/png', quality);
        } else {
            this._fallbackDownload(canvas.toDataURL('image/png', quality), `${filename}-${Date.now()}.png`);
        }
    }

    /**
     * Download canvas as JPEG (significantly smaller file size ~1-3MB compared to 25MB+ PNG)
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} filename - Filename (without extension)
     * @param {number} quality - Quality (0-1, default 0.92)
     */
    downloadJPEG(canvas, filename = 'word-portrait', quality = 0.92) {
        // High-resolution canvases can have transparent pixels which turn black in standard JPEG.
        // We draw onto an offscreen canvas with a pure white background to guarantee clean output.
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const ctx = exportCanvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        if (exportCanvas.toBlob) {
            exportCanvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `${filename}-${Date.now()}.jpg`;
                    link.href = url;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                } else {
                    this._fallbackDownload(exportCanvas.toDataURL('image/jpeg', quality), `${filename}-${Date.now()}.jpg`);
                }
            }, 'image/jpeg', quality);
        } else {
            this._fallbackDownload(exportCanvas.toDataURL('image/jpeg', quality), `${filename}-${Date.now()}.jpg`);
        }
    }

    /**
     * Fallback data URL download helper
     * @private
     */
    _fallbackDownload(href, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = href;
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

    /**
     * Share canvas image using native OS / iOS / iPadOS Share Sheet
     * @param {HTMLCanvasElement} canvas - Canvas to share
     * @param {string} filename - Filename (without extension)
     * @param {string} format - Image format ('jpeg' or 'png')
     * @param {number} quality - Quality (0-1)
     */
    async shareImage(canvas, filename = 'word-portrait', format = 'jpeg', quality = 0.92) {
        try {
            const isJpeg = format === 'jpeg' || format === 'jpg';
            const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
            const ext = isJpeg ? 'jpg' : 'png';

            let targetCanvas = canvas;
            if (isJpeg) {
                targetCanvas = document.createElement('canvas');
                targetCanvas.width = canvas.width;
                targetCanvas.height = canvas.height;
                const ctx = targetCanvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
                ctx.drawImage(canvas, 0, 0);
            }

            const blob = await this.getBlob(targetCanvas, mimeType, quality);
            const file = new File([blob], `${filename}-${Date.now()}.${ext}`, { type: mimeType });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Word Portrait',
                    text: 'Created with Word Cloud Generator'
                });
                return true;
            } else if (navigator.share) {
                await navigator.share({
                    title: 'Word Portrait',
                    text: 'Created with Word Cloud Generator',
                    url: window.location.href
                });
                return true;
            } else {
                if (isJpeg) {
                    this.downloadJPEG(canvas, filename, quality);
                } else {
                    this.downloadPNG(canvas, filename);
                }
                return true;
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
                if (format === 'png') {
                    this.downloadPNG(canvas, filename);
                } else {
                    this.downloadJPEG(canvas, filename, quality);
                }
            }
            return false;
        }
    }
}

// Singleton instance
export const exportService = new ExportService();
