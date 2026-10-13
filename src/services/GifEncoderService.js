/**
 * GifEncoderService - High performance pure JavaScript GIF89a encoder
 * 
 * SOLID Principles:
 * - SRP: Exclusively handles frame quantization, LZW compression, and GIF89a byte streaming
 * - OCP: Encapsulated encoder pipeline extensible for custom palettes or quantizers
 * 
 * Zero external dependencies. Works directly in browser environment.
 */

/**
 * Fast Color Quantizer using Color Histogram & Median Cut
 */
class ColorQuantizer {
    /**
     * Build 256-color palette from RGBA image data
     * @param {Uint8ClampedArray} rgbaData - Pixel buffer
     * @param {number} maxColors - Maximum palette entries (usually 256)
     * @returns {{ palette: Uint8Array, indexMap: Map<number, number> }}
     */
    static quantize(rgbaData, maxColors = 256) {
        const pixelCount = rgbaData.length / 4;
        // Sample pixels to quickly build color distribution
        const sampleStep = Math.max(1, Math.floor(pixelCount / 15000));
        
        // Fast color frequency map using 15-bit reduced RGB (5 bits per channel)
        const hist = new Map();
        for (let i = 0; i < rgbaData.length; i += 4 * sampleStep) {
            const r = rgbaData[i] >> 3;
            const g = rgbaData[i + 1] >> 3;
            const b = rgbaData[i + 2] >> 3;
            const key = (r << 10) | (g << 5) | b;
            hist.set(key, (hist.get(key) || 0) + 1);
        }

        // Color boxes for median-cut
        const boxes = [{
            keys: Array.from(hist.keys()),
            count: pixelCount
        }];

        while (boxes.length < maxColors) {
            // Find box with largest range to split
            let bestIdx = -1;
            let maxRange = -1;
            let splitDim = 'r';

            for (let i = 0; i < boxes.length; i++) {
                const box = boxes[i];
                if (box.keys.length <= 1) continue;

                let minR = 32, maxR = 0, minG = 32, maxG = 0, minB = 32, maxB = 0;
                for (const key of box.keys) {
                    const r = (key >> 10) & 31;
                    const g = (key >> 5) & 31;
                    const b = key & 31;
                    if (r < minR) minR = r; if (r > maxR) maxR = r;
                    if (g < minG) minG = g; if (g > maxG) maxG = g;
                    if (b < minB) minB = b; if (b > maxB) maxB = b;
                }

                const rRange = maxR - minR;
                const gRange = maxG - minG;
                const bRange = maxB - minB;
                const currentMax = Math.max(rRange, gRange, bRange);

                if (currentMax > maxRange) {
                    maxRange = currentMax;
                    bestIdx = i;
                    if (currentMax === rRange) splitDim = 'r';
                    else if (currentMax === gRange) splitDim = 'g';
                    else splitDim = 'b';
                }
            }

            if (bestIdx === -1 || maxRange <= 0) break;

            const targetBox = boxes[bestIdx];
            // Sort keys along the largest dimension
            targetBox.keys.sort((a, b) => {
                if (splitDim === 'r') return ((a >> 10) & 31) - ((b >> 10) & 31);
                if (splitDim === 'g') return ((a >> 5) & 31) - ((b >> 5) & 31);
                return (a & 31) - (b & 31);
            });

            const mid = Math.floor(targetBox.keys.length / 2);
            const box1 = { keys: targetBox.keys.slice(0, mid) };
            const box2 = { keys: targetBox.keys.slice(mid) };

            boxes.splice(bestIdx, 1, box1, box2);
        }

        // Generate average RGB for each box
        const palette = new Uint8Array(256 * 3);
        const indexMap = new Map();

        // Always ensure pure white is palette entry 0 for crisp text/background
        palette[0] = 255;
        palette[1] = 255;
        palette[2] = 255;
        indexMap.set((31 << 10) | (31 << 5) | 31, 0);

        let pIdx = 1;
        for (const box of boxes) {
            if (pIdx >= 256) break;
            let sumR = 0, sumG = 0, sumB = 0, totalCount = 0;

            for (const key of box.keys) {
                const count = hist.get(key) || 1;
                const r = ((key >> 10) & 31) << 3;
                const g = ((key >> 5) & 31) << 3;
                const b = (key & 31) << 3;
                sumR += r * count;
                sumG += g * count;
                sumB += b * count;
                totalCount += count;
            }

            const avgR = totalCount > 0 ? Math.round(sumR / totalCount) : 0;
            const avgG = totalCount > 0 ? Math.round(sumG / totalCount) : 0;
            const avgB = totalCount > 0 ? Math.round(sumB / totalCount) : 0;

            palette[pIdx * 3] = avgR;
            palette[pIdx * 3 + 1] = avgG;
            palette[pIdx * 3 + 2] = avgB;

            for (const key of box.keys) {
                indexMap.set(key, pIdx);
            }

            pIdx++;
        }

        // Fill remaining palette entries with black/neutral if fewer than 256
        while (pIdx < 256) {
            palette[pIdx * 3] = 0;
            palette[pIdx * 3 + 1] = 0;
            palette[pIdx * 3 + 2] = 0;
            pIdx++;
        }

        return { palette, indexMap };
    }

