"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MessageCircle, X, Send, ShoppingBag } from "lucide-react";
import { useRentalCart } from "@/lib/rental-context";
import { api } from "@/lib/api";
import { ChatMessage, Garment } from "@/lib/types";
import { cn } from "@/lib/utils";

const START_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Nhập dịp diện, phong cách hoặc đặc điểm trang phục để tìm mẫu trong kho.",
};

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([START_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useRentalCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<Garment[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestions]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setSuggestions([]);

    try {
      const response = await api.sendChatMessage([...messages, userMessage]);
      setSuggestions(response.items);
      if (response.items.length === 0) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Không tìm thấy mẫu phù hợp trong kho." }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Xin lỗi, đã có lỗi xảy ra khi kết nối. Vui lòng thử lại sau." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuggestionToCart = async (garmentId: string) => {
    try {
      const garment = await api.getGarmentById(garmentId);
      addToCart(garment, "M", 1);
    } catch (err) {
      console.error("Failed to add garment:", err);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 left-6 z-40 p-4 bg-[#9F3B30] dark:bg-[#D16F5D] text-white rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center",
          isOpen && "hidden"
        )}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-full md:w-[360px] bg-[#F9F6F0] dark:bg-[#121110] border-r border-[#D8D0C1] dark:border-[#485047] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#D8D0C1] dark:border-[#485047] bg-white dark:bg-[#232923]">
          <div className="flex items-center gap-3">
            <div className="seal-stamp w-8 h-8 rounded-sm text-sm font-serif font-bold flex items-center justify-center">
              越
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#24251F] dark:text-[#EEE8DC]">Tìm Trang Phục</h3>
              <p className="text-[10px] uppercase tracking-wider text-[#625F56] dark:text-[#B7AFA0]">Tìm kiếm ngữ nghĩa</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-[#625F56] hover:text-[#24251F] dark:text-[#B7AFA0] dark:hover:text-[#EEE8DC] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex flex-col max-w-[85%]", msg.role === "user" ? "self-end items-end" : "self-start items-start")}>
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-[#9F3B30] dark:bg-[#D16F5D] text-white rounded-br-sm"
                    : "bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] text-[#24251F] dark:text-[#EEE8DC] rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="self-start items-start bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] p-3 rounded-2xl rounded-bl-sm flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[#797468] animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#797468] animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#797468] animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <span className="text-[10px] uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] font-serif">Gợi ý trang phục</span>
              {suggestions.map((garment) => (
                <div key={garment.id} className="bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] p-3 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-serif font-bold text-sm text-[#24251F] dark:text-[#EEE8DC]">{garment.display_name}</span>
                  </div>
                  <div className="relative w-full aspect-square bg-[#F5F1E9] dark:bg-[#2C332C]">
                    <Image
                      src={garment.thumbnail_url || garment.image_url || `/api/v1/images/${garment.image_path}`}
                      alt={garment.display_name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-[#625F56] dark:text-[#B7AFA0]">
                    {[garment.material, garment.primary_color, garment.era].filter(Boolean).join(" · ")}
                  </p>
                  {garment.cultural_description && (
                    <p className="text-xs text-[#625F56] dark:text-[#B7AFA0] line-clamp-4">{garment.cultural_description}</p>
                  )}
                  <button
                    onClick={() => handleAddSuggestionToCart(garment.id)}
                    className="mt-1 flex items-center justify-center gap-2 py-2 bg-[#F5F1E9] dark:bg-[#2C332C] hover:bg-[#D8D0C1] dark:hover:bg-[#485047] text-[#24251F] dark:text-[#EEE8DC] text-xs uppercase tracking-wider transition-colors rounded"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Thêm vào giỏ thuê
                  </button>
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-[#232923] border-t border-[#D8D0C1] dark:border-[#485047]">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Tìm theo dịp, kiểu dáng, màu sắc..."
              className="w-full bg-[#F5F1E9] dark:bg-[#2C332C] border border-[#D8D0C1] dark:border-[#485047] rounded-xl py-3 pl-4 pr-12 text-sm text-[#24251F] dark:text-[#EEE8DC] placeholder-[#797468] dark:placeholder-[#625F56] focus:outline-hidden focus:border-[#9F3B30] dark:focus:border-[#D16F5D] resize-none h-[52px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 p-2 bg-[#9F3B30] dark:bg-[#D16F5D] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
