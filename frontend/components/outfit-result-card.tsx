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
    <div className="bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] p-6 sm:p-8 shadow-2xs relative transition-colors duration-200">
      {/* Top Title & Seal */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#D8D0C1] dark:border-[#485047]">
        <div>
          {outfit.headline && (
            <span className="text-[11px] font-serif uppercase tracking-widest text-[#9F3B30] dark:text-[#D16F5D] block mb-1">
              — {outfit.headline}
            </span>
          )}
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#24251F] dark:text-[#EEE8DC]">
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
                    ? "bg-[#F4E9E3] dark:bg-[#382724] border-2 border-[#9F3B30] dark:border-[#D16F5D] shadow-xs"
                    : "bg-[#F5F1E9] dark:bg-[#2C332C] border border-[#D8D0C1]/80 dark:border-[#485047]"
                }`}
              >
                {isPinned && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 text-[9px] font-serif uppercase tracking-widest bg-[#9F3B30] dark:bg-[#D16F5D] text-[#F5F1E9] px-2 py-0.5 whitespace-nowrap shadow-xs">
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
                <span className="font-serif text-xs font-semibold text-[#24251F] dark:text-[#EEE8DC] line-clamp-1">
                  {g.display_name}
                </span>
                <span className="text-[10px] text-[#797468] dark:text-[#625F56] mt-0.5">
                  {g.primary_color || g.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editorial Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-t border-[#D8D0C1] dark:border-[#485047] text-xs font-serif leading-relaxed">
        {outfit.ai_styling_tip && (
          <div className="border-l-2 border-[#24251F] dark:border-[#EEE8DC] pl-3">
            <span className="text-[10px] uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] block mb-0.5 font-sans font-medium">
              Mẹo Diện Đồ
            </span>
            <p className="text-[#4A4C43] dark:text-[#D7D0C4]">{outfit.ai_styling_tip}</p>
          </div>
        )}

        {outfit.ai_cultural_note && (
          <div className="border-l-2 border-[#9F3B30] dark:border-[#D16F5D] pl-3">
            <span className="text-[10px] uppercase tracking-widest text-[#9F3B30] dark:text-[#D16F5D] block mb-0.5 font-sans font-medium">
              Điển Tích Văn Hóa
            </span>
            <p className="text-[#4A4C43] dark:text-[#D7D0C4]">{outfit.ai_cultural_note}</p>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#D8D0C1] dark:border-[#485047] text-xs">
        <span className="text-[11px] text-[#797468] dark:text-[#625F56] font-serif">
          Độ hài hòa màu sắc: <strong className="text-[#24251F] dark:text-[#EEE8DC]">{Math.round((outfit.color_harmony_score || 0.9) * 100)}%</strong>
        </span>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#24251F] dark:border-[#EEE8DC] text-[#24251F] dark:text-[#EEE8DC] text-xs uppercase tracking-wider font-medium hover:bg-[#24251F] dark:hover:bg-[#EEE8DC] hover:text-[#F9F6F0] dark:hover:text-[#121110] transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#9F3B30] dark:text-[#D16F5D]" /> Đã Lưu Thẻ
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
