import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Product = {
    id: string;
    name: string;
    sku: string;
    basePrice?: number;
    tierPrice?: number | null;
    stock: number;
    unit?: string;
    imageUrl?: string | null;
};

export type CartItem = Product & { quantity: number };

interface CartState {
    cart: Record<string, CartItem>;
    userId: string | null;
    expiresAt: number | null;
    setUserId: (userId: string) => void;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => {
            const getExpiration = () => Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now

            return {
                cart: {},
                userId: null,
                expiresAt: null,

                setUserId: (userId) => set({ userId }),

                addToCart: (product) => set((state) => {
                    const current = state.cart[product.id];
                    const newQuantity = current ? current.quantity + 1 : 1;

                    if (newQuantity > product.stock) {
                        return state; // Do not add more than stock
                    }

                    return {
                        expiresAt: getExpiration(),
                        cart: {
                            ...state.cart,
                            [product.id]: {
                                ...product,
                                quantity: newQuantity,
                            },
                        },
                    };
                }),

                removeFromCart: (productId) => set((state) => {
                    const nextCart = { ...state.cart };
                    delete nextCart[productId];
                    return { cart: nextCart, expiresAt: Object.keys(nextCart).length > 0 ? getExpiration() : null };
                }),

                updateQuantity: (productId, quantity) => set((state) => {
                    const item = state.cart[productId];
                    if (!item) return state;

                    if (quantity <= 0) {
                        const nextCart = { ...state.cart };
                        delete nextCart[productId];
                        return { cart: nextCart, expiresAt: Object.keys(nextCart).length > 0 ? getExpiration() : null };
                    }

                    if (quantity > item.stock) {
                        return state;
                    }

                    return {
                        expiresAt: getExpiration(),
                        cart: {
                            ...state.cart,
                            [productId]: {
                                ...item,
                                quantity,
                            },
                        },
                    };
                }),

                clearCart: () => set({ cart: {}, expiresAt: null }),

                getTotalItems: () => {
                    const state = get();
                    return Object.values(state.cart).reduce((sum, item) => sum + item.quantity, 0);
                },

                getTotalPrice: () => {
                    const state = get();
                    return Object.values(state.cart).reduce((sum, item) => sum + (item.tierPrice || 0) * item.quantity, 0);
                }
            };
        },
        {
            name: 'b2b-cart-storage', // key in localStorage
        }
    )
);
