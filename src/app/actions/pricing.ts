"use server";

import { db } from "@/lib/db";
import { tierPrices, products, tiers } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAllTiers() {
    try {
        return await db.select().from(tiers);
    } catch (error) {
        console.error("Failed to fetch tiers:", error);
        return [];
    }
}

export async function upsertTierPrice(data: { productId: string; tierId: string; price?: number; isActive?: boolean }) {
    try {
        // Optional validation: Ensure tier price is not lower than base price
        if (data.price !== undefined) {
            const [product] = await db.select().from(products).where(eq(products.id, data.productId));
            if (product && data.price < product.basePrice) {
                return { error: `Harga tier tidak boleh lebih rendah dari base price (Rp ${product.basePrice.toLocaleString()})` };
            }
        }

        const existing = await db
            .select()
            .from(tierPrices)
            .where(
                and(
                    eq(tierPrices.productId, data.productId),
                    eq(tierPrices.tierId, data.tierId)
                )
            );

        if (existing.length > 0) {
            await db
                .update(tierPrices)
                .set({
                    ...(data.price !== undefined && { price: data.price }),
                    ...(data.isActive !== undefined && { isActive: data.isActive })
                })
                .where(
                    and(
                        eq(tierPrices.productId, data.productId),
                        eq(tierPrices.tierId, data.tierId)
                    )
                );
        } else {
            await db.insert(tierPrices).values({
                productId: data.productId,
                tierId: data.tierId,
                price: data.price ?? null,
                isActive: data.isActive ?? true
            });
        }

        revalidatePath("/dashboard/superadmin/pricing");
        revalidatePath("/dashboard/buyer"); // Revalidate buyer dashboard to show new prices
        return { success: true, message: "Harga tier berhasil diperbarui!" };
    } catch (error) {
        console.error("Failed to upsert tier price:", error);
        return { success: false, error: "Gagal menyimpan harga tier." };
    }
}
