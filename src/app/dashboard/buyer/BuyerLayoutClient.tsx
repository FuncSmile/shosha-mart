"use client";

import { useCartStore } from "@/store/cartStore";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BuyerLayoutClient({
    children,
    userId
}: {
    children: React.ReactNode;
    userId: string;
}) {
    const [mounted, setMounted] = useState(false);

    // Selectors
    const cart = useCartStore((state) => state.cart);
    const storeUserId = useCartStore((state) => state.userId);
    const setUserId = useCartStore((state) => state.setUserId);
    const clearCart = useCartStore((state) => state.clearCart);
    const expiresAt = useCartStore((state) => state.expiresAt);
    const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

    // Prevent hydration mismatch for zustand persist & handle user session validation
    useEffect(() => {
        setMounted(true);
        const now = Date.now();

        // Cek apakah user berubah atau waktu sudah expired (lebih dari 7 hari)
        if (userId && storeUserId !== userId) {
            clearCart();
            setUserId(userId);
        } else if (expiresAt && now > expiresAt) {
            clearCart();
        }
    }, [userId, storeUserId, expiresAt, clearCart, setUserId]);

    return (
        <div className="relative min-h-screen">
            {children}

            {/* Floating Action Button for Cart */}
            {mounted && totalItems > 0 && (
                <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50">
                    <Link href="/dashboard/buyer/cart">
                        <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center relative cursor-pointer transition-transform hover:scale-110 active:scale-95">
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                                {totalItems > 99 ? '99+' : totalItems}
                            </span>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
}
