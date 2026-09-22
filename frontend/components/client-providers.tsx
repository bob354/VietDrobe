"use client";

import { RentalCartProvider } from "@/lib/rental-context";
import { RentalCartIndicator } from "@/components/rental-cart";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <RentalCartProvider>
      {children}
      <RentalCartIndicator />
    </RentalCartProvider>
  );
}
