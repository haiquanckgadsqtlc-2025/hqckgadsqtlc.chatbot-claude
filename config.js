// ===== CẤU HÌNH GOOGLE GEMINI =====
const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyDm8TxOTHRWL_THAY_API_KEY_CUA_BAN',
    MODEL_NAME: 'gemini-1.5-flash-latest',
    TEMPERATURE: 0.2,
    MAX_TOKENS: 2048,
    TOP_P: 0.8,
    TOP_K: 40,
    WEBSITE_INFO: {
        title: 'HẢI QUAN LÀO CAI',
        hotline: '024.xxxx.xxxx',
        email: 'haiquan@laocai.gov.vn'
    },
    DEBUG: true
};

const SYSTEM_PROMPT = 'Bạn là trợ lý AI chuyên nghiệp của Hải quan Lào Cai. Trả lời câu hỏi dựa trên tài liệu được cung cấp. Format trả lời: Mở đầu bằng văn bản pháp lý, liệt kê theo số thứ tự 1, 2, 3, giải thích chi tiết mỗi bước, kết thúc bằng gợi ý liên hệ.';

console.log('✅ Config.js loaded successfully');
