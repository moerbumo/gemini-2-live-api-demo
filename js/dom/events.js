import elements from './elements.js';
import settingsManager from '../settings/settings-manager.js';
import { AudioRecorder } from '../audio/recorder.js';

export function setupEventListeners(apiClient, chatManager) {
    const recorder = new AudioRecorder();
    const taskSwitch = document.getElementById('taskSwitch');
    const taskLabel = document.getElementById('taskLabel');

    // --- Top Bar Buttons ---
    elements.settingsBtn.addEventListener('click', () =>
        settingsManager.show(),
    );

    // Hide unused buttons
    elements.cameraBtn.style.display = 'none';
    elements.screenBtn.style.display = 'none';
    elements.disconnectBtn.style.display = 'none';
    elements.connectBtn.style.display = 'none';

    // --- Task Toggle Switch ---
    taskSwitch.addEventListener('change', () => {
        taskLabel.textContent = taskSwitch.checked ? 'Translate' : 'Transcribe';
    });

    // --- Audio Recording Logic ---
    const startRecording = async (sourceType) => {
        if (recorder.isRecording) return;
        try {
            await recorder.start(sourceType);
            elements.micBtn.classList.add('recording');
            elements.systemAudioBtn.classList.add('recording');
            chatManager.addSystemMessage(
                `Recording from ${sourceType} started...`,
            );
        } catch (error) {
            chatManager.addSystemMessage(
                `Error starting recording: ${error.message}`,
            );
        }
    };

    const stopRecordingAndProcess = async () => {
        if (!recorder.isRecording) return;

        elements.micBtn.classList.remove('recording');
        elements.systemAudioBtn.classList.remove('recording');

        const isTranslation = taskSwitch.checked;
        chatManager.addSystemMessage(
            `Recording stopped. ${
                isTranslation ? 'Translating' : 'Transcribing'
            }...`,
        );

        try {
            const audioBlob = await recorder.stop();
            let resultText;

            if (isTranslation) {
                const targetLanguage =
                    localStorage.getItem('targetLanguage') || 'Chinese';
                resultText = await apiClient.translateAudio(
                    audioBlob,
                    targetLanguage,
                );
            } else {
                resultText = await apiClient.transcribe(audioBlob);
            }

            chatManager.addUserMessage(resultText);
        } catch (error) {
            chatManager.addSystemMessage(`Processing failed: ${error.message}`);
        }
    };

    elements.micBtn.addEventListener('click', () => {
        recorder.isRecording
            ? stopRecordingAndProcess()
            : startRecording('mic');
    });

    elements.systemAudioBtn.addEventListener('click', () => {
        recorder.isRecording
            ? stopRecordingAndProcess()
            : startRecording('display');
    });

    // --- Text Input and Send Button (for testing) ---
    const sendMessage = async () => {
        const text = elements.messageInput.value.trim();
        if (!text) return;

        chatManager.addUserMessage(text);
        elements.messageInput.value = '';

        try {
            const targetLanguage =
                localStorage.getItem('targetLanguage') || 'Chinese';
            // For text translation, we can't know the source, so we let the model figure it out.
            const responseText = await apiClient.translate(
                text,
                targetLanguage,
                'auto-detected',
            );
            chatManager.addBotMessage(responseText);
        } catch (error) {
            chatManager.addSystemMessage(
                `Chat request failed: ${error.message}`,
            );
        }
    };

    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}
