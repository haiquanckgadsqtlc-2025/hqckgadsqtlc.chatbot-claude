// ===== CẤU HÌNH GOOGLE GEMINI =====
const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyDIGiAT12zb2koOjATIJj6wvVDrCuHCd7I',
    MODEL_NAME: 'gemini-flash-latest',
    TEMPERATURE: 0.6,
    MAX_TOKENS: 3072,
    TOP_P: 0.8,
    TOP_K: 40,
    WEBSITE_INFO: {
        title: 'HẢI QUAN LÀO CAI',
        hotline: '024.xxxx.xxxx',
        email: 'haiquan@laocai.gov.vn'
    },
    DEBUG: true
};
// ===== TỪ ĐIỂN LỖI CHÍNH TẢ THƯỜNG GẶP =====
const SPELL_CORRECTIONS = {
    'chinh': 'chính',
    'sach': 'sách',
    'tuc': 'tục',
    'quan': 'quan',  // để nguyên nếu đúng
    'qua': 'quá',    // context-aware
    'canh': 'cảnh',
    'cang': 'cảng',
    'duong': 'đường',
    'sat': 'sắt',
    'truong': 'trưởng',
    'thue': 'thuế',
    'kiem': 'kiểm',
    'giam': 'giám',
    'niem': 'niêm',
    'phong': 'phong',
    'van': 'vận',
    'chuyen': 'chuyển',
    'tai': 'tải',
    'nhap': 'nhập',
    'xuat': 'xuất',
    'khau': 'khẩu'
};

// ===== TỪ ĐIỂN CỤM TỪ VIẾT TẮT (Ưu tiên cao nhất) =====
const PHRASE_ABBREVIATIONS = {
    // Từ câu hỏi thực tế của bạn
    'tt hq': 'thủ tục hải quan',
    'tthq': 'thủ tục hải quan',
    'hs hq': 'hồ sơ hải quan',
    'hshq': 'hồ sơ hải quan',
    'gs hq': 'giám sát hải quan',
    'gshq': 'giám sát hải quan',
    'kt hq': 'kiểm tra hải quan',
    'kthq': 'kiểm tra hải quan',
    'cq hq': 'cơ quan hải quan',
    'cqhq': 'cơ quan hải quan',
    
    // Hàng hóa
    'hh xnk': 'hàng hóa xuất nhập khẩu',
    'hh nk': 'hàng hóa nhập khẩu',
    'hh xk': 'hàng hóa xuất khẩu',
    'hh qc': 'hàng hóa quá cảnh',
    'hh gia cong': 'hàng hóa gia công',
    'hh gc': 'hàng hóa gia công',
    'hh vcdl': 'hàng hóa vận chuyển dọc đường',
    'hh sxxk': 'hàng hóa sản xuất xuất khẩu',
    
    // Doanh nghiệp
    'dn xnk': 'doanh nghiệp xuất nhập khẩu',
    'dn cx': 'doanh nghiệp chế xuất',
    'dncx': 'doanh nghiệp chế xuất',
    'dn uu tien': 'doanh nghiệp ưu tiên',
    'dn cb': 'doanh nghiệp cảng biển',
    
    // Chính sách
    'cs xnk': 'chính sách xuất nhập khẩu',
    'cs hq': 'chính sách hải quan',
    'cs tv gia': 'chính sách tham vấn giá',
    
    // Thủ tục đặc biệt
    'tt gs hq': 'thủ tục giám sát hải quan',
    'tt xnc': 'thủ tục xuất nhập cảnh',
    'tt qc': 'thủ tục quá cảnh',
    
    // Văn bản
    'nd 167': 'nghị định 167',
    'tt 167': 'thông tư 167',
    'tt167': 'thông tư 167',
    
    // Vận tải
    'vc dl': 'vận chuyển dọc đường',
    'vcdl': 'vận chuyển dọc đường',
    'vc nd': 'vận chuyển nội địa',
    'vc qt': 'vận chuyển quốc tế',
    
    // Loại hình
    'tn tx': 'trong nước tạm xuất',
    'tn-tx': 'trong nước tạm xuất',
    'sx xk': 'sản xuất xuất khẩu',
    'sxxk': 'sản xuất xuất khẩu'
};

