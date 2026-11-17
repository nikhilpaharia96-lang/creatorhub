import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/types/api";

interface CartContextValue {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  isInCart: (productId: string) => boolean;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Client-only cart state (React state, per Section 8 — no global
 * state library needed for this). No backend Cart model exists in
 * the schema; cart contents are ephemeral until checkout creates a
 * real Order. This is a deliberate MVP scope choice, not an
 * oversight — a persisted server-side cart (e.g. for cross-device
 * continuity) is a reasonable v2 addition without requiring a
 * rewrite here, since checkout already takes a productIds array.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  const addItem = (product: Product) => {
    setItems((current) =>
      current.some((item) => item.id === product.id) ? current : [...current, product]
    );
  };

  const removeItem = (productId: string) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  };

  const clear = () => setItems([]);

  const isInCart = (productId: string) => items.some((item) => item.id === productId);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.priceAmount, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, isInCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
