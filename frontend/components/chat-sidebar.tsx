"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ShoppingBag } from "lucide-react";
import { useRentalCart } from "@/lib/rental-context";
import { api } from "@/lib/api";
import { ChatMessage, GarmentSuggestion, CulturalCardInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useRentalCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<GarmentSuggestion[]>([]);
  const [culturalCards, setCulturalCards] = useState<CulturalCardInfo[]>([]);
  const [etiquetteTips, setEtiquetteTips] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  const startMessage: ChatMessage = {
    role: "assistant",
    content: "Xin chào! 👋 Mình là trợ lý tư vấn Việt phục. Để gợi ý set đồ phù hợp nhất, mình cần biết:\n\n1️⃣ Bạn muốn mặc cho **hoạt động** gì? (Biểu diễn văn nghệ / Tham quan di tích / Chụp kỷ yếu / Dạo phố...)",
  };

  useEffect(() => {
    if (isOpen && !hasStarted) {
      setMessages([startMessage]);
      setHasStarted(true);
    }
  }, [isOpen, hasStarted]);

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
          "fixed bottom-6 left-6 z-40 p-4 bg-[#9E2A2B] dark:bg-[#D94142] text-white rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center",
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
          "fixed top-0 left-0 h-full w-full md:w-[360px] bg-[#F9F6F0] dark:bg-[#121110] border-r border-[#E7DFD3] dark:border-[#2E2A26] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E7DFD3] dark:border-[#2E2A26] bg-white dark:bg-[#1C1A18]">
          <div className="flex items-center gap-3">
            <div className="seal-stamp w-8 h-8 rounded-sm text-sm font-serif font-bold flex items-center justify-center">
              越
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#1C1917] dark:text-[#EAE5DC]">Trợ Lý Việt Phục</h3>
              <p className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">AI Stylist</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-[#78716C] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:text-[#EAE5DC] transition-colors">
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
                    ? "bg-[#9E2A2B] dark:bg-[#D94142] text-white rounded-br-sm"
                    : "bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] text-[#1C1917] dark:text-[#EAE5DC] rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="self-start items-start bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] p-3 rounded-2xl rounded-bl-sm flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[#A8A29E] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#A8A29E] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#A8A29E] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <span className="text-[10px] uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] font-serif">Gợi ý trang phục</span>
              {suggestions.map((sug, idx) => (
                <div key={idx} className="bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] p-3 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-serif font-bold text-sm text-[#1C1917] dark:text-[#EAE5DC]">{sug.display_name}</span>
                    {sug.etiquette_score !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#24211E] text-[#9E2A2B] dark:text-[#D94142] font-semibold border border-[#E7DFD3] dark:border-[#2E2A26]">
                        {sug.etiquette_score}% Chuẩn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">{sug.reason}</p>
                  <button 
                    onClick={() => handleAddSuggestionToCart(sug.garment_id)}
                    className="mt-1 flex items-center justify-center gap-2 py-2 bg-[#FAF7F2] dark:bg-[#24211E] hover:bg-[#E7DFD3] dark:hover:bg-[#2E2A26] text-[#1C1917] dark:text-[#EAE5DC] text-xs uppercase tracking-wider transition-colors rounded"
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
              <span className="text-[10px] uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] font-serif">Thông tin văn hóa</span>
              {culturalCards.map((card, idx) => (
                <div key={idx} className="bg-[#FAF7F2] dark:bg-[#24211E] border-l-2 border-[#9E2A2B] dark:border-[#D94142] p-3">
                  <h4 className="font-serif font-bold text-sm text-[#1C1917] dark:text-[#EAE5DC] mb-1">{card.title} {card.era && `(${card.era})`}</h4>
                  <p className="text-xs text-[#57534E] dark:text-[#C4BDB5] leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Etiquette Tips */}
          {etiquetteTips.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 bg-[#FAF1EE] dark:bg-[#2A1717] border border-[#9E2A2B]/20 dark:border-[#D94142]/20 p-3 rounded-lg">
              <span className="text-[10px] uppercase tracking-widest text-[#9E2A2B] dark:text-[#D94142] font-serif mb-1">Lưu ý lễ nghi</span>
              <ul className="list-disc list-inside flex flex-col gap-1 text-xs text-[#1C1917] dark:text-[#EAE5DC]">
                {etiquetteTips.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-[#1C1A18] border-t border-[#E7DFD3] dark:border-[#2E2A26]">
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
              className="w-full bg-[#FAF7F2] dark:bg-[#24211E] border border-[#E7DFD3] dark:border-[#2E2A26] rounded-xl py-3 pl-4 pr-12 text-sm text-[#1C1917] dark:text-[#EAE5DC] placeholder-[#A8A29E] dark:placeholder-[#78716C] focus:outline-hidden focus:border-[#9E2A2B] dark:focus:border-[#D94142] resize-none h-[52px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 p-2 bg-[#9E2A2B] dark:bg-[#D94142] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
