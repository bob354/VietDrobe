"use client";

import Image from "next/image";
import { Check, Share2 } from "lucide-react";
import { Outfit } from "@/lib/types";
import { useState } from "react";

interface OutfitResultCardProps {
  outfit: Outfit;
  pinnedGarmentIds?: string[];
  onSave?: (outfit: Outfit) => void;
}

export function OutfitResultCard({ outfit, pinnedGarmentIds = [], onSave }: OutfitResultCardProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    onSave?.(outfit);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] p-6 sm:p-8 shadow-2xs relative transition-colors duration-200">
      {/* Top Title & Seal */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E7DFD3] dark:border-[#2E2A26]">
        <div>
          {outfit.headline && (
            <span className="text-[11px] font-serif uppercase tracking-widest text-[#9E2A2B] dark:text-[#D94142] block mb-1">
              — {outfit.headline}
            </span>
          )}
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#EAE5DC]">
            {outfit.name}
          </h3>
        </div>
      </div>

      {/* Garments Visual Strip */}
      <div className="py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {outfit.items.map((item, idx) => {
            const g = item.garment;
            if (!g) return null;
            const isPinned = pinnedGarmentIds.includes(g.id);
            return (
              <div
                key={g.id || idx}
                className={`relative flex flex-col items-center p-3 text-center transition-all ${
                  isPinned
                    ? "bg-[#FAF1EE] dark:bg-[#2A1717] border-2 border-[#9E2A2B] dark:border-[#D94142] shadow-xs"
                    : "bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3]/80 dark:border-[#2E2A26]"
                }`}
              >
                {isPinned && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 text-[9px] font-serif uppercase tracking-widest bg-[#9E2A2B] dark:bg-[#D94142] text-[#FAF7F2] px-2 py-0.5 whitespace-nowrap shadow-xs">
                    Món Tâm Điểm
                  </span>
                )}
                <div className="relative w-20 h-20 aspect-square mb-2 mt-1">
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

      {/* Editorial Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-t border-[#E7DFD3] dark:border-[#2E2A26] text-xs font-serif leading-relaxed">
        {outfit.ai_styling_tip && (
          <div className="border-l-2 border-[#1C1917] dark:border-[#EAE5DC] pl-3">
            <span className="text-[10px] uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] block mb-0.5 font-sans font-medium">
              Mẹo Diện Đồ
            </span>
            <p className="text-[#44403C] dark:text-[#D6D0C7]">{outfit.ai_styling_tip}</p>
          </div>
        )}

        {outfit.ai_cultural_note && (
          <div className="border-l-2 border-[#9E2A2B] dark:border-[#D94142] pl-3">
            <span className="text-[10px] uppercase tracking-widest text-[#9E2A2B] dark:text-[#D94142] block mb-0.5 font-sans font-medium">
              Điển Tích Văn Hóa
            </span>
            <p className="text-[#44403C] dark:text-[#D6D0C7]">{outfit.ai_cultural_note}</p>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E7DFD3] dark:border-[#2E2A26] text-xs">
        <span className="text-[11px] text-[#A8A29E] dark:text-[#78716C] font-serif">
          Độ hài hòa màu sắc: <strong className="text-[#1C1917] dark:text-[#EAE5DC]">{Math.round((outfit.color_harmony_score || 0.9) * 100)}%</strong>
        </span>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#1C1917] dark:border-[#EAE5DC] text-[#1C1917] dark:text-[#EAE5DC] text-xs uppercase tracking-wider font-medium hover:bg-[#1C1917] dark:hover:bg-[#EAE5DC] hover:text-[#F9F6F0] dark:hover:text-[#121110] transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#9E2A2B] dark:text-[#D94142]" /> Đã Lưu Thẻ
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" /> Lưu Thẻ Lookbook
            </>
          )}
        </button>
      </div>
    </div>
  );
}
