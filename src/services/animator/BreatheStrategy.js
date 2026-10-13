import { BaseAnimationStrategy } from './BaseAnimationStrategy.js';

/**
 * BreatheStrategy - Harmonious global radial respiration
 * 
 * SOLID Principles:
 * - SRP: Only handles radial respiratory expansion/contraction
 * - LSP: Substitutable with BaseAnimationStrategy
 */
export class BreatheStrategy extends BaseAnimationStrategy {
    constructor() {
        super('breathe');
    }

    apply(word, progress, index, options = {}) {
        const intensity = options.intensity !== undefined ? options.intensity : 1.0;
        const width = options.width || 2400;
        const height = options.height || 3600;
        const cx = width / 2;
        const cy = height / 2;

        // Smooth cosine ease breathing (0 -> 1 -> 0)
        const theta = progress * Math.PI * 2;
        const breath = (1 - Math.cos(theta)) * 0.5; // [0, 1]

        // Radial outward push from center
        const relX = (word.x - cx) / cx;
        const relY = (word.y - cy) / cy;
        const pushAmount = 14 * intensity * breath;

        const dx = relX * pushAmount;
        const dy = relY * pushAmount;
        const scale = 1.0 + breath * (0.12 * intensity);
        const alpha = Math.max(0.65, Math.min(1.0, 0.82 + breath * 0.18));

        return {
            dx,
            dy,
            scale,
            alpha,
            rotation: 0
        };
    }
}
