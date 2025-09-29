/**
 * A client for interacting with an OpenAI-compatible API.
 */
export class OpenAIClient {
    constructor() {
        this.proxyUrl = localStorage.getItem('proxyUrl') || '';
        this.apiKey = localStorage.getItem('apiKey') || '';
        this.transcriptionModel =
            localStorage.getItem('transcriptionModel') || 'whisper-1';
        this.translationModel =
            localStorage.getItem('translationModel') || 'gpt-3.5-turbo';
    }

    /**
     * Sends audio data to the transcription API.
     * @param {Blob} audioBlob The audio data to transcribe.
     * @returns {Promise<string>} The transcribed text.
     */
    async transcribe(audioBlob) {
        if (!this.proxyUrl || !this.apiKey) {
            throw new Error('API Proxy URL or API Key is not configured.');
        }

        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('model', this.transcriptionModel);

        const endpoint = this.proxyUrl.endsWith('/')
            ? `${this.proxyUrl}audio/transcriptions`
            : `${this.proxyUrl}/audio/transcriptions`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.apiKey}` },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `API Error: ${response.status} ${response.statusText} - ${errorData.error.message}`,
            );
        }

        const data = await response.json();
        return data.text;
    }

    /**
     * Translates text from a source language to a target language.
     * @param {string} text The text to translate.
     * @param {string} targetLanguage The language to translate to (e.g., 'Chinese').
     * @param {string} sourceLanguage The language of the original text (e.g., 'Japanese').
     * @returns {Promise<string>} The translated text.
     */
    async translate(text, targetLanguage, sourceLanguage) {
        if (!this.proxyUrl || !this.apiKey) {
            throw new Error('API Proxy URL or API Key is not configured.');
        }

        const endpoint = this.proxyUrl.endsWith('/')
            ? `${this.proxyUrl}chat/completions`
            : `${this.proxyUrl}/chat/completions`;
        const prompt = `Translate the following ${sourceLanguage} text to ${targetLanguage}: ${text}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.translationModel,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `API Error: ${response.status} ${response.statusText} - ${errorData.error.message}`,
            );
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * A wrapper function to first transcribe audio and then translate the result.
     * @param {Blob} audioBlob The audio data.
     * @param {string} sourceLanguage The language of the audio.
     * @param {string} targetLanguage The language to translate the text to.
     * @returns {Promise<string>} The final translated text.
     */
    async translateAudio(audioBlob, targetLanguage) {
        const transcribedText = await this.transcribe(audioBlob);
        if (!transcribedText) {
            return 'Transcription failed or produced no text.';
        }
        // We don't know the source language, so we ask the model to detect and translate.
        const sourceLanguage = 'auto-detected';
        return await this.translate(
            transcribedText,
            targetLanguage,
            sourceLanguage,
        );
    }
}
