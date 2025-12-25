/**
 * Accordion - Handles collapsible section behavior
 * 
 * SOLID: SRP - Only handles accordion toggle functionality
 */

import { BaseComponent } from './BaseComponent.js';

export class Accordion extends BaseComponent {
    constructor() {
        super('Accordion');

        this.headers = null;
        this.allowMultiple = false; // Only one section open at a time (like WordArt)
    }

    cacheElements() {
        this.headers = document.querySelectorAll('.accordion-header');
    }

    bindEvents() {
        this.headers.forEach(header => {
            this.addListener(header, 'click', () => this.toggle(header));
        });
    }

    /**
     * Toggle accordion section
     * @param {HTMLElement} header - The clicked header
     */
    toggle(header) {
        const section = header.dataset.toggle;
        const content = document.getElementById(`section-${section}`);
        const isOpen = content.classList.contains('open');

        // If not allowing multiple, close all others first
        if (!this.allowMultiple && !isOpen) {
            this.closeAll();
        }

        // Toggle current
        if (isOpen) {
            this.close(header, content);
        } else {
            this.open(header, content);
        }
    }

    /**
     * Open a section
     * @param {HTMLElement} header 
     * @param {HTMLElement} content 
     */
    open(header, content) {
        header.classList.add('active');
        header.querySelector('.accordion-arrow').textContent = '▼';
        content.classList.add('open');
    }

    /**
     * Close a section
     * @param {HTMLElement} header 
     * @param {HTMLElement} content 
     */
    close(header, content) {
        header.classList.remove('active');
        header.querySelector('.accordion-arrow').textContent = '▶';
        content.classList.remove('open');
    }

    /**
     * Close all sections
     */
    closeAll() {
        this.headers.forEach(h => {
            const section = h.dataset.toggle;
            const content = document.getElementById(`section-${section}`);
            this.close(h, content);
        });
    }

    /**
     * Open all sections
     */
    openAll() {
        this.headers.forEach(h => {
            const section = h.dataset.toggle;
            const content = document.getElementById(`section-${section}`);
            this.open(h, content);
        });
    }

    /**
     * Open a specific section by name
     * @param {string} sectionName 
     */
    openSection(sectionName) {
        const header = document.querySelector(`[data-toggle="${sectionName}"]`);
        const content = document.getElementById(`section-${sectionName}`);
        if (header && content) {
            this.open(header, content);
        }
    }

    render() {
        // Initial state: WORDS section open
        // This is handled in HTML with .open and .active classes
    }
}

// Factory function
export function createAccordion() {
    const component = new Accordion();
    component.init();
    return component;
}
