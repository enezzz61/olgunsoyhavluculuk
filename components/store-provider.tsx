"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product, UserRole } from "@/lib/products";
import { loadLocal, saveLocal } from "@/lib/storage";

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type Order = {
  id: string;
  userId: string;
  createdAt: string;
  status: "odeme_alindi" | "hazirlaniyor" | "kargoda" | "teslim_edildi" | "iptal";
  cargoCompany?: string | null;
  trackingCode?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  total: number;
  items: Array<CartItem & { unitPrice: number; name: string }>;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type LoginMode = "user" | "admin";

type ProfileUpdatePayload = {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

type StoreContextType = {
  user: AppUser | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  addToCart: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  register: (payload: RegisterPayload) => Promise<{ ok: boolean; message: string }>;
  login: (email: string, password: string, mode: LoginMode) => Promise<{ ok: boolean; message: string; user?: AppUser }>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<{ ok: boolean; message: string }>;
  deleteAccount: (password: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  checkout: () => Promise<{ ok: boolean; message: string; redirectUrl?: string }>;
  confirmPayment: (sessionId: string) => Promise<{ ok: boolean; message: string }>;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  cartCount: number;
};

const CART_KEY = "olgunsoy_cart";

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() =>
    loadLocal<CartItem[]>(CART_KEY, []),
  );
  const [orders, setOrders] = useState<Order[]>([]);

  const refreshProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products");
      const data = (await response.json()) as Product[];
      setProducts(data);
    } catch (error) {
      console.error("Failed to refresh products:", error);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        setOrders([]);
        return;
      }
      const data = (await response.json()) as { orders: Order[] };
      setOrders(data.orders ?? []);
    } catch (error) {
      console.error("Failed to refresh orders:", error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/products")
      .then((response) => {
        if (!response.ok) {
          console.error("Products fetch failed:", response.status);
          return null;
        }
        return response.json();
      })
      .then((data: Product[] | null) => {
        if (active && data) {
          setProducts(data);
        }
      })
      .catch((error) => console.error("Products error:", error));

    fetch("/api/session")
      .then((response) => {
        if (!response.ok) {
          console.error("Session fetch failed:", response.status);
          return null;
        }
        return response.json();
      })
      .then((data: { user: AppUser | null } | null) => {
        if (active && data) {
          setUser(data.user ?? null);
        }
      })
      .catch((error) => console.error("Session error:", error));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    fetch("/api/orders")
      .then((response) => {
        if (!response.ok) {
          return { orders: [] as Order[] };
        }
        return response.json() as Promise<{ orders: Order[] }>;
      })
      .then((data) => {
        if (active) {
          setOrders(data.orders ?? []);
        }
      })
      .catch((error) => console.error("Orders error:", error));

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    saveLocal(CART_KEY, cart);
  }, [cart]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setCart((prev) => {
      const found = prev.find((item) => item.productId === productId);
      if (found) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...prev, { productId, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        return { ok: false, message: errorData.message || "Kayit islemi basarisiz oldu" };
      }
      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        user?: AppUser;
      };
      if (data.user) {
        setUser(data.user);
      }
      return { ok: data.ok, message: data.message };
    } catch (error) {
      console.error("Register error:", error);
      return { ok: false, message: "Islem sirasinda hata olustu" };
    }
  }, []);

  const login = useCallback(async (email: string, password: string, mode: LoginMode) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, mode }),
      });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        return { ok: false, message: errorData.message || "Giris basarisiz oldu" };
      }
      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        user?: AppUser;
      };
      if (data.user) {
        setUser(data.user);
      }
      return { ok: data.ok, message: data.message, user: data.user };
    } catch (error) {
      console.error("Login error:", error);
      return { ok: false, message: "Islem sirasinda hata olustu" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    setOrders([]);
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    try {
      const response = await fetch("/api/auth/delete", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        return { ok: false, message: "Hesap silinemedi." };
      }

      const data = (await response.json()) as { ok: boolean; message: string };
      setUser(null);
      setOrders([]);
      setCart([]);
      return { ok: data.ok, message: data.message };
    } catch (error) {
      console.error("Delete account error:", error);
      return { ok: false, message: "Islem sirasinda hata olustu" };
    }
  }, []);

  const updateProfile = useCallback(async (payload: ProfileUpdatePayload) => {
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return { ok: false, message: "Profil guncellenmedi" };
      }

      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        user?: AppUser;
      };

      if (data.ok && data.user) {
        setUser(data.user);
      }

      return { ok: data.ok, message: data.message };
    } catch (error) {
      console.error("Profile update error:", error);
      return { ok: false, message: "Islem sirasinda hata olustu" };
    }
  }, []);

  const checkout = useCallback(async () => {
    if (!user) {
      return { ok: false, message: "Odeme icin once giris yapmaniz gerekiyor." };
    }

    if (!cart.length) {
      return { ok: false, message: "Sepetiniz bos." };
    }

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      if (!response.ok) {
        return { ok: false, message: "Siparis olusturulamadi." };
      }

      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        url?: string;
      };

      if (!data.ok) {
        return { ok: false, message: data.message || "Siparis olusturulamadi." };
      }

      if (!data.url) {
        return { ok: false, message: "Odeme oturumu olusturulamadi." };
      }

      return {
        ok: true,
        message: "Odeme adimina yonlendiriliyorsunuz.",
        redirectUrl: data.url,
      };
    } catch (error) {
      console.error("Checkout error:", error);
      return { ok: false, message: "Islem sirasinda hata olustu" };
    }
  }, [cart, user]);

  const confirmPayment = useCallback(async (sessionId: string) => {
    const response = await fetch("/api/payments/confirm", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      message?: string;
    };

    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message || "Odeme dogrulanamadi." };
    }

    setCart([]);
    await refreshOrders();

    return { ok: true, message: data.message || "Odeme dogrulandi." };
  }, [refreshOrders]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const value: StoreContextType = {
    user,
    products,
    cart,
    orders,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    register,
    login,
    updateProfile,
    deleteAccount,
    logout,
    checkout,
    confirmPayment,
    refreshProducts,
    refreshOrders,
    cartCount,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
}
