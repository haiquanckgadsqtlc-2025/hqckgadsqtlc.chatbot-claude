// ===== GOOGLE GEMINI CHATBOT AI =====

class ChatbotAI {
    constructor() {
        this.apiKey = CONFIG.GEMINI_API_KEY;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.MODEL_NAME + ':generateContent?key=' + this.apiKey;
        this.conversationHistory = [];
        this.documentContent = '';
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        await this.loadDocuments();
        this.setupEventListeners();
    }

    async loadDocuments() {
        try {
            this.showLoadingMessage('Đang tải tài liệu hải quan...');

            const files = [
                'data/chi_muc.txt',
                'data/tai_lieu_1.txt',
                'data/tai_lieu_2.txt',
                'data/tai_lieu_3.txt'
            ];

            let allContent = '';
            let loadedFiles = 0;
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    const response = await fetch(file);
                    if (response.ok) {
                        const text = await response.text();
                        allContent += text + '\n\n';
                        loadedFiles++;
                        console.log('✅ Đã tải: ' + file);
                    } else {
                        console.warn('⚠️ Không tải được: ' + file);
                    }
                } catch (error) {
                    console.warn('⚠️ Lỗi khi tải ' + file + ':', error);
                }
            }

            if (loadedFiles === 0) {
                console.warn('⚠️ Không load được file nào, dùng tài liệu mẫu');
                allContent = this.getSampleDocument();
            }

            this.documentContent = allContent;
            this.removeLoadingMessage();
            
