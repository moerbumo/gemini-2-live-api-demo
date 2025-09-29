export const settingsTemplate = `
<div class="settings-group">
    <label for="proxyUrl">API Proxy URL</label>
    <input type="text" id="proxyUrl" placeholder="e.g., https://api.openai.com/v1">
</div>

<div class="settings-group">
    <label for="apiKey">API Key</label>
    <input type="password" id="apiKey" placeholder="Enter your API key">
</div>

<hr>

<div class="settings-group">
    <label for="transcriptionModel">Transcription Model</label>
    <input type="text" id="transcriptionModel" placeholder="e.g., whisper-1">
</div>


<div class="settings-group">
    <label for="translationModel">Translation Model</label>
    <input type="text" id="translationModel" placeholder="e.g., gpt-3.5-turbo">
</div>

<div class="settings-group">
    <label for="targetLanguage">Target Language (for Translation)</label>
    <input type="text" id="targetLanguage" placeholder="e.g., Chinese">
</div>

<button id="settingsSaveBtn" class="settings-save-btn">Save Settings</button>
`;
