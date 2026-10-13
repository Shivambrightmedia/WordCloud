/**
 * WordAnimator - Central animation orchestrator service
 * 
 * SOLID Principles:
 * - SRP: Orchestrates word animation frame rendering & strategy execution
 * - OCP: New animation strategies can be registered via registerStrategy() without editing this file
 * - DIP: Depends on BaseAnimationStrategy abstraction, not concrete implementations
 */

import { PulseStrategy } from './animator/PulseStrategy.js';
import { WaveStrategy } from './animator/WaveStrategy.js';
import { FloatStrategy } from './animator/FloatStrategy.js';
import { ShimmerStrategy } from './animator/ShimmerStrategy.js';
import { BreatheStrategy } from './animator/BreatheStrategy.js';

export class WordAnimator {
    constructor() {
        /** @type {Map<string, import('./animator/BaseAnimationStrategy').BaseAnimationStrategy>} */
        this.strategies = new Map();

        // Register default strategies
        this.registerStrategy('pulse', new PulseStrategy());
        this.registerStrategy('wave', new WaveStrategy());
        this.registerStrategy('float', new FloatStrategy());
        this.registerStrategy('shimmer', new ShimmerStrategy());
        this.registerStrategy('breathe', new BreatheStrategy());
    }

    /**
     * Register an animation strategy (Open/Closed Principle)
     * @param {string} name - Strategy identifier
     * @param {import('./animator/BaseAnimationStrategy').BaseAnimationStrategy} strategy
     */
    registerStrategy(name, strategy) {
        this.strategies.set(name, strategy);
    }

    /**
     * Get strategy by identifier, falls back to 'pulse'
     * @param {string} name
     * @returns {import('./animator/BaseAnimationStrategy').BaseAnimationStrategy}
     */
    getStrategy(name) {
        return this.strategies.get(name) || this.strategies.get('pulse');
    }

    /**
     * Get list of registered strategy IDs
     * @returns {string[]}
     */
    getAvailableStrategies() {
        return Array.from(this.strategies.keys());
    }

    /**
     * Render a single animation frame to a canvas context
     * @param {CanvasRenderingContext2D} ctx - Target 2D rendering context
     * @param {Array<Object>} words - Array of placed word objects
     * @param {number} progress - Normalized time progression in [0.0, 1.0)
     * @param {Object} options - Animation configuration options
     */
    renderFrame(ctx, words, progress, options = {}) {
        if (!ctx || !words || words.length === 0) return;

        const {
            width = ctx.canvas.width,
            height = ctx.canvas.height,
            effect = 'pulse',
            intensity = 1.0,
            backgroundColor = '#FFFFFF',
            colorMode = 'source',
            scaleFactor = 1.0 // Scale multiplier when drawing onto offscreen export canvas
        } = options;

        const strategy = this.getStrategy(effect);

        // Reset and clear canvas background
        ctx.save();
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const hasSourceShadow = colorMode === 'source';

        // Precompute context scale if rendering to different resolution
        const len = words.length;
        for (let i = 0; i < len; i++) {
            const word = words[i];
            const transform = strategy.apply(word, progress, i, {
                width,
                height,
                intensity
            });

            const posX = (word.x + (transform.dx || 0)) * scaleFactor;
            const posY = (word.y + (transform.dy || 0)) * scaleFactor;
            const fontSize = Math.max(6, Math.round(word.fontSize * scaleFactor * (transform.scale || 1.0)));

            ctx.save();
            ctx.translate(posX, posY);

            if (transform.rotation) {
                ctx.rotate(transform.rotation);
            }

            // Word shadow styling
            if (hasSourceShadow) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
                ctx.shadowBlur = Math.round(3 * scaleFactor);
                ctx.shadowOffsetX = Math.round(1.5 * scaleFactor);
                ctx.shadowOffsetY = Math.round(1.5 * scaleFactor);
            }

            ctx.font = `${word.fontWeight || 700} ${fontSize}px '${word.fontFamily || 'Outfit'}'`;
            
            // Apply opacity
            const effectiveAlpha = Math.max(0.1, Math.min(1.0, transform.alpha !== undefined ? transform.alpha : 1.0));
            ctx.globalAlpha = effectiveAlpha;
            ctx.fillStyle = word.color;

            ctx.fillText(word.text, 0, 0);
            ctx.restore();
        }

        ctx.restore();
    }
}

// Export singleton instance
export const wordAnimator = new WordAnimator();
