"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, ArrowUpRight } from "lucide-react";
import { Garment } from "@/lib/types";
import { useRentalCart } from "@/lib/rental-context";

interface RentalModalProps { isOpen: boolean; onClose: () => void; garments: Garment[]; }
const sizes = ["S", "M", "L", "XL"];

export function RentalModal({ isOpen, onClose, garments }: RentalModalProps) {
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const { addToCart } = useRentalCart();
  const router = useRouter();
  if (!isOpen) return null;

  const continueToCart = () => {
    garments.forEach(garment => addToCart(garment, selectedSizes[garment.id] || "M", 1));
    onClose();
    router.push("/rent");
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24251F]/65" onMouseDown={onClose}>
    <div role="dialog" aria-modal="true" aria-labelledby="rental-modal-title" onMouseDown={event => event.stopPropagation()} className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#F5F1E9] dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] shadow-xl">
      <div className="flex items-start justify-between gap-6 border-b border-[#D8D0C1] dark:border-[#485047] p-6"><div><h2 id="rental-modal-title" className="font-serif text-3xl text-[#24251F] dark:text-[#EEE8DC]">Bộ đồ của bạn</h2><p className="text-sm text-[#625F56] dark:text-[#B7AFA0] mt-2">Chọn cỡ cho từng món trước khi xem giỏ thuê.</p></div><button type="button" onClick={onClose} aria-label="Đóng" className="p-2 text-[#625F56] dark:text-[#B7AFA0]"><X size={20} /></button></div>
      <div className="p-6 space-y-4">{garments.map(garment => <div className="flex gap-4 border-b border-[#D8D0C1] dark:border-[#485047] pb-4" key={garment.id}><div className="relative w-20 h-20 shrink-0 bg-white dark:bg-[#2C332C]"><Image src={garment.thumbnail_url || garment.image_url || `/api/v1/images/${garment.image_path}`} alt={garment.display_name} fill className="object-contain" /></div><div className="flex-1"><p className="font-serif text-base text-[#24251F] dark:text-[#EEE8DC]">{garment.display_name}</p><div className="flex gap-2 mt-3" aria-label={`Cỡ của ${garment.display_name}`}>{sizes.map(size => <button key={size} type="button" aria-pressed={(selectedSizes[garment.id] || "M") === size} onClick={() => setSelectedSizes(prev => ({ ...prev, [garment.id]: size }))} className={`w-8 h-8 border text-xs ${(selectedSizes[garment.id] || "M") === size ? "bg-[#24251F] text-white border-[#24251F] dark:bg-[#EEE8DC] dark:text-[#191D1A]" : "border-[#D8D0C1] dark:border-[#485047] text-[#625F56] dark:text-[#B7AFA0]"}`}>{size}</button>)}</div></div></div>)}</div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-[#EEE9DF] dark:bg-[#2C332C]"><p className="text-xs text-[#625F56] dark:text-[#B7AFA0] max-w-[24ch]">Ngày thuê và chi phí được tính ở bước tiếp theo.</p><button type="button" onClick={continueToCart} className="inline-flex items-center gap-5 px-5 py-3 bg-[#24251F] dark:bg-[#EEE8DC] text-white dark:text-[#191D1A] text-xs uppercase tracking-wider font-semibold">Tiếp tục đặt thuê <ArrowUpRight size={16} /></button></div>
    </div>
  </div>;
}
