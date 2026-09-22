"use client";

import { useState } from "react";
import { X, Calendar, MapPin, CheckCircle2, ChevronRight } from "lucide-react";
import { Garment } from "@/lib/types";
import Image from "next/image";

interface RentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  garments: Garment[];
}

const SIZES = ["S", "M", "L", "XL"];
const MOCK_PRICE = 150000; // Mock daily rent per piece

export function RentalModal({ isOpen, onClose, garments }: RentalModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [sizes, setSizes] = useState<Record<string, string>>({});
  
  // Calculate dates (tomorrow to +3 days)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const returnD = new Date(tomorrow);
  returnD.setDate(returnD.getDate() + 3);
  
  const startDateStr = tomorrow.toISOString().split("T")[0];
  const endDateStr = returnD.toISOString().split("T")[0];

  if (!isOpen) return null;

  const days = 3;
  const subtotal = garments.length * MOCK_PRICE * days;
  const discount = garments.length >= 3 ? subtotal * 0.15 : 0;
  const total = subtotal - discount;
  const deposit = total * 0.3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("success");
  };

  const resetAndClose = () => {
    setTimeout(() => {
      setStep("form");
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={resetAndClose} />
      
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none flex flex-col">
        {step === "form" ? (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E7DFD3] dark:border-[#2E2A26] bg-white dark:bg-[#1C1A18]">
              <div>
                <h2 className="font-serif text-2xl text-[#1C1917] dark:text-[#EAE5DC]">
                  Đặt Thuê Phục Trang
                </h2>
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-1">
                  Vui lòng kiểm tra danh sách và chọn size phù hợp
                </p>
              </div>
              <button 
                onClick={resetAndClose}
                className="p-2 text-[#78716C] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D94142] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col md:flex-row gap-8">
              {/* Left Column: Items */}
              <div className="flex-1 space-y-4">
                <div className="text-[11px] uppercase tracking-widest text-[#9E2A2B] dark:text-[#D94142] font-serif mb-2">
                  Danh Sách Trang Phục ({garments.length})
                </div>
                
                <div className="space-y-3">
                  {garments.map((g) => (
                    <div key={g.id} className="flex gap-4 p-3 border border-[#E7DFD3] dark:border-[#2E2A26] bg-[#FAF7F2] dark:bg-[#24211E]">
                      <div className="relative w-16 h-16 bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26]">
                        <Image
                          src={g.thumbnail_url || g.image_url || `/api/v1/images/${g.image_path}`}
                          alt={g.display_name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="font-serif text-sm text-[#1C1917] dark:text-[#EAE5DC] line-clamp-1">
                            {g.display_name}
                          </div>
                          <div className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                            {MOCK_PRICE.toLocaleString("vi-VN")}đ / ngày
                          </div>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {SIZES.map(s => (
                            <button
                              key={s}
                              onClick={() => setSizes({ ...sizes, [g.id]: s })}
                              className={`w-6 h-6 text-[10px] flex items-center justify-center border transition-colors ${
                                sizes[g.id] === s 
                                  ? "border-[#1C1917] bg-[#1C1917] text-white dark:border-[#EAE5DC] dark:bg-[#EAE5DC] dark:text-[#121110]" 
                                  : "border-[#E7DFD3] dark:border-[#2E2A26] text-[#78716C] dark:text-[#A8A29E] hover:border-[#9E2A2B] dark:hover:border-[#D94142]"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Form & Summary */}
              <div className="w-full md:w-[320px] flex flex-col gap-6">
                <form id="rental-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <input 
                      required 
                      placeholder="Họ và tên" 
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] focus:outline-hidden focus:border-[#9E2A2B] dark:focus:border-[#D94142] text-[#1C1917] dark:text-[#EAE5DC]" 
                    />
                    <input 
                      required 
                      type="tel" 
                      placeholder="Số điện thoại" 
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] focus:outline-hidden focus:border-[#9E2A2B] dark:focus:border-[#D94142] text-[#1C1917] dark:text-[#EAE5DC]" 
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-[#78716C] dark:text-[#A8A29E] mb-1 block">Ngày nhận</label>
                        <input type="date" defaultValue={startDateStr} className="w-full px-2 py-1.5 text-xs border border-[#E7DFD3] dark:border-[#2E2A26] bg-transparent text-[#1C1917] dark:text-[#EAE5DC]" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-[#78716C] dark:text-[#A8A29E] mb-1 block">Ngày trả</label>
                        <input type="date" defaultValue={endDateStr} className="w-full px-2 py-1.5 text-xs border border-[#E7DFD3] dark:border-[#2E2A26] bg-transparent text-[#1C1917] dark:text-[#EAE5DC]" />
                      </div>
                    </div>
                  </div>
                </form>

                <div className="bg-[#FAF7F2] dark:bg-[#24211E] p-4 border border-[#E7DFD3] dark:border-[#2E2A26] text-sm">
                  <div className="space-y-2 mb-3 pb-3 border-b border-[#E7DFD3] dark:border-[#2E2A26]">
                    <div className="flex justify-between text-[#78716C] dark:text-[#A8A29E]">
                      <span>Tạm tính ({days} ngày)</span>
                      <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-[#9E2A2B] dark:text-[#D94142]">
                        <span>Ưu đãi Combo 15%</span>
                        <span>-{discount.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between font-serif text-[#1C1917] dark:text-[#EAE5DC] mb-3">
                    <span>Tổng tiền</span>
                    <span className="font-semibold">{total.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between font-serif text-lg text-[#9E2A2B] dark:text-[#D94142]">
                    <span>Cọc (30%)</span>
                    <span className="font-semibold">{deposit.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#E7DFD3] dark:border-[#2E2A26] flex justify-end gap-3 bg-[#FAF7F2] dark:bg-[#24211E]">
              <button 
                type="button" 
                onClick={resetAndClose}
                className="px-6 py-2.5 text-sm uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EAE5DC]"
              >
                Hủy
              </button>
              <button 
                form="rental-form"
                type="submit"
                className="px-8 py-2.5 bg-[#9E2A2B] dark:bg-[#D94142] text-white text-sm uppercase tracking-wider hover:bg-[#7a2021] dark:hover:bg-[#b83738] transition-colors"
              >
                Xác Nhận Đặt Thuê (Demo)
              </button>
            </div>
          </>
        ) : (
          /* Success Receipt UI */
          <div className="p-8 md:p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF1EE] dark:bg-[#2A1717] text-[#9E2A2B] dark:text-[#D94142] flex items-center justify-center mb-6 border border-[#9E2A2B]/20 dark:border-[#D94142]/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#78716C] dark:text-[#A8A29E] font-serif block mb-2">
              Xác nhận thành công
            </span>
            <h2 className="font-serif text-3xl font-normal text-[#1C1917] dark:text-[#EAE5DC] mb-8">
              Mã Đặt Thuê: VP-RENT-{Math.floor(1000 + Math.random() * 9000)}
            </h2>

            <div className="w-full max-w-md text-left bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] p-6 space-y-4 mb-8 relative">
              {/* Receipt edge decoration */}
              <div className="absolute -top-1.5 left-0 right-0 h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgMTBMNSAwTDEwIDEwTDE1IDBMMjAgMTBWMHgtMjB6IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgMTBMNSAwTDEwIDEwTDE1IDBMMjAgMTBWMHgtMjB6IiBmaWxsPSIjMUMxQTE4Ii8+PC9zdmc+')] bg-repeat-x"></div>

              <div className="flex justify-between items-center py-2 border-b border-[#E7DFD3] dark:border-[#2E2A26] border-dashed">
                <div className="flex items-center gap-2 text-sm text-[#78716C] dark:text-[#A8A29E]">
                  <Calendar className="w-4 h-4" /> Thời gian
                </div>
                <div className="text-sm font-medium text-[#1C1917] dark:text-[#EAE5DC]">
                  {startDateStr} <ChevronRight className="w-3 h-3 inline text-[#A8A29E]" /> {endDateStr}
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[#E7DFD3] dark:border-[#2E2A26] border-dashed">
                <div className="flex items-center gap-2 text-sm text-[#78716C] dark:text-[#A8A29E]">
                  <MapPin className="w-4 h-4" /> Nhận tại
                </div>
                <div className="text-sm font-medium text-[#1C1917] dark:text-[#EAE5DC] text-right">
                  Việt Phục Remix Studio<br/>
                  <span className="text-xs text-[#78716C] dark:text-[#A8A29E] font-normal">123 Phố Cổ, Hà Nội</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="text-sm text-[#78716C] dark:text-[#A8A29E]">
                  Số tiền cần cọc
                </div>
                <div className="text-lg font-serif font-semibold text-[#9E2A2B] dark:text-[#D94142]">
                  {deposit.toLocaleString("vi-VN")}đ
                </div>
              </div>
            </div>

            <button 
              onClick={resetAndClose}
              className="px-8 py-3 bg-[#1C1917] dark:bg-[#EAE5DC] text-[#F9F6F0] dark:text-[#121110] text-sm uppercase tracking-wider hover:bg-[#9E2A2B] dark:hover:bg-[#D94142] dark:hover:text-white transition-colors"
            >
              Đóng & Trở về
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
