import { BaseAnimationStrategy } from './BaseAnimationStrategy.js';

/**
 * PulseStrategy - Words gently breathe and pulse in size in-place
 * 
 * SOLID Principles:
 * - SRP: Only handles pulsating size/scale animation calculations
 * - LSP: Substitutable with BaseAnimationStrategy
 */
export class PulseStrategy extends BaseAnimationStrategy {
    constructor() {
        super('pulse');
    }

    apply(word, progress, index, options = {}) {
        const intensity = options.intensity !== undefined ? options.intensity : 1.0;
        // Phase offset based on spatial position so nearby words ripple
        const spatialPhase = (word.x * 0.003 + word.y * 0.003 + index * 0.1) % (Math.PI * 2);
        const theta = progress * Math.PI * 2 + spatialPhase;
        
        // Gentle scale variation: ±12% to ±25% depending on intensity
        const scaleDelta = Math.sin(theta) * (0.16 * intensity);
        const scale = Math.max(0.7, Math.min(1.35, 1.0 + scaleDelta));
        
        // Subtle opacity pulsation
        const alphaDelta = Math.cos(theta) * (0.10 * intensity);
        const alpha = Math.max(0.65, Math.min(1.0, 1.0 + alphaDelta));

        return {
            dx: 0,
            dy: 0,
            scale,
            alpha,
            rotation: 0
        };
    }
}
