// ===== CHATBOT AI - VERSION SIMPLE =====

class ChatbotAI {
    constructor() {
        console.log('🔧 Khởi tạo ChatbotAI...');
        
        this.apiKey = CONFIG.GEMINI_API_KEY;
        this.modelName = CONFIG.MODEL_NAME;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + this.modelName + ':generateContent?key=' + this.apiKey;
        this.documentContent = '';
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 Bắt đầu init...');
        await this.loadDocuments();
        this.setupEventListeners();
        console.log('✅ Init hoàn tất');
    }

    async loadDocuments() {
        console.log('📄 Đang load tài liệu...');
        
        try {
            this.showLoadingMessage('Đang tải tài liệu...');
            
            const files = [
                'data/chi_muc.txt',
                'data/tai_lieu_1.txt',
                'data/tai_lieu_2.txt',
                'data/tai_lieu_3.txt'
            ];

            let allContent = '';
            
            for (let i = 0; i < files.length; i++) {
                try {
                    const response = await fetch(files[i]);
                    if (response.ok) {
                        const text = await response.text();
                        allContent += text + '\n\n';
                        console.log('✅ Loaded: ' + files[i]);
                    }
                } catch (err) {
                    console.warn('⚠️ Skip: ' + files[i]);
                }
            }

            if (allContent.length < 100) {
                allContent = this.getSampleDocument();
                console.log('📋 Dùng tài liệu mẫu');
            }

            this.documentContent = allContent;
            this.removeLoadingMessage();
            console.log('✅ Loaded ' + allContent.length + ' ký tự');
            
        } catch (error) {
            console.error('❌ Lỗi load:', error);
            this.documentContent = this.getSampleDocument();
            this.removeLoadingMessage();
        }
    }

