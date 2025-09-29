export class ChatManager {
    constructor() {
        this.chatContainer = document.getElementById('chatHistory');
    }

    addUserMessage(text) {
        this.addMessage('user', text);
    }

    addBotMessage(text) {
        this.addMessage('model', text);
    }

    addSystemMessage(text) {
        this.addMessage('system', text);
    }

    /**
     * Adds a new message to the chat history and initiates a typewriter effect for bot messages.
     * @param {string} sender - 'user', 'bot', or 'system'.
     * @param {string} text - The message content.
     */
    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;

        if (sender === 'model') {
            this._typewriterEffect(messageDiv, text);
        } else {
            messageDiv.textContent = text;
        }

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Simulates a typewriter effect for displaying text content in an element.
     * @param {HTMLElement} element - The element where the text will be displayed.
     * @param {string} text - The full text to display.
     * @private
     */
    _typewriterEffect(element, text) {
        let i = 0;
        element.textContent = ''; // Clear content before starting
        const speed = 30; // Milliseconds per character

        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                this.scrollToBottom();
                setTimeout(type, speed);
            }
        };
        type();
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    clear() {
        this.chatContainer.innerHTML = '';
    }
}