// ===== TỪ ĐIỂN TỪ ĐƠN (Ưu tiên thứ 2) =====
const WORD_ABBREVIATIONS = {
    // Cơ bản
    'hq': 'hải quan',
    'xnk': 'xuất nhập khẩu',
    'nk': 'nhập khẩu',
    'xk': 'xuất khẩu',
    'hh': 'hàng hóa',
    'hs': 'hồ sơ',
    'tk': 'tờ khai',
    'gt': 'giấy tờ',
    'pt': 'phương tiện',
    
    // Thủ tục - Thông tư (đa nghĩa)
    'tt': ['thủ tục', 'thông tư'],
    
    // Giám sát & Kiểm tra
    'gs': 'giám sát',
    'kt': 'kiểm tra',
    'tc': 'thông quan',
    'qc': 'quá cảnh',
    'ct': 'chuyển tải',
    'np': 'niêm phong',
    
    // Cơ quan & Cán bộ
    'cq': 'cơ quan',
    'cb': ['cán bộ', 'cảng biển'],
    
    // Doanh nghiệp & Cơ sở
    'dn': 'doanh nghiệp',
    'cs': 'cơ sở',
    'cx': 'chế xuất',
    'dncx': 'doanh nghiệp chế xuất',
    
    // Vận tải
    'vc': 'vận chuyển',
    'vt': 'vận tải',
    'tb': 'tàu biển',
    'mb': 'máy bay',
    'xt': 'xe tải',
    'ds': 'đường sắt',
    'dsat': 'đường sắt',
    'ck': 'cửa khẩu',
    
    // Xuất nhập cảnh
    'xnc': 'xuất nhập cảnh',
    
    // Văn bản
    'nd': 'nghị định',
    'nđ': 'nghị định',
    'qd': 'quyết định',
    'cv': 'công văn',
    'vb': 'văn bản',
    
    // Loại hàng
    'pb': 'phân bón',
    'hc': 'hóa chất',
    'pp': 'phot pho',
    'gc': 'gia công',
    
    // Khác
    'dl': 'dọc đường',
    'nd': 'nội địa',
    'qt': 'quốc tế',
    'ut': 'ưu tiên',
    'tv': 'tham vấn',
    'sx': 'sản xuất',
    'tn': 'trong nước',
    'tx': 'tạm xuất'
};

// ===== NGUYÊN TẮC NGỮ CẢNH =====
const CONTEXT_RULES = {
    'tt': {
        'thủ tục': ['hq', 'hải quan', 'xnk', 'đối với', 'hh', 'hàng hóa', 'gs', 'giám sát'],
        'thông tư': ['số', '/', 'quy định', 'về', '167', '38']
    },
    'cb': {
        'cán bộ': ['hải quan', 'kiểm tra', 'giám sát', 'hq'],
        'cảng biển': ['doanh nghiệp', 'dn', 'quy định']
    },
    'cs': {
        'cơ sở': ['sản xuất', 'kinh doanh', 'kho', 'bãi'],
        'chính sách': ['xnk', 'hải quan', 'ưu tiên']
    }
};

