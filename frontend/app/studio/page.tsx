"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, Check, ArrowRight, Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import { CulturalCheckResponse, Garment } from "@/lib/types";
import { CulturalBadge } from "@/components/cultural-badge";
import { useRentalCart } from "@/lib/rental-context";
import { StudioChat } from "@/components/studio-chat";
import { RentalModal } from "@/components/rental-modal";

const CATEGORY_TABS = [
  { id: "all", label: "Tất Cả" },
  { id: "traditional_top", label: "Áo Cổ Phục" },
  { id: "traditional_bottom", label: "Quần/Váy Lụa" },
  { id: "modern_bottom", label: "Quần Remix" },
  { id: "headwear", label: "Mấn/Nón" },
  { id: "footwear", label: "Giày/Guốc" },
  { id: "accessory", label: "Phụ Kiện" },
];

export default function StudioPage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGarments, setSelectedGarments] = useState<Garment[]>([]);
  const [culturalCheck, setCulturalCheck] = useState<CulturalCheckResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [outfitName, setOutfitName] = useState("Bản Phối Của Tôi");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRentalOpen, setIsRentalOpen] = useState(false);
  const { addToCart } = useRentalCart();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getGarments();
        setGarments(res.items);
      } catch (err) {
        console.error("Failed to load garments:", err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function runCheck() {
      if (selectedGarments.length === 0) {
        setCulturalCheck(null);
        return;
      }
      setChecking(true);
      try {
        const res = await api.checkCultural(selectedGarments.map((g) => g.id));
        setCulturalCheck(res);
      } catch (err) {
        console.error("Cultural check error:", err);
      } finally {
        setChecking(false);
      }
    }
    runCheck();
  }, [selectedGarments]);

  const addGarment = (g: Garment) => {
    if (selectedGarments.some((item) => item.id === g.id)) return;
    setSelectedGarments((prev) => [...prev, g]);
  };

  const handleAddGarmentsFromChat = (newGarments: Garment[]) => {
    setSelectedGarments((prev) => {
      const added = newGarments.filter(g => !prev.some(p => p.id === g.id));
      return [...prev, ...added];
    });
  };

  const removeGarment = (id: string) => {
    setSelectedGarments((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleGarment = (g: Garment) => {
    if (selectedGarments.some((item) => item.id === g.id)) {
      removeGarment(g.id);
    } else {
      addGarment(g);
    }
  };

  const clearAll = () => {
    setSelectedGarments([]);
    setCulturalCheck(null);
  };

  const handleSaveLookbook = async () => {
    if (selectedGarments.length < 2) return;
    try {
      await api.createOutfit({
        name: outfitName || "Việt Phục Remix Lookbook",
        garment_ids: selectedGarments.map((g) => g.id),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Save outfit error:", err);
    }
  };

  const filteredGarments =
    selectedCategory === "all"
      ? garments
      : garments.filter((g) => g.category === selectedCategory);

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-[#E7DFD3] dark:border-[#2E2A26]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#9E2A2B] dark:text-[#D94142] font-serif block mb-2">
            Không Gian Sáng Tạo
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#1C1917] dark:text-[#EAE5DC]">
            Phối Đồ Tự Do & Thẩm Định
          </h1>
        </div>

        {selectedGarments.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D94142] transition-colors"
          >
            Làm mới trang canvas
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* LEFT COLUMN: Outfit Catalog (Garment Picker) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none border-b border-[#E7DFD3]/60 dark:border-[#2E2A26] pb-3">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`text-xs uppercase tracking-wider whitespace-nowrap pb-1 transition-all relative ${
                  selectedCategory === tab.id
                    ? "text-[#1C1917] dark:text-[#EAE5DC] font-semibold border-b-2 border-[#9E2A2B] dark:border-[#D94142]"
                    : "text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EAE5DC]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid of items to pick */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredGarments.map((g) => {
              const isSelected = selectedGarments.some((item) => item.id === g.id);
              return (
                <div
                  key={g.id}
                  onClick={() => toggleGarment(g)}
                  className={`group relative p-3 border flex flex-col items-center cursor-pointer transition-all bg-white dark:bg-[#1C1A18] text-center ${
                    isSelected
                      ? "border-[#9E2A2B] dark:border-[#D94142] ring-1 ring-[#9E2A2B] dark:ring-[#D94142] bg-[#FAF1EE]/80 dark:bg-[#2A1717]/60"
                      : "border-[#E7DFD3] dark:border-[#2E2A26] hover:border-[#1C1917] dark:hover:border-[#EAE5DC]"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-[#9E2A2B] dark:bg-[#D94142] text-white flex items-center justify-center text-[10px] shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </span>
                  )}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 aspect-square mb-2">
                    <Image
                      src={g.thumbnail_url || g.image_url || `/api/v1/images/${g.image_path}`}
                      alt={g.display_name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="font-serif text-xs font-semibold text-[#1C1917] dark:text-[#EAE5DC] line-clamp-1">
                    {g.display_name}
                  </span>
                  <span className="text-[10px] text-[#A8A29E] dark:text-[#78716C] mt-0.5">
                    {g.primary_color || g.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MIDDLE COLUMN: Chat Assistant (ChatGPT-like) */}
        <div className="lg:col-span-4 h-[640px]">
          <StudioChat 
            onAddGarments={handleAddGarmentsFromChat} 
            selectedGarments={selectedGarments}
            allGarments={garments}
          />
        </div>

        {/* RIGHT COLUMN: Minimal Action Canvas */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] p-5 sm:p-6 flex flex-col h-[640px] justify-between transition-colors duration-200">
            {/* Canvas Top Bar */}
            <div>
              <div className="pb-3 border-b border-[#E7DFD3] dark:border-[#2E2A26] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-semibold text-[#1C1917] dark:text-[#EAE5DC]">
                    Khung Phối
                  </span>
                  <span className="text-xs text-[#A8A29E] dark:text-[#78716C]">
                    ({selectedGarments.length})
                  </span>
                </div>

                {culturalCheck && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[#9E2A2B] dark:border-[#D94142] text-[#9E2A2B] dark:text-[#D94142]">
                    ✓ {Math.round(culturalCheck.score * 100)}% Chuẩn Mực
                  </span>
                )}
              </div>

              {/* Visual Canvas Items */}
              <div className="py-4 max-h-[380px] overflow-y-auto pr-1">
                {selectedGarments.length === 0 ? (
                  <div className="py-24 text-center text-[#78716C] dark:text-[#A8A29E] font-serif text-xs leading-relaxed">
                    Chọn trang phục từ tủ đồ bên trái hoặc nhận gợi ý từ trợ lý AI ở giữa.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedGarments.map((g) => (
                      <div
                        key={g.id}
                        className="relative p-2.5 bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] flex flex-col items-center text-center group"
                      >
                        <button
                          onClick={() => removeGarment(g.id)}
                          className="absolute top-1 right-1 p-1 text-[#A8A29E] dark:text-[#78716C] hover:text-[#9E2A2B] dark:hover:text-[#D94142] transition-colors z-10"
                          title="Gỡ món đồ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="relative w-14 h-14 aspect-square mb-1">
                          <Image
                            src={g.thumbnail_url || g.image_url || `/api/v1/images/${g.image_path}`}
                            alt={g.display_name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className="font-serif text-[11px] font-semibold text-[#1C1917] dark:text-[#EAE5DC] line-clamp-1">
                          {g.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cultural Warnings & Actions */}
            <div>
              {culturalCheck && culturalCheck.violations.length > 0 && (
                <div className="mb-4 p-2.5 text-[11px] font-serif leading-relaxed border-l-2 border-[#9E2A2B] dark:border-[#D94142] bg-[#FAF1EE] dark:bg-[#2A1717] text-[#44403C] dark:text-[#D6D0C7] max-h-20 overflow-y-auto">
                  <strong className="text-[#9E2A2B] dark:text-[#D94142]">Lưu ý: </strong>
                  {culturalCheck.violations[0].message}
                </div>
              )}

              <div className="pt-3 border-t border-[#E7DFD3] dark:border-[#2E2A26] flex items-center gap-2">
                <button
                  onClick={() => setIsRentalOpen(true)}
                  disabled={selectedGarments.length === 0}
                  className="flex-1 py-3.5 bg-[#1C1917] dark:bg-[#EAE5DC] text-[#F9F6F0] dark:text-[#121110] text-xs uppercase tracking-widest hover:bg-[#9E2A2B] dark:hover:bg-[#D94142] dark:hover:text-white transition-colors disabled:opacity-40 font-medium text-center"
                >
                  Đặt Thuê Set Này
                </button>
                <button
                  onClick={handleSaveLookbook}
                  disabled={selectedGarments.length < 2}
                  title={savedSuccess ? "Đã lưu Lookbook" : "Lưu vào Lookbook"}
                  className="p-3.5 border border-[#E7DFD3] dark:border-[#2E2A26] hover:border-[#1C1917] dark:hover:border-[#EAE5DC] text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EAE5DC] transition-colors disabled:opacity-40"
                >
                  <Bookmark className={`w-4 h-4 ${savedSuccess ? "fill-[#9E2A2B] text-[#9E2A2B]" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RentalModal
        isOpen={isRentalOpen}
        onClose={() => setIsRentalOpen(false)}
        garments={selectedGarments}
      />
    </div>
  );
}
