/**
 * App - Main application orchestrator
 * 
 * SOLID Principles:
 * - SRP: Orchestrates component initialization (doesn't do business logic)
 * - OCP: New components can be added without modifying existing code
 * - DIP: Depends on component interfaces, not implementations
 * 
 * Pattern: Facade - Provides simple interface to complex subsystem
 */

import { stateManager } from './StateManager.js';
import { eventBus, Events } from './EventBus.js';
import { errorHandler } from './ErrorHandler.js';

// Import all components
import { createImageUploader } from '../components/ImageUploader.js';
import { createImageCustomizer } from '../components/ImageCustomizer.js';
import { createWordSettings } from '../components/WordSettings.js';
import { createColorSettings } from '../components/ColorSettings.js';
import { createResolutionSettings } from '../components/ResolutionSettings.js';
import { createCanvasRenderer } from '../components/CanvasRenderer.js';
import { createPresetPanel } from '../components/PresetPanel.js';
import { createAccordion } from '../components/Accordion.js';

export class App {
    constructor() {
        /** @type {Object[]} */
        this.components = [];

        /** @type {boolean} */
        this._initialized = false;
    }

    /**
     * Initialize the application
     */
    init() {
        if (this._initialized) {
            console.warn('App already initialized');
            return;
        }

        console.log('🚀 Word Portrait Generator - Initializing...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._bootstrap());
        } else {
            this._bootstrap();
        }
    }

    /**
     * Bootstrap the application
     * @private
     */
    _bootstrap() {
        try {
            // Initialize error handler first
            errorHandler.init();

            // Initialize all components
            this.components = [
                createAccordion(),  // Must be first to set up section toggling
                createImageUploader(),
                createImageCustomizer(),
                createWordSettings(),
                createColorSettings(),
                createResolutionSettings(),
                createCanvasRenderer(),
                createPresetPanel(),
            ];

            // Setup global event handlers
            this._setupGlobalHandlers();

            // Handle window resize
            window.addEventListener('resize', this._handleResize.bind(this));

            this._initialized = true;
            console.log('✅ App initialized successfully');
            console.log(`   Components loaded: ${this.components.length}`);

        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    }

    /**
     * Setup global event handlers
     * @private
     */
    _setupGlobalHandlers() {
        // Listen for preset loaded to re-render components
        eventBus.on(Events.PRESET_LOADED, () => {
            this.components.forEach(component => {
                if (typeof component.render === 'function') {
                    component.render();
                }
            });
        });

        // Log generation events
        eventBus.on(Events.GENERATION_START, () => {
            console.log('🎨 Generation started...');
        });

        eventBus.on(Events.GENERATION_COMPLETE, ({ duration }) => {
            console.log(`🎨 Generation complete in ${duration}s`);
        });
    }

    /**
     * Handle window resize
     * @private
     */
    _handleResize() {
        // Canvas responsiveness is handled via CSS
        // Add any additional resize logic here
    }

    /**
     * Get current application state
     * @returns {Object}
     */
    getState() {
        return stateManager.getState();
    }

    /**
     * Update application state
     * @param {Object} updates - State updates
     */
    setState(updates) {
        stateManager.setState(updates);
    }

    /**
     * Destroy the application and cleanup
     */
    destroy() {
        this.components.forEach(component => {
            if (typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        this.components = [];
        eventBus.clear();
        this._initialized = false;
        console.log('🛑 App destroyed');
    }
}

// Create and export singleton
export const app = new App();
