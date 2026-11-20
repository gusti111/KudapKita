import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublicProduct } from '@/domain/entities/Product';
import type { CartLine } from '@/domain/entities/CartLine';

const STORAGE_KEY = 'kudapkita.cart.v1';
export const CART_MAX_DISTINCT_PRODUCTS = 6;
export const CART_MAX_QUANTITY_PER_PRODUCT = 50;

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalEstimate: number;
  addItem: (product: PublicProduct) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};
const CartContext = createContext<CartContextValue | undefined>(undefined);

function readInitialCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = new Map<string, CartLine>();
    for (const value of parsed) {
      if (!value || typeof value !== 'object') continue;
      const line = value as Partial<CartLine>;
      if (typeof line.productId !== 'string' || !line.productId.trim()) continue;
      if (typeof line.productName !== 'string' || !line.productName.trim()) continue;
      if (!Number.isSafeInteger(line.quantity) || Number(line.quantity) < 1) continue;
      const quantity = Math.min(CART_MAX_QUANTITY_PER_PRODUCT, Number(line.quantity));
      const price = line.displayedUnitPrice;
      const displayedUnitPrice = typeof price === 'number' && Number.isSafeInteger(price) && price >= 0 ? price : null;
      const existing = normalized.get(line.productId);
      if (existing) {
        existing.quantity = Math.min(CART_MAX_QUANTITY_PER_PRODUCT, existing.quantity + quantity);
      } else if (normalized.size < CART_MAX_DISTINCT_PRODUCTS) {
        normalized.set(line.productId, {
          productId: line.productId,
          productName: line.productName.trim().slice(0, 120),
          quantity,
          displayedUnitPrice,
        });
      }
    }
    return [...normalized.values()];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readInitialCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // The cart remains usable for this page session when browser storage is blocked.
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalEstimate: lines.reduce((sum, line) => sum + (line.displayedUnitPrice ?? 0) * line.quantity, 0),
    addItem: (product) => {
      const existing = lines.find((line) => line.productId === product.id);
      if (existing && existing.quantity >= CART_MAX_QUANTITY_PER_PRODUCT) return false;
      if (!existing && lines.length >= CART_MAX_DISTINCT_PRODUCTS) return false;

      setLines((current) => {
        const found = current.find((line) => line.productId === product.id);
        if (found) return current.map((line) => line.productId === product.id 
          ? { ...line, quantity: Math.min(CART_MAX_QUANTITY_PER_PRODUCT, line.quantity + 1) }
          : line);
        if (current.length >= CART_MAX_DISTINCT_PRODUCTS) return current;
        return [...current, {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          displayedUnitPrice: product.price,
        }];
      });
      return true;
    },
    setQuantity: (productId, quantity) => setLines((current) => {
      if (!Number.isFinite(quantity)) return current;
      const safeQuantity = Math.floor(quantity);
      return safeQuantity <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) => line.productId === productId
          ? { ...line, quantity: Math.min(CART_MAX_QUANTITY_PER_PRODUCT, safeQuantity) }
          : line);
    }),
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
