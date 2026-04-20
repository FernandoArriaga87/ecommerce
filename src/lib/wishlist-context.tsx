"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  toggleWishlistAction,
  getWishlistIdsAction,
  mergeGuestWishlistAction,
} from "@/app/actions/wishlist";

interface WishlistContextType {
  ids: Set<string>;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<{ added: boolean; requiresAuth?: boolean; error?: string }>;
  count: number;
  isLoggedIn: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "deportivo-wishlist";

function loadGuest(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuest(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function clearGuest() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        const guestIds = loadGuest();
        if (guestIds.length > 0) {
          const res = await mergeGuestWishlistAction(guestIds);
          if ("success" in res) clearGuest();
        }
        const serverIds = await getWishlistIdsAction();
        setIds(new Set(serverIds));
      } else {
        setIds(new Set(loadGuest()));
      }
      setHydrated(true);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);

      if (event === "SIGNED_IN" && loggedIn) {
        const guestIds = loadGuest();
        if (guestIds.length > 0) {
          const res = await mergeGuestWishlistAction(guestIds);
          if ("success" in res) clearGuest();
        }
        const serverIds = await getWishlistIdsAction();
        setIds(new Set(serverIds));
      } else if (event === "SIGNED_OUT") {
        setIds(new Set());
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (hydrated && !isLoggedIn) saveGuest(Array.from(ids));
  }, [ids, hydrated, isLoggedIn]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId: string) => {
      const wasIn = ids.has(productId);

      setIds((prev) => {
        const next = new Set(prev);
        if (wasIn) next.delete(productId);
        else next.add(productId);
        return next;
      });

      if (!isLoggedIn) {
        return { added: !wasIn };
      }

      const res = await toggleWishlistAction(productId);
      if ("error" in res && res.error) {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasIn) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return { added: wasIn, error: res.error, requiresAuth: res.requiresAuth };
      }

      return { added: res.added ?? !wasIn };
    },
    [ids, isLoggedIn]
  );

  return (
    <WishlistContext.Provider
      value={{
        ids,
        isWishlisted,
        toggle,
        count: ids.size,
        isLoggedIn,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
