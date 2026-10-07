"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RefreshCw, ArrowRight, Pin, X, ShoppingBag, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Garment, SuggestedOutfit } from "@/lib/types";
import { GarmentCard } from "@/components/garment-card";
import { GarmentDetailModal } from "@/components/garment-detail-modal";
import { useRentalCart } from "@/lib/rental-context";

const OCCASIONS = [
  { id: "tet", label: "Du Xuân Đón Tết", desc: "Dạo phố hoa, lễ Tết gia đình, lễ hội đầu năm" },
  { id: "ky_yeu", label: "Chụp Ảnh Kỷ Yếu", desc: "Lễ tốt nghiệp, ghi dấu thời hoa niên học đường" },
  { id: "dao_pho", label: "Dạo Phố & Cà Phê", desc: "Gặp gỡ bạn bè, nhịp sống trẻ trung cuối tuần" },
  { id: "le_hoi", label: "Trẩy Hội Dân Gian", desc: "Lễ hội Đền Hùng, không gian văn hóa truyền thống" },
  { id: "tiec_cuoi", label: "Tiệc Cưới & Hỷ Sự", desc: "Trang trọng, nổi bật và trang nhã" },
];

const STYLES = [
  { id: "streetwear", label: "Streetwear Cá Tính", desc: "Phối cùng Sneaker, Kính râm, năng động" },
  { id: "minimalist", label: "Tối Giản Tinh Tế", desc: "Màu sắc trang nhã, phom dáng thanh thoát" },
  { id: "y2k", label: "Y2K Folk-Fusion", desc: "Họa tiết rực rỡ, phá cách nhưng chuẩn mực" },
  { id: "thanh_lich", label: "Cổ Phong Thanh Lịch", desc: "Giữ trọn nét nho nhã triều Nguyễn / Lê" },
];

const GENDERS = [
  { id: "unisex", label: "Tất Cả / Unisex" },
  { id: "nu", label: "Nữ" },
  { id: "nam", label: "Nam" },
];

