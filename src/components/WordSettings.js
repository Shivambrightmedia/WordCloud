/**
 * WordSettings - Word dictionary and hero words controls
 * 
 * SOLID: SRP - Only handles word input
 */

import { BaseComponent } from './BaseComponent.js';

export class WordSettings extends BaseComponent {
    constructor() {
        super('WordSettings');

        this.wordsInput = null;
        this.heroWordsInput = null;
    }

    cacheElements() {
        this.wordsInput = this.$('wordsInput');
        this.heroWordsInput = this.$('heroWordsInput');
    }

    bindEvents() {
        this.addListener(this.wordsInput, 'input', () => {
            this.parseAndUpdateWords();
        });

        this.addListener(this.heroWordsInput, 'input', () => {
            this.parseAndUpdateHeroWords();
        });
    }

    /**
     * Parse words input and update state
     */
    parseAndUpdateWords() {
        const rawText = this.wordsInput.value;
        const words = rawText
            .split(/[\n,]+/)
            .map(w => w.trim())
            .filter(w => w.length > 0);

        this.setState({
            words: words.length > 0 ? words : ['Word', 'Portrait']
        });
    }

    /**
     * Parse hero words input and update state
     */
    parseAndUpdateHeroWords() {
        const rawText = this.heroWordsInput.value;
        const heroWords = rawText
            .split(/[\n,]+/)
            .map(w => w.trim())
            .filter(w => w.length > 0);

        this.setState({ heroWords });
    }

    render() {
        // Sync UI with state
        const { words, heroWords } = this.state;
        this.wordsInput.value = words.join(', ');
        this.heroWordsInput.value = heroWords.join(', ');
    }
}

// Factory function
export function createWordSettings() {
    const component = new WordSettings();
    component.init();
    return component;
}