    /**
     * Map image pixels to 8-bit palette indices
     * @param {Uint8ClampedArray} rgbaData
     * @param {Uint8Array} palette
     * @param {Map<number, number>} indexMap
     * @returns {Uint8Array}
     */
    static indexPixels(rgbaData, palette, indexMap) {
        const len = rgbaData.length;
        const indexed = new Uint8Array(len / 4);
        let outIdx = 0;

        for (let i = 0; i < len; i += 4) {
            const r = rgbaData[i];
            const g = rgbaData[i + 1];
            const b = rgbaData[i + 2];
            const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);

            let idx = indexMap.get(key);
            if (idx === undefined) {
                // Find nearest color in palette
                let minDist = Infinity;
                let closest = 0;
                for (let c = 0; c < 256; c++) {
                    const pr = palette[c * 3];
                    const pg = palette[c * 3 + 1];
                    const pb = palette[c * 3 + 2];
                    const dist = (r - pr) * (r - pr) + (g - pg) * (g - pg) + (b - pb) * (b - pb);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = c;
                        if (dist === 0) break;
                    }
                }
                idx = closest;
                indexMap.set(key, idx);
            }

            indexed[outIdx++] = idx;
        }

        return indexed;
    }
}

/**
 * GIF LZW Byte Stream Compressor
 */
class GifLzwEncoder {
    /**
     * Compress 8-bit indexed pixel data using GIF LZW
     * @param {Uint8Array} indexedPixels
     * @param {number} minCodeSize - Minimum code size (8 for 256 colors)
     * @returns {Uint8Array}
     */
    static encode(indexedPixels, minCodeSize = 8) {
        const clearCode = 1 << minCodeSize; // 256
        const eoiCode = clearCode + 1;       // 257

        const output = [];
        let curCodeSize = minCodeSize + 1;
        let nextCode = eoiCode + 1;

        // Hash table for prefix + suffix lookup: (prefix << 8) | suffix -> code
        const table = new Map();

        const resetTable = () => {
            table.clear();
            curCodeSize = minCodeSize + 1;
            nextCode = eoiCode + 1;
        };

        // Bit accumulator
        let curAccum = 0;
        let curBits = 0;

        // Block accumulator (max 255 bytes per sub-block)
        const block = new Uint8Array(256);
        let blockLen = 0;

        const writeByte = (byte) => {
            block[blockLen++] = byte;
            if (blockLen === 254) {
                output.push(blockLen);
                for (let i = 0; i < blockLen; i++) output.push(block[i]);
                blockLen = 0;
            }
        };

        const flushBlock = () => {
            if (blockLen > 0) {
                output.push(blockLen);
                for (let i = 0; i < blockLen; i++) output.push(block[i]);
                blockLen = 0;
            }
        };

        const emitCode = (code) => {
            curAccum |= code << curBits;
            curBits += curCodeSize;

            while (curBits >= 8) {
                writeByte(curAccum & 0xFF);
                curAccum >>= 8;
                curBits -= 8;
            }
        };

        // Initial clear code
        emitCode(clearCode);

        let prefix = indexedPixels[0];
        const len = indexedPixels.length;

        for (let i = 1; i < len; i++) {
            const suffix = indexedPixels[i];
            const hash = (prefix << 8) | suffix;

            if (table.has(hash)) {
                prefix = table.get(hash);
            } else {
                emitCode(prefix);

                if (nextCode < 4096) {
                    table.set(hash, nextCode++);
                    if (nextCode > (1 << curCodeSize) && curCodeSize < 12) {
                        curCodeSize++;
                    }
                } else {
                    emitCode(clearCode);
                    resetTable();
                }

                prefix = suffix;
            }
        }

        // Output final code and end of information
        emitCode(prefix);
        emitCode(eoiCode);

        // Flush remaining bits
        if (curBits > 0) {
            writeByte(curAccum & 0xFF);
        }

        flushBlock();
        output.push(0x00); // Block terminator

        return new Uint8Array(output);
    }
}

