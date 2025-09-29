import { settingsTemplate } from './settings-template.js';

class SettingsManager {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
    }

    initializeElements() {
        this.dialog = document.createElement('div');
        this.dialog.className = 'settings-dialog';
        this.dialog.innerHTML = settingsTemplate;

        this.overlay = document.createElement('div');
        this.overlay.className = 'settings-overlay';

        document.body.appendChild(this.dialog);
        document.body.appendChild(this.overlay);

        this.elements = {
            dialog: this.dialog,
            overlay: this.overlay,
            proxyUrlInput: this.dialog.querySelector('#proxyUrl'),
            apiKeyInput: this.dialog.querySelector('#apiKey'),
            transcriptionModelInput: this.dialog.querySelector(
                '#transcriptionModel',
            ),
            translationModelInput:
                this.dialog.querySelector('#translationModel'),
            targetLanguageInput: this.dialog.querySelector('#targetLanguage'),
            saveBtn: this.dialog.querySelector('#settingsSaveBtn'),
        };
    }

    setupEventListeners() {
        this.overlay.addEventListener('click', () => this.hide());
        this.dialog.addEventListener('click', (e) => e.stopPropagation());
        this.elements.saveBtn.addEventListener('click', () => {
            this.saveSettings();
            this.hide();
            window.location.reload();
        });
    }

    loadSettings() {
        this.elements.proxyUrlInput.value =
            localStorage.getItem('proxyUrl') || '';
        this.elements.apiKeyInput.value = localStorage.getItem('apiKey') || '';
        this.elements.transcriptionModelInput.value =
            localStorage.getItem('transcriptionModel') || 'whisper-1';
        this.elements.translationModelInput.value =
            localStorage.getItem('translationModel') || 'gpt-3.5-turbo';
        this.elements.targetLanguageInput.value =
            localStorage.getItem('targetLanguage') || 'Chinese';
    }

    saveSettings() {
        localStorage.setItem('proxyUrl', this.elements.proxyUrlInput.value);
        localStorage.setItem('apiKey', this.elements.apiKeyInput.value);
        localStorage.setItem(
            'transcriptionModel',
            this.elements.transcriptionModelInput.value,
        );
        localStorage.setItem(
            'translationModel',
            this.elements.translationModelInput.value,
        );
        localStorage.setItem(
            'targetLanguage',
            this.elements.targetLanguageInput.value,
        );
    }

    show() {
        this.dialog.classList.add('active');
        this.overlay.classList.add('active');
    }

    hide() {
        this.dialog.classList.remove('active');
        this.overlay.classList.remove('active');
    }
}

export default new SettingsManager();
