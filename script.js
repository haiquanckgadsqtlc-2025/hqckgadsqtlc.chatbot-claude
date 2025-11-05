// ===== GOOGLE GEMINI API INTEGRATION =====

class ChatbotAI {
    constructor() {
        this.apiKey = CONFIG.GEMINI_API_KEY;
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL_NAME}:generateContent?key=${this.apiKey}`;
        this.conversationHistory = [];
        this.documentContent = '';
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        // Load tài liệu khi khởi động
        await this.loadDocuments();
        this.setupEventListeners();
    }

    // Load tất cả tài liệu
    async loadDocuments() {
        try {
            // Hiển thị loading
            this.showLoadingMessage('Đang tải tài liệu hải quan...');

            const files = [
                'data/chi_muc.txt',
                'data/tai_lieu_1.txt',
                'data/tai_lieu_2.txt',
                'data/tai_lieu_3.txt'
            ];

            let allContent = '';
            
            for (const file of files) {
                try {
                    const response = await fetch(file);
                    if (response.ok) {
                        const text = await response.text();
                        allContent += text + '\n\n';
                    } else {
                        console.warn(`Không tải được file: ${file}`);
                    }
                } catch (error) {
                    console.warn(`Lỗi khi tải ${file}:`, error);
                }
            }

            this.documentContent = allContent;
            
            // Xóa loading message
            this.removeLoadingMessage();
            
            console.log('✅ Đã tải tài liệu thành công:', this.documentContent.length, 'ký tự');
        } catch (error) {
            console.error('❌ Lỗi load tài liệu:', error);
            this.showError('Không thể tải tài liệu. Vui lòng tải lại trang.');
        }
    }

    // Setup các event listener
    setupEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const userInput = document.getElementById('userInput');
        const chatbotToggle = document.getElementById('chatbotToggle');
        const minimizeBtn = document.getElementById('minimizeBtn');
        const chatbotContainer = document.getElementById('chatbotContainer');

        // Gửi tin nhắn
        sendBtn.addEventListener('click', () => this.sendMessage());
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isLoading) {
                this.sendMessage();
            }
        });

        // Mở/đóng chatbot
        chatbotToggle.addEventListener('click', () => {
            chatbotContainer.classList.add('active');
            chatbotToggle.classList.add('hidden');
            userInput.focus();
        });

        minimizeBtn.addEventListener('click', () => {
            chatbotContainer.classList.remove('active');
            chatbotToggle.classList.remove('hidden');
        });
    }

    // Gửi tin nhắn
    async sendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();

        if (message === '' || this.isLoading) return;

        // Thêm tin nhắn người dùng
        this.addMessage(message, 'user');
        userInput.value = '';

        // Hiển thị loading
        this.isLoading = true;
        const loadingId = this.showTypingIndicator();

        try {
            // Gọi Gemini API
            const response = await this.callGeminiAPI(message);
            
            // Xóa loading
            this.removeTypingIndicator(loadingId);
            
            // Hiển thị câu trả lời
            this.addMessage(response, 'bot');
            
        } catch (error) {
            console.error('❌ Lỗi:', error);
            this.removeTypingIndicator(loadingId);
            this.addMessage('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.', 'bot');
        } finally {
            this.isLoading = false;
        }
    }

    // Gọi Google Gemini API
    async callGeminiAPI(userQuestion) {
        // Tạo prompt với tài liệu
        const prompt = `${SYSTEM_PROMPT}

===== TÀI LIỆU THAM KHẢO =====
${this.documentContent.substring(0, 30000)} 

===== CÂU HỎI CỦA NGƯỜI DÙNG =====
${userQuestion}

===== TRẢ LỜI =====`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: CONFIG.TEMPERATURE,
                maxOutputTokens: CONFIG.MAX_TOKENS,
            }
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Lấy câu trả lời
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Không nhận được phản hồi từ AI');
        }
    }

    // Thêm tin nhắn vào chat
    addMessage(text, sender) {
        const chatMessages = document.getElementById('chatMessages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message fade-in`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' 
            ? '<i class="fas fa-robot"></i>' 
            : '<i class="fas fa-user"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Format text (chuyển \n thành <br>)
        const formattedText = text.replace(/\n/g, '<br>');
        content.innerHTML = `<p>${formattedText}</p>`;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Hiển thị đang gõ
    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.id = 'typing-indicator';
        
        loadingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return 'typing-indicator';
    }

    removeTypingIndicator(id) {
        const indicator = document.getElementById(id);
        if (indicator) {
            indicator.remove();
        }
    }

    showLoadingMessage(text) {
        const chatMessages = document.getElementById('chatMessages');
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'document-loading';
        loadingDiv.className = 'message bot-message';
        loadingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p><i class="fas fa-spinner fa-spin"></i> ${text}</p>
            </div>
        `;
        chatMessages.appendChild(loadingDiv);
    }

    removeLoadingMessage() {
        const loading = document.getElementById('document-loading');
        if (loading) {
            loading.remove();
        }
    }

    showError(text) {
        this.addMessage(`❌ ${text}`, 'bot');
    }
}

// Khởi động chatbot khi trang load xong
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new ChatbotAI();
});