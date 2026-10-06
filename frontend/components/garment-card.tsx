"use client";

import Image from "next/image";
import { Garment } from "@/lib/types";

const ERA_SHORT: Record<string, string> = {
  nguyen: "Triều Nguyễn",
  le: "Thời Hậu Lê",
  ly_tran_le: "Lý - Trần - Lê",
  folk: "Dân gian",
  modern: "Đương đại",
  toan_quoc: "Toàn quốc",
};

interface GarmentCardProps {
  garment: Garment;
  onSelect?: (garment: Garment) => void;
  onClickDetail?: (garment: Garment) => void;
  selected?: boolean;
}

export function GarmentCard({ garment, onSelect, onClickDetail, selected = false }: GarmentCardProps) {
  return <button type="button" aria-pressed={selected} onClick={() => (onClickDetail ? onClickDetail(garment) : onSelect?.(garment))} className={`garment-card group ${selected ? "is-selected" : ""}`}>
    <span className="garment-image"><Image src={garment.thumbnail_url || garment.image_url || `/api/v1/images/${garment.image_path}`} alt={garment.display_name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" /><span className="garment-category">{garment.is_traditional ? "Cổ phục" : "Phối mới"}</span></span>
    <span className="garment-details"><strong>{garment.display_name}</strong><span className="garment-meta"><span>{ERA_SHORT[garment.era || ""] || "Đương đại"}</span><span>{garment.primary_color || "Xem chi tiết"}</span></span></span>
  </button>;
}
