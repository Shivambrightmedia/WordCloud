/**
 * WordSettings - Word dictionary with individual colors and table UI
 * 
 * SOLID: SRP - Only handles word input with WordArt.com style table
 */

import { BaseComponent } from './BaseComponent.js';
import { Events } from '../core/EventBus.js';

export class WordSettings extends BaseComponent {
    constructor() {
        super('WordSettings');

        // Word data: array of { text, color, repeat }
        this.wordItems = [];
        this.selectedIndices = new Set();
        this.defaultColors = ['#ff00ff', '#00bfff', '#ff6600', '#00ff00', '#ff0066', '#9933ff'];
        this.colorIndex = 0;
    }

    cacheElements() {
        this.wordsTableContainer = this.$('wordsTableContainer');
        this.wordsTableBody = this.$('wordsTableBody');
        this.newWordInput = this.$('newWordInput');
        this.selectAllCheckbox = this.$('selectAllWords');
        this.heroWordsInput = this.$('heroWordsInput');

        // Toolbar buttons
        this.importBtn = this.$('wordsImportBtn');
        this.addBtn = this.$('wordsAddBtn');
        this.removeBtn = this.$('wordsRemoveBtn');
        this.moveUpBtn = this.$('wordsMoveUpBtn');
        this.moveDownBtn = this.$('wordsMoveDownBtn');
        this.actionsBtn = this.$('wordsActionsBtn');
        this.actionsMenu = this.$('wordsActionsMenu');
        this.bulkColorPicker = this.$('bulkColorPicker');
    }

    init() {
        this.cacheElements();
        this.bindEvents();

        // Check if there's saved state to restore, otherwise use defaults
        const { wordItems, words, wordColors } = this.state;

        if (wordItems && wordItems.length > 0) {
            // Restore from saved wordItems (from preset)
            this.wordItems = wordItems.map(item => ({ ...item, size: item.size || 1 }));
        } else if (words && words.length > 0) {
            // Build wordItems from words array
            this.wordItems = words.map(word => ({
                text: word,
                size: 1,
                color: wordColors && wordColors[word] ? wordColors[word] : this.getNextColor(),
                repeat: true
            }));
        } else {
            // Initialize with default words
            this.wordItems = [
                { text: 'Leadership', size: 5, color: '#1e293b', repeat: true },
                { text: 'Reputation', size: 4, color: '#1e293b', repeat: true },
                { text: 'Influence', size: 4, color: '#1e293b', repeat: true },
                { text: 'Stories', size: 3, color: '#1e293b', repeat: true },
                { text: 'Culture', size: 3, color: '#1e293b', repeat: true },
                { text: 'Credibility', size: 2, color: '#1e293b', repeat: true },
                { text: 'Communication', size: 2, color: '#1e293b', repeat: true },
                { text: 'Purpose', size: 2, color: '#1e293b', repeat: true },
                { text: 'Impact', size: 2, color: '#1e293b', repeat: true },
                { text: 'Trust', size: 2, color: '#1e293b', repeat: true },
                { text: 'Respect', size: 1, color: '#1e293b', repeat: true },
                { text: 'Growth', size: 1, color: '#1e293b', repeat: true },
                { text: 'Integrity', size: 1, color: '#1e293b', repeat: true }
            ];
        }

        this.renderTable();
        this.updateState();
    }

    bindEvents() {
        // New word input - Enter key
        this.addListener(this.newWordInput, 'keypress', (e) => {
            if (e.key === 'Enter' && this.newWordInput.value.trim()) {
                this.addWord(this.newWordInput.value.trim());
                this.newWordInput.value = '';
            }
        });

        // Select all checkbox
        this.addListener(this.selectAllCheckbox, 'change', () => {
            this.toggleSelectAll();
        });

        // Toolbar buttons
        this.addListener(this.importBtn, 'click', () => this.handleImport());
        this.addListener(this.addBtn, 'click', () => this.handleAdd());
        this.addListener(this.removeBtn, 'click', () => this.removeSelected());
        this.addListener(this.moveUpBtn, 'click', () => this.moveSelected(-1));
        this.addListener(this.moveDownBtn, 'click', () => this.moveSelected(1));

        // Actions dropdown
        this.addListener(this.actionsBtn, 'click', (e) => {
            e.stopPropagation();
            this.actionsMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.actionsMenu.classList.remove('show');
        });

        // Bulk color picker
        this.addListener(this.bulkColorPicker, 'input', () => {
            this.applyColorToSelected(this.bulkColorPicker.value);
        });

        // Dropdown menu actions
        const selectAllAction = document.getElementById('selectAllAction');
        const deselectAllAction = document.getElementById('deselectAllAction');
        const clearAllAction = document.getElementById('clearAllAction');

        if (selectAllAction) {
            this.addListener(selectAllAction, 'click', () => {
                this.selectAllCheckbox.checked = true;
                this.toggleSelectAll();
                this.actionsMenu.classList.remove('show');
            });
        }

        if (deselectAllAction) {
            this.addListener(deselectAllAction, 'click', () => {
                this.selectAllCheckbox.checked = false;
                this.toggleSelectAll();
                this.actionsMenu.classList.remove('show');
            });
        }

        if (clearAllAction) {
            this.addListener(clearAllAction, 'click', () => {
                if (confirm('Are you sure you want to clear all words?')) {
                    this.wordItems = [];
                    this.selectedIndices.clear();
                    this.renderTable();
                    this.updateState();
                }
                this.actionsMenu.classList.remove('show');
            });
        }

        // Hero words
        this.addListener(this.heroWordsInput, 'input', () => {
            this.parseAndUpdateHeroWords();
        });

        // Re-render when preset is loaded
        this.on(Events.PRESET_LOADED, () => {
            this.loadFromState();
        });
    }

