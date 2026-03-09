"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useCartStore, CartItem } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ReorderButtonProps {
    items: {
        productId: string;
        name: string;
        sku: string;
        unit: string;
        imageUrl: string | null;
        quantity: number;
        price: number;
        // We'll need the current stock and price to properly add to cart
        // But for reorder, we can try to fetch them or pass them if available
        // The store's addToCartBulk expects full Product info
    }[];
}

export default function ReorderButton({ items }: { items: any[] }) {
    const { addToCartBulk } = useCartStore();
    const router = useRouter();

    const handleReorder = () => {
        try {
            const itemsToAddToCart: CartItem[] = items.map(item => ({
                id: item.productId,
                name: item.name,
                sku: item.sku,
                unit: item.unit,
                imageUrl: item.imageUrl,
                quantity: item.quantity,
                tierPrice: item.price,
                stock: item.stock,
            }));

            addToCartBulk(itemsToAddToCart);
            toast.success("Barang telah ditambahkan ke keranjang!");
            router.push("/dashboard/buyer/cart");
        } catch (error) {
            toast.error("Gagal menjadwalkan ulang pesanan.");
        }
    };

    return (
        <Button
            onClick={handleReorder}
            variant="outline"
            size="sm"
            className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 font-bold"
        >
            <RefreshCw className="h-4 w-4" />
            Pesan Lagi
        </Button>
    );
}
