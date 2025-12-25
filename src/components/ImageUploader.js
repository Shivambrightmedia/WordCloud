/**
 * ImageUploader - Handles image file upload and drag-drop
 * 
 * SOLID: SRP - Only handles image loading
 */

import { BaseComponent } from './BaseComponent.js';
import { eventBus, Events } from '../core/EventBus.js';

export class ImageUploader extends BaseComponent {
    constructor() {
        super('ImageUploader');

        /** @type {HTMLInputElement|null} */
        this.fileInput = null;

        /** @type {HTMLElement|null} */
        this.dropArea = null;

        /** @type {HTMLElement|null} */
        this.imageName = null;
    }

    cacheElements() {
        this.fileInput = this.$('imageUpload');
        this.dropArea = this.$('dropArea');
        this.imageName = this.$('imageName');
    }

    bindEvents() {
        // File input change
        this.addListener(this.fileInput, 'change', this.handleFileSelect);

        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.addListener(this.dropArea, eventName, this.preventDefaults);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.addListener(this.dropArea, eventName, () => {
                this.dropArea.style.borderColor = '#7b4397';
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.addListener(this.dropArea, eventName, () => {
                this.dropArea.style.borderColor = 'rgba(255,255,255,0.1)';
            });
        });

        this.addListener(this.dropArea, 'drop', this.handleDrop);
    }

    /**
     * Prevent default drag behavior
     * @param {Event} e
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Handle file drop
     * @param {DragEvent} e
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            this.loadFile(files[0]);
        }
    }

    /**
     * Handle file input change
     * @param {Event} e
     */
    handleFileSelect(e) {
        if (e.target.files.length) {
            this.loadFile(e.target.files[0]);
        }
    }

    /**
     * Load an image file
     * @param {File} file
     */
    loadFile(file) {
        if (!file.type.startsWith('image/')) {
            console.warn('Invalid file type');
            return;
        }

        // Update UI
        this.imageName.textContent = file.name;
        this.imageName.classList.remove('hidden');

        // Read file
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Update state
                this.setState({ image: img });

                // Emit event
                this.emit(Events.IMAGE_LOADED, { image: img, name: file.name });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Factory function
export function createImageUploader() {
    const component = new ImageUploader();
    component.init();
    return component;
}
