"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { GarmentCard } from "@/components/garment-card";
import { GarmentDetailModal } from "@/components/garment-detail-modal";
import { api } from "@/lib/api";
import { Garment } from "@/lib/types";

const CATEGORY_TABS = [
  { id: "all", label: "Tất Cả" },
  { id: "traditional_top", label: "Áo Cổ Phục" },
  { id: "traditional_bottom", label: "Quần & Váy Lụa" },
  { id: "headwear", label: "Mấn & Nón" },
  { id: "footwear", label: "Guốc & Sneaker" },
  { id: "accessory", label: "Phụ Kiện" },
];

export default function CatalogPage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTradFilter, setSelectedTradFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [error, setError] = useState("");
  const [activeGarment, setActiveGarment] = useState<Garment | null>(null);

  const fetchGarments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const isTrad =
        selectedTradFilter === "traditional"
          ? true
          : selectedTradFilter === "modern"
          ? false
          : undefined;

      const res = await api.getGarments({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        is_traditional: isTrad,
        search: submittedQuery || undefined,
      });
      setGarments(res.items);
    } catch (err) {
      console.error("Failed to load garments:", err);
      setError("Chưa thể mở tủ đồ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedTradFilter, submittedQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchGarments(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchGarments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchQuery.trim());
  };

  return (
    <div className="interior-page mx-auto max-w-7xl px-6 sm:px-8 py-12 sm:py-16">
      {/* Editorial Header */}
      <div className="page-intro flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#D8D0C1] dark:border-[#485047]">
        <div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#24251F] dark:text-[#EEE8DC]">
            Tủ đồ cổ phục
          </h1>
          <p className="page-lead">Những trang phục mang câu chuyện riêng, sẵn sàng để bạn khám phá và chọn thuê.</p>
        </div>

        {/* Minimal Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#797468] dark:text-[#625F56]" />
          <input
            aria-label="Tìm kiếm trang phục"
            type="text"
            placeholder="Tìm kiếm phục trang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-serif bg-white dark:bg-[#232923] text-[#24251F] dark:text-[#EEE8DC] border border-[#D8D0C1] dark:border-[#485047] focus:outline-hidden focus:border-[#24251F] dark:focus:border-[#EEE8DC] placeholder:text-[#797468] dark:placeholder:text-[#AAA495]"
          />
        </form>
      </div>

      {/* Understated Filter Row */}
      <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D0C1]/60 dark:border-[#485047] mb-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
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

        {/* Traditional / Modern Toggle */}
        <div className="flex items-center gap-4 text-xs font-serif">
          <button
            onClick={() => setSelectedTradFilter("all")}
            className={`transition-colors ${
              selectedTradFilter === "all" ? "text-[#24251F] dark:text-[#EEE8DC] font-bold underline" : "text-[#625F56] dark:text-[#B7AFA0]"
            }`}
          >
            Tất Cả
          </button>
          <span className="text-[#D8CEBE] dark:text-[#38332E]">/</span>
          <button
            onClick={() => setSelectedTradFilter("traditional")}
            className={`transition-colors ${
              selectedTradFilter === "traditional" ? "text-[#9F3B30] dark:text-[#D16F5D] font-bold underline" : "text-[#625F56] dark:text-[#B7AFA0]"
            }`}
          >
            Cổ Phục
          </button>
          <span className="text-[#D8CEBE] dark:text-[#38332E]">/</span>
          <button
            onClick={() => setSelectedTradFilter("modern")}
            className={`transition-colors ${
              selectedTradFilter === "modern" ? "text-[#24251F] dark:text-[#EEE8DC] font-bold underline" : "text-[#625F56] dark:text-[#B7AFA0]"
            }`}
          >
            Remix Gen Z
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="py-24 text-center text-[#625F56] dark:text-[#B7AFA0] font-serif text-sm flex flex-col items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-[#9F3B30] dark:text-[#D16F5D]" />
          <span>Đang mở trang di sản...</span>
        </div>
      ) : error ? (
        <div className="py-24 text-center font-serif text-sm text-[#625F56] dark:text-[#B7AFA0]"><p role="alert">{error}</p><button type="button" onClick={() => void fetchGarments()} className="mt-5 px-5 py-2 border border-[#24251F] dark:border-[#EEE8DC]">Thử lại</button></div>
      ) : garments.length === 0 ? (
        <div className="py-24 text-center text-[#625F56] dark:text-[#B7AFA0] font-serif text-sm">
          Không tìm thấy trang phục phù hợp. Thử một từ khóa hoặc bộ lọc khác.
        </div>
      ) : (
        <div className="catalog-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8">
          {garments.map((garment) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              onClickDetail={(g) => setActiveGarment(g)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <GarmentDetailModal
        garment={activeGarment}
        onClose={() => setActiveGarment(null)}
      />
    </div>
  );
}
