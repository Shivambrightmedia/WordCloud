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

        /** @type {HTMLButtonElement|null} */
        this.switchCameraBtn = null;

        /** @type {HTMLElement|null} */
        this.cameraError = null;

        /** @type {HTMLElement|null} */
        this.cameraErrorMsg = null;

        /** @type {MediaStream|null} */
        this.currentStream = null;

        /** @type {string} */
        this.facingMode = 'user'; // 'user' (front/selfie) or 'environment' (back/rear)
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
        this.switchCameraBtn = this.$('switchCameraBtn');
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

        // Switch/Flip camera button click
        if (this.switchCameraBtn) {
            this.addListener(this.switchCameraBtn, 'click', this.switchCamera);
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
     * Switch between Front (Selfie) and Back (Rear) camera
     */
    async switchCamera() {
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        await this.startStream();
    }

    /**
     * Start or restart webcam stream
     */
    async startStream() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showCameraError('Camera not supported in this browser');
            return;
        }

        try {
            // Apply mirror class ONLY for selfie/front camera
            if (this.facingMode === 'user') {
                this.videoElement.classList.add('mirror');
            } else {
                this.videoElement.classList.remove('mirror');
            }

            const constraints = {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.currentStream = stream;
            this.videoElement.srcObject = stream;

            this.videoElement.onloadedmetadata = () => {
                this.videoElement.play();
                this.captureBtn.disabled = false;
            };
        } catch (error) {
            console.error('Camera error:', error);
            if (error.name === 'NotAllowedError') {
                this.showCameraError('Camera access denied. Please allow camera permissions.');
            } else if (error.name === 'NotFoundError') {
                this.showCameraError('No camera found on this device.');
            } else {
                this.showCameraError('Could not access camera: ' + error.message);
            }
        }
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

        await this.startStream();
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
     * Capture photo from webcam in exact 4×6 (2:3 aspect ratio)
     */
    capturePhoto() {
        if (!this.videoElement || !this.captureCanvas) {
            return;
        }

        const videoWidth = this.videoElement.videoWidth || 1280;
        const videoHeight = this.videoElement.videoHeight || 720;
        const targetRatio = 2 / 3; // 4x6 Photo Aspect Ratio (Portrait)

        let cropW, cropH, cropX, cropY;

        if (videoWidth / videoHeight > targetRatio) {
            cropH = videoHeight;
            cropW = Math.round(videoHeight * targetRatio);
            cropX = Math.round((videoWidth - cropW) / 2);
            cropY = 0;
        } else {
            cropW = videoWidth;
            cropH = Math.round(videoWidth / targetRatio);
            cropX = 0;
            cropY = Math.round((videoHeight - cropH) / 2);
        }

        // Set output canvas to sharp 4x6 resolution (1600x2400)
        const outW = 1600;
        const outH = 2400;
        this.captureCanvas.width = outW;
        this.captureCanvas.height = outH;

        const ctx = this.captureCanvas.getContext('2d');

        // If selfie front camera, mirror image horizontally
        if (this.facingMode === 'user') {
            ctx.translate(outW, 0);
            ctx.scale(-1, 1);
        }

        // Draw the exact 4x6 center crop
        ctx.drawImage(this.videoElement, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

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
            const filename = `camera-4x6-${timestamp}.png`;
            if (this.imageName) {
                this.imageName.textContent = filename;
                this.imageName.classList.remove('hidden');
            }

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