    setupEventListeners() {
        console.log('🔧 Setup listeners...');
        
        const sendBtn = document.getElementById('sendBtn');
        const userInput = document.getElementById('userInput');
        const chatbotToggle = document.getElementById('chatbotToggle');
        const minimizeBtn = document.getElementById('minimizeBtn');
        const chatbotContainer = document.getElementById('chatbotContainer');

        console.log('sendBtn:', sendBtn ? 'OK' : 'NULL');
        console.log('userInput:', userInput ? 'OK' : 'NULL');
        console.log('chatbotToggle:', chatbotToggle ? 'OK' : 'NULL');
        console.log('chatbotContainer:', chatbotContainer ? 'OK' : 'NULL');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                console.log('🖱️ Click send');
                this.sendMessage();
            });
        }

        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isLoading) {
                    console.log('⌨️ Enter pressed');
                    this.sendMessage();
                }
            });
        }

        if (chatbotToggle && chatbotContainer) {
            chatbotToggle.addEventListener('click', () => {
                console.log('🖱️ Open chatbot');
                chatbotContainer.classList.add('active');
                chatbotToggle.classList.add('hidden');
                
                setTimeout(() => {
                    if (userInput) {
                        userInput.focus();
                        console.log('✏️ Input focused');
                    }
                }, 300);
            });
        }

        if (minimizeBtn && chatbotContainer && chatbotToggle) {
            minimizeBtn.addEventListener('click', () => {
                console.log('🖱️ Close chatbot');
                chatbotContainer.classList.remove('active');
                chatbotToggle.classList.remove('hidden');
            });
        }
    }

    async sendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();

        if (message === '' || this.isLoading) {
            console.log('⚠️ Empty or loading');
            return;
        }

        console.log('💬 Send:', message);
        this.addMessage(message, 'user');
        userInput.value = '';

        this.isLoading = true;
        const loadingId = this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message);
            this.removeTypingIndicator(loadingId);
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('❌ Error:', error);
            this.removeTypingIndicator(loadingId);
            this.addMessage('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.', 'bot');
        } finally {
            this.isLoading = false;
        }
    }

    async callGeminiAPI(userQuestion) {
        console.log('🚀 Call API...');
        
        const promptText = SYSTEM_PROMPT + '\n\nTÀI LIỆU:\n' + this.documentContent.substring(0, 30000) + '\n\nCÂU HỎI:\n' + userQuestion;

        const requestBody = {
            contents: [{
                parts: [{
                    text: promptText
                }]
            }],
            generationConfig: {
                temperature: CONFIG.TEMPERATURE,
                maxOutputTokens: CONFIG.MAX_TOKENS
            }
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('📥 Response:', data);

        if (!response.ok) {
            throw new Error('API Error: ' + response.status);
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const answer = data.candidates[0].content.parts[0].text;
            console.log('✅ Answer OK');
            return answer;
        }

        throw new Error('No response');
    }

    getSampleDocument() {
        return 'TÀI LIỆU MẪU\n\nThủ tục hải quan tàu biển theo Nghị định 167/2025/NĐ-CP:\n1. Thông báo trước 24h\n2. Nộp hồ sơ qua NSW\n3. Kiểm tra hồ sơ trong 01 giờ\n4. Giám sát dỡ hàng\n5. Thông quan';
    }

  addMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + sender + '-message fade-in';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (sender === 'bot') {
        // Format nâng cao cho bot message
        let formattedText = text
            // Xử lý xuống dòng đôi (tạo khoảng trắng lớn)
            .replace(/\n\n\n\n/g, '<div class="large-spacing"></div>')  // 4 dòng
            .replace(/\n\n/g, '<div class="medium-spacing"></div>')      // 2 dòng
            .replace(/\n/g, '<br>')                                      // 1 dòng
            
            // Format tiêu đề mục có số (1. Tiêu đề)
            .replace(/^(\d+)\.\s+([^\n<]+)/gm, '<div class="section-title">$1. $2</div>')
            
            // Highlight câu mở đầu "Theo ... như sau:"
            .replace(/(Theo .+? như sau:)/gi, '<div class="intro-sentence">$1</div>')
            
            // Highlight văn bản pháp lý
            .replace(/(Nghị định|Thông tư|Luật|Quyết định|Công văn)\s+(\d+\/\d+\/[A-Z\-]+)/gi, 
                     '<span class="legal-reference">$1 $2</span>')
            
            // Highlight câu "Nguồn:"
            .replace(/(Nguồn:.+?)(<div|<br|$)/gi, '<div class="source-line">$1</div>$2')
            
            // Highlight các động từ trách nhiệm
            .replace(/\b(phải|có trách nhiệm|cần|chịu trách nhiệm)\b/gi, 
                     '<span class="responsibility-verb">$1</span>')
            
            // Highlight câu giới thiệu danh sách
            .replace(/([^.]+(?:bao gồm|gồm|như sau|cụ thể):)/gi, 
                     '<div class="list-intro">$1</div>');
        
        content.innerHTML = formattedText;
    } else {
        // User message - format đơn giản
        content.innerHTML = '<p>' + text.replace(/\n/g, '<br>') + '</p>';
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    
    // Auto scroll
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return null;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.id = 'typing-indicator';
        loadingDiv.innerHTML = '<div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content typing-indicator"><span></span><span></span><span></span></div>';
        
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return 'typing-indicator';
    }

    removeTypingIndicator(id) {
        if (!id) return;
        const indicator = document.getElementById(id);
        if (indicator) indicator.remove();
    }

    showLoadingMessage(text) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'document-loading';
        loadingDiv.className = 'message bot-message';
        loadingDiv.innerHTML = '<div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><p>' + text + '</p></div>';
        chatMessages.appendChild(loadingDiv);
    }

    removeLoadingMessage() {
        const loading = document.getElementById('document-loading');
        if (loading) loading.remove();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Ready');
    console.log('📋 CONFIG:', typeof CONFIG !== 'undefined' ? 'OK' : 'MISSING');
    
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG not found! Check config.js');
        alert('Lỗi: File config.js chưa load. Vui lòng tải lại trang.');
        return;
    }
    
    window.chatbot = new ChatbotAI();
});

console.log('✅ Script.js loaded');
