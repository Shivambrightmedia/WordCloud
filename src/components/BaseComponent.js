/**
 * BaseComponent - Abstract base class for UI components
 * 
 * SOLID Principles:
 * - SRP: Defines component lifecycle and common behavior
 * - OCP: Subclasses extend without modifying base
 * - LSP: All components can be substituted where BaseComponent is expected
 * - DIP: Components depend on abstractions (eventBus, stateManager)
 */

import { eventBus } from '../core/EventBus.js';
import { stateManager } from '../core/StateManager.js';
import { $ } from '../utils/domUtils.js';

export class BaseComponent {
    /**
     * @param {string} name - Component name for debugging
     */
    constructor(name) {
        /** @type {string} */
        this.name = name;

        /** @type {Function[]} */
        this._cleanups = [];

        /** @type {boolean} */
        this._initialized = false;
    }

    /**
     * Get element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    $(id) {
        return $(id);
    }

    /**
     * Get current state
     * @returns {Object}
     */
    get state() {
        return stateManager.getState();
    }

    /**
     * Update state
     * @param {Object} updates - State updates
     */
    setState(updates) {
        stateManager.setState(updates);
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Callback function
     */
    onStateChange(callback) {
        const unsubscribe = stateManager.subscribe(callback);
        this._cleanups.push(unsubscribe);
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        const unsubscribe = eventBus.on(event, callback);
        this._cleanups.push(unsubscribe);
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        eventBus.emit(event, data);
    }

    /**
     * Add a DOM event listener with automatic cleanup
     * @param {Element} element - Target element
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    addListener(element, eventName, handler, options = {}) {
        if (!element) {
            console.warn(`${this.name}: Element not found for event ${eventName}`);
            return;
        }

        const boundHandler = handler.bind(this);
        element.addEventListener(eventName, boundHandler, options);
        this._cleanups.push(() =>
            element.removeEventListener(eventName, boundHandler, options)
        );
    }

    /**
     * Initialize the component - must be implemented by subclasses
     * @abstract
     */
    init() {
        if (this._initialized) {
            console.warn(`${this.name}: Already initialized`);
            return;
        }

        this.cacheElements();
        this.bindEvents();
        this.render();

        this._initialized = true;
        console.log(`${this.name}: Initialized`);
    }

    /**
     * Cache DOM element references - override in subclass
     * @abstract
     */
    cacheElements() {
        // Override in subclass
    }

    /**
     * Bind event listeners - override in subclass
     * @abstract
     */
    bindEvents() {
        // Override in subclass
    }

    /**
     * Render or update the component - override in subclass
     * @abstract
     */
    render() {
        // Override in subclass
    }

    /**
     * Cleanup and destroy the component
     */
    destroy() {
        this._cleanups.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.error(`${this.name}: Cleanup error:`, error);
            }
        });
        this._cleanups = [];
        this._initialized = false;
        console.log(`${this.name}: Destroyed`);
    }
}
