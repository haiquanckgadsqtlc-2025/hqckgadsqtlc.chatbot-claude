// ===== GOOGLE GEMINI CHATBOT AI - VERSION 2.0 =====

class ChatbotAI {
    constructor() {
        this.apiKey = CONFIG.GEMINI_API_KEY;
        this.modelName = CONFIG.MODEL_NAME;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + this.modelName + ':generateContent?key=' + this.apiKey;
        this.documentContent = '';
        this.isLoading = false;
        this.requestCount = 0;
        
        this.init();
    }

    async init() {
        this.log('🚀 Khởi động Chatbot AI với model: ' + this.modelName);
        await this.loadDocuments();
        this.setupEventListeners();
        this.log('✅ Chatbot sẵn sàng!');
    }

    log(message, data) {
        if (CONFIG.DEBUG) {
            if (data) {
                console.log(message, data);
            } else {
                console.log(message);
            }
        }
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
                    this.log('📄 Đang tải: ' + file);
                    const response = await fetch(file);
                    
                    if (response.ok) {
                        const text = await response.text();
                        allContent += '\n\n===== FILE: ' + file + ' =====\n' + text;
                        loadedFiles++;
                        this.log('✅ Đã tải: ' + file + ' (' + text.length + ' ký tự)');
                    } else {
                        this.log('⚠️ Không tải được: ' + file + ' (HTTP ' + response.status + ')');
                    }
                } catch (error) {
                    this.log('⚠️ Lỗi khi tải ' + file, error);
                }
            }

            // Nếu không load được file nào, dùng tài liệu mẫu
            if (loadedFiles === 0) {
                this.log('⚠️ Không load được file nào, dùng tài liệu mẫu');
                allContent = this.getSampleDocument();
                this.addMessage('⚠️ Cảnh báo: Đang sử dụng tài liệu mẫu do không tải được file gốc.', 'bot');
            }

            this.documentContent = allContent;
            this.removeLoadingMessage();
            
            this.log('✅ Tổng kết: Đã tải ' + loadedFiles + '/' + files.length + ' tài liệu');
            this.log('📊 Tổng dung lượng: ' + this.documentContent.length + ' ký tự');
            
        } catch (error) {
            this.log('❌ Lỗi nghiêm trọng khi load tài liệu', error);
            this.documentContent = this.getSampleDocument();
            this.removeLoadingMessage();
            this.addMessage('❌ Không thể tải tài liệu. Đang sử dụng dữ liệu mẫu.', 'bot');
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

        this.log('💬 Người dùng hỏi: ' + message);
        this.addMessage(message, 'user');
        userInput.value = '';

        this.isLoading = true;
        this.requestCount++;
        const loadingId = this.showTypingIndicator();

        try {
            this.log('🔄 Bắt đầu xử lý request #' + this.requestCount);
            
            // Kiểm tra tài liệu
            if (!this.documentContent || this.documentContent.length < 100) {
                throw new Error('Tài liệu chưa được tải hoặc quá ngắn');
            }
            
            const response = await this.callGeminiAPI(message);
            
            this.removeTypingIndicator(loadingId);
            this.log('✅ Đã nhận câu trả lời');
            this.addMessage(response, 'bot');
            
        } catch (error) {
            this.log('❌ Lỗi khi xử lý:', error);
            this.removeTypingIndicator(loadingId);
            
            // Hiển thị lỗi chi tiết cho người dùng
            let errorMessage = '❌ Xin lỗi, đã có lỗi xảy ra.\n\n';
            
            if (error.message.includes('API key')) {
                errorMessage += '🔑 Lỗi API Key: Vui lòng kiểm tra lại API key trong file config.js\n\n';
                errorMessage += 'Hướng dẫn:\n';
                errorMessage += '1. Truy cập: https://aistudio.google.com\n';
                errorMessage += '2. Click "Get API key"\n';
                errorMessage += '3. Copy API key mới\n';
                errorMessage += '4. Dán vào file config.js';
            } else if (error.message.includes('Tài liệu')) {
                errorMessage += '📄 Lỗi tài liệu: ' + error.message + '\n\n';
                errorMessage += 'Vui lòng kiểm tra thư mục data/ trên GitHub.';
            } else if (error.message.includes('429')) {
                errorMessage += '⏳ Đã vượt giới hạn request. Vui lòng đợi 1 phút rồi thử lại.';
            } else {
                errorMessage += 'Chi tiết lỗi: ' + error.message + '\n\n';
                errorMessage += 'Vui lòng liên hệ:\n';
                errorMessage += '📞 Hotline: ' + CONFIG.WEBSITE_INFO.hotline + '\n';
                errorMessage += '📧 Email: ' + CONFIG.WEBSITE_INFO.email;
            }
            
            this.addMessage(errorMessage, 'bot');
            
        } finally {
            this.isLoading = false;
        }
    }

    async callGeminiAPI(userQuestion) {
        const maxRetries = 2;
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                this.log('🚀 API Call - Lần thử ' + (attempt + 1) + '/' + maxRetries);
                
                // Tạo prompt
                const promptText = SYSTEM_PROMPT + 
                    '\n\n===== TÀI LIỆU THAM KHẢO =====\n' + 
                    this.documentContent.substring(0, 40000) + 
                    '\n\n===== CÂU HỎI CỦA NGƯỜI DÙNG =====\n' + 
                    userQuestion + 
                    '\n\n===== HÃY TRẢ LỜI =====';

                const requestBody = {
                    contents: [{
                        parts: [{
                            text: promptText
                        }]
                    }],
                    generationConfig: {
                        temperature: CONFIG.TEMPERATURE,
                        maxOutputTokens: CONFIG.MAX_TOKENS,
                        topP: CONFIG.TOP_P || 0.8,
                        topK: CONFIG.TOP_K || 40
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

                this.log('📤 Gửi request đến Gemini API...');
                this.log('🔗 URL: ' + this.apiUrl);
                this.log('📏 Độ dài prompt: ' + promptText.length + ' ký tự');

                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                this.log('📥 Nhận response - Status: ' + response.status);

                // Đọc response
                const data = await response.json();
                this.log('📦 Response data:', data);

                // Xử lý lỗi HTTP
                if (!response.ok) {
                    if (response.status === 400) {
                        if (data.error && data.error.message) {
                            if (data.error.message.includes('API key')) {
                                throw new Error('API key không hợp lệ hoặc đã hết hạn. Vui lòng tạo API key mới tại https://aistudio.google.com');
                            }
                            throw new Error('Lỗi API (400): ' + data.error.message);
                        }
                    } else if (response.status === 429) {
                        throw new Error('Vượt giới hạn request (429). Vui lòng đợi 1 phút.');
                    } else if (response.status === 403) {
                        throw new Error('API key không có quyền truy cập (403). Kiểm tra lại API key.');
                    } else if (response.status === 404) {
                        throw new Error('Model không tồn tại (404). Kiểm tra lại MODEL_NAME trong config.js');
                    }
                    
                    throw new Error('HTTP Error ' + response.status + ': ' + JSON.stringify(data));
                }

                // Lấy câu trả lời
                if (data.candidates && data.candidates.length > 0) {
                    const candidate = data.candidates[0];
                    
                    // Kiểm tra bị block
                    if (candidate.finishReason === 'SAFETY') {
                        this.log('⚠️ Nội dung bị chặn bởi safety filter');
                        return 'Xin lỗi, câu hỏi của bạn chứa nội dung không phù hợp theo chính sách an toàn. Vui lòng đặt câu hỏi khác.';
                    }
                    
                    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                        const answer = candidate.content.parts[0].text;
                        this.log('✅ Câu trả lời: ' + answer.substring(0, 100) + '...');
                        return answer;
                    }
                }

                // Không có câu trả lời hợp lệ
                this.log('⚠️ Response không chứa câu trả lời hợp lệ');
                throw new Error('API không trả về câu trả lời. Response: ' + JSON.stringify(data));

            } catch (error) {
                this.log('❌ Lỗi lần thử ' + (attempt + 1), error);
                lastError = error;
                
                // Retry với delay
                if (attempt < maxRetries - 1) {
                    const delay = 2000 * (attempt + 1);
                    this.log('⏳ Đợi ' + delay + 'ms trước khi thử lại...');
                    await this.sleep(delay);
                }
            }
        }

        // Hết retry, throw error
        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getSampleDocument() {
        return `===== TÀI LIỆU HẢI QUAN MẪU =====

CHƯƠNG 1: GIÁM SÁT TÀU BIỂN

Điều 1: Thủ tục giám sát tàu biển
Khi tàu biển cập cảng Việt Nam, cần thực hiện:

1. Thông báo trước cho hải quan cảng biển (24 giờ trước khi đến)
2. Nộp hồ sơ:
   - Manifest (bản kê hàng hóa)
   - Danh sách thuyền viên
   - Giấy tờ tàu (đăng ký, đăng kiểm)
   - Tờ khai hàng hóa
   
3. Kiểm tra hải quan:
   - Kiểm tra niêm phong container
   - Đối chiếu manifest với hàng thực tế
   - Kiểm tra hàng nguy hiểm (nếu có)
   - Quét X-ray container (nếu cần)
   
4. Giám sát dỡ hàng:
   - Hải quan giám sát toàn bộ quá trình
   - Kiểm tra số lượng, trọng lượng
   - Niêm phong lại container sau kiểm tra
   
5. Thời gian xử lý: 4-8 giờ/tàu

Điều 2: Hàng nguy hiểm trên tàu biển
- Phải khai báo chi tiết loại hóa chất
- Xuất trình MSDS (phiếu an toàn)
- Kiểm tra 100% container chứa hàng nguy hiểm
- Giám sát suốt quá trình vận chuyển từ cảng đến kho

CHƯƠNG 2: TRÁCH NHIỆM DOANH NGHIỆP CẢNG HÀNG KHÔNG

Điều 3: Nghĩa vụ của DN kinh doanh cảng hàng không

Theo Luật Hàng không 2020 và Nghị định 92/2021/NĐ-CP:

1. VỀ CƠ SỞ VẬT CHẤT:
   - Đảm bảo khu vực giám sát hải quan đạt chuẩn
   - Lắp đặt camera quan sát 24/7
   - Có kho hàng nguy hiểm riêng biệt
   - Hệ thống soi chiếu X-ray, máy dò kim loại

2. VỀ GIÁM SÁT HÀNG HÓA:
   - Phối hợp với hải quan kiểm tra hàng xuất nhập khẩu
   - Cung cấp thông tin hàng hóa theo yêu cầu
   - Báo cáo ngay hàng hóa bất thường
   - Lưu trữ hồ sơ tối thiểu 5 năm

3. VỀ AN NINH:
   - Kiểm tra an ninh 100% hành khách, hành lý
   - Kiểm soát người ra vào khu vực hạn chế
   - Đào tạo nhân viên về an ninh hàng không
   - Có kế hoạch ứng phó sự cố

4. VỀ BÁO CÁO:
   - Báo cáo định kỳ cho Cục Hàng không
   - Thông báo sự cố trong vòng 2 giờ
   - Cung cấp số liệu thống kê khi có yêu cầu

5. TRÁCH NHIỆM VỚI HẢI QUAN:
   - Bố trí văn phòng làm việc cho hải quan
   - Hỗ trợ kiểm tra hàng hóa 24/7
   - Cung cấp thông tin chuyến bay, hàng hóa
   - Giám sát hàng quá cảnh

6. XỬ PHẠT KHI VI PHẠM:
   - Cảnh cáo đến thu hồi giấy phép
   - Phạt tiền từ 50-200 triệu đồng
   - Đình chỉ hoạt động (vi phạm nghiêm trọng)

CHƯƠNG 3: QUY TRÌNH CHUNG

Điều 4: Nguyên tắc giám sát
- Hải quan có quyền kiểm tra bất kỳ lúc nào
- Doanh nghiệp phải tạo điều kiện thuận lợi
- Mọi thông tin phải cung cấp trung thực
- Thời gian xử lý: Theo quy định từng loại hình

Điều 5: Hồ sơ chung
1. Tờ khai hải quan (điện tử hoặc giấy)
2. Hợp đồng, hóa đơn
3. Vận đơn (B/L, AWB...)
4. Giấy phép (nếu hàng cần phép)
5. Chứng từ nguồn gốc

Liên hệ: Hải quan Lào Cai
📞 Hotline: 024.xxxx.xxxx
📧 Email: haiquan@laocai.gov.vn`;
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
    
    // Format text nâng cao
    let formattedText = text
        // Xuống dòng
        .replace(/\n/g, '<br>')
        
        // Tiêu đề mục (số + dấu chấm + tiêu đề)
        .replace(/(\d+)\.\s*([^\n]+)/g, '<br><strong>$1. $2</strong>')
        
        // Văn bản pháp lý
        .replace(/(Nghị định|Thông tư|Luật|Quyết định|Công văn)\s+(\d+\/\d+\/[A-Z\-]+)/g, '<strong>$1 $2</strong>')
        
        // Điều khoản
        .replace(/(Điều|Khoản|Mục)\s+(\d+)/g, '<strong>$1 $2</strong>')
        
        // Thời gian
        .replace(/(\d+)\s*(giờ|ngày|tháng|năm)/g, '<strong>$1 $2</strong>')
        
        // Icon
        .replace(/📞/g, '<i class="fas fa-phone"></i>')
        .replace(/📧/g, '<i class="fas fa-envelope"></i>')
        .replace(/⏰/g, '<i class="fas fa-clock"></i>')
        .replace(/✅/g, '<i class="fas fa-check-circle" style="color: green;"></i>')
        .replace(/❌/g, '<i class="fas fa-times-circle" style="color: red;"></i>')
        .replace(/⚠️/g, '<i class="fas fa-exclamation-triangle" style="color: orange;"></i>')
        
        // Dấu gạch đầu dòng
        .replace(/^- (.+)/gm, '<br>• $1')
        .replace(/\n- (.+)/g, '<br>• $1');
    
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

// Khởi động chatbot
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Bắt đầu khởi động Chatbot AI...');
    console.log('📋 Model: ' + CONFIG.MODEL_NAME);
    console.log('🔑 API Key: ' + CONFIG.GEMINI_API_KEY.substring(0, 20) + '...');
    
    window.chatbot = new ChatbotAI();
});

