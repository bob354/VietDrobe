"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Trash2, Check, Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import { CulturalCheckResponse, Garment } from "@/lib/types";
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

const DEFAULT_LEFT = 21;
const DEFAULT_RIGHT = 22;
const MIN_LEFT = 16;
const MIN_RIGHT = 18;
const MIN_CHAT = 34;

type Divider = "left" | "right";

export default function StudioPage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [garmentError, setGarmentError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGarments, setSelectedGarments] = useState<Garment[]>([]);
  const [culturalCheck, setCulturalCheck] = useState<CulturalCheckResponse | null>(null);
  const outfitName = "Bản phối của tôi";
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRentalOpen, setIsRentalOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT);
  const [categoryOverflow, setCategoryOverflow] = useState({ left: false, right: false });
  const workspaceRef = useRef<HTMLDivElement>(null);
  const categoryTabsRef = useRef<HTMLDivElement>(null);
  const activeDivider = useRef<Divider | null>(null);

  const updateCategoryOverflow = () => {
    const element = categoryTabsRef.current;
    if (!element) return;
    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    setCategoryOverflow({
      left: element.scrollLeft > 2,
      right: element.scrollLeft < maxScrollLeft - 2,
    });
  };

  const resizeFromPointer = (divider: Divider, clientX: number) => {
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    if (divider === "left") {
      const proposed = ((clientX - bounds.left) / bounds.width) * 100;
      setLeftWidth(Math.max(MIN_LEFT, Math.min(proposed, 100 - rightWidth - MIN_CHAT)));
    } else {
      const proposed = ((bounds.right - clientX) / bounds.width) * 100;
      setRightWidth(Math.max(MIN_RIGHT, Math.min(proposed, 100 - leftWidth - MIN_CHAT)));
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, divider: Divider) => {
    event.preventDefault();
    activeDivider.current = divider;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDivider.current) return;
    event.preventDefault();
    resizeFromPointer(activeDivider.current, event.clientX);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    activeDivider.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleDividerKey = (event: React.KeyboardEvent<HTMLDivElement>, divider: Divider) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.shiftKey ? 5 : 2;
    const direction = event.key === "ArrowRight" ? 1 : -1;
    if (divider === "left") setLeftWidth(current => Math.max(MIN_LEFT, Math.min(current + direction * step, 100 - rightWidth - MIN_CHAT)));
    else setRightWidth(current => Math.max(MIN_RIGHT, Math.min(current - direction * step, 100 - leftWidth - MIN_CHAT)));
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getGarments();
        setGarments(res.items);
      } catch (err) {
        console.error("Failed to load garments:", err);
        setGarmentError(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const element = categoryTabsRef.current;
    if (!element) return;
    updateCategoryOverflow();
    const observer = new ResizeObserver(updateCategoryOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function runCheck() {
      if (selectedGarments.length === 0) {
        setCulturalCheck(null);
        return;
      }
      try {
        const res = await api.checkCultural(selectedGarments.map((g) => g.id));
        setCulturalCheck(res);
      } catch (err) {
        console.error("Cultural check error:", err);
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
        name: outfitName || "VietDrobe Lookbook",
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
    <div className="interior-page studio-page mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="page-intro flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-[#D8D0C1] dark:border-[#485047]">
        <div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#24251F] dark:text-[#EEE8DC]">
            Studio phối đồ
          </h1>
          <p className="page-lead">Chọn từng món, xem chúng đi cùng nhau và kiểm tra sự phù hợp văn hóa.</p>
        </div>

        <div className="studio-header-actions">{selectedGarments.length > 0 && <button onClick={clearAll} className="text-xs uppercase tracking-wider text-[#625F56] dark:text-[#B7AFA0] hover:text-[#9F3B30] dark:hover:text-[#D16F5D] transition-colors">Làm mới trang canvas</button>}</div>
      </div>

      <div ref={workspaceRef} className="studio-layout mt-8" style={{ gridTemplateColumns: `${leftWidth}% 12px minmax(0, 1fr) 12px ${rightWidth}%` }}>
        {/* LEFT COLUMN: Outfit Catalog (Garment Picker) */}
        <div className="studio-picker-pane flex flex-col gap-6">
          {/* Category Tabs */}
          <div className={`studio-category-tabs-shell ${categoryOverflow.left ? "has-left-overflow" : ""} ${categoryOverflow.right ? "has-right-overflow" : ""}`}>
            <div
              ref={categoryTabsRef}
              onScroll={updateCategoryOverflow}
              className="studio-category-tabs flex items-center gap-6 overflow-x-auto scrollbar-none border-b border-[#D8D0C1]/60 dark:border-[#485047] pb-3"
            >
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`text-xs uppercase tracking-wider whitespace-nowrap pb-1 transition-all relative ${
                    selectedCategory === tab.id
                      ? "text-[#24251F] dark:text-[#EEE8DC] font-semibold border-b-2 border-[#9F3B30] dark:border-[#D16F5D]"
                      : "text-[#625F56] dark:text-[#B7AFA0] hover:text-[#24251F] dark:hover:text-[#EEE8DC]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of items to pick */}
          <div className="studio-picker-grid grid grid-cols-2 gap-3 overflow-y-auto pr-1">
            {garmentError && <p role="alert" className="col-span-full text-sm text-[#625F56] dark:text-[#B7AFA0] py-10">Tủ đồ đang tạm thời không khả dụng. Hãy thử tải lại trang sau.</p>}
            {filteredGarments.map((g) => {
              const isSelected = selectedGarments.some((item) => item.id === g.id);
              return (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => toggleGarment(g)}
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? "Bỏ" : "Chọn"} ${g.display_name}`}
                  className={`group relative p-3 border flex flex-col items-center cursor-pointer transition-all bg-white dark:bg-[#232923] text-center ${
                    isSelected
                      ? "border-[#9F3B30] dark:border-[#D16F5D] ring-1 ring-[#9F3B30] dark:ring-[#D16F5D] bg-[#F4E9E3]/80 dark:bg-[#382724]/60"
                      : "border-[#D8D0C1] dark:border-[#485047] hover:border-[#24251F] dark:hover:border-[#EEE8DC]"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-[#9F3B30] dark:bg-[#D16F5D] text-white flex items-center justify-center text-[10px] shadow-2xs">
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
                  <span className="font-serif text-xs font-semibold text-[#24251F] dark:text-[#EEE8DC] line-clamp-1">
                    {g.display_name}
                  </span>
                  <span className="text-[10px] text-[#797468] dark:text-[#B7AFA0] mt-0.5">
                    {g.primary_color || g.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div role="separator" tabIndex={0} aria-orientation="vertical" aria-label="Điều chỉnh độ rộng tủ đồ và khung chat" aria-valuemin={MIN_LEFT} aria-valuemax={100 - rightWidth - MIN_CHAT} aria-valuenow={Math.round(leftWidth)} className="studio-divider" onPointerDown={event => handlePointerDown(event, "left")} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onKeyDown={event => handleDividerKey(event, "left")} onDoubleClick={() => { setLeftWidth(DEFAULT_LEFT); setRightWidth(DEFAULT_RIGHT); }}><span /></div>

        {/* MIDDLE COLUMN: Chat Assistant (ChatGPT-like) */}
        <div className="studio-chat-pane">
          <StudioChat
            onAddGarments={handleAddGarmentsFromChat}
            selectedGarments={selectedGarments}
          />
        </div>

        <div role="separator" tabIndex={0} aria-orientation="vertical" aria-label="Điều chỉnh độ rộng khung chat và khung phối" aria-valuemin={MIN_LEFT + MIN_CHAT} aria-valuemax={100 - MIN_RIGHT} aria-valuenow={Math.round(100 - rightWidth)} className="studio-divider" onPointerDown={event => handlePointerDown(event, "right")} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onKeyDown={event => handleDividerKey(event, "right")} onDoubleClick={() => { setLeftWidth(DEFAULT_LEFT); setRightWidth(DEFAULT_RIGHT); }}><span /></div>

        {/* RIGHT COLUMN: Minimal Action Canvas */}
        <div className="studio-canvas-pane flex flex-col gap-6">
          <div className="studio-canvas-panel bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] p-5 sm:p-6 flex flex-col overflow-hidden transition-colors duration-200">
            {/* Canvas Top Bar */}
            <div className="min-h-0 flex-1 flex flex-col">
              <div className="pb-3 border-b border-[#D8D0C1] dark:border-[#485047] flex items-center justify-between gap-2 flex-wrap shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-semibold text-[#24251F] dark:text-[#EEE8DC]">
                    Khung Phối
                  </span>
                  <span className="text-xs text-[#797468] dark:text-[#B7AFA0]">
                    ({selectedGarments.length})
                  </span>
                </div>

                {culturalCheck && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[#9F3B30] dark:border-[#D16F5D] text-[#9F3B30] dark:text-[#D16F5D]">
                    ✓ {Math.round(culturalCheck.score * 100)}% Chuẩn Mực
                  </span>
                )}
              </div>

              {/* Visual Canvas Items */}
              <div className="py-4 min-h-0 flex-1 overflow-y-auto pr-1">
                {selectedGarments.length === 0 ? (
                  <div className="h-full min-h-40 flex items-center justify-center text-center text-[#625F56] dark:text-[#B7AFA0] font-serif text-xs leading-relaxed">
                    Chọn trang phục từ tủ đồ bên trái hoặc nhận gợi ý từ trợ lý AI ở giữa.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedGarments.map((g) => (
                      <div
                        key={g.id}
                        className="relative p-2.5 bg-[#F5F1E9] dark:bg-[#2C332C] border border-[#D8D0C1] dark:border-[#485047] flex flex-col items-center text-center group"
                      >
                        <button
                          onClick={() => removeGarment(g.id)}
                          className="absolute top-1 right-1 p-1 text-[#797468] dark:text-[#B7AFA0] hover:text-[#9F3B30] dark:hover:text-[#D16F5D] transition-colors z-10"
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
                        <span className="font-serif text-[11px] font-semibold text-[#24251F] dark:text-[#EEE8DC] line-clamp-1">
                          {g.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cultural Warnings & Actions */}
            <div className="shrink-0">
              {culturalCheck && culturalCheck.violations.length > 0 && (
                <div className="mb-4 p-2.5 text-[11px] font-serif leading-relaxed border border-[#D8D0C1] dark:border-[#485047] bg-[#F4E9E3] dark:bg-[#382724] text-[#4A4C43] dark:text-[#D7D0C4] max-h-20 overflow-y-auto">
                  <strong className="text-[#9F3B30] dark:text-[#D16F5D]">Lưu ý: </strong>
                  {culturalCheck.violations[0].message}
                </div>
              )}

              <div className="pt-3 border-t border-[#D8D0C1] dark:border-[#485047] flex items-center gap-2">
                <button
                  onClick={() => setIsRentalOpen(true)}
                  disabled={selectedGarments.length === 0}
                  className="flex-1 py-3.5 bg-[#24251F] dark:bg-[#EEE8DC] text-[#F9F6F0] dark:text-[#121110] text-xs uppercase tracking-widest hover:bg-[#9F3B30] dark:hover:bg-[#D16F5D] dark:hover:text-white transition-colors disabled:opacity-40 font-medium text-center"
                >
                  Đặt Thuê Set Này
                </button>
                <button
                  onClick={handleSaveLookbook}
                  disabled={selectedGarments.length < 2}
                  title={savedSuccess ? "Đã lưu Lookbook" : "Lưu vào Lookbook"}
                  className="p-3.5 border border-[#D8D0C1] dark:border-[#485047] hover:border-[#24251F] dark:hover:border-[#EEE8DC] text-[#625F56] dark:text-[#B7AFA0] hover:text-[#24251F] dark:hover:text-[#EEE8DC] transition-colors disabled:opacity-40"
                >
                  <Bookmark className={`w-4 h-4 ${savedSuccess ? "fill-[#9F3B30] text-[#9F3B30]" : ""}`} />
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
