/**
 * BaseAnimationStrategy - Abstract base class for word animations
 * 
 * SOLID Principles:
 * - SRP: Defines the contract for word animation transforms
 * - OCP: Subclasses extend without modifying base
 * - LSP: All strategy subclasses are interchangeable
 */
export class BaseAnimationStrategy {
    constructor(name) {
        this.name = name;
    }

    /**
     * Calculate transformation parameters for a word at progress t in [0, 1)
     * @param {Object} word - The placed word object { text, x, y, fontSize, fontFamily, color, boxW, boxH }
     * @param {number} progress - Normalized animation loop progress [0.0, 1.0)
     * @param {number} index - Index of word in array
     * @param {Object} options - Options { speed, intensity, width, height }
     * @returns {{ dx: number, dy: number, scale: number, alpha: number, rotation: number }}
     */
    apply(word, progress, index, options = {}) {
        return {
            dx: 0,
            dy: 0,
            scale: 1,
            alpha: 1,
            rotation: 0
        };
    }
}
