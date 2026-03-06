"use server";

import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitOrder(
    buyerId: string,
    tierId: string,
    cartItems: { productId: string; quantity: number; priceAtPurchase: number }[]
) {
    if (!cartItems || cartItems.length === 0) {
        return { error: "Keranjang kosong" };
    }

    try {
        await db.transaction(async (tx) => {
            // 1. Verify stock for all items
            for (const item of cartItems) {
                const productData = await tx.select({ stock: products.stock, name: products.name })
                    .from(products)
                    .where(eq(products.id, item.productId));

                if (productData.length === 0) {
                    throw new Error(`Produk tidak ditemukan`);
                }

                if (productData[0].stock < item.quantity) {
                    throw new Error(`Stok produk ${productData[0].name} tidak mencukupi (Sisa: ${productData[0].stock})`);
                }
            }

            // 2. Insert order header
            const totalAmount = cartItems.reduce(
                (sum, item) => sum + item.priceAtPurchase * item.quantity,
                0
            );

            const [newOrder] = await tx
                .insert(orders)
                .values({
                    buyerId,
                    tierId,
                    totalAmount,
                    status: "PENDING_APPROVAL",
                })
                .returning();

            // 3. Insert order items
            const itemsToInsert = cartItems.map((item) => ({
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.priceAtPurchase,
            }));

            await tx.insert(orderItems).values(itemsToInsert);

            // 4. Deduct stock
            for (const item of cartItems) {
                await tx.update(products)
                    .set({ stock: sql`${products.stock} - ${item.quantity}` })
                    .where(eq(products.id, item.productId));
            }
        });

        revalidatePath("/dashboard/buyer");
        return { success: true, message: "Pesanan berhasil dibuat!" };
    } catch (error: any) {
        console.error("Failed to submit order:", error);
        return { success: false, error: error.message || "Gagal membuat pesanan." };
    }
}

export async function approveOrder(orderId: string) {
    try {
        await db
            .update(orders)
            .set({ status: "APPROVED" })
            .where(eq(orders.id, orderId));

        revalidatePath("/dashboard/admin-tier");
        revalidatePath("/dashboard/superadmin");
        return { success: true, message: "Pesanan disetujui!" };
    } catch (error) {
        return { success: false, error: "Gagal menyetujui pesanan." };
    }
}

export async function rejectOrder(orderId: string, reason: string) {
    try {
        if (!reason || reason.trim() === "") {
            return { error: "Alasan pembatalan harus diisi" };
        }

        await db.transaction(async (tx) => {
            await tx
                .update(orders)
                .set({
                    status: "REJECTED",
                    rejectionReason: reason
                })
                .where(eq(orders.id, orderId));

            // Restore stock for rejected items
            const items = await tx.select({ productId: orderItems.productId, quantity: orderItems.quantity })
                .from(orderItems)
                .where(eq(orderItems.orderId, orderId));

            for (const item of items) {
                await tx.update(products)
                    .set({ stock: sql`${products.stock} + ${item.quantity}` })
                    .where(eq(products.id, item.productId));
            }
        });

        revalidatePath("/dashboard/admin-tier");
        revalidatePath("/dashboard/superadmin");
        revalidatePath("/dashboard/buyer/orders");
        return { success: true, message: "Pesanan ditolak." };
    } catch (error) {
        return { success: false, error: "Gagal menolak pesanan." };
    }
}

export async function packOrder(orderId: string) {
    try {
        await db
            .update(orders)
            .set({ status: "PACKING" })
            .where(eq(orders.id, orderId));

        revalidatePath("/dashboard/superadmin");
        return { success: true, message: "Status pesanan: PACKING" };
    } catch (error) {
        return { success: false, error: "Gagal merubah status ke PACKING." };
    }
}

export async function processOrder(orderId: string) {
    try {
        await db
            .update(orders)
            .set({ status: "PROCESSED" })
            .where(eq(orders.id, orderId));

        revalidatePath("/dashboard/superadmin");
        revalidatePath("/dashboard/buyer/orders");
        return { success: true, message: "Pesanan berhasil diselesaikan!" };
    } catch (error) {
        return { success: false, error: "Gagal memproses pesanan." };
    }
}
