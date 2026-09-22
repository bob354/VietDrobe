"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Garment } from "@/lib/types";
import { useRentalCart } from "@/lib/rental-context";

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
  const { addToCart } = useRentalCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  useEffect(() => {
    if (!garment) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [garment, onClose]);
  if (!garment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24251F]/60 dark:bg-black/75" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="garment-title" onMouseDown={(event) => event.stopPropagation()} className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#F5F1E9] dark:bg-[#232923] border border-[#D8CEBE] dark:border-[#485047] shadow-xl p-6 sm:p-10 transition-colors duration-200">
        {/* Minimal Close button */}
        <button
          onClick={onClose}
          aria-label="Đóng chi tiết trang phục"
          className="absolute top-5 right-5 p-1.5 text-[#625F56] dark:text-[#B7AFA0] hover:text-[#24251F] dark:hover:text-[#EEE8DC] transition-colors"
        >
          <X className="w-5 h-5 stroke-1" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
          {/* The product details live alongside the artwork, not inside it. */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="relative w-full aspect-square bg-[#FAF7F2] border border-[#D8D0C1] dark:border-[#485047] p-2 shadow-2xs">
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
              <span className="text-[11px] tracking-widest text-[#9F3B30] dark:text-[#D16F5D] uppercase font-serif">
                {ERA_LABELS[garment.era || ""] || "Di sản phục trang"}
              </span>
              <h3 id="garment-title" className="font-serif text-2xl font-bold text-[#24251F] dark:text-[#EEE8DC] mt-1 leading-snug">
                {garment.display_name}
              </h3>
              {garment.display_name_en && (
                <p className="text-xs text-[#625F56] dark:text-[#B7AFA0] italic mt-0.5 font-serif">{garment.display_name_en}</p>
              )}
            </div>

            {/* Cultural Storytelling */}
            {garment.cultural_description && (
              <div className="border-l-2 border-[#BFA57D] dark:border-[#C5A880] pl-3.5 py-1">
                <span className="text-[11px] uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] font-semibold block mb-1">
                  Điển Tích & Ý Nghĩa Văn Hóa
                </span>
                <p className="font-serif text-xs sm:text-sm text-[#4A4C43] dark:text-[#D7D0C4] leading-relaxed">
                  {garment.cultural_description}
                </p>
              </div>
            )}

            {/* Subtle Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[#D8D0C1] dark:border-[#485047]">
              <div>
                <span className="text-[#797468] dark:text-[#625F56] block text-[11px] uppercase tracking-wider">Chất liệu</span>
                <span className="font-serif text-[#24251F] dark:text-[#EEE8DC]">{garment.material || "Chưa cập nhật"}</span>
              </div>
              <div>
                <span className="text-[#797468] dark:text-[#625F56] block text-[11px] uppercase tracking-wider">Sắc màu</span>
                <span className="font-serif text-[#24251F] dark:text-[#EEE8DC]">{garment.primary_color || "Màu mộc"}</span>
              </div>
            </div>

            {/* Remix compatibility */}
            {garment.remix_tags && garment.remix_tags.length > 0 && (
              <div className="pt-2 text-xs text-[#625F56] dark:text-[#B7AFA0] flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#797468] dark:text-[#625F56]">Phong cách:</span>
                <div className="flex flex-wrap gap-1.5">
                  {garment.remix_tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-white dark:bg-[#2C332C] border border-[#D8D0C1] dark:border-[#485047] text-[#24251F] dark:text-[#EEE8DC] text-[11px] font-serif">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="detail-actions"><button type="button" onClick={() => { addToCart(garment, "M", 1); setAddedId(garment.id); }}>{addedId === garment.id ? "Đã thêm vào giỏ thuê" : "Thêm vào giỏ thuê"}</button><Link href="/rent" onClick={onClose}>Xem giỏ thuê</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}
