import { OpenAIClient } from './api/OpenAIClient.js';
import { ChatManager } from './chat/chat-manager.js';
import { setupEventListeners } from './dom/events.js';

// Main application entry point
function main() {
    const apiClient = new OpenAIClient();
    const chatManager = new ChatManager();

    setupEventListeners(apiClient, chatManager);

    chatManager.addSystemMessage(
        'App initialized. Configure your API settings and start transcribing.',
    );
}

main();