    /**
     * Load wordItems from state (used when preset is loaded)
     */
    loadFromState() {
        const { wordItems, words, wordColors } = this.state;

        // If preset has wordItems, use them
        if (wordItems && wordItems.length > 0) {
            this.wordItems = [...wordItems];
        }
        // Otherwise, rebuild from words array
        else if (words && words.length > 0) {
            this.wordItems = words.map(word => ({
                text: word,
                color: wordColors && wordColors[word] ? wordColors[word] : this.getNextColor(),
                repeat: true
            }));
        }

        this.selectedIndices.clear();
        this.renderTable();
    }

    /**
     * Get next color from palette
     */
    getNextColor() {
        const color = this.defaultColors[this.colorIndex % this.defaultColors.length];
        this.colorIndex++;
        return color;
    }

    /**
     * Add a new word to the list
     */
    addWord(text) {
        this.wordItems.push({
            text: text,
            size: 1,
            color: this.getNextColor(),
            repeat: true
        });
        this.renderTable();
        this.updateState();
    }

    /**
     * Handle import button - opens file dialog or paste modal
     */
    handleImport() {
        const text = prompt('Paste words separated by commas or new lines:');
        if (text) {
            const words = text.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
            words.forEach(word => {
                this.wordItems.push({
                    text: word,
                    size: 1,
                    color: this.getNextColor(),
                    repeat: true
                });
            });
            this.renderTable();
            this.updateState();
        }
    }

    /**
     * Handle add button
     */
    handleAdd() {
        const text = this.newWordInput.value.trim();
        if (text) {
            this.addWord(text);
            this.newWordInput.value = '';
        } else {
            this.newWordInput.focus();
        }
    }

    /**
     * Remove selected words
     */
    removeSelected() {
        if (this.selectedIndices.size === 0) return;

        this.wordItems = this.wordItems.filter((_, index) => !this.selectedIndices.has(index));
        this.selectedIndices.clear();
        this.selectAllCheckbox.checked = false;
        this.renderTable();
        this.updateState();
    }

    /**
     * Move selected words up or down
     */
    moveSelected(direction) {
        if (this.selectedIndices.size !== 1) return;

        const index = Array.from(this.selectedIndices)[0];
        const newIndex = index + direction;

        if (newIndex < 0 || newIndex >= this.wordItems.length) return;

        // Swap items
        [this.wordItems[index], this.wordItems[newIndex]] = [this.wordItems[newIndex], this.wordItems[index]];

        this.selectedIndices.clear();
        this.selectedIndices.add(newIndex);
        this.renderTable();
        this.updateState();
    }

    /**
     * Toggle select all
     */
    toggleSelectAll() {
        if (this.selectAllCheckbox.checked) {
            this.wordItems.forEach((_, index) => this.selectedIndices.add(index));
        } else {
            this.selectedIndices.clear();
        }
        this.renderTable();
    }

    /**
     * Apply color to all selected words
     */
    applyColorToSelected(color) {
        this.selectedIndices.forEach(index => {
            this.wordItems[index].color = color;
        });
        this.renderTable();
        this.updateState();
    }

    /**
     * Toggle all selected words repeat status
     */
    toggleRepeatSelected(repeat) {
        this.selectedIndices.forEach(index => {
            this.wordItems[index].repeat = repeat;
        });
        this.renderTable();
        this.updateState();
    }

