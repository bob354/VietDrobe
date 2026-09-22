"use client";

import Image from "next/image";
import { Garment } from "@/lib/types";

interface GarmentCardProps {
  garment: Garment;
  onSelect?: (garment: Garment) => void;
  onClickDetail?: (garment: Garment) => void;
  selected?: boolean;
}

export function GarmentCard({
  garment,
  onSelect,
  onClickDetail,
  selected = false,
}: GarmentCardProps) {
  return (
    <div
      onClick={() => (onClickDetail ? onClickDetail(garment) : onSelect?.(garment))}
      className={`group relative flex flex-col cursor-pointer transition-all duration-300 bg-white dark:bg-[#1C1A18] border ${
        selected
          ? "border-[#9E2A2B] dark:border-[#D94142] ring-1 ring-[#9E2A2B] dark:ring-[#D94142]"
          : "border-[#E7DFD3] dark:border-[#2E2A26] hover:border-[#BFA57D] dark:hover:border-[#C5A880] hover:shadow-xs"
      }`}
    >
      {/* Artwork container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#FAF7F2] dark:bg-[#24211E] p-2">
        <Image
          src={garment.thumbnail_url || garment.image_url || `/api/v1/images/${garment.image_path}`}
          alt={garment.display_name}
          fill
          className="object-contain p-1 group-hover:scale-[1.02] transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />

        {/* Small subtle corner indicator */}
        <span className="absolute top-3 left-3 text-[10px] tracking-widest font-serif text-[#78716C] dark:text-[#A8A29E] uppercase bg-white/90 dark:bg-[#1C1A18]/90 px-1.5 py-0.5 border border-[#E7DFD3] dark:border-[#2E2A26]">
          {garment.is_traditional ? "Cổ Phục" : "Remix"}
        </span>
      </div>

      {/* Understated gallery caption */}
      <div className="p-4 flex flex-col gap-1 border-t border-[#E7DFD3]/60 dark:border-[#2E2A26] bg-white dark:bg-[#1C1A18]">
        <h4 className="font-serif text-sm font-semibold text-[#1C1917] dark:text-[#EAE5DC] line-clamp-1 group-hover:text-[#9E2A2B] dark:group-hover:text-[#D94142] transition-colors">
          {garment.display_name}
        </h4>

        <div className="flex items-center justify-between text-[11px] text-[#78716C] dark:text-[#A8A29E] font-light">
          <span className="capitalize">{garment.era ? `Thời ${garment.era}` : "Đương đại"}</span>
          <span className="font-serif italic text-[#A8A29E] dark:text-[#78716C]">{garment.primary_color || ""}</span>
        </div>
      </div>
    </div>
  );
}
