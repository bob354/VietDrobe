"use client";

import { useRentalCart } from "@/lib/rental-context";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export function RentalCartIndicator() {
  const { totalItems } = useRentalCart();

  if (totalItems === 0) return null;

  return (
    <Link href="/rent" className="fixed bottom-6 right-6 z-50 p-4 bg-[#1C1917] dark:bg-[#EAE5DC] text-[#F9F6F0] dark:text-[#121110] rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
      <div className="relative">
        <ShoppingBag className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#9E2A2B] dark:bg-[#D94142] text-[10px] text-white font-bold">
          {totalItems}
        </span>
      </div>
    </Link>
  );
}
