"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  const [priceError, setPriceError] = useState("");
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    async function calculate() {
      if (cartItems.length === 0 || !rentalDate || !returnDate) {
        setCalcResponse(null);
        setPriceError("");
        return;
      }

      const start = new Date(rentalDate);
      const end = new Date(returnDate);
      if (end < start) { setCalcResponse(null); setPriceError("Ngày trả phải sau ngày nhận."); return; }
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

      if (days > 0) {
        try {
          setPriceError("");
          const res = await api.calculateRental(cartItems.map(i => i.garment.id), days, Object.fromEntries(cartItems.map(i => [i.garment.id, i.quantity])));
          setCalcResponse(res);
        } catch (err) {
          console.error("Calculation error:", err);
          setCalcResponse(null);
          setPriceError("Chưa thể tính tiền thuê. Vui lòng thử lại sau.");
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
    setBookingError("");
    try {
      const booking = await api.createBooking({
        customer_name: customerName.trim(), phone: phone.trim(), email: email.trim() || undefined,
        rental_date: rentalDate, return_date: returnDate,
        garment_ids: cartItems.map(item => ({ garment_id: item.garment.id, size: item.size, quantity: item.quantity })),
        notes: notes.trim() || undefined,
      });
      setBookingSuccess(booking.id);
      clearCart();
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError("Chưa gửi được yêu cầu đặt thuê. Vui lòng kiểm tra thông tin và thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  if (bookingSuccess) {
    return (
      <div className="interior-page mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] p-12 rounded-xl flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-[#9F3B30] dark:text-[#D16F5D] mb-6" />
          <h1 className="font-serif text-3xl font-bold text-[#24251F] dark:text-[#EEE8DC] mb-4">
            Đã gửi yêu cầu đặt thuê
          </h1>
          <p className="text-[#625F56] dark:text-[#B7AFA0] mb-2">Mã đơn hàng của bạn là:</p>
          <div className="text-xl font-mono font-bold text-[#24251F] dark:text-[#EEE8DC] bg-[#F5F1E9] dark:bg-[#2C332C] px-6 py-3 rounded-lg mb-8">
            {bookingSuccess}
          </div>
          <p className="text-sm text-[#625F56] dark:text-[#C3BBAE] mb-8 max-w-md">
            Yêu cầu đang chờ xác nhận. Vui lòng lưu mã này để tra cứu và chờ liên hệ qua số {phone}.
          </p>
          <Link href="/" className="px-8 py-3 bg-[#24251F] dark:bg-[#EEE8DC] text-[#F9F6F0] dark:text-[#121110] text-xs uppercase tracking-widest hover:bg-[#9F3B30] dark:hover:bg-[#D16F5D] transition-colors">
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="interior-page mx-auto max-w-7xl px-6 sm:px-8 py-12">
      <div className="page-intro mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#24251F] dark:text-[#EEE8DC]">
          Giỏ thuê của bạn
        </h1>
        <p className="page-lead">Xem lại trang phục, chọn ngày sử dụng và gửi yêu cầu đặt thuê.</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] rounded-xl">
          <p className="font-serif text-lg text-[#625F56] dark:text-[#B7AFA0] mb-6">Giỏ thuê của bạn đang trống.</p>
          <Link href="/catalog" className="inline-flex px-8 py-3 border border-[#24251F] dark:border-[#EEE8DC] text-[#24251F] dark:text-[#EEE8DC] text-xs uppercase tracking-widest hover:bg-[#24251F] hover:text-[#F9F6F0] transition-colors">
            Khám Phá Tủ Đồ
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h2 className="font-serif text-xl font-bold border-b border-[#D8D0C1] dark:border-[#485047] pb-4">
              Danh sách trang phục ({cartItems.length})
            </h2>
            <div className="flex flex-col gap-4">
              {cartItems.map((item) => (
                <div key={`${item.garment.id}-${item.size}`} className="flex gap-4 p-4 bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047]">
                  <div className="relative w-24 h-24 bg-[#F5F1E9] dark:bg-[#2C332C]">
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
                        <h3 className="font-serif font-bold text-base text-[#24251F] dark:text-[#EEE8DC]">{item.garment.display_name}</h3>
                        <p className="text-xs text-[#625F56] dark:text-[#B7AFA0] mt-1">{item.garment.primary_color || item.garment.type}</p>
                      </div>
                      <button type="button" aria-label={`Bỏ ${item.garment.display_name} khỏi giỏ`} onClick={() => removeFromCart(item.garment.id)} className="text-[#797468] hover:text-[#9F3B30] transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-4 items-center mt-4">
                      <select
                        aria-label={`Cỡ của ${item.garment.display_name}`}
                        value={item.size}
                        onChange={(e) => updateSize(item.garment.id, e.target.value)}
                        className="text-xs bg-transparent border border-[#D8D0C1] dark:border-[#485047] rounded px-2 py-1 focus:outline-hidden"
                      >
                        {["S", "M", "L", "XL"].map(sz => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                      <div className="flex items-center border border-[#D8D0C1] dark:border-[#485047] rounded text-xs">
                        <button type="button" aria-label={`Giảm số lượng ${item.garment.display_name}`} onClick={() => updateQuantity(item.garment.id, Math.max(1, item.quantity - 1))} className="px-2 py-1 hover:bg-[#F5F1E9] dark:hover:bg-[#2C332C]">-</button>
                        <span className="px-3 border-x border-[#D8D0C1] dark:border-[#485047]">{item.quantity}</span>
                        <button type="button" aria-label={`Tăng số lượng ${item.garment.display_name}`} onClick={() => updateQuantity(item.garment.id, item.quantity + 1)} className="px-2 py-1 hover:bg-[#F5F1E9] dark:hover:bg-[#2C332C]">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] p-6 sticky top-24">
              <h2 className="font-serif text-xl font-bold border-b border-[#D8D0C1] dark:border-[#485047] pb-4 mb-6">
                Thông tin đặt thuê
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rental-date" className="block text-xs uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] mb-2">Ngày nhận</label>
                    <input id="rental-date" type="date" required value={rentalDate} onChange={e => setRentalDate(e.target.value)} className="w-full bg-[#F5F1E9] dark:bg-[#2C332C] border border-[#D8D0C1] dark:border-[#485047] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#24251F]" />
                  </div>
                  <div>
                    <label htmlFor="return-date" className="block text-xs uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] mb-2">Ngày trả</label>
                    <input id="return-date" type="date" required value={returnDate} onChange={e => setReturnDate(e.target.value)} min={rentalDate} className="w-full bg-[#F5F1E9] dark:bg-[#2C332C] border border-[#D8D0C1] dark:border-[#485047] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#24251F]" />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-name" className="block text-xs uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] mb-2">Họ tên</label>
                  <input id="customer-name" type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full bg-[#F5F1E9] dark:bg-[#2C332C] border border-[#D8D0C1] dark:border-[#485047] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#24251F]" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer-phone" className="block text-xs uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] mb-2">Điện thoại</label>
                    <input id="customer-phone" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="090..." className="w-full bg-[#F5F1E9] dark:bg-[#2C332C] border border-[#D8D0C1] dark:border-[#485047] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#24251F]" />
                  </div>
                  <div>
                    <label htmlFor="customer-email" className="block text-xs uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] mb-2">Email (tùy chọn)</label>
                    <input id="customer-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@..." className="w-full bg-[#F5F1E9] dark:bg-[#2C332C] border border-[#D8D0C1] dark:border-[#485047] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#24251F]" />
                  </div>
                </div>

                <div>
                  <label htmlFor="rental-notes" className="block text-xs uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] mb-2">Ghi chú</label>
                  <textarea id="rental-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Số đo cụ thể hoặc yêu cầu thêm..." className="w-full bg-[#F5F1E9] dark:bg-[#2C332C] border border-[#D8D0C1] dark:border-[#485047] rounded px-3 py-2 text-sm focus:outline-hidden focus:border-[#24251F] h-20 resize-none" />
                </div>

                {/* Price Breakdown */}
                {calcResponse && (
                  <div className="mt-4 pt-4 border-t border-[#D8D0C1] dark:border-[#485047] flex flex-col gap-3">
                    <div className="flex justify-between text-sm text-[#625F56] dark:text-[#C3BBAE]">
                      <span>Tạm tính ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} món)</span>
                      <span>{formatMoney(calcResponse.subtotal)}</span>
                    </div>
                    {calcResponse.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-[#9F3B30] dark:text-[#D16F5D]">
                        <span>Giảm giá Combo ({calcResponse.combo_discount_percent}%)</span>
                        <span>-{formatMoney(calcResponse.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-[#625F56] dark:text-[#C3BBAE]">
                      <span>Tiền cọc dự tính</span>
                      <span>{formatMoney(calcResponse.deposit)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-serif font-bold text-[#24251F] dark:text-[#EEE8DC] mt-2 pt-2 border-t border-[#D8D0C1] dark:border-[#485047]">
                      <span>Tổng tiền thuê</span>
                      <span>{formatMoney(calcResponse.total)}</span>
                    </div>
                  </div>
                )}

                {priceError && <p role="alert" className="text-sm text-[#9F3B30] dark:text-[#D16F5D]">{priceError}</p>}
                {bookingError && <p role="alert" className="text-sm text-[#9F3B30] dark:text-[#D16F5D]">{bookingError}</p>}
                  <button
                  type="submit"
                  disabled={isSubmitting || !calcResponse}
                  className="w-full py-4 mt-4 bg-[#24251F] dark:bg-[#EEE8DC] text-[#F9F6F0] dark:text-[#121110] text-sm uppercase tracking-widest hover:bg-[#9F3B30] dark:hover:bg-[#D16F5D] dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu đặt thuê"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
