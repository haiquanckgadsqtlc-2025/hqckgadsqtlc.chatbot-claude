// ===== CHATBOT AI - VERSION STABLE =====

class ChatbotAI {
    constructor() {
        console.log('🔧 Khởi tạo ChatbotAI...');
        
        this.apiKey = CONFIG.GEMINI_API_KEY;
        this.modelName = CONFIG.MODEL_NAME;
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
        this.documentContent = '';
        this.isLoading = false;
        
        this.init();
    }

    // ===== HÀM XỬ LÝ VIẾT TẮT THEO CONFIG.JS =====
    expandAbbreviations(text) {
        console.log('📝 Input gốc:', text);
        
        let expandedText = text.toLowerCase();
        let hasChange = false;

        // BƯỚC 1: Xử lý CỤM TỪ VIẾT TẮT (Ưu tiên cao nhất)
        Object.keys(PHRASE_ABBREVIATIONS).forEach(abbr => {
            const regex = new RegExp('\\b' + abbr.replace(/\s+/g, '\\s+') + '\\b', 'gi');
            if (regex.test(expandedText)) {
                expandedText = expandedText.replace(regex, PHRASE_ABBREVIATIONS[abbr]);
                hasChange = true;
            }
        });

        // BƯỚC 2: Xử lý TỪNG TỪ ĐƠN
        const words = expandedText.split(/\s+/);
        const processedWords = words.map((word, index) => {
            const cleanWord = word.replace(/[.,!?;:]/g, '');
            
            if (WORD_ABBREVIATIONS[cleanWord]) {
                const expansion = WORD_ABBREVIATIONS[cleanWord];
                
                // Xử lý từ có nhiều nghĩa (dùng context)
                if (Array.isArray(expansion)) {
                    const contextResult = this.resolveContext(cleanWord, words, index);
                    hasChange = true;
                    return word.replace(cleanWord, contextResult);
                } else {
                    hasChange = true;
                    return word.replace(cleanWord, expansion);
                }
            }
            return word;
        });

        expandedText = processedWords.join(' ');

        // BƯỚC 3: Xử lý ĐỒNG NGHĨA (không dấu)
        Object.keys(SYNONYMS).forEach(synonym => {
            const regex = new RegExp('\\b' + synonym + '\\b', 'gi');
            if (regex.test(expandedText)) {
                expandedText = expandedText.replace(regex, SYNONYMS[synonym]);
                hasChange = true;
            }
        });

        // BƯỚC 4: Sửa lỗi chính tả
        if (CONFIG.SPELL_CHECK_ENABLED) {
            Object.keys(SPELL_CORRECTIONS).forEach(wrong => {
                const regex = new RegExp('\\b' + wrong + '\\b', 'gi');
                if (regex.test(expandedText)) {
                    expandedText = expandedText.replace(regex, SPELL_CORRECTIONS[wrong]);
                    hasChange = true;
                }
            });
        }

        // Chuẩn hóa khoảng trắng
        expandedText = expandedText.replace(/\s+/g, ' ').trim();

        console.log('✅ Input đã mở rộng:', expandedText);
        
        return {
            original: text,
            expanded: expandedText,
            hasAbbreviation: hasChange
        };
    }

    // ===== GIẢI QUYẾT NGỮ CẢNH CHO TỪ ĐA NGHĨA =====
    resolveContext(word, words, currentIndex) {
        if (!CONTEXT_RULES[word]) {
            return WORD_ABBREVIATIONS[word][0]; // Lấy nghĩa đầu tiên
        }

        const contexts = CONTEXT_RULES[word];
        const contextWindow = words.slice(Math.max(0, currentIndex - 3), currentIndex + 4).join(' ');

        for (const meaning in contexts) {
            const keywords = contexts[meaning];
            const matchCount = keywords.filter(kw => contextWindow.includes(kw)).length;
            
            if (matchCount > 0) {
                console.log(`🎯 Context match: "${word}" → "${meaning}"`);
                return meaning;
            }
        }

        // Mặc định trả về nghĩa đầu tiên
        return WORD_ABBREVIATIONS[word][0];
    }

    // ===== KHỞI TẠO =====
    async init() {
        console.log('🚀 Bắt đầu init...');
        await this.loadDocuments();
        this.setupEventListeners();
        this.setupAutocomplete();
        console.log('✅ Init hoàn tất');
    }

