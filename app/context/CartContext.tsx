'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  image?: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  _hasHydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setHasHydrated: (state: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getShippingCost: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      _hasHydrated: false,

      setHasHydrated: (val: boolean) => {
        set({ _hasHydrated: val });
      },

      addItem: (newItem: CartItem) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === newItem.id);
          let updatedItems;
          if (existingItem) {
            updatedItems = state.items.map((item) =>
              item.id === newItem.id
                ? { ...item, quantity: (item.quantity ?? 1) + (newItem.quantity || 1) }
                : item
            );
          } else {
            updatedItems = [...state.items, { ...newItem, quantity: newItem.quantity || 1 }];
          }
          return { items: updatedItems, isOpen: true };
        });
      },

      removeItem: (itemId: string) => {
        set((state) => {
          const updatedItems = state.items.filter((item) => item.id !== itemId);
          return { items: updatedItems };
        });
      },

      updateQuantity: (itemId: string, quantity: number) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
          );
          return { items: updatedItems };
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + (item.quantity ?? 1), 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * (item.quantity ?? 1), 0);
      },

      getShippingCost: () => {
        const subtotal = get().getTotalPrice();
        return subtotal >= 5000 ? 0 : 700;
      },
    }),
    {
      name: 'felicity-cart',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
