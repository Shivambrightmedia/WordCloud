import { BaseAnimationStrategy } from './BaseAnimationStrategy.js';

/**
 * WaveStrategy - Smooth wave of scale and illumination ripples across the portrait
 * 
 * SOLID Principles:
 * - SRP: Only handles directional wave propagation animation calculations
 * - LSP: Substitutable with BaseAnimationStrategy
 */
export class WaveStrategy extends BaseAnimationStrategy {
    constructor() {
        super('wave');
    }

    apply(word, progress, index, options = {}) {
        const intensity = options.intensity !== undefined ? options.intensity : 1.0;
        const width = options.width || 2400;
        const height = options.height || 3600;

        // Wave traveling diagonally from top-left to bottom-right
        const normalizedDist = (word.x / width + word.y / height) * 0.5;
        // Two full wave cycles across the canvas for rich motion
        const theta = (progress - normalizedDist * 2) * Math.PI * 2;
        
        // Bell-curve crest for sharp wave definition
        const waveValue = Math.sin(theta);
        const scale = 1.0 + Math.max(0, waveValue) * (0.22 * intensity);
        const dy = -Math.max(0, waveValue) * (4 * intensity);
        const alpha = Math.max(0.6, Math.min(1.0, 0.85 + waveValue * 0.15 * intensity));

        return {
            dx: 0,
            dy,
            scale,
            alpha,
            rotation: 0
        };
    }
}
