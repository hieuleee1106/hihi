import { GoogleGenAI } from "@google/genai";
import { Product } from "../models/Product.js";

// ✅ sửa khởi tạo cho đúng SDK mới
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Tin nhắn không được để trống." });
    }

    // 1. Lấy dữ liệu sản phẩm từ DB
    const products = await Product.find({});
    const productData = JSON.stringify(
      products.map((p) => ({
        id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        provider: p.provider,
        description: p.description,
        benefits: p.benefits,
      }))
    );

    // 2. Prompt (GIỮ NGUYÊN – OK)
    const systemPrompt = `
Bạn là một trợ lý AI chuyên nghiệp và thân thiện của HieuShop, một cửa hàng chuyên về các sản phẩm bảo hiểm.
Chủ cửa hàng tên là Hiếu,số điện thoại 0971304944, email: hieulee05@gmail.com
Địa chỉ: Xóm 3-Hữu Chung-Tân Phong-Hải Dương
QUY TẮC BẮT BUỘC:
Khi trả lời khách hàng:
- KHÔNG dùng bảng Markdown
- KHÔNG dùng emoji
- KHÔNG in đậm toàn bộ nội dung
- Trình bày dạng đoạn ngắn + gạch đầu dòng
- Giọng văn tự nhiên như tư vấn viên thật
- Ưu tiên dễ đọc trên giao diện chat
- Chỉ làm nổi bật tên sản phẩm khi cần.
- Chỉ trả lời dựa trên dữ liệu được cung cấp, không bịa
- Không có sản phẩm → nói không có
- Câu hỏi ngoài bảo hiểm → trả lời tự nhiên
- Luôn lịch sự
DỮ LIỆU SẢN PHẨM (JSON):
${productData}

CÂU HỎI KHÁCH:
"${message}"
`;

    // ✅ CÁCH GỌI ĐÚNG SDK MỚI
    const result = await genAI.models.generateContent({
      model: "models/gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
    });

    const text =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Xin lỗi, tôi chưa thể trả lời lúc này.";

    res.status(200).json({ reply: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ message: "Lỗi AI server" });
  }
};
