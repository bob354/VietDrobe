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
}: CulturalBadgeProps) {
  const isSafe = score >= 0.9 && !warning;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="inline-flex items-center gap-2">
        <span className="seal-stamp px-1.5 py-0.5 text-[10px] font-serif font-bold rounded-xs tracking-wider">
          {isSafe ? "CHUẨN" : "LƯU Ý"}
        </span>
        <span className="text-xs font-serif tracking-wider text-[#4A4C43] dark:text-[#D7D0C4]">
          Bảo chứng văn hóa • {Math.round(score * 100)}%
        </span>
      </div>

      {warning && (
        <p className="text-xs font-serif italic text-[#9F3B30] dark:text-[#E57373] bg-[#F4E9E3] dark:bg-[#382724] p-2.5 border-l-2 border-[#9F3B30] dark:border-[#D16F5D] leading-relaxed">
          {warning}
        </p>
      )}
    </div>
  );
}
