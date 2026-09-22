"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Garment } from "@/lib/types";

interface GarmentDetailModalProps {
  garment: Garment | null;
  onClose: () => void;
}

const ERA_LABELS: Record<string, string> = {
  nguyen: "Triều Nguyễn (1802 — 1945)",
  le: "Thời Hậu Lê (1428 — 1789)",
  folk: "Dân gian Bắc Bộ / Quan Họ",
  modern: "Phong cách Đương đại / Gen Z",
  toan_quoc: "Toàn quốc",
};

export function GarmentDetailModal({ garment, onClose }: GarmentDetailModalProps) {
  if (!garment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/50 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#D8CEBE] dark:border-[#2E2A26] shadow-xl p-6 sm:p-10 transition-colors duration-200">
        {/* Minimal Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EAE5DC] transition-colors"
        >
          <X className="w-5 h-5 stroke-1" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
          {/* Artwork Image */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="relative w-full aspect-square bg-white dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] p-2 shadow-2xs">
              <Image
                src={garment.image_url || `/api/v1/images/${garment.image_path}`}
                alt={garment.display_name}
                fill
                className="object-contain p-2"
              />
            </div>

            <div className="mt-4 text-center">
              <span className="seal-stamp px-2 py-0.5 text-xs font-serif font-bold">
                {garment.is_traditional ? "CỔ PHỤC" : "REMIX"}
              </span>
            </div>
          </div>

          {/* Editorial Content */}
          <div className="sm:col-span-7 flex flex-col gap-4">
            <div>
              <span className="text-[11px] tracking-widest text-[#9E2A2B] dark:text-[#D94142] uppercase font-serif">
                {ERA_LABELS[garment.era || ""] || "Di sản phục trang"}
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#1C1917] dark:text-[#EAE5DC] mt-1 leading-snug">
                {garment.display_name}
              </h3>
              {garment.display_name_en && (
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E] italic mt-0.5 font-serif">{garment.display_name_en}</p>
              )}
            </div>

            {/* Cultural Storytelling */}
            {garment.cultural_description && (
              <div className="border-l-2 border-[#BFA57D] dark:border-[#C5A880] pl-3.5 py-1">
                <span className="text-[11px] uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] font-semibold block mb-1">
                  Điển Tích & Ý Nghĩa Văn Hóa
                </span>
                <p className="font-serif text-xs sm:text-sm text-[#44403C] dark:text-[#D6D0C7] leading-relaxed">
                  {garment.cultural_description}
                </p>
              </div>
            )}

            {/* Subtle Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[#E7DFD3] dark:border-[#2E2A26]">
              <div>
                <span className="text-[#A8A29E] dark:text-[#78716C] block text-[11px] uppercase tracking-wider">Chất liệu</span>
                <span className="font-serif text-[#1C1917] dark:text-[#EAE5DC]">{garment.material || "Lụa gấm tự nhiên"}</span>
              </div>
              <div>
                <span className="text-[#A8A29E] dark:text-[#78716C] block text-[11px] uppercase tracking-wider">Sắc màu</span>
                <span className="font-serif text-[#1C1917] dark:text-[#EAE5DC]">{garment.primary_color || "Màu mộc"}</span>
              </div>
            </div>

            {/* Remix compatibility */}
            {garment.remix_tags && garment.remix_tags.length > 0 && (
              <div className="pt-2 text-xs text-[#78716C] dark:text-[#A8A29E] flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#A8A29E] dark:text-[#78716C]">Phong cách:</span>
                <div className="flex flex-wrap gap-1.5">
                  {garment.remix_tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-white dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] text-[#1C1917] dark:text-[#EAE5DC] text-[11px] font-serif">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
