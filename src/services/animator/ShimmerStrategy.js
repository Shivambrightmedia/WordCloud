import { BaseAnimationStrategy } from './BaseAnimationStrategy.js';

/**
 * ShimmerStrategy - Twinkling glints and brightness sweeps across text
 * 
 * SOLID Principles:
 * - SRP: Only handles shimmering opacity and micro-glint transforms
 * - LSP: Substitutable with BaseAnimationStrategy
 */
export class ShimmerStrategy extends BaseAnimationStrategy {
    constructor() {
        super('shimmer');
    }

    apply(word, progress, index, options = {}) {
        const intensity = options.intensity !== undefined ? options.intensity : 1.0;
        const seed = (word.x * 37 + word.y * 73 + index * 17) % 1000;
        const phase = (seed / 1000) * Math.PI * 2;
        
        // Periodic glint burst: powers of sine produce sharp sparkle peaks
        const theta = progress * Math.PI * 2 * 2 + phase;
        const rawPulse = Math.max(0, Math.sin(theta));
        const shimmer = Math.pow(rawPulse, 3); // Sharp glint highlight
        
        const scale = 1.0 + shimmer * (0.15 * intensity);
        const alpha = Math.max(0.4, Math.min(1.0, 0.65 + shimmer * 0.35 * intensity));

        return {
            dx: 0,
            dy: 0,
            scale,
            alpha,
            rotation: 0
        };
    }
}
