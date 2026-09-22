"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, PlusCircle } from "lucide-react";
import { Garment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  chips?: string[];
  suggestedGarments?: Garment[];
  etiquetteScore?: number;
  culturalNotes?: string[];
}

interface StudioChatProps {
  onAddGarments: (garments: Garment[]) => void;
  selectedGarments?: Garment[];
  allGarments?: Garment[];
}

export function StudioChat({ onAddGarments, selectedGarments = [], allGarments = [] }: StudioChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Chào bạn! Mình là trợ lý Việt Phục. Bạn có thể hỏi mình bất cứ điều gì về lịch sử, giá thuê, hoặc nhờ mình nhận xét và hoàn thiện set đồ đang phối trên Canvas nhé!",
      chips: ["Đánh giá set đồ trên canvas", "Tư vấn đi chùa Hương", "Nguồn gốc Áo Nhật Bình"],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue("");
    setLoading(true);

    try {
      // 1. Prepare chat history & canvas context
      const chatHistory = nextMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const context = {
        canvas_garment_ids: selectedGarments.map(g => g.id),
      };

      // 2. Call real LLM API
      const res = await api.sendChatMessage(chatHistory, context);

      // 3. Resolve suggested garments with full objects from allGarments
      const catalog = allGarments.length > 0 ? allGarments : (await api.getGarments()).items;
      const resolvedGarments: Garment[] = [];
      for (const s of (res.suggestions || [])) {
        const found = catalog.find(g => g.id === s.garment_id);
        if (found && !resolvedGarments.some(rg => rg.id === found.id)) {
          resolvedGarments.push(found);
        }
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.reply || "Mình đã xem qua yêu cầu của bạn.",
        suggestedGarments: resolvedGarments.length > 0 ? resolvedGarments : undefined,
        etiquetteScore: res.suggestions?.[0]?.etiquette_score ? Math.round(res.suggestions[0].etiquette_score) : undefined,
        culturalNotes: res.etiquette_tips && res.etiquette_tips.length > 0 ? res.etiquette_tips : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat API error:", err);
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Xin lỗi bạn, kết nối tới AI đang gặp gián đoạn. Bạn thử gửi lại câu hỏi nhé!",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[640px] bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26]">
      {/* Header */}
      <div className="p-4 border-b border-[#E7DFD3] dark:border-[#2E2A26] flex items-center gap-2 bg-[#FAF7F2] dark:bg-[#24211E]">
        <Sparkles className="w-4 h-4 text-[#9E2A2B] dark:text-[#D94142]" />
        <h2 className="font-serif text-sm uppercase tracking-widest text-[#1C1917] dark:text-[#EAE5DC]">
          AI Stylist
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "px-4 py-3 max-w-[85%] text-sm rounded-lg",
                msg.role === "user"
                  ? "bg-[#1C1917] dark:bg-[#EAE5DC] text-white dark:text-[#121110]"
                  : "bg-[#FAF7F2] dark:bg-[#24211E] text-[#1C1917] dark:text-[#EAE5DC] border border-[#E7DFD3] dark:border-[#2E2A26]"
              )}
            >
              {msg.content}
            </div>
            
            {msg.chips && msg.role === "assistant" && (
              <div className="flex flex-wrap gap-2 mt-2">
                {msg.chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    className="text-xs px-3 py-1.5 border border-[#E7DFD3] dark:border-[#2E2A26] rounded-full text-[#78716C] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D94142] hover:border-[#9E2A2B] dark:hover:border-[#D94142] transition-colors bg-white dark:bg-[#1C1A18]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {msg.suggestedGarments && msg.role === "assistant" && (
              <div className="mt-3 w-full max-w-[90%] border border-[#E7DFD3] dark:border-[#2E2A26] bg-[#F9F6F0] dark:bg-[#121110] p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#9E2A2B] dark:text-[#D94142] font-serif">
                    Gợi ý phối đồ
                  </span>
                  {msg.etiquetteScore && (
                    <span className="text-[10px] font-bold text-[#1C1917] dark:text-[#EAE5DC]">
                      Độ Phù Hợp: {msg.etiquetteScore}%
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {msg.suggestedGarments.map(g => (
                    <div key={g.id} className="min-w-[70px] flex flex-col items-center gap-1">
                      <img 
                        src={g.thumbnail_url || g.image_url || `/api/v1/images/${g.image_path}`} 
                        alt={g.display_name}
                        className="w-12 h-12 object-contain bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] p-1"
                      />
                      <span className="text-[9px] text-center line-clamp-1">{g.display_name}</span>
                    </div>
                  ))}
                </div>

                {msg.culturalNotes && (
                  <ul className="mt-2 text-[10px] text-[#78716C] dark:text-[#A8A29E] space-y-1 list-disc pl-3">
                    {msg.culturalNotes.map((note, i) => <li key={i}>{note}</li>)}
                  </ul>
                )}

                <button
                  onClick={() => onAddGarments(msg.suggestedGarments!)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-[#1C1917] dark:bg-[#EAE5DC] text-white dark:text-[#121110] text-[10px] uppercase tracking-wider hover:bg-[#9E2A2B] dark:hover:bg-[#D94142] dark:hover:text-white transition-colors"
                >
                  <PlusCircle className="w-3 h-3" />
                  Ghép vào Canvas
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#78716C] dark:text-[#A8A29E]">
            <Sparkles className="w-3 h-3 animate-pulse" /> Đang phân tích...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#E7DFD3] dark:border-[#2E2A26] bg-[#FAF7F2] dark:bg-[#24211E]">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
            placeholder="Nhập yêu cầu của bạn..."
            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-[#1C1A18] border border-[#E7DFD3] dark:border-[#2E2A26] text-sm focus:outline-hidden focus:border-[#9E2A2B] dark:focus:border-[#D94142] text-[#1C1917] dark:text-[#EAE5DC]"
          />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#78716C] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D94142] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
