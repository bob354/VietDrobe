"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRentalCart } from "@/lib/rental-context";
import { api } from "@/lib/api";
import { RentalCalculateResponse } from "@/lib/types";
import { Trash2, CheckCircle2 } from "lucide-react";

export default function RentPage() {
  const { cartItems, updateQuantity, updateSize, removeFromCart, clearCart } = useRentalCart();
  const [rentalDate, setRentalDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [calcResponse, setCalcResponse] = useState<RentalCalculateResponse | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function calculate() {
      if (cartItems.length === 0 || !rentalDate || !returnDate) {
        setCalcResponse(null);
        return;
      }
      
      const start = new Date(rentalDate);
      const end = new Date(returnDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      
      if (days > 0) {
        try {
          const res = await api.calculateRental(cartItems.map(i => i.garment.id), days);
          setCalcResponse(res);
        } catch (err) {
          console.error("Calculation error, using mock:", err);
          const subtotal = cartItems.reduce((acc, item) => acc + (150000 * item.quantity), 0) * days;
          const discount = cartItems.length >= 3 ? subtotal * 0.15 : 0;
          const total = subtotal - discount;
          setCalcResponse({
            items: cartItems.map(item => ({
              garment_id: item.garment.id,
              display_name: item.garment.display_name,
              daily_price: 150000,
              days,
              subtotal: 150000 * days * item.quantity,
            })),
            subtotal,
            combo_discount_percent: cartItems.length >= 3 ? 15 : 0,
            discount_amount: discount,
            deposit: total * 0.3,
            total,
          });
        }
      }
    }
    
    const delayDebounce = setTimeout(() => {
      calculate();
    }, 500);
    
    return () => clearTimeout(delayDebounce);
  }, [cartItems, rentalDate, returnDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0 || !rentalDate || !returnDate || !customerName || !phone) return;
    
    setIsSubmitting(true);
    try {
      // Simulate API call for booking
      await new Promise((resolve) => setTimeout(resolve, 800));
      const fakeId = `VP-RENT-${Math.floor(1000 + Math.random() * 9000)}`;
      setBookingSuccess(fakeId);
      clearCart();
    } catch (err) {
      console.error("Booking error:", err);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  if (bookingSuccess) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] p-12 rounded-xl flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-[#9E2A2B] dark:text-[#D94142] mb-6" />
          <h1 className="font-serif text-3xl font-bold text-[#1C1917] dark:text-[#EAE5DC] mb-4">
            Đặt Thuê Thành Công!
          </h1>
          <p className="text-[#78716C] dark:text-[#A8A29E] mb-2">Mã đơn hàng của bạn là:</p>
          <div className="text-xl font-mono font-bold text-[#1C1917] dark:text-[#EAE5DC] bg-[#FAF7F2] dark:bg-[#24211E] px-6 py-3 rounded-lg mb-8">
            {bookingSuccess}
          </div>
          <p className="text-sm text-[#57534E] dark:text-[#C4BDB5] mb-8 max-w-md">
            Chúng tôi sẽ liên hệ với bạn qua số điện thoại {phone} trong thời gian sớm nhất để xác nhận đơn hàng. Cảm ơn bạn đã lựa chọn Việt Phục Remix!
          </p>
          <button onClick={() => window.location.href = "/"} className="px-8 py-3 bg-[#1C1917] dark:bg-[#EAE5DC] text-[#F9F6F0] dark:text-[#121110] text-xs uppercase tracking-widest hover:bg-[#9E2A2B] dark:hover:bg-[#D94142] transition-colors">
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-12">
      <div className="mb-12">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#9E2A2B] dark:text-[#D94142] font-serif block mb-2">
          Dịch Vụ
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] dark:text-[#EAE5DC]">
          Đặt Thuê Trọn Gói
        </h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] rounded-xl">
          <p className="font-serif text-lg text-[#78716C] dark:text-[#A8A29E] mb-6">Giỏ thuê của bạn đang trống.</p>
          <button onClick={() => window.location.href = "/catalog"} className="px-8 py-3 border border-[#1C1917] dark:border-[#EAE5DC] text-[#1C1917] dark:text-[#EAE5DC] text-xs uppercase tracking-widest hover:bg-[#1C1917] hover:text-[#F9F6F0] transition-colors">
            Khám Phá Tủ Đồ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h2 className="font-serif text-xl font-bold border-b border-[#E7DFD3] dark:border-[#2E2A26] pb-4">
              Danh sách trang phục ({cartItems.length})
            </h2>
            <div className="flex flex-col gap-4">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26]">
                  <div className="relative w-24 h-24 bg-[#FAF7F2] dark:bg-[#24211E]">
                    <Image
                      src={item.garment.thumbnail_url || item.garment.image_url || `/api/v1/images/${item.garment.image_path}`}
                      alt={item.garment.display_name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-serif font-bold text-base text-[#1C1917] dark:text-[#EAE5DC]">{item.garment.display_name}</h3>
                        <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-1">{item.garment.primary_color || item.garment.type}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.garment.id)} className="text-[#A8A29E] hover:text-[#9E2A2B] transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-4 items-center mt-4">
                      <select
                        value={item.size}
                        onChange={(e) => updateSize(item.garment.id, e.target.value)}
                        className="text-xs bg-transparent border border-[#E7DFD3] dark:border-[#2E2A26] rounded px-2 py-1 focus:outline-hidden"
                      >
                        {["S", "M", "L", "XL"].map(sz => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                      <div className="flex items-center border border-[#E7DFD3] dark:border-[#2E2A26] rounded text-xs">
                        <button onClick={() => updateQuantity(item.garment.id, Math.max(1, item.quantity - 1))} className="px-2 py-1 hover:bg-[#FAF7F2] dark:hover:bg-[#24211E]">-</button>
                        <span className="px-3 border-x border-[#E7DFD3] dark:border-[#2E2A26]">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.garment.id, item.quantity + 1)} className="px-2 py-1 hover:bg-[#FAF7F2] dark:hover:bg-[#24211E]">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] p-6 sticky top-24">
              <h2 className="font-serif text-xl font-bold border-b border-[#E7DFD3] dark:border-[#2E2A26] pb-4 mb-6">
                Thông tin đặt thuê
              </h2>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] mb-2">Ngày nhận</label>
                    <input type="date" required value={rentalDate} onChange={e => setRentalDate(e.target.value)} className="w-full bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#1C1917]" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] mb-2">Ngày trả</label>
                    <input type="date" required value={returnDate} onChange={e => setReturnDate(e.target.value)} min={rentalDate} className="w-full bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#1C1917]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] mb-2">Họ Tên</label>
                  <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#1C1917]" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] mb-2">Điện thoại</label>
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="090..." className="w-full bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#1C1917]" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] mb-2">Email (Tùy chọn)</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@..." className="w-full bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#1C1917]" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] mb-2">Ghi chú</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Số đo cụ thể hoặc yêu cầu thêm..." className="w-full bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#1C1917] h-20 resize-none" />
                </div>

                {/* Price Breakdown */}
                {calcResponse && (
                  <div className="mt-4 pt-4 border-t border-[#E7DFD3] dark:border-[#2E2A26] flex flex-col gap-3">
                    <div className="flex justify-between text-sm text-[#57534E] dark:text-[#C4BDB5]">
                      <span>Tạm tính ({cartItems.length} món)</span>
                      <span>{formatMoney(calcResponse.subtotal)}</span>
                    </div>
                    {calcResponse.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-[#9E2A2B] dark:text-[#D94142]">
                        <span>Giảm giá Combo ({calcResponse.combo_discount_percent}%)</span>
                        <span>-{formatMoney(calcResponse.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-[#57534E] dark:text-[#C4BDB5]">
                      <span>Tiền cọc (Hoàn trả khi trả đồ)</span>
                      <span>{formatMoney(calcResponse.deposit)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-serif font-bold text-[#1C1917] dark:text-[#EAE5DC] mt-2 pt-2 border-t border-[#E7DFD3] dark:border-[#2E2A26]">
                      <span>Tổng thanh toán</span>
                      <span>{formatMoney(calcResponse.total)}</span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting || !calcResponse}
                  className="w-full py-4 mt-4 bg-[#1C1917] dark:bg-[#EAE5DC] text-[#F9F6F0] dark:text-[#121110] text-sm uppercase tracking-widest hover:bg-[#9E2A2B] dark:hover:bg-[#D94142] dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác Nhận Đặt Thuê"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