            console.log('✅ Đã tải ' + loadedFiles + '/4 tài liệu, tổng ' + this.documentContent.length + ' ký tự');
            
        } catch (error) {
            console.error('❌ Lỗi load tài liệu:', error);
            this.documentContent = this.getSampleDocument();
            this.removeLoadingMessage();
        }
    }

    setupEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const userInput = document.getElementById('userInput');
        const chatbotToggle = document.getElementById('chatbotToggle');
        const minimizeBtn = document.getElementById('minimizeBtn');
        const chatbotContainer = document.getElementById('chatbotContainer');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isLoading) {
                    this.sendMessage();
                }
            });
        }

        if (chatbotToggle && chatbotContainer) {
            chatbotToggle.addEventListener('click', () => {
                chatbotContainer.classList.add('active');
                chatbotToggle.classList.add('hidden');
                if (userInput) userInput.focus();
            });
        }

        if (minimizeBtn && chatbotContainer && chatbotToggle) {
            minimizeBtn.addEventListener('click', () => {
                chatbotContainer.classList.remove('active');
                chatbotToggle.classList.remove('hidden');
            });
        }
    }

    async sendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();

        if (message === '' || this.isLoading) return;

        this.addMessage(message, 'user');
        userInput.value = '';

        this.isLoading = true;
        const loadingId = this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message);
            this.removeTypingIndicator(loadingId);
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('❌ Lỗi:', error);
            this.removeTypingIndicator(loadingId);
            const fallbackResponse = this.getFallbackResponse(message);
            this.addMessage(fallbackResponse, 'bot');
        } finally {
            this.isLoading = false;
        }
    }

    async callGeminiAPI(userQuestion) {
        const maxRetries = 3;
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const promptText = SYSTEM_PROMPT + '\n\n===== TÀI LIỆU THAM KHẢO =====\n' + 
                    this.documentContent.substring(0, 30000) + 
                    '\n\n===== CÂU HỎI CỦA NGƯỜI DÙNG =====\n' + 
                    userQuestion + 
                    '\n\n===== TRẢ LỜI =====';

                const requestBody = {
                    contents: [{
                        parts: [{
                            text: promptText
                        }]
                    }],
                    generationConfig: {
                        temperature: CONFIG.TEMPERATURE,
                        maxOutputTokens: CONFIG.MAX_TOKENS
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_NONE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_NONE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_NONE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_NONE"
                        }
                    ]
                };

                console.log('🚀 Đang gọi Gemini API... (lần thử: ' + (i + 1) + ')');

                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error('❌ API Error:', response.status, data);
                    
                    if (response.status === 429) {
                        console.log('⏳ Rate limit, đợi ' + (2000 * (i + 1)) + ' ms...');
                        await this.sleep(2000 * (i + 1));
                        continue;
                    }
                    
                    if (response.status === 400 && data.error && data.error.message && data.error.message.includes('API key')) {
                        throw new Error('API key không hợp lệ. Vui lòng kiểm tra lại config.js');
                    }
                    
                    throw new Error('API Error: ' + response.status);
                }

                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    const answer = data.candidates[0].content.parts[0].text;
                    console.log('✅ Nhận được câu trả lời');
                    return answer;
                } else if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
                    console.warn('⚠️ Content bị block:', data.candidates[0].finishReason);
                    return this.getFallbackResponse(userQuestion);
                } else {
                    throw new Error('Không nhận được phản hồi từ AI');
                }

            } catch (error) {
                console.error('❌ Lỗi lần thử ' + (i + 1) + ':', error);
                lastError = error;
                
                if (i < maxRetries - 1) {
                    console.log('🔄 Thử lại...');
                    await this.sleep(1000 * (i + 1));
                }
            }
        }

        console.error('❌ Đã thử ' + maxRetries + ' lần nhưng vẫn lỗi');
        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getFallbackResponse(question) {
        const lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.includes('qua canh') || lowerQuestion.includes('quá cảnh')) {
            return 'Thủ tục giám sát hàng quá cảnh:\n\n1. Khai báo hải quan tại cửa khẩu nhập\n2. Niêm phong hàng hóa bởi cán bộ hải quan\n3. Vận chuyển theo tuyến đường quy định\n4. Giám sát GPS (nếu yêu cầu)\n5. Làm thủ tục xuất tại cửa khẩu biên giới\n\nHồ sơ cần:\n• Tờ khai hàng hóa quá cảnh\n• Vận đơn quốc tế\n• Hợp đồng vận chuyển\n• Danh mục hàng hóa chi tiết\n\nThời gian: Tối đa 15 ngày quá cảnh\n\nLiên hệ: 024.xxxx.xxxx để được hỗ trợ chi tiết.';
        }
        
        if (lowerQuestion.includes('phan bon') || lowerQuestion.includes('phân bón')) {
            return 'Thủ tục hải quan phân bón:\n\nTheo Thông tư 38/2015/TT-BTC:\n\n1. Nộp tờ khai hải quan điện tử\n2. Xuất trình giấy phép nhập khẩu (Bộ NN&PTNT)\n3. Kiểm tra chất lượng tại cửa khẩu\n4. Lấy mẫu kiểm nghiệm (lô hàng đầu)\n\nThời gian: 2-3 ngày làm việc\n\nHotline: 024.xxxx.xxxx\nEmail: haiquan@laocai.gov.vn';
        }

        if (lowerQuestion.includes('phot pho') || lowerQuestion.includes('hoa chat') || lowerQuestion.includes('hóa chất')) {
            return 'Thủ tục hải quan hóa chất/phot pho:\n\n⚠️ Hàng nguy hiểm - kiểm soát đặc biệt\n\nGiấy tờ bắt buộc:\n1. Giấy phép nhập khẩu hóa chất (Bộ Công Thương)\n2. Phiếu an toàn hóa chất (MSDS)\n3. Giấy phép vận chuyển hóa chất nguy hiểm\n4. Bảo hiểm trách nhiệm dân sự\n\nKiểm tra: 100% lô hàng\nThời gian: 5-7 ngày làm việc\n\nLiên hệ ngay: 024.xxxx.xxxx';
        }

        if (lowerQuestion.includes('duong sat') || lowerQuestion.includes('đường sắt') || lowerQuestion.includes('ga')) {
            return 'Giám sát hàng hóa đường sắt quốc tế:\n\nQuy trình:\n1. Thông báo trước 24 giờ khi tàu đến\n2. Kiểm tra niêm phong tại biên giới\n3. Giám sát dỡ/xếp hàng tại ga\n4. Kiểm tra vận đơn quốc tế\n5. Xác nhận xuất cảnh\n\nThời gian kiểm tra: 2-4 giờ/chuyến\n\nLiên hệ: 024.xxxx.xxxx';
        }

        return 'Xin lỗi, hiện hệ thống AI tạm thời gặp sự cố kỹ thuật.\n\nBạn có thể:\n1. Thử hỏi lại với câu ngắn gọn hơn\n2. Liên hệ trực tiếp:\n   📞 Hotline: 024.xxxx.xxxx\n   📧 Email: haiquan@laocai.gov.vn\n   ⏰ Giờ làm việc: T2-T6, 7:30-17:00\n\nMột số câu hỏi mẫu:\n• "Thủ tục nhập khẩu phân bón"\n• "Giấy phép cần thiết"\n• "Quy trình quá cảnh hàng hóa"\n• "Thời gian xử lý hồ sơ"';
    }

    getSampleDocument() {
        const doc = 'TÀI LIỆU HẢI QUAN LÀO CAI\n\n' +
            'CHƯƠNG 1: THỦ TỤC GIÁM SÁT HÀNG QUÁ CẢNH\n\n' +
            'Điều 1: Định nghĩa\n' +
            'Hàng hóa quá cảnh là hàng hóa được vận chuyển qua lãnh thổ Việt Nam từ cửa khẩu nhập đến cửa khẩu xuất mà không thực hiện hoạt động thương mại tại Việt Nam.\n\n' +
            'Điều 2: Thủ tục hải quan hàng quá cảnh\n' +
            '1. Khai báo hải quan tại cửa khẩu nhập\n' +
            '2. Niêm phong hàng hóa bởi cán bộ hải quan\n' +
            '3. Vận chuyển theo tuyến đường quy định\n' +
            '4. Giám sát bằng GPS (nếu yêu cầu)\n' +
            '5. Làm thủ tục xuất tại cửa khẩu biên giới\n\n' +
            'Điều 3: Hồ sơ cần thiết\n' +
            '- Tờ khai hàng hóa quá cảnh\n' +
            '- Vận đơn quốc tế\n' +
            '- Hợp đồng vận chuyển\n' +
            '- Danh mục hàng hóa chi tiết\n\n' +
            'Điều 4: Thời gian xử lý\n' +
            '- Kiểm tra hồ sơ: 30 phút\n' +
            '- Niêm phong: 1-2 giờ\n' +
            '- Thời gian quá cảnh tối đa: 15 ngày\n\n' +
            'CHƯƠNG 2: THỦ TỤC HẢI QUAN PHÂN BÓN\n\n' +
            'Điều 5: Quy định chung\n' +
            'Phân bón thuộc danh mục hàng hóa cần giấy phép nhập khẩu theo Thông tư 38/2015/TT-BTC.\n\n' +
            'Điều 6: Hồ sơ\n' +
            '1. Tờ khai hải quan điện tử\n' +
            '2. Giấy phép nhập khẩu từ Bộ NN&PTNT\n' +
            '3. Hợp đồng mua bán\n' +
            '4. Hóa đơn thương mại\n' +
            '5. Giấy chứng nhận chất lượng\n\n' +
            'Điều 7: Thời gian\n' +
            '- Hồ sơ đầy đủ: 2-3 ngày làm việc\n' +
            '- Cần kiểm nghiệm: 5-7 ngày làm việc\n\n' +
            'CHƯƠNG 3: THỦ TỤC HẢI QUAN HÓA CHẤT\n\n' +
            'Điều 8: Phân loại\n' +
            'Phot pho thuộc danh mục hóa chất nguy hiểm cần kiểm soát đặc biệt.\n\n' +
            'Điều 9: Giấy tờ bắt buộc\n' +
            '1. Giấy phép nhập khẩu hóa chất\n' +
            '2. Phiếu an toàn hóa chất (MSDS)\n' +
            '3. Giấy phép vận chuyển\n' +
            '4. Bảo hiểm trách nhiệm dân sự\n\n' +
            'Điều 10: Kiểm tra\n' +
            '- 100% lô hàng phải kiểm tra thực tế\n' +
            '- Thời gian: 5-7 ngày làm việc\n\n' +
            'CHƯƠNG 4: GIÁM SÁT ĐƯỜNG SẮT\n\n' +
            'Điều 11: Quy trình\n' +
            '1. Thông báo trước 24 giờ\n' +
            '2. Kiểm tra niêm phong tại biên giới\n' +
            '3. Giám sát dỡ/xếp hàng\n' +
            '4. Kiểm tra vận đơn quốc tế\n' +
            '5. Xác nhận xuất cảnh\n\n' +
            'Điều 12: Thời gian\n' +
            '- Kiểm tra: 2-4 giờ/chuyến\n' +
            '- Xử lý hồ sơ: 1 ngày làm việc';
        
        return doc;
    }

    addMessage(text, sender) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ' + sender + '-message fade-in';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' 
            ? '<i class="fas fa-robot"></i>' 
            : '<i class="fas fa-user"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        let formattedText = text.replace(/\n/g, '<br>');
        content.innerHTML = '<p>' + formattedText + '</p>';
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return null;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.id = 'typing-indicator';
        
        loadingDiv.innerHTML = '<div class="message-avatar"><i class="fas fa-robot"></i></div>' +
            '<div class="message-content typing-indicator">' +
            '<span></span><span></span><span></span></div>';
        
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return 'typing-indicator';
    }

    removeTypingIndicator(id) {
        if (!id) return;
        const indicator = document.getElementById(id);
        if (indicator) {
            indicator.remove();
        }
    }

    showLoadingMessage(text) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'document-loading';
        loadingDiv.className = 'message bot-message';
        loadingDiv.innerHTML = '<div class="message-avatar"><i class="fas fa-robot"></i></div>' +
            '<div class="message-content"><p><i class="fas fa-spinner fa-spin"></i> ' + text + '</p></div>';
        chatMessages.appendChild(loadingDiv);
    }

    removeLoadingMessage() {
        const loading = document.getElementById('document-loading');
        if (loading) {
            loading.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Khởi động Chatbot AI...');
    window.chatbot = new ChatbotAI();
});
