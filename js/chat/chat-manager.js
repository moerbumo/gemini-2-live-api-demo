export class ChatManager {
    constructor() {
        this.chatContainer = document.getElementById('chatHistory');
    }

    addUserMessage(text) {
        this.addMessage('user', text);
    }

    addBotMessage(text) {
        this.addMessage('bot', text);
    }

    addSystemMessage(text) {
        this.addMessage('system', text);
    }

    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        messageDiv.textContent = text;
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    clear() {
        this.chatContainer.innerHTML = '';
    }
}
