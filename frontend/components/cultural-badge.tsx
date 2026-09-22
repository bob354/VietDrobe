import { cn } from "@/lib/utils";

interface CulturalBadgeProps {
  score?: number;
  warning?: string | null;
  className?: string;
  size?: "sm" | "md";
}

export function CulturalBadge({
  score = 1.0,
  warning,
  className,
  size = "md",
}: CulturalBadgeProps) {
  const isSafe = score >= 0.9 && !warning;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="inline-flex items-center gap-2">
        <span className="seal-stamp px-1.5 py-0.5 text-[10px] font-serif font-bold rounded-xs tracking-wider">
          {isSafe ? "CHUẨN" : "LƯU Ý"}
        </span>
        <span className="text-xs font-serif tracking-wider text-[#44403C] dark:text-[#D6D0C7]">
          Bảo chứng văn hóa • {Math.round(score * 100)}%
        </span>
      </div>

      {warning && (
        <p className="text-xs font-serif italic text-[#9E2A2B] dark:text-[#E57373] bg-[#FAF1EE] dark:bg-[#2A1717] p-2.5 border-l-2 border-[#9E2A2B] dark:border-[#D94142] leading-relaxed">
          {warning}
        </p>
      )}
    </div>
  );
}