    // ===== TẢI TÀI LIỆU =====
    async loadDocuments() {
        console.log('📄 Đang load tài liệu...');
        
        try {
            // this.showLoadingMessage('Đang tải tài liệu hải quan...');
            
            const files = [
                'data/chi_muc.txt',
                'data/tai_lieu_1.txt',
                'data/tai_lieu_2.txt',
                'data/tai_lieu_3.txt'
            ];

            let allContent = '';
            let loadedCount = 0;
            
            for (let i = 0; i < files.length; i++) {
                try {
                    const response = await fetch(files[i]);
                    if (response.ok) {
                        const text = await response.text();
                        allContent += text + '\n\n';
                        loadedCount++;
                        console.log(`✅ Loaded: ${files[i]}`);
                    }
                } catch (err) {
                    console.warn(`⚠️ Skip: ${files[i]}`);
                }
            }

            if (allContent.length < 100) {
                allContent = this.getSampleDocument();
                console.log('📋 Dùng tài liệu mẫu');
            }
              this.documentContent = allContent;  // ← THÊM DÒNG NÀY
              console.log(`✅ Loaded ${allContent.length} ký tự từ ${loadedCount} files`);  // ← VÀ DÒNG NÀY
                       
        } catch (error) {
            console.error('❌ Lỗi load:', error);
            this.documentContent = this.getSampleDocument();
          //  this.removeLoadingMessage();
        }
    }

