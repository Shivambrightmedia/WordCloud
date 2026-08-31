/**
 * ImageUploader - Handles image file upload, drag-drop, and webcam capture
 * 
 * SOLID: SRP - Only handles image loading from various sources
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

        /** @type {HTMLButtonElement|null} */
        this.cameraBtn = null;

        /** @type {HTMLElement|null} */
        this.cameraModal = null;

        /** @type {HTMLVideoElement|null} */
        this.videoElement = null;

        /** @type {HTMLCanvasElement|null} */
        this.captureCanvas = null;

        /** @type {HTMLButtonElement|null} */
        this.captureBtn = null;

        /** @type {HTMLButtonElement|null} */
        this.closeCameraBtn = null;

        /** @type {HTMLElement|null} */
        this.cameraError = null;

        /** @type {HTMLElement|null} */
        this.cameraErrorMsg = null;

        /** @type {MediaStream|null} */
        this.currentStream = null;
    }

    cacheElements() {
        this.fileInput = this.$('imageUpload');
        this.dropArea = this.$('dropArea');
        this.imageName = this.$('imageName');
        this.cameraBtn = this.$('cameraBtn');
        this.cameraModal = this.$('cameraModal');
        this.videoElement = this.$('cameraVideo');
        this.captureCanvas = this.$('captureCanvas');
        this.captureBtn = this.$('captureBtn');
        this.closeCameraBtn = this.$('closeCameraBtn');
        this.cameraError = this.$('cameraError');
        this.cameraErrorMsg = this.$('cameraErrorMsg');
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

        // Camera button click
        if (this.cameraBtn) {
            this.addListener(this.cameraBtn, 'click', this.openCamera);
        }

        // Capture button click
        if (this.captureBtn) {
            this.addListener(this.captureBtn, 'click', this.capturePhoto);
        }

        // Close camera button click
        if (this.closeCameraBtn) {
            this.addListener(this.closeCameraBtn, 'click', this.closeCamera);
        }

        // Close modal on backdrop click
        if (this.cameraModal) {
            this.addListener(this.cameraModal, 'click', (e) => {
                if (e.target === this.cameraModal) {
                    this.closeCamera();
                }
            });
        }

        // Close modal on Escape key
        this.addListener(document, 'keydown', (e) => {
            if (e.key === 'Escape' && !this.cameraModal.classList.contains('hidden')) {
                this.closeCamera();
            }
        });
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

    /**
     * Open the camera modal and start webcam stream
     */
    async openCamera() {
        if (!this.cameraModal || !this.videoElement) {
            console.warn('Camera modal elements not found');
            return;
        }

        // Show modal
        this.cameraModal.classList.remove('hidden');
        this.cameraError.classList.add('hidden');
        this.captureBtn.disabled = true;

        // Check for webcam support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showCameraError('Camera not supported in this browser');
            return;
        }

        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            this.currentStream = stream;
            this.videoElement.srcObject = stream;

            // Wait for video to be ready
            this.videoElement.onloadedmetadata = () => {
                this.videoElement.play();
                this.captureBtn.disabled = false;
            };

        } catch (error) {
            console.error('Camera error:', error);

            // Handle specific error types
            if (error.name === 'NotAllowedError') {
                this.showCameraError('Camera access denied. Please allow camera permissions.');
            } else if (error.name === 'NotFoundError') {
                this.showCameraError('No camera found on this device.');
            } else if (error.name === 'NotReadableError') {
                this.showCameraError('Camera is already in use by another application.');
            } else {
                this.showCameraError('Could not access camera: ' + error.message);
            }
        }
    }

    /**
     * Show camera error message
     * @param {string} message
     */
    showCameraError(message) {
        if (this.cameraError && this.cameraErrorMsg) {
            this.cameraErrorMsg.textContent = message;
            this.cameraError.classList.remove('hidden');
        }
        if (this.captureBtn) {
            this.captureBtn.disabled = true;
        }
    }

    /**
     * Capture photo from webcam
     */
    capturePhoto() {
        if (!this.videoElement || !this.captureCanvas) {
            return;
        }

        // Set canvas dimensions to match video
        const videoWidth = this.videoElement.videoWidth;
        const videoHeight = this.videoElement.videoHeight;

        this.captureCanvas.width = videoWidth;
        this.captureCanvas.height = videoHeight;

        const ctx = this.captureCanvas.getContext('2d');

        // Mirror the image horizontally to match the preview
        ctx.translate(videoWidth, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);

        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Convert canvas to image
        const dataUrl = this.captureCanvas.toDataURL('image/png');

        const img = new Image();
        img.onload = () => {
            // Update state
            this.setState({ image: img });

            // Update UI
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const filename = `camera-capture-${timestamp}.png`;
            this.imageName.textContent = filename;
            this.imageName.classList.remove('hidden');

            // Emit event
            this.emit(Events.IMAGE_LOADED, { image: img, name: filename });

            // Close camera
            this.closeCamera();
        };
        img.src = dataUrl;
    }

    /**
     * Close camera modal and stop stream
     */
    closeCamera() {
        // Stop all video tracks
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
            });
            this.currentStream = null;
        }

        // Clear video source
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        // Hide modal
        if (this.cameraModal) {
            this.cameraModal.classList.add('hidden');
        }

        // Reset capture button
        if (this.captureBtn) {
            this.captureBtn.disabled = false;
        }
    }

    /**
     * Cleanup when component is destroyed
     */
    destroy() {
        this.closeCamera();
        super.destroy();
    }
}

// Factory function
export function createImageUploader() {
    const component = new ImageUploader();
    component.init();
    return component;
}
