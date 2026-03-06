"use server";

import { db } from "@/lib/db";
import { products, tierPrices } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProductsForBuyer(tierId: string) {
    try {
        const result = await db
            .select({
                id: products.id,
                name: products.name,
                sku: products.sku,
                stock: products.stock,
                tierPrice: tierPrices.price,
                basePrice: products.basePrice,
                unit: products.unit,
                imageUrl: products.imageUrl,
            })
            .from(products)
            .leftJoin(
                tierPrices,
                and(
                    eq(tierPrices.productId, products.id),
                    eq(tierPrices.tierId, tierId)
                )
            )
            .where(
                or(
                    isNull(tierPrices.isActive),
                    eq(tierPrices.isActive, true)
                )
            );

        return result.map(p => ({
            ...p,
            finalPrice: p.tierPrice ?? p.basePrice
        }));
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

export async function createProduct(data: { name: string; sku: string; basePrice: number; stock: number; unit: string; imageUrl?: string }) {
    try {
        await db.insert(products).values({
            name: data.name,
            sku: data.sku,
            basePrice: data.basePrice,
            stock: data.stock,
            unit: data.unit,
            imageUrl: data.imageUrl,
        });
        revalidatePath("/dashboard/superadmin/products");
        return { success: true, message: "Produk berhasil ditambahkan!" };
    } catch (error) {
        console.error("Failed to create product:", error);
        return { success: false, error: "Gagal menambahkan produk. SKU mungkin sudah terpakai." };
    }
}

export async function updateProduct(id: string, data: { name: string; sku: string; basePrice: number; stock: number; unit: string; imageUrl?: string }) {
    try {
        await db.update(products)
            .set({
                name: data.name,
                sku: data.sku,
                basePrice: data.basePrice,
                stock: data.stock,
                unit: data.unit,
                imageUrl: data.imageUrl
            })
            .where(eq(products.id, id));
        revalidatePath("/dashboard/superadmin/products");
        return { success: true, message: "Produk berhasil diperbarui!" };
    } catch (error) {
        console.error("Failed to update product:", error);
        return { success: false, error: "Gagal memperbarui produk." };
    }
}

export async function deleteProduct(id: string) {
    try {
        await db.delete(products).where(eq(products.id, id));
        revalidatePath("/dashboard/superadmin/products");
        return { success: true, message: "Produk berhasil dihapus!" };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { success: false, error: "Gagal menghapus produk. Produk mungkin terkait dengan data lain." };
    }
}

export async function getAllProducts() {
    try {
        return await db.select().from(products);
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