    // ===== THIẾT LẬP SỰ KIỆN =====
    setupEventListeners() {
        console.log('🔧 Setup listeners...');
        
        const sendBtn = document.getElementById('sendBtn');
        const userInput = document.getElementById('userInput');
        const chatbotToggle = document.getElementById('chatbotToggle');
        const minimizeBtn = document.getElementById('minimizeBtn');
        const chatbotContainer = document.getElementById('chatbotContainer');

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
                    if (userInput) userInput.focus();
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

    // ===== THIẾT LẬP AUTOCOMPLETE =====
    setupAutocomplete() {
        if (!CONFIG.AUTOCOMPLETE_ENABLED) return;

        const userInput = document.getElementById('userInput');
        const chatMessages = document.getElementById('chatMessages');
        
        if (!userInput) return;

        // Tạo dropdown autocomplete
        const dropdown = document.createElement('div');
        dropdown.id = 'autocomplete-dropdown';
        dropdown.className = 'autocomplete-dropdown';
        dropdown.style.display = 'none';
        
        if (chatMessages) {
            chatMessages.parentElement.appendChild(dropdown);
        }

        userInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            
            if (value.length < 2) {
                dropdown.style.display = 'none';
                return;
            }

            const matches = AUTOCOMPLETE_SUGGESTIONS.filter(suggestion => 
                suggestion.toLowerCase().includes(value)
            ).slice(0, 5);

            if (matches.length > 0) {
                dropdown.innerHTML = matches.map(match => 
                    `<div class="autocomplete-item">${match}</div>`
                ).join('');
                dropdown.style.display = 'block';

                // Xử lý click vào suggestion
                dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                    item.addEventListener('click', () => {
                        userInput.value = item.textContent;
                        dropdown.style.display = 'none';
                        userInput.focus();
                    });
                });
            } else {
                dropdown.style.display = 'none';
            }
        });

        // Ẩn dropdown khi click ra ngoài
        document.addEventListener('click', (e) => {
            if (e.target !== userInput) {
                dropdown.style.display = 'none';
            }
        });
    }

    // ===== GỬI TIN NHẮN =====
    async sendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();

        if (message === '' || this.isLoading) {
            console.log('⚠️ Empty or loading');
            return;
        }

        console.log('💬 Send:', message);

        // Xử lý viết tắt
        const processed = this.expandAbbreviations(message);
        
        // Hiển thị tin nhắn gốc
        this.addMessage(message, 'user');
        
        // Nếu có viết tắt, hiển thị phiên bản đã mở rộng
        /* Xóa hiện thị tôi đã hiểu 
        if (processed.hasAbbreviation && CONFIG.DEBUG) {
            this.addMessage(
                `🔍 Tôi hiểu câu hỏi: "${processed.expanded}"`,
                'bot'
            );
        } */

        userInput.value = '';

        this.isLoading = true;
        const loadingId = this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(processed.expanded);
            this.removeTypingIndicator(loadingId);
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('❌ Error:', error);
            this.removeTypingIndicator(loadingId);
            this.addMessage(
                'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.\n\nHoặc liên hệ: Hotline ' + CONFIG.WEBSITE_INFO.hotline,
                'bot'
            );
        } finally {
            this.isLoading = false;
        }
    }

    // ===== GỌI API GEMINI =====
    async callGeminiAPI(userQuestion) {
        console.log('🚀 Call Gemini API...');
        
        const promptText = `${SYSTEM_PROMPT}\n\nTÀI LIỆU:\n${this.documentContent.substring(0, 30000)}\n\nCÂU HỎI:\n${userQuestion}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: promptText
                }]
            }],
            generationConfig: {
                temperature: CONFIG.TEMPERATURE,
                maxOutputTokens: CONFIG.MAX_TOKENS,
                topP: CONFIG.TOP_P,
                topK: CONFIG.TOP_K
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
            throw new Error(`API Error: ${response.status}`);
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const answer = data.candidates[0].content.parts[0].text;
            console.log('✅ Answer OK');
            return answer;
        }

        throw new Error('No response from API');
    }

    // ===== TÀI LIỆU MẪU =====
    getSampleDocument() {
        return `TÀI LIỆU MẪU - HẢI QUAN LÀO CAI

THỦ TỤC HẢI QUAN TÀU BIỂN
Theo Nghị định 167/2025/NĐ-CP:

1. Thông báo trước
Người khai hải quan phải thông báo trước 24 giờ cho cơ quan hải quan qua Cổng thông tin một cửa quốc gia.

2. Nộp hồ sơ
Hồ sơ gồm:
- Bản khai chung tàu biển
- Manifest (Bản khai hàng hóa)
- Danh sách thuyền viên
- Danh sách hành khách (nếu có)

3. Kiểm tra và thông quan
Cơ quan hải quan phản hồi trong 01 giờ.
Hệ thống phân luồng: Xanh, Vàng, Đỏ.

4. Giám sát dỡ hàng
Hải quan giám sát, kiểm tra niêm phong container.

TRÁCH NHIỆM TRƯỞNG GA ĐƯỜNG SẮT

1. Thông báo thông tin tàu
Thông báo qua mạng máy tính, fax về:
- Số hiệu đầu tàu, toa xe
- Thời gian tàu đến, dừng, rời ga
- Thông tin hàng hóa xuất nhập khẩu

2. Xác nhận chứng từ
Xác nhận và đóng dấu chứng từ do Trưởng tàu nộp.

3. Bố trí kho, bãi
Kho hàng XNK phải tách biệt với hàng nội địa.

4. Phối hợp kiểm tra
Phối hợp với hải quan kiểm tra, giám sát.

Nguồn: Nghị định 167/2025/NĐ-CP về thủ tục hải quan.`;
    }

    // ===== THÊM TIN NHẮN =====
    addMessage(text, sender) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message fade-in`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' 
            ? '<i class="fas fa-robot"></i>' 
            : '<i class="fas fa-user"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        if (sender === 'bot') {
            // Format nâng cao cho bot message
            let formattedText = text
                .replace(/\n\n\n\n/g, '<div class="large-spacing"></div>')
                .replace(/\n\n/g, '<div class="medium-spacing"></div>')
                .replace(/\n/g, '<br>')
                .replace(/^(\d+)\.\s+([^\n<]+)/gm, '<div class="section-title">$1. $2</div>')
                .replace(/(Theo .+? như sau:)/gi, '<div class="intro-sentence">$1</div>')
                .replace(/(Nghị định|Thông tư|Luật|Quyết định|Công văn)\s+(\d+\/\d+\/[A-ZĐ\-]+)/gi, 
                         '<span class="legal-reference">$1 $2</span>')
                .replace(/(Nguồn:.+?)(<div|<br|$)/gi, '<div class="source-line">$1</div>$2')
                // ======== Xóa hightligh các chữ bôi đỏ trong trả lời chatbot
                .replace(/\b(phải|có trách nhiệm|cần|chịu trách nhiệm)\b/gi, 
                         '<span class="responsibility-verb">$1</span>')
                .replace(/([^.]+(?:bao gồm|gồm|như sau|cụ thể):)/gi, 
                         '<div class="list-intro">$1</div>');
            
            content.innerHTML = formattedText;
        } else {
            content.innerHTML = '<p>' + text.replace(/\n/g, '<br>') + '</p>';
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // ===== HIỂN THỊ TYPING INDICATOR =====
    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return null;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.id = 'typing-indicator';
        loadingDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        
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
        loadingDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content"><p>${text}</p></div>
        `;
        chatMessages.appendChild(loadingDiv);
    }

    removeLoadingMessage() {
        const loading = document.getElementById('document-loading');
        if (loading) loading.remove();
    }
}

// ===== KHỞI ĐỘNG CHATBOT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Ready');
    console.log('📋 CONFIG:', typeof CONFIG !== 'undefined' ? 'OK' : 'MISSING');
    
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG not found! Check config.js');
        alert('Lỗi: File config.js chưa load. Vui lòng kiểm tra thứ tự import script.');
        return;
    }
    
    window.chatbot = new ChatbotAI();
    console.log('✅ Chatbot initialized successfully');
});

console.log('✅ Script.js loaded - Version Stable');
// ===== SỰ KIỆN NÚT "BẮT ĐẦU CHAT NGAY" =====
document.addEventListener('DOMContentLoaded', function() {
    const openChatBtn = document.getElementById('openChatBtn');
    const chatbotToggle = document.getElementById('chatbotToggle');
    
    if (openChatBtn && chatbotToggle) {
        openChatBtn.addEventListener('click', () => {
            chatbotToggle.click(); // Kích hoạt nút mở chatbot
        });
    }
});
