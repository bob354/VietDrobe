import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] justify-center">
      {/* Editorial Hero Section */}
      <section className="py-20 sm:py-28 max-w-5xl mx-auto px-6 text-center">
        {/* Subtle Seal Tag */}
        <div className="inline-flex items-center gap-2 mb-8">
          <span className="seal-stamp w-6 h-6 text-xs font-serif font-bold">
            越
          </span>
          <span className="text-xs uppercase tracking-[0.25em] text-[#78716C] font-light">
            Triển Lãm & Phối Cổ Phục Kỹ Thuật Số
          </span>
        </div>

        {/* Primary Title */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#1C1917] dark:text-[#EAE5DC] leading-[1.2]">
          Di Sản Cổ Truyền <br />
          <span className="italic font-normal text-[#9E2A2B] dark:text-[#D94142]">
            Hơi Thở Đương Đại
          </span>
        </h1>

        {/* Minimalist Subtext */}
        <p className="mt-8 text-base sm:text-lg text-[#57534E] dark:text-[#C4BDB5] font-serif max-w-2xl mx-auto leading-relaxed">
          Không gian khám phá vẻ đẹp Áo Tấc, Nhật Bình, Ngũ Thân... và phối ngẫu hài hòa cùng thời trang Gen Z dưới sự bảo chứng chuẩn mực văn hóa của AI.
        </p>

        {/* Quiet CTAs */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/suggest"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#1C1917] dark:bg-[#EAE5DC] text-[#F9F6F0] dark:text-[#121110] text-xs uppercase tracking-widest hover:bg-[#9E2A2B] dark:hover:bg-[#D94142] dark:hover:text-white transition-colors duration-300"
          >
            <span>Khởi Tạo Với AI Stylist</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-1" />
          </Link>

          <Link
            href="/catalog"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 border border-[#1C1917] dark:border-[#EAE5DC] text-[#1C1917] dark:text-[#EAE5DC] text-xs uppercase tracking-widest hover:bg-white dark:hover:bg-[#1C1A18] transition-colors duration-300"
          >
            <span>Khám Phá Tủ Đồ Di Sản</span>
          </Link>
        </div>

        {/* Editorial Three Pillars */}
        <div className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-12 text-left pt-16 border-t border-[#E7DFD3] dark:border-[#2E2A26]">
          <div>
            <span className="text-xs tracking-widest text-[#9E2A2B] dark:text-[#D94142] font-serif uppercase block mb-2">01 / Tủ Đồ</span>
            <h3 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#EAE5DC] mb-2">
              Khảo Cứu Di Sản
            </h3>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] font-serif leading-relaxed">
              Tư liệu chuẩn mực thời Lê, Nguyễn về phom dáng ngũ thân, dải ngũ hành, mấn gấm và điển tích cổ phong.
            </p>
          </div>

          <div>
            <span className="text-xs tracking-widest text-[#9E2A2B] dark:text-[#D94142] font-serif uppercase block mb-2">02 / Phối Ngẫu</span>
            <h3 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#EAE5DC] mb-2">
              Tân Thời Gen Z
            </h3>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] font-serif leading-relaxed">
              Trợ lý AI phân tích tỷ lệ phom dáng và độ hài hòa màu sắc để đề xuất cách diện cùng sneaker, túi canvas.
            </p>
          </div>

          <div>
            <span className="text-xs tracking-widest text-[#9E2A2B] dark:text-[#D94142] font-serif uppercase block mb-2">03 / Bảo Chứng</span>
            <h3 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#EAE5DC] mb-2">
              Cultural Guardrail
            </h3>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] font-serif leading-relaxed">
              Hệ thống kiểm định tự động nhắc nhở những kết hợp sai lệch phẩm hàm, nghi lễ và thuần phong mỹ tục.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