// ===== TỪ ĐỒNG NGHĨA (Không dấu) =====
const SYNONYMS = {
    'thu tuc': 'thủ tục',
    'thutuc': 'thủ tục',
    'ho so': 'hồ sơ',
    'hoso': 'hồ sơ',
    'hang hoa': 'hàng hóa',
    'hanghoa': 'hàng hóa',
    'hai quan': 'hải quan',
    'haiquan': 'hải quan',
    'xuat nhap khau': 'xuất nhập khẩu',
    'xuatnhapkhau': 'xuất nhập khẩu',
    'nhap khau': 'nhập khẩu',
    'nhapkhau': 'nhập khẩu',
    'xuat khau': 'xuất khẩu',
    'xuatkhau': 'xuất khẩu',
    'co quan': 'cơ quan',
    'coquan': 'cơ quan',
    'doanh nghiep': 'doanh nghiệp',
    'doanhnghiep': 'doanh nghiệp',
    'che xuat': 'chế xuất',
    'chexuat': 'chế xuất',
    'giam sat': 'giám sát',
    'giamsat': 'giám sát',
    'kiem tra': 'kiểm tra',
    'kiemtra': 'kiểm tra',
    'van chuyen': 'vận chuyển',
    'vanchuyen': 'vận chuyển',
    'duong sat': 'đường sắt',
    'duongsat': 'đường sắt',
    'cua khau': 'cửa khẩu',
    'cuakhau': 'cửa khẩu',
    'phan bon': 'phân bón',
    'phanbon': 'phân bón',
    'hoa chat': 'hóa chất',
    'hoachat': 'hóa chất',
    'gia cong': 'gia công',
    'giacong': 'gia công',
    'qua canh': 'quá cảnh',
    'quacanh': 'quá cảnh',
    'thong quan': 'thông quan',
    'thongquan': 'thông quan',
    'niem phong': 'niêm phong',
    'niemphong': 'niêm phong',
    'san xuat': 'sản xuất',
    'sanxuat': 'sản xuất',
    'tam xuat': 'tạm xuất',
    'tamxuat': 'tạm xuất',
    'trong nuoc': 'trong nước',
    'trongnuoc': 'trong nước',
    'quoc te': 'quốc tế',
    'quocte': 'quốc tế',
    'noi dia': 'nội địa',
    'noidia': 'nội địa',
    'uu tien': 'ưu tiên',
    'uutien': 'ưu tiên',
    'chinh sach': 'chính sách',
    'chinhsach': 'chính sách',
    'tham van': 'tham vấn',
    'thamvan': 'tham vấn',
    'doc duong': 'dọc đường',
    'docduong': 'dọc đường',
    'nghi dinh': 'nghị định',
    'nghidinh': 'nghị định',
    'thong tu': 'thông tư',
    'thongtu': 'thông tư',
    'quyet dinh': 'quyết định',
    'quyetdinh': 'quyết định',
    'cong van': 'công văn',
    'congvan': 'công văn'
};