export default function SuggestPage() {
  const router = useRouter();
  const { addToCart } = useRentalCart();
  const [occasion, setOccasion] = useState("tet");
  const [style, setStyle] = useState("streetwear");
  const [gender, setGender] = useState("unisex");
  const [garments, setGarments] = useState<Garment[]>([]);
  const [pinnedGarmentId, setPinnedGarmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [outfits, setOutfits] = useState<SuggestedOutfit[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [garmentError, setGarmentError] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [activeGarment, setActiveGarment] = useState<Garment | null>(null);
  const [rentedOutfitId, setRentedOutfitId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const firstOutfitRef = useRef<HTMLElement | null>(null);
  const shouldScrollRef = useRef(false);

  const handleRentOutfit = (outfit: SuggestedOutfit) => {
    outfit.items.forEach((garment) => {
      addToCart(garment, "M", 1);
    });
    setRentedOutfitId(outfit.id);
    setTimeout(() => {
      router.push("/rent");
    }, 600);
  };

  useEffect(() => {
    async function loadGarments() {
      try {
        const res = await api.getGarments({ limit: 50 });
        setGarments(res.items);
      } catch (err) {
        console.error("Failed to load garments for pinning:", err);
        setGarmentError(true);
      }
    }
    loadGarments();
  }, []);

  // After a search finishes, glide down to the first outfit (or to the message if there is none).
  useEffect(() => {
    if (loading || !shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    const target = firstOutfitRef.current ?? resultsRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [loading, outfits, generationError]);

  const handleGenerate = async () => {
    shouldScrollRef.current = true;
    setLoading(true);
    setHasGenerated(true);
    setGenerationError(false);
    try {
      const res = await api.suggestOutfits({
        occasion,
        style,
        gender,
        pinned_garment_ids: pinnedGarmentId ? [pinnedGarmentId] : [],
      });
      setOutfits(res.outfits || []);
    } catch (err) {
      console.error("Semantic garment search error:", err);
      setOutfits([]);
      setGenerationError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="interior-page mx-auto max-w-5xl px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="page-intro text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#24251F] dark:text-[#EEE8DC]">
          Tìm mẫu trang phục phù hợp
        </h1>
        <p className="page-lead mt-4 text-xs sm:text-sm text-[#625F56] dark:text-[#B7AFA0] font-serif leading-relaxed">
          Chọn dịp, phong cách và món đồ tâm điểm để tìm các mẫu cổ phục phù hợp từ kho.
        </p>
      </div>

      {/* Minimalist Selection Matrix */}
      <div className="bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] p-8 sm:p-12 shadow-2xs transition-colors duration-200">
        {/* Step 1: Occasion */}
        <div className="mb-10">
          <span className="text-xs font-serif uppercase tracking-widest text-[#24251F] dark:text-[#EEE8DC] block mb-4">
            01 / Hoàn Cảnh Diện Đồ
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {OCCASIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={occasion === item.id}
                onClick={() => setOccasion(item.id)}
                className={`stylist-choice p-4 text-left border transition-all ${
                  occasion === item.id
                    ? "border-[#9F3B30] dark:border-[#D16F5D] bg-[#F5F1E9] dark:bg-[#2C332C] text-[#24251F] dark:text-[#EEE8DC]"
                    : "border-[#D8D0C1] dark:border-[#485047] hover:border-[#24251F] dark:hover:border-[#EEE8DC] text-[#625F56] dark:text-[#C3BBAE]"
                }`}
              >
                <div className="font-serif text-sm font-semibold">{item.label}</div>
                <div className="text-[11px] text-[#797468] dark:text-[#625F56] mt-1 font-light leading-relaxed">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Style */}
        <div className="mb-10 pt-8 border-t border-[#D8D0C1] dark:border-[#485047]">
          <span className="text-xs font-serif uppercase tracking-widest text-[#24251F] dark:text-[#EEE8DC] block mb-4">
            02 / Phong Cách Gen Z
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {STYLES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={style === item.id}
                onClick={() => setStyle(item.id)}
                className={`stylist-choice p-4 text-left border transition-all ${
                  style === item.id
                    ? "border-[#9F3B30] dark:border-[#D16F5D] bg-[#F5F1E9] dark:bg-[#2C332C] text-[#24251F] dark:text-[#EEE8DC]"
                    : "border-[#D8D0C1] dark:border-[#485047] hover:border-[#24251F] dark:hover:border-[#EEE8DC] text-[#625F56] dark:text-[#C3BBAE]"
                }`}
              >
                <div className="font-serif text-sm font-semibold">{item.label}</div>
                <div className="text-[11px] text-[#797468] dark:text-[#625F56] mt-1 font-light leading-relaxed">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Pinned Garment (Key Piece) */}
        <div className="mb-10 pt-8 border-t border-[#D8D0C1] dark:border-[#485047]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-xs font-serif uppercase tracking-widest text-[#24251F] dark:text-[#EEE8DC] flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-[#9F3B30] dark:text-[#D16F5D]" />
                03 / Ghim Món Đồ Tâm Điểm (Tùy Chọn)
              </span>
              <span className="text-[11px] text-[#625F56] dark:text-[#B7AFA0] font-serif">
                Chọn 1 món đồ để ưu tiên các mẫu tương tự trong kết quả
              </span>
            </div>
            {pinnedGarmentId && (
              <button
                type="button"
                onClick={() => setPinnedGarmentId(null)}
                className="inline-flex items-center gap-1 text-xs text-[#9F3B30] dark:text-[#D16F5D] hover:underline font-serif self-start sm:self-auto"
              >
                <X className="w-3 h-3" />
                <span>Bỏ ghim (Phối tự do)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-56 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setPinnedGarmentId(null)}
              className={`p-3 border text-center flex flex-col items-center justify-center transition-all ${
                pinnedGarmentId === null
                  ? "border-[#9F3B30] dark:border-[#D16F5D] bg-[#F5F1E9] dark:bg-[#2C332C] text-[#24251F] dark:text-[#EEE8DC] ring-1 ring-[#9F3B30]/40"
                  : "border-[#D8D0C1] dark:border-[#485047] hover:border-[#24251F] dark:hover:border-[#EEE8DC] text-[#625F56]"
              }`}
            >
              <span className="font-serif text-xs font-semibold">Tự Do Hoàn Toàn</span>
              <span className="text-[10px] text-[#797468] dark:text-[#625F56] mt-1">Không cố định món nào</span>
            </button>

            {garments.map((g) => {
              const isPinned = pinnedGarmentId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setPinnedGarmentId(isPinned ? null : g.id)}
                  className={`p-2.5 border text-center flex flex-col items-center transition-all relative ${
                    isPinned
                      ? "border-[#9F3B30] dark:border-[#D16F5D] bg-[#F4E9E3] dark:bg-[#382724] ring-1 ring-[#9F3B30] shadow-xs"
                      : "border-[#D8D0C1] dark:border-[#485047] hover:border-[#24251F] dark:hover:border-[#EEE8DC] bg-white dark:bg-[#232923]"
                  }`}
                >
                  {isPinned && (
                    <span className="absolute top-1.5 right-1.5 z-10 w-2 h-2 rounded-full bg-[#9F3B30] dark:bg-[#D16F5D]" />
                  )}
                  <div className="relative w-12 h-12 aspect-square mb-1.5">
                    <Image
                      src={g.thumbnail_url || g.image_url || `/api/v1/images/${g.image_path}`}
                      alt={g.display_name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="font-serif text-[11px] font-semibold text-[#24251F] dark:text-[#EEE8DC] line-clamp-1">
                    {g.display_name}
                  </span>
                  <span className="text-[9px] text-[#797468] dark:text-[#625F56] mt-0.5 capitalize">
                    {g.primary_color || (g.is_traditional ? "Cổ phục" : "Remix")}
                  </span>
                </button>
              );
            })}
          </div>
          {garmentError && <p role="status" className="mt-3 text-xs text-[#625F56] dark:text-[#B7AFA0]">Tủ đồ đang tạm thời không khả dụng. Bạn vẫn có thể tạo bản phối mà không ghim món đồ.</p>}
        </div>

        {/* Step 4: Gender & CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-[#D8D0C1] dark:border-[#485047]">
          <div className="flex items-center gap-4 text-xs font-serif">
            <span className="text-[#797468] dark:text-[#625F56] uppercase tracking-wider text-[11px]">04 / Dành cho:</span>
            {GENDERS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGender(g.id)}
                className={`transition-colors ${
                  gender === g.id ? "text-[#9F3B30] dark:text-[#D16F5D] font-bold underline" : "text-[#625F56] dark:text-[#B7AFA0]"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#24251F] dark:bg-[#EEE8DC] text-[#F9F6F0] dark:text-[#121110] text-xs uppercase tracking-widest hover:bg-[#9F3B30] dark:hover:bg-[#D16F5D] dark:hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tìm mẫu phù hợp...</span>
              </>
            ) : (
              <>
                <span>Tìm Trang Phục Phù Hợp</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {hasGenerated && (
        <div ref={resultsRef} className="mt-16 scroll-mt-24">
          <div className="text-center mb-10">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#9F3B30] dark:text-[#D16F5D] font-serif block mb-1">
              Tuyển Tập Đề Xuất
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#24251F] dark:text-[#EEE8DC]">
              Các Bộ Phối Phù Hợp
            </h2>
          </div>

          {loading ? (
            <div className="py-20 text-center text-[#625F56] dark:text-[#B7AFA0] font-serif text-sm flex flex-col items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-[#9F3B30] dark:text-[#D16F5D]" />
              <span>Đang tìm kiếm trong kho trang phục...</span>
            </div>
          ) : generationError ? (
            <div role="alert" className="text-center py-16 bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] font-serif text-sm text-[#625F56] dark:text-[#B7AFA0]">Chưa thể tìm kiếm trang phục. Vui lòng thử lại sau.</div>
          ) : outfits.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] font-serif text-sm text-[#625F56] dark:text-[#B7AFA0]">
              Không tìm thấy bộ trang phục hoàn chỉnh và phù hợp trong kho hiện có.
            </div>
          ) : (
            <div className="space-y-8">
              {outfits.map((outfit, index) => (
                <section
                  key={outfit.id}
                  ref={index === 0 ? firstOutfitRef : undefined}
                  className="scroll-mt-24 bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] p-5 sm:p-7"
                >
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <h3 className="font-serif text-lg text-[#24251F] dark:text-[#EEE8DC]">
                      {`Bộ phối ${String(index + 1).padStart(2, "0")}`}
                    </h3>
                    <span className="text-[10px] uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0]">
                      {outfit.items.length} món
                    </span>
                  </div>
                  <div className="outfit-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {outfit.items.map((garment) => (
                      <GarmentCard
                        key={garment.id}
                        garment={garment}
                        onClickDetail={setActiveGarment}
                      />
                    ))}
                  </div>
                  {outfit.cultural_warning && (
                    <p className="mt-5 text-xs text-[#625F56] dark:text-[#B7AFA0]">
                      {outfit.cultural_warning}
                    </p>
                  )}
                  {/* Rent Outfit CTA */}
                  <div className="mt-5 pt-5 border-t border-[#D8D0C1] dark:border-[#485047] flex items-center justify-end gap-4">
                    <button
                      type="button"
                      id={`rent-outfit-${outfit.id}`}
                      onClick={() => handleRentOutfit(outfit)}
                      disabled={rentedOutfitId === outfit.id}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest font-serif transition-all duration-300 shrink-0 ${
                        rentedOutfitId === outfit.id
                          ? "bg-[#2C6E49] text-white cursor-default"
                          : "bg-[#9F3B30] dark:bg-[#D16F5D] text-white hover:bg-[#7D2E26] dark:hover:bg-[#B85947] active:scale-95"
                      }`}
                    >
                      {rentedOutfitId === outfit.id ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Đã thêm vào giỏ!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Thuê Cả Bộ</span>
                        </>
                      )}
                    </button>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      <GarmentDetailModal garment={activeGarment} onClose={() => setActiveGarment(null)} />
    </div>
  );
}
