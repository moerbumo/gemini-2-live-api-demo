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
    const handleRecording = async (sourceType) => {
        if (recorder.isRecording) {
            recorder.stop();
            elements.micBtn.classList.remove('recording');
            elements.systemAudioBtn.classList.remove('recording');
            chatManager.addSystemMessage('Recording stopped.');
        } else {
            try {
                await recorder.start(sourceType);
                elements.micBtn.classList.add('recording');
                elements.systemAudioBtn.classList.add('recording');
                chatManager.addSystemMessage(
                    `Recording from ${sourceType} started...`
                );
            } catch (error) {
                chatManager.addSystemMessage(
                    `Error starting recording: ${error.message}`
                );
            }
        }
    };

    // --- API Request Queue ---
    const apiQueue = [];
    let isProcessingQueue = false;

    const processQueue = async () => {
        if (isProcessingQueue || apiQueue.length === 0) {
            return;
        }
        isProcessingQueue = true;

        const { audioBlob, isTranslation } = apiQueue.shift();

        try {
            let resultText;
            if (isTranslation) {
                const targetLanguage =
                    localStorage.getItem('targetLanguage') || 'Chinese';
                resultText = await apiClient.translateAudio(
                    audioBlob,
                    targetLanguage
                );
            } else {
                resultText = await apiClient.transcribe(audioBlob);
            }
            chatManager.addBotMessage(resultText);
        } catch (error) {
            chatManager.addSystemMessage(`Processing failed: ${error.message}`);
        } finally {
            isProcessingQueue = false;
            processQueue(); // Process next item in the queue
        }
    };

    recorder.addEventListener('audioChunkReady', (event) => {
        const audioBlob = event.detail;
        const isTranslation = taskSwitch.checked;
        
        // Add the new chunk to the queue
        apiQueue.push({ audioBlob, isTranslation });
        
        // Start processing the queue if it's not already running
        if (!isProcessingQueue) {
            processQueue();
        }
    });

    elements.micBtn.addEventListener('click', () => handleRecording('mic'));
    elements.systemAudioBtn.addEventListener('click', () =>
        handleRecording('display')
    );

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
