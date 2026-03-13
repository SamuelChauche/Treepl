import { useState, useCallback } from "react";
import { StorageService } from "../services/StorageService";

export function useCart() {
  const [cart, setCart] = useState<Set<string>>(() => StorageService.loadCart());

  const toggleCart = useCallback((id: string) => {
    setCart((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      StorageService.saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    const empty = new Set<string>();
    StorageService.saveCart(empty);
    setCart(empty);
  }, []);

  return { cart, toggleCart, clearCart };
}
