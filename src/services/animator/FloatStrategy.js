import { BaseAnimationStrategy } from './BaseAnimationStrategy.js';

/**
 * FloatStrategy - Organic micro-drift and levitation in place
 * 
 * SOLID Principles:
 * - SRP: Only handles floating/levitating coordinate displacement calculations
 * - LSP: Substitutable with BaseAnimationStrategy
 */
export class FloatStrategy extends BaseAnimationStrategy {
    constructor() {
        super('float');
    }

    apply(word, progress, index, options = {}) {
        const intensity = options.intensity !== undefined ? options.intensity : 1.0;
        // Unique deterministic seed per word
        const seed = (index * 137.5 + word.x * 0.1) % (Math.PI * 2);
        
        // Loop-closed harmonic curves (multiples of 2*PI ensure frame 0 == frame N)
        const t = progress * Math.PI * 2;
        const maxDisplacement = Math.min(8, Math.max(2, word.fontSize * 0.12)) * intensity;
        
        const dx = Math.sin(t + seed) * (maxDisplacement * 0.6);
        const dy = Math.cos(t * 2 + seed) * maxDisplacement;
        const scale = 1.0 + Math.sin(t + seed * 0.5) * (0.08 * intensity);
        const alpha = 0.9 + Math.sin(t + seed) * (0.1 * intensity);

        return {
            dx,
            dy,
            scale: Math.max(0.85, Math.min(1.15, scale)),
            alpha: Math.max(0.7, Math.min(1.0, alpha)),
            rotation: (Math.sin(t + seed) * 0.03 * intensity) // Subtle tilt in radians
        };
    }
}