    /**
     * Render the words table
     */
    renderTable() {
        this.wordsTableBody.innerHTML = '';

        this.wordItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = this.selectedIndices.has(index) ? 'word-row selected' : 'word-row';

            row.innerHTML = `
                <td class="cell-select">
                    <input type="checkbox" class="word-select-checkbox" data-index="${index}" 
                           ${this.selectedIndices.has(index) ? 'checked' : ''}>
                </td>
                <td class="cell-text">
                    <input type="text" class="word-text-input" value="${item.text}" data-index="${index}">
                </td>
                <td class="cell-size">
                    <input type="number" class="word-size-input" min="1" max="10" value="${item.size || 1}" data-index="${index}" title="Size Weight (1-10)">
                </td>
                <td class="cell-color">
                    <input type="color" class="word-color-input" value="${item.color}" data-index="${index}">
                </td>
                <td class="cell-repeat">
                    <input type="checkbox" class="word-repeat-checkbox" data-index="${index}" 
                           ${item.repeat ? 'checked' : ''}>
                </td>
            `;

            this.wordsTableBody.appendChild(row);
        });

        // Bind row events
        this.bindRowEvents();
    }

    /**
     * Bind events for table rows
     */
    bindRowEvents() {
        // Selection checkboxes
        this.wordsTableBody.querySelectorAll('.word-select-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (e.target.checked) {
                    this.selectedIndices.add(index);
                } else {
                    this.selectedIndices.delete(index);
                }
                this.updateSelectAllState();
                this.renderTable();
            });
        });

        // Text inputs
        this.wordsTableBody.querySelectorAll('.word-text-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.wordItems[index].text = e.target.value.trim() || 'Word';
                this.updateState();
            });
        });

        // Size inputs
        this.wordsTableBody.querySelectorAll('.word-size-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                this.wordItems[index].size = val;
                this.updateState();
            });
        });

        // Color inputs
        this.wordsTableBody.querySelectorAll('.word-color-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const newColor = e.target.value;

                if (this.selectedIndices.has(index) && this.selectedIndices.size > 1) {
                    this.selectedIndices.forEach(selectedIndex => {
                        this.wordItems[selectedIndex].color = newColor;
                        const colorInput = this.wordsTableBody.querySelector(
                            `.word-color-input[data-index="${selectedIndex}"]`
                        );
                        if (colorInput && colorInput !== e.target) {
                            colorInput.value = newColor;
                        }
                    });
                } else {
                    this.wordItems[index].color = newColor;
                }
                this.updateState();
            });
        });

        // Repeat checkboxes
        this.wordsTableBody.querySelectorAll('.word-repeat-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const newRepeatState = e.target.checked;

                if (this.selectedIndices.has(index) && this.selectedIndices.size > 1) {
                    this.selectedIndices.forEach(selectedIndex => {
                        this.wordItems[selectedIndex].repeat = newRepeatState;
                        const repeatCheckbox = this.wordsTableBody.querySelector(
                            `.word-repeat-checkbox[data-index="${selectedIndex}"]`
                        );
                        if (repeatCheckbox && repeatCheckbox !== e.target) {
                            repeatCheckbox.checked = newRepeatState;
                        }
                    });
                } else {
                    this.wordItems[index].repeat = newRepeatState;
                }
                this.updateState();
            });
        });
    }

    /**
     * Update select all checkbox state
     */
    updateSelectAllState() {
        const allSelected = this.wordItems.length > 0 && this.selectedIndices.size === this.wordItems.length;
        this.selectAllCheckbox.checked = allSelected;
        this.selectAllCheckbox.indeterminate = this.selectedIndices.size > 0 && !allSelected;
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

    /**
     * Update global state with current word data
     */
    updateState() {
        const words = this.wordItems.filter(item => item.repeat).map(item => item.text);
        const wordColors = {};
        const heroWordsFromTable = [];

        this.wordItems.forEach(item => {
            wordColors[item.text] = item.color;
            // Words with size >= 3 automatically qualify as hero words
            if ((item.size || 1) >= 3) {
                heroWordsFromTable.push(item.text);
            }
        });

        // Combine explicit hero words textarea with table-promoted hero words
        const rawHeroText = this.heroWordsInput ? this.heroWordsInput.value : '';
        const textareaHeroWords = rawHeroText
            .split(/[\n,]+/)
            .map(w => w.trim())
            .filter(w => w.length > 0);

        const combinedHeroWords = Array.from(new Set([...textareaHeroWords, ...heroWordsFromTable]));

        this.setState({
            words: words.length > 0 ? words : ['Word', 'Portrait'],
            heroWords: combinedHeroWords,
            wordColors: wordColors,
            wordItems: this.wordItems
        });
    }

    render() {
        // Sync UI with state if needed
        const { heroWords } = this.state;
        if (heroWords) {
            this.heroWordsInput.value = heroWords.join(', ');
        }
    }
}

// Factory function
export function createWordSettings() {
    const component = new WordSettings();
    component.init();
    return component;
}