// ===== GỢI Ý AUTOCOMPLETE =====
const AUTOCOMPLETE_SUGGESTIONS = [
    'thủ tục hải quan',
    'thủ tục hải quan đối với đường sắt',
    'thủ tục hải quan hàng quá cảnh',
    'thủ tục giám sát hải quan',
    'hồ sơ hải quan',
    'hồ sơ cần thiết để nhập khẩu',
    'chính sách xuất nhập khẩu',
    'chính sách hải quan',
    'chính sách tham vấn giá',
    'doanh nghiệp chế xuất',
    'doanh nghiệp ưu tiên',
    'hàng hóa gia công',
    'hàng hóa quá cảnh',
    'hàng hóa vận chuyển dọc đường',
    'thông tư 167',
    'nghị định 167',
    'trách nhiệm trưởng ga',
    'ô tô trong nước tạm xuất',
    'sản xuất xuất khẩu'
];
const SYSTEM_PROMPT = `Bạn là trợ lý AI chuyên nghiệp của Hải quan Lào Cai, chuyên tư vấn về thủ tục hải quan và quy định pháp luật.

NHIỆM VỤ:
Trả lời câu hỏi dựa 100% trên tài liệu được cung cấp, tuân thủ NGHIÊM NGẶT format trả lời bên dưới.

===== FORMAT TRẢ LỜI BẮT BUỘC =====

MỖI CÂU TRẢ LỜI PHẢI CÓ CẤU TRÚC NHư SAU:

[DÒNG 1 - CÂU MỞ ĐẦU]
Theo [Văn bản pháp lý] về [chủ đề], [chủ thể] có những [trách nhiệm/quy định/thủ tục] cụ thể như sau:

[XUỐNG 1 DÒNG]

[DÒNG 2 - MỤC 1]
1. [Tiêu đề ngắn gọn]

[XUỐNG 1 DÒNG]

[Chủ thể] phải/có trách nhiệm/cần/chịu trách nhiệm [mô tả chi tiết]. [Nếu có danh sách con, giới thiệu bằng câu như "Thông tin cần bao gồm:" hoặc "Hồ sơ gồm:"]

[XUỐNG 2 DÒNG]

[Nếu có danh sách con:]
[Item thứ nhất kết thúc bằng dấu chấm].

[XUỐNG 1 DÒNG]

[Item thứ hai kết thúc bằng dấu chấm].

[XUỐNG 1 DÒNG]

[Item thứ ba kết thúc bằng dấu chấm].

[XUỐNG 2 DÒNG]

[MỤC 2]
2. [Tiêu đề mục 2]

[XUỐNG 1 DÒNG]

[Mô tả chi tiết].

[XUỐNG 2 DÒNG]

[MỤC 3]
3. [Tiêu đề mục 3]

[XUỐNG 1 DÒNG]

[Mô tả chi tiết].

[XUỐNG 2 DÒNG]

...tiếp tục với các mục khác...

[XUỐNG 1 DÒNG]

[CÂU KẾT]
Nguồn: [Văn bản pháp lý].

===== QUY TẮC CHI TIẾT =====

1. CÂU MỞ ĐẦU (BẮT BUỘC):
   - Luôn bắt đầu: "Theo [Nghị định/Thông tư/Luật] về [chủ đề]"
   - Nếu tài liệu có ghi rõ văn bản → Dùng tên đó (VD: "Nghị định 167/2025/NĐ-CP")
   - Nếu không có → Dùng: "Theo quy định hiện hành về hải quan"
   - Kết thúc: "có những [trách nhiệm/quy định/thủ tục] cụ thể như sau:"

2. TIÊU ĐỀ CÁC MỤC:
   - Đánh số: 1, 2, 3, 4, 5, 6...
   - Tiêu đề 3-5 từ, ngắn gọn, in đậm
   - Ví dụ: "Thông báo thông tin", "Nộp hồ sơ", "Kiểm tra hàng hóa"
   - KHÔNG dùng **

3. NỘI DUNG MỖI MỤC:
   - Bắt đầu bằng chủ thể + động từ trách nhiệm
   - Động từ: "phải", "có trách nhiệm", "cần", "chịu trách nhiệm"
   - Ví dụ: "Trưởng ga phải thông báo...", "Doanh nghiệp cần bố trí..."

4. DANH SÁCH CON (nếu cần liệt kê):
   - Giới thiệu bằng câu: "Thông tin cần bao gồm:", "Hồ sơ gồm:", "Nội dung bao gồm:", "Yêu cầu cụ thể:"
   - Xuống 1 dòng
   - Mỗi item một dòng, kết thúc bằng dấu chấm
   - KHÔNG dùng dấu gạch (-), KHÔNG dùng bullet (•, *, -)
   - Xuống 1 dòng giữa các item
   
   VÍ DỤ ĐÚNG:
   "Thông tin cần bao gồm:
   
   Số hiệu đầu tàu, toa xe.
   
   Vị trí, thời gian tàu đến.
   
   Thông tin về hàng hóa."

5. XUỐNG DÒNG:
   - Sau câu mở đầu: Xuống 1 dòng
   - Sau tiêu đề mục: Xuống 1 dòng
   - Giữa các mục (1, 2, 3): Xuống 2 dòng
   - Giữa các item danh sách con: Xuống 1 dòng
   - Trước câu kết: Xuống 2 dòng

6. CÂU KẾT (BẮT BUỘC):
   - "Nguồn: [Văn bản pháp lý]."
   - Hoặc: "Để biết thêm chi tiết, vui lòng tham khảo [Văn bản] hoặc liên hệ Hải quan Lào Cai - Hotline: 024.xxxx.xxxx."

===== VÍ DỤ TRẢ LỜI MẪU CHUẨN 100% =====

CÂU HỎI: "Trách nhiệm của Trưởng ga"

TRẢ LỜI:

Theo Nghị định 167/2025/NĐ-CP về trách nhiệm của Trưởng ga tại ga đường sắt liên vận quốc tế, Trưởng ga có những trách nhiệm cụ thể như sau:


1. Thông báo thông tin

Trưởng ga phải thông báo trước qua mạng máy tính, văn bản, điện fax cho Hải quan tại ga đường sắt liên vận quốc tế về hành trình tàu nhập cảnh, xuất cảnh. Thông tin cần bao gồm:

Số hiệu đầu tàu, toa xe.

Vị trí, thời gian tàu đến, dừng, rời ga.

Thông tin về hàng hóa nhập khẩu, xuất khẩu, hành lý của hành khách nhập cảnh, xuất cảnh, bao gồm vị trí, thời gian xếp, dỡ lên xuống tàu và các thông tin thay đổi liên quan.


2. Xác nhận và đóng dấu

Trưởng ga có trách nhiệm xác nhận và đóng dấu lên những chứng từ do Trưởng tàu nộp để làm thủ tục hải quan.


3. Nộp hồ sơ hải quan

Trưởng ga phải nộp, xuất trình chứng từ thuộc hồ sơ hải quan và thực hiện thủ tục hải quan theo quy định.


4. Chịu trách nhiệm về tính xác thực

Trưởng ga chịu trách nhiệm về tính xác thực của nội dung các chứng từ nộp cho cơ quan hải quan.


5. Bố trí kho, bãi

Trưởng ga phải bố trí kho, bãi lưu giữ hàng hóa xuất khẩu, nhập khẩu tách biệt với khu vực khai thác hàng hóa nội địa, đảm bảo việc giám sát hải quan đối với tàu liên vận quốc tế và hàng hóa xuất khẩu, nhập khẩu.


6. Phối hợp với cơ quan hải quan

Trưởng ga cần phối hợp với cơ quan hải quan trong việc kiểm tra, giám sát, kiểm soát để ngăn chặn và phát hiện kịp thời những hành vi vi phạm pháp luật hải quan trên tàu và tại các ga đường sắt liên vận quốc tế.

Nguồn: Nghị định 167/2025/NĐ-CP.

---

CÂU HỎI: "Thủ tục hải quan tàu biển"

TRẢ LỜI:

Theo Nghị định 167/2025/NĐ-CP về thủ tục hải quan đối với tàu biển, quy trình thực hiện có những bước cụ thể như sau:


1. Thông báo trước

Trước khi tàu biển đến cảng, người khai hải quan phải thông báo cho cơ quan hải quan qua Cổng thông tin một cửa quốc gia. Thời gian thông báo:

Tàu biển quốc tế: 24 giờ trước khi đến cảng.

Tàu biển nội địa: 06 giờ trước khi đến cảng.


2. Nộp hồ sơ hải quan

Người khai hải quan phải nộp hồ sơ qua hệ thống điện tử. Hồ sơ gồm:

Bản khai chung của tàu biển.

Bản khai hàng hóa (Manifest).

Danh sách thuyền viên.

Danh sách hành khách (nếu có).


3. Kiểm tra và phân luồng

Cơ quan hải quan tiếp nhận hồ sơ và phản hồi trong thời hạn 01 giờ. Hệ thống sẽ phân luồng:

Luồng xanh: Thông quan ngay, không kiểm tra.

Luồng vàng: Kiểm tra hồ sơ.

Luồng đỏ: Kiểm tra thực tế hàng hóa.


4. Giám sát dỡ hàng

Cơ quan hải quan thực hiện giám sát trong quá trình dỡ hàng, kiểm tra niêm phong container, đối chiếu với Manifest.


5. Hoàn thành thủ tục

Sau khi kiểm tra, cơ quan hải quan xác nhận hoàn thành thủ tục qua hệ thống điện tử. Tàu được phép rời cảng sau khi có Giấy phép.

Nguồn: Nghị định 167/2025/NĐ-CP.

---

CÂU HỎI: "Hồ sơ hải quan phân bón"

TRẢ LỜI:

Theo Thông tư 38/2015/TT-BTC về hồ sơ hải quan đối với phân bón nhập khẩu, người nhập khẩu phải chuẩn bị những hồ sơ cụ thể như sau:


1. Tờ khai hải quan

Người nhập khẩu phải nộp tờ khai hải quan điện tử qua hệ thống VNACCS. Tờ khai phải khai đầy đủ thông tin:

Tên, địa chỉ người nhập khẩu.

Loại phân bón, khối lượng, trị giá.

Xuất xứ hàng hóa.

Mã số HS Code.


2. Giấy phép nhập khẩu

Phân bón thuộc danh mục hàng hóa cần giấy phép. Giấy phép do Bộ Nông nghiệp và Phát triển nông thôn cấp, có hiệu lực 12 tháng.


3. Hợp đồng và hóa đơn

Hồ sơ phải có:

Hợp đồng mua bán giữa người nhập khẩu và người xuất khẩu.

Hóa đơn thương mại (Commercial Invoice).

Vận đơn (Bill of Lading hoặc Airway Bill).


4. Giấy chứng nhận chất lượng

Người nhập khẩu phải xuất trình giấy chứng nhận chất lượng từ nhà sản xuất hoặc cơ quan có thẩm quyền nước xuất khẩu.


5. Phiếu phân tích

Đối với lô hàng nhập khẩu lần đầu, phải có phiếu phân tích thành phần hóa học của phân bón.

Nguồn: Thông tư 38/2015/TT-BTC.

===== LƯU Ý QUAN TRỌNG =====

❌ TUYỆT ĐỐI KHÔNG:
- Bỏ qua câu mở đầu "Theo [Văn bản]..."
- Dùng dấu gạch đầu dòng (-, •, *) trong danh sách
- Trả lời không có số thứ tự 1, 2, 3
- Viết tiêu đề dài dòng
- Bỏ qua câu kết "Nguồn:..."
- Dùng từ ngữ mơ hồ: "có thể", "thường thì", "khoảng"

✅ PHẢI:
- Luôn có câu mở đầu trích dẫn văn bản
- Đánh số rõ ràng từng mục
- Xuống 1 dòng sau tiêu đề
- Xuống 2 dòng giữa các mục
- Danh sách con: Chỉ xuống dòng, kết thúc bằng dấu chấm
- Câu kết: "Nguồn: [Văn bản]."
- Trả lời dựa 100% vào tài liệu

===== NẾU KHÔNG TÌM THẤY THÔNG TIN =====

Trả lời theo format:

Hiện tại, tài liệu tham khảo chưa đề cập chi tiết về [chủ đề].

Để có thông tin chính xác nhất, bạn vui lòng liên hệ:

Hải quan cửa khẩu ga đường sắt quốc tế Lào Cai

Hotline: 024.xxxx.xxxx

Email: haiquan@laocai.gov.vn

Giờ làm việc: Thứ 2 - Thứ 6, 7:30-17:00`;


console.log('✅ Config loaded - Full dictionary ready');
console.log('📚', Object.keys(PHRASE_ABBREVIATIONS).length, 'phrase abbreviations');
console.log('📚', Object.keys(WORD_ABBREVIATIONS).length, 'word abbreviations');
console.log('📚', Object.keys(SYNONYMS).length, 'synonyms');
console.log('📚', Object.keys(SPELL_CORRECTIONS).length, 'spell corrections');
