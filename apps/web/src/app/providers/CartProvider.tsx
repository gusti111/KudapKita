import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublicProduct } from '@/domain/entities/Product';
import type { CartLine } from '@/domain/entities/CartLine';

const STORAGE_KEY = 'kudapkita.cart.v1';
type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalEstimate: number;
  addItem: (product: PublicProduct) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};
const CartContext = createContext<CartContextValue | undefined>(undefined);

function readInitialCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readInitialCart);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)), [lines]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalEstimate: lines.reduce((sum, line) => sum + (line.displayedUnitPrice ?? 0) * line.quantity, 0),
    addItem: (product) => setLines((current) => {
      const found = current.find((line) => line.productId === product.id);
      if (found) return current.map((line) => line.productId === product.id ? { ...line, quantity: Math.min(50, line.quantity + 1) } : line);
      return [...current, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        displayedUnitPrice: product.price,
      }];
    }),
    setQuantity: (productId, quantity) => setLines((current) => quantity <= 0
      ? current.filter((line) => line.productId !== productId)
      : current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(50, quantity) } : line)),
    removeItem: (productId) => setLines((current) => current.filter((line) => line.productId !== productId)),
    clearCart: () => setLines([]),
  }), [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}
