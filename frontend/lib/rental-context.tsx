"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CartItem, Garment } from "./types";

interface RentalCartContextType {
  cartItems: CartItem[];
  addToCart: (garment: Garment, size: string, quantity: number) => void;
  removeFromCart: (garmentId: string) => void;
  updateQuantity: (garmentId: string, quantity: number) => void;
  updateSize: (garmentId: string, size: string) => void;
  clearCart: () => void;
  totalItems: number;
}

const RentalCartContext = createContext<RentalCartContextType | undefined>(undefined);

export function RentalCartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (garment: Garment, size: string, quantity: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.garment.id === garment.id);
      if (existing) {
        return prev.map((item) =>
          item.garment.id === garment.id
            ? { ...item, size, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { garment, size, quantity }];
    });
  };

  const removeFromCart = (garmentId: string) => {
    setCartItems((prev) => prev.filter((item) => item.garment.id !== garmentId));
  };
  
  const updateQuantity = (garmentId: string, quantity: number) => {
    setCartItems((prev) => prev.map((item) => (item.garment.id === garmentId ? { ...item, quantity } : item)));
  }
  
  const updateSize = (garmentId: string, size: string) => {
    setCartItems((prev) => prev.map((item) => (item.garment.id === garmentId ? { ...item, size } : item)));
  }

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <RentalCartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, updateSize, clearCart, totalItems }}>
      {children}
    </RentalCartContext.Provider>
  );
}

export function useRentalCart() {
  const context = useContext(RentalCartContext);
  if (context === undefined) {
    throw new Error("useRentalCart must be used within a RentalCartProvider");
  }
  return context;
}
