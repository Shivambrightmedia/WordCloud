/**
 * AnimationSettings - Animation effect and GIF controls UI
 * 
 * SOLID Principles:
 * - SRP: Only handles animation configuration UI and user interaction
 * - LSP: Extends BaseComponent cleanly
 * - DIP: Depends on EventBus and StateManager abstractions
 */

import { BaseComponent } from './BaseComponent.js';
import { Events } from '../core/EventBus.js';
import { exportService } from '../services/ExportService.js';

export class AnimationSettings extends BaseComponent {
    constructor() {
        super('AnimationSettings');

        this.effectSelect = null;
        this.speedInput = null;
        this.speedValue = null;
        this.intensityInput = null;
        this.intensityValue = null;
        this.fpsSelect = null;
        this.gifResSelect = null;
        this.previewToggleBtn = null;
        this.exportGifBtn = null;
        this.progressContainer = null;
        this.progressBar = null;
        this.progressText = null;

        this._isExporting = false;
    }

    cacheElements() {
        this.effectSelect = this.$('animationEffectSelect');
        this.speedInput = this.$('animationSpeedInput');
        this.speedValue = this.$('animationSpeedValue');
        this.intensityInput = this.$('animationIntensityInput');
        this.intensityValue = this.$('animationIntensityValue');
        this.fpsSelect = this.$('animationFpsSelect');
        this.gifResSelect = this.$('gifResSelect');
        this.previewToggleBtn = this.$('previewAnimationBtn');
        this.exportGifBtn = this.$('exportGifBtn');
        this.progressContainer = this.$('gifProgressContainer');
        this.progressBar = this.$('gifProgressBar');
        this.progressText = this.$('gifProgressText');
    }

    bindEvents() {
        // Animation effect selection
        if (this.effectSelect) {
            this.addListener(this.effectSelect, 'change', (e) => {
                this.setState({ animationEffect: e.target.value });
            });
        }

        // Animation speed
        if (this.speedInput) {
            this.addListener(this.speedInput, 'input', (e) => {
                const speed = parseFloat(e.target.value) || 1.0;
                if (this.speedValue) this.speedValue.textContent = `${speed.toFixed(1)}×`;
                this.setState({ animationSpeed: speed });
            });
        }

        // Animation intensity
        if (this.intensityInput) {
            this.addListener(this.intensityInput, 'input', (e) => {
                const intensity = parseFloat(e.target.value) || 1.0;
                if (this.intensityValue) this.intensityValue.textContent = `${intensity.toFixed(1)}×`;
                this.setState({ animationIntensity: intensity });
            });
        }

        // FPS selection
        if (this.fpsSelect) {
            this.addListener(this.fpsSelect, 'change', (e) => {
                this.setState({ animationFps: parseInt(e.target.value, 10) || 15 });
            });
        }

        // GIF Resolution selection
        if (this.gifResSelect) {
            this.addListener(this.gifResSelect, 'change', (e) => {
                this.setState({ gifResolution: e.target.value });
            });
        }

        // Live preview toggle
        if (this.previewToggleBtn) {
            this.addListener(this.previewToggleBtn, 'click', () => {
                this.emit(Events.ANIMATION_PREVIEW_TOGGLE);
            });
        }

        // Direct Export GIF button in panel
        if (this.exportGifBtn) {
            this.addListener(this.exportGifBtn, 'click', () => {
                this.emit(Events.GIF_EXPORT_START);
            });
        }

        // Listen for animation events
        this.on(Events.ANIMATION_START, () => this.updatePreviewBtnState(true));
        this.on(Events.ANIMATION_STOP, () => this.updatePreviewBtnState(false));

        // Listen for GIF progress
        this.on(Events.GIF_EXPORT_PROGRESS, ({ phase, current, total, percent }) => {
            this.showProgress(phase, current, total, percent);
        });

        this.on(Events.GIF_EXPORT_COMPLETE, () => {
            this.hideProgress();
        });

        this.on(Events.GIF_EXPORT_ERROR, (err) => {
            this.hideProgress();
            alert('Failed to export GIF: ' + (err?.message || err));
        });
    }

    updatePreviewBtnState(isPlaying) {
        if (!this.previewToggleBtn) return;
        if (isPlaying) {
            this.previewToggleBtn.innerHTML = '⏸ Pause Preview';
            this.previewToggleBtn.classList.add('active');
        } else {
            this.previewToggleBtn.innerHTML = '▶ Live Animation Preview';
            this.previewToggleBtn.classList.remove('active');
        }
    }

    showProgress(phase, current, total, percent) {
        if (!this.progressContainer) return;
        this.progressContainer.classList.remove('hidden');

        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }

        if (this.progressText) {
            const phaseLabel = phase === 'rendering' ? 'Rendering frames' : 'Encoding GIF';
            this.progressText.textContent = `${phaseLabel}... ${percent}% (${current}/${total})`;
        }
    }

    hideProgress() {
        if (!this.progressContainer) return;
        setTimeout(() => {
            this.progressContainer.classList.add('hidden');
            if (this.progressBar) this.progressBar.style.width = '0%';
        }, 1200);
    }

    render() {
        const state = this.state;
        if (this.effectSelect && state.animationEffect) {
            this.effectSelect.value = state.animationEffect;
        }
        if (this.speedInput && state.animationSpeed) {
            this.speedInput.value = state.animationSpeed;
            if (this.speedValue) this.speedValue.textContent = `${Number(state.animationSpeed).toFixed(1)}×`;
        }
        if (this.intensityInput && state.animationIntensity) {
            this.intensityInput.value = state.animationIntensity;
            if (this.intensityValue) this.intensityValue.textContent = `${Number(state.animationIntensity).toFixed(1)}×`;
        }
        if (this.fpsSelect && state.animationFps) {
            this.fpsSelect.value = String(state.animationFps);
        }
        if (this.gifResSelect && state.gifResolution) {
            this.gifResSelect.value = state.gifResolution;
        }
        this.updatePreviewBtnState(Boolean(state.isAnimationPlaying));
    }
}

// Factory function
export function createAnimationSettings() {
    const component = new AnimationSettings();
    component.init();
    return component;
}
