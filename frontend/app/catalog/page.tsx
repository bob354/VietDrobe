"use client";

import { useEffect, useState } from "react";
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
  const [activeGarment, setActiveGarment] = useState<Garment | null>(null);

  const fetchGarments = async () => {
    setLoading(true);
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
        search: searchQuery || undefined,
      });
      setGarments(res.items);
    } catch (err) {
      console.error("Failed to load garments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarments();
  }, [selectedCategory, selectedTradFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGarments();
  };

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-12 sm:py-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E7DFD3] dark:border-[#2E2A26]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#9E2A2B] dark:text-[#D94142] font-serif block mb-2">
            Di Sản Khảo Cứu
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#1C1917] dark:text-[#EAE5DC]">
            Tủ Đồ Cổ Phục & Remix
          </h1>
        </div>

        {/* Minimal Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E] dark:text-[#78716C]" />
          <input
            type="text"
            placeholder="Tìm kiếm phục trang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-serif bg-white dark:bg-[#1C1A18] text-[#1C1917] dark:text-[#EAE5DC] border border-[#E7DFD3] dark:border-[#2E2A26] focus:outline-hidden focus:border-[#1C1917] dark:focus:border-[#EAE5DC] placeholder:text-[#A8A29E] dark:placeholder:text-[#78716C]"
          />
        </form>
      </div>

      {/* Understated Filter Row */}
      <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DFD3]/60 dark:border-[#2E2A26] mb-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
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

        {/* Traditional / Modern Toggle */}
        <div className="flex items-center gap-4 text-xs font-serif">
          <button
            onClick={() => setSelectedTradFilter("all")}
            className={`transition-colors ${
              selectedTradFilter === "all" ? "text-[#1C1917] dark:text-[#EAE5DC] font-bold underline" : "text-[#78716C] dark:text-[#A8A29E]"
            }`}
          >
            Tất Cả
          </button>
          <span className="text-[#D8CEBE] dark:text-[#38332E]">/</span>
          <button
            onClick={() => setSelectedTradFilter("traditional")}
            className={`transition-colors ${
              selectedTradFilter === "traditional" ? "text-[#9E2A2B] dark:text-[#D94142] font-bold underline" : "text-[#78716C] dark:text-[#A8A29E]"
            }`}
          >
            Cổ Phục
          </button>
          <span className="text-[#D8CEBE] dark:text-[#38332E]">/</span>
          <button
            onClick={() => setSelectedTradFilter("modern")}
            className={`transition-colors ${
              selectedTradFilter === "modern" ? "text-[#1C1917] dark:text-[#EAE5DC] font-bold underline" : "text-[#78716C] dark:text-[#A8A29E]"
            }`}
          >
            Remix Gen Z
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="py-24 text-center text-[#78716C] dark:text-[#A8A29E] font-serif text-sm flex flex-col items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-[#9E2A2B] dark:text-[#D94142]" />
          <span>Đang mở trang di sản...</span>
        </div>
      ) : garments.length === 0 ? (
        <div className="py-24 text-center text-[#78716C] dark:text-[#A8A29E] font-serif text-sm">
          Không tìm thấy trang phục phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8">
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
