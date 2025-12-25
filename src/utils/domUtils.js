/**
 * DOM utility functions - Single Responsibility: DOM manipulation helpers
 */

/**
 * Get element by ID with type safety
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} The element or null
 */
export function $(id) {
    return document.getElementById(id);
}

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {Element|null} The element or null
 */
export function $q(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {NodeListOf<Element>} NodeList of elements
 */
export function $qa(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * Add event listener with automatic cleanup support
 * @param {Element} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 * @returns {Function} Cleanup function to remove the listener
 */
export function on(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
}

/**
 * Add multiple event listeners
 * @param {Element} element - Target element
 * @param {string[]} events - Array of event names
 * @param {Function} handler - Event handler
 * @returns {Function} Cleanup function to remove all listeners
 */
export function onMultiple(element, events, handler) {
    const cleanups = events.map(event => on(element, event, handler));
    return () => cleanups.forEach(cleanup => cleanup());
}

/**
 * Create an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {(Element|string)[]} children - Child elements or text
 * @returns {HTMLElement} The created element
 */
export function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });

    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Element) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Toggle visibility of an element
 * @param {Element} element - Target element
 * @param {boolean} visible - Whether to show or hide
 */
export function toggleVisibility(element, visible) {
    if (visible) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Toggle a CSS class
 * @param {Element} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} force - Force add/remove
 */
export function toggleClass(element, className, force) {
    element.classList.toggle(className, force);
}
