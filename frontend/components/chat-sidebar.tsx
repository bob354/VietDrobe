"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ShoppingBag } from "lucide-react";
import { useRentalCart } from "@/lib/rental-context";
import { api } from "@/lib/api";
import { ChatMessage, GarmentSuggestion, CulturalCardInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

const START_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Chào bạn. Mình có thể giúp chọn trang phục theo dịp, giải thích chi tiết cổ phục và gợi ý cách phối. Bạn đang chuẩn bị cho dịp nào?",
};

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([START_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useRentalCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<GarmentSuggestion[]>([]);
  const [culturalCards, setCulturalCards] = useState<CulturalCardInfo[]>([]);
  const [etiquetteTips, setEtiquetteTips] = useState<string[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestions, culturalCards, etiquetteTips]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setSuggestions([]);
    setCulturalCards([]);
    setEtiquetteTips([]);

    try {
      const response = await api.sendChatMessage([...messages, userMessage]);
      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
      if (response.suggestions) setSuggestions(response.suggestions);
      if (response.cultural_cards) setCulturalCards(response.cultural_cards);
      if (response.etiquette_tips) setEtiquetteTips(response.etiquette_tips);
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
              <h3 className="font-serif font-bold text-[#24251F] dark:text-[#EEE8DC]">Trợ Lý Việt Phục</h3>
              <p className="text-[10px] uppercase tracking-wider text-[#625F56] dark:text-[#B7AFA0]">AI Stylist</p>
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
              {suggestions.map((sug, idx) => (
                <div key={idx} className="bg-white dark:bg-[#232923] border border-[#D8D0C1] dark:border-[#485047] p-3 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-serif font-bold text-sm text-[#24251F] dark:text-[#EEE8DC]">{sug.display_name}</span>
                    {sug.etiquette_score !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F1E9] dark:bg-[#2C332C] text-[#9F3B30] dark:text-[#D16F5D] font-semibold border border-[#D8D0C1] dark:border-[#485047]">
                        {sug.etiquette_score}% Chuẩn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#625F56] dark:text-[#B7AFA0]">{sug.reason}</p>
                  <button
                    onClick={() => handleAddSuggestionToCart(sug.garment_id)}
                    className="mt-1 flex items-center justify-center gap-2 py-2 bg-[#F5F1E9] dark:bg-[#2C332C] hover:bg-[#D8D0C1] dark:hover:bg-[#485047] text-[#24251F] dark:text-[#EEE8DC] text-xs uppercase tracking-wider transition-colors rounded"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Thêm vào giỏ thuê
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Cultural Cards */}
          {culturalCards.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <span className="text-[10px] uppercase tracking-widest text-[#625F56] dark:text-[#B7AFA0] font-serif">Thông tin văn hóa</span>
              {culturalCards.map((card, idx) => (
                <div key={idx} className="bg-[#F5F1E9] dark:bg-[#2C332C] border-l-2 border-[#9F3B30] dark:border-[#D16F5D] p-3">
                  <h4 className="font-serif font-bold text-sm text-[#24251F] dark:text-[#EEE8DC] mb-1">{card.title} {card.era && `(${card.era})`}</h4>
                  <p className="text-xs text-[#625F56] dark:text-[#C3BBAE] leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Etiquette Tips */}
          {etiquetteTips.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 bg-[#F4E9E3] dark:bg-[#382724] border border-[#9F3B30]/20 dark:border-[#D16F5D]/20 p-3 rounded-lg">
              <span className="text-[10px] uppercase tracking-widest text-[#9F3B30] dark:text-[#D16F5D] font-serif mb-1">Lưu ý lễ nghi</span>
              <ul className="list-disc list-inside flex flex-col gap-1 text-xs text-[#24251F] dark:text-[#EEE8DC]">
                {etiquetteTips.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
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
              placeholder="Nhập tin nhắn..."
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
