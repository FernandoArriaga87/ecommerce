"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { track } from "@vercel/analytics";

export interface CartItem {
  productId: string;
  name: string;
  team: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "deportivo-cart";

function loadGuest(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuest(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function clearGuest() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
}

async function postSync(
  localItems: CartItem[],
  mode: "merge" | "replace"
): Promise<CartItem[] | null> {
  try {
    const res = await fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ localItems, mode }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.items) ? (data.items as CartItem[]) : null;
  } catch (e) {
    console.error("Cart sync failed", e);
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // When state comes from the server (initial load, login merge, logout reset),
  // skip the very next auto-persist so we don't bounce the same payload back.
  const skipNextPersistRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const handleLogin = async () => {
      const guest = loadGuest();
      // Always round-trip: guest→merge pulls back the combined cart; empty
      // guest still needs to hydrate whatever the DB already had.
      const merged = await postSync(guest, "merge");
      skipNextPersistRef.current = true;
      setItems(merged ?? guest);
      clearGuest();
    };

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        await handleLogin();
      } else {
        skipNextPersistRef.current = true;
        setItems(loadGuest());
      }
      setHydrated(true);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);

      if (event === "SIGNED_IN" && loggedIn) {
        await handleLogin();
      } else if (event === "SIGNED_OUT") {
        skipNextPersistRef.current = true;
        setItems([]);
        clearGuest();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Persist: guest → localStorage; logged in → debounced server "replace".
  useEffect(() => {
    if (!hydrated) return;

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    if (isLoggedIn) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        postSync(items, "replace");
      }, 500);
    } else {
      saveGuest(items);
    }
  }, [items, hydrated, isLoggedIn]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === newItem.productId && i.size === newItem.size
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId && i.size === newItem.size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    track("add_to_cart", {
      productId: newItem.productId,
      name: newItem.name,
      size: newItem.size,
      price: newItem.price,
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.size === size))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: string, delta: number) => {
      setItems((prev) =>
        prev
          .map((i) => {
            if (i.productId === productId && i.size === size) {
              const newQty = i.quantity + delta;
              return newQty > 0 ? { ...i, quantity: newQty } : null;
            }
            return i;
          })
          .filter(Boolean) as CartItem[]
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