/**
 * GIF89a Multi-Frame Encoder Service
 */
export class GifEncoderService {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.bytes = [];
    }

    /**
     * Encode multi-frame canvas animation into an animated GIF Blob
     * @param {Array<ImageData>} frames - Array of ImageData objects
     * @param {Object} options - Export options { fps, loop }
     * @param {Function} [onProgress] - Optional progress callback: (frameIndex, totalFrames) => void
     * @returns {Promise<Blob>}
     */
    async encodeFrames(frames, options = {}, onProgress = null) {
        if (!frames || frames.length === 0) {
            throw new Error('No frames provided for GIF encoding');
        }

        const width = frames[0].width;
        const height = frames[0].height;
        const fps = options.fps || 15;
        // Delay in hundredths of a second (1s = 100 hundredths)
        const delayHundredths = Math.max(2, Math.round(100 / fps));

        const byteStream = [];

        // 1. Header: GIF89a
        this._writeString(byteStream, 'GIF89a');

        // 2. Logical Screen Descriptor
        this._writeWord(byteStream, width);
        this._writeWord(byteStream, height);
        // Packed byte: No Global Color Table (we use high-precision local color tables per frame for peak quality)
        byteStream.push(0x70); // 0b01110000: GCT=0, color res=7, sort=0, size=0
        byteStream.push(0x00); // Background color index
        byteStream.push(0x00); // Pixel aspect ratio

        // 3. Netscape 2.0 Application Extension (Infinite Looping)
        byteStream.push(0x21, 0xFF, 0x0B);
        this._writeString(byteStream, 'NETSCAPE2.0');
        byteStream.push(0x03, 0x01, 0x00, 0x00, 0x00);

        // 4. Encode each frame
        const total = frames.length;
        for (let f = 0; f < total; f++) {
            const frame = frames[f];

            // Quantize frame colors to 256
            const { palette, indexMap } = ColorQuantizer.quantize(frame.data, 256);
            const indexedPixels = ColorQuantizer.indexPixels(frame.data, palette, indexMap);

            // Graphic Control Extension (0x21, 0xF9, 0x04)
            byteStream.push(0x21, 0xF9, 0x04);
            // Packed byte: Disposal method 2 (restore to background), user input=0, transparent=0
            byteStream.push(0x08); // 0b00001000: Disposal 2
            this._writeWord(byteStream, delayHundredths);
            byteStream.push(0x00); // Transparent color index (unused)
            byteStream.push(0x00); // Terminator

            // Image Descriptor (0x2C)
            byteStream.push(0x2C);
            this._writeWord(byteStream, 0); // Left
            this._writeWord(byteStream, 0); // Top
            this._writeWord(byteStream, width);
            this._writeWord(byteStream, height);
            // Packed: Local Color Table Flag=1, Interlace=0, Sort=0, Size=7 (256 colors)
            byteStream.push(0x87);

            // Local Color Table (768 bytes)
            for (let i = 0; i < 768; i++) {
                byteStream.push(palette[i]);
            }

            // Table-based Image Data: LZW minCodeSize = 8
            byteStream.push(0x08);
            const lzwBytes = GifLzwEncoder.encode(indexedPixels, 8);
            for (let i = 0; i < lzwBytes.length; i++) {
                byteStream.push(lzwBytes[i]);
            }

            // Report progress and yield to browser event loop
            if (onProgress) {
                onProgress(f + 1, total);
            }
            // Allow browser UI repaints
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // 5. Trailer (0x3B)
        byteStream.push(0x3B);

        const gifArray = new Uint8Array(byteStream);
        return new Blob([gifArray], { type: 'image/gif' });
    }

    _writeString(stream, str) {
        for (let i = 0; i < str.length; i++) {
            stream.push(str.charCodeAt(i));
        }
    }

    _writeWord(stream, value) {
        stream.push(value & 0xFF);
        stream.push((value >> 8) & 0xFF);
    }
}

// Export singleton instance
export const gifEncoderService = new GifEncoderService();
