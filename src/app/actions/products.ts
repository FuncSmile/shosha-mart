"use server";

import { db } from "@/lib/db";
import { products, tierPrices, tiers } from "@/lib/db/schema";
import { eq, and, or, isNull, sql, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as xlsx from "xlsx";
import { withTimeout } from "@/lib/utils/timeout";

export async function getProductsForBuyer(tierId: string, page: number = 1, limit: number = 10, search?: string) {
    try {
        const offset = (page - 1) * limit;

        let whereClause = and(
            isNull(products.deletedAt),
            or(
                isNull(tierPrices.isActive),
                eq(tierPrices.isActive, true)
            )
        );

        if (search) {
            whereClause = and(
                whereClause,
                or(
                    sql`LOWER(${products.name}) LIKE ${`%${search.toLowerCase()}%`}`,
                    sql`LOWER(${products.sku}) LIKE ${`%${search.toLowerCase()}%`}`
                )
            );
        }

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
            .where(whereClause)
            .limit(limit)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .leftJoin(
                tierPrices,
                and(
                    eq(tierPrices.productId, products.id),
                    eq(tierPrices.tierId, tierId)
                )
            )
            .where(whereClause);

        return {
            products: result.map(p => ({
                ...p,
                finalPrice: p.tierPrice ?? p.basePrice
            })),
            totalCount: countResult.count
        };
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return { products: [], totalCount: 0 };
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
        const product = await db.query.products.findFirst({
            where: eq(products.id, id)
        });

        if (!product || product.deletedAt) {
            return { success: false, error: "Produk tidak ditemukan atau sudah dihapus." };
        }

        await db.update(products)
            .set({ deletedAt: new Date() })
            .where(eq(products.id, id));

        revalidatePath("/dashboard/superadmin/products");
        return { success: true, message: "Produk berhasil diarsipkan (Soft Delete)!" };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { success: false, error: "Gagal menghapus produk." };
    }
}

export async function restoreProduct(id: string) {
    try {
        await db.update(products)
            .set({ deletedAt: null })
            .where(eq(products.id, id));

        revalidatePath("/dashboard/superadmin/products");
        return { success: true, message: "Produk berhasil dikembalikan!" };
    } catch (error) {
        console.error("Failed to restore product:", error);
        return { success: false, error: "Gagal mengembalikan produk." };
    }
}

export async function getAllProducts(page: number = 1, limit: number = 10, search?: string) {
    try {
        const offset = (page - 1) * limit;

        let whereClause: any = undefined;
        if (search) {
            whereClause = or(
                sql`LOWER(${products.name}) LIKE ${`%${search.toLowerCase()}%`}`,
                sql`LOWER(${products.sku}) LIKE ${`%${search.toLowerCase()}%`}`
            );
        }

        const allProducts = await db
            .select()
            .from(products)
            .where(whereClause)
            .orderBy(desc(products.createdAt))
            .limit(limit)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(whereClause);

        return {
            products: allProducts,
            totalCount: countResult.count
        };
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return { products: [], totalCount: 0 };
    }
}

export async function downloadProductTemplate() {
    try {
        const allTiers = await db.select().from(tiers);

        // Define standard columns
        const header = ["Nama Produk", "SKU", "Satuan (Unit)", "Stok", "Harga Dasar", "Deskripsi"];

        // Add dynamic tier columns
        allTiers.forEach(tier => {
            header.push(`Harga ${tier.name}`);
        });

        // Add dummy data for guidance
        const dummyRow = ["Solasi Bening", "SOL-001", "ROLL", 100, 40000, "Lakban berkualitas"];
        allTiers.forEach(() => dummyRow.push(42000));

        const wsName = "Template Produk";
        const wsData = [header, dummyRow];

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(wsData);
        xlsx.utils.book_append_sheet(wb, ws, wsName);

        const base64 = xlsx.write(wb, { type: "base64", bookType: "xlsx" });
        return { success: true, base64 };
    } catch (error) {
        console.error("Failed to generate template:", error);
        return { success: false, error: "Gagal membuat template." };
    }
}

export async function importProducts(formData: FormData) {
    return await withTimeout((async () => {
        try {
            const file = formData.get("file") as File;
            if (!file) {
                return { success: false, error: "File tidak ditemukan." };
            }

            if (file.size > 5 * 1024 * 1024) {
                return { success: false, error: "Ukuran file terlalu besar (Maksimal 5MB)." };
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const wb = xlsx.read(buffer, { type: "buffer" });
            const ws = wb.Sheets[wb.SheetNames[0]];

            const data = xlsx.utils.sheet_to_json(ws);
            if (!data || data.length === 0) {
                return { success: false, error: "File Excel kosong." };
            }

            // 1. Pre-fetch Tiers
            const allTiers = await db.select().from(tiers);
            
            // 2. Collect all SKUs for pre-fetching existing products
            const skus = Array.from(new Set(data.map((row: any) => row["SKU"]).filter(Boolean)));
            
            // 3. Batch fetch existing products using inArray
            let existingProducts: { id: string, sku: string }[] = [];
            if (skus.length > 0) {
                // Split into chunks if SKUs are more than 999 (SQLite limit)
                const chunkSize = 900;
                for (let i = 0; i < skus.length; i += chunkSize) {
                    const chunk = skus.slice(i, i + chunkSize);
                    const batch = await db.select({ id: products.id, sku: products.sku })
                        .from(products)
                        .where(inArray(products.sku, chunk));
                    existingProducts = [...existingProducts, ...batch];
                }
            }
            
            const productMap = new Map(existingProducts.map(p => [p.sku, p.id]));

            return await db.transaction(async (tx) => {
                let imported = 0;
                let updated = 0;
                
                const productsToUpsert: any[] = [];
                const tierPricesToUpsert: any[] = [];

                // 4. Process data in memory
                for (let i = 0; i < data.length; i++) {
                    const row = data[i] as any;
                    const name = row["Nama Produk"];
                    const sku = row["SKU"];
                    const unit = row["Satuan (Unit)"] || "Pcs";
                    const stock = Number(row["Stok"]) || 0;
                    const basePrice = Number(row["Harga Dasar"]);

                    if (!name || !sku || isNaN(basePrice)) continue;

                    let productId = productMap.get(sku);

                    if (productId) {
                        // Prepare Update
                        await tx.update(products)
                            .set({ name, unit, stock, basePrice, deletedAt: null })
                            .where(eq(products.sku, sku));
                        updated++;
                    } else {
                        // Prepare Insert
                        const [inserted] = await tx.insert(products)
                            .values({ name, sku, unit, stock, basePrice })
                            .returning({ id: products.id });
                        productId = inserted.id;
                        productMap.set(sku, productId);
                        imported++;
                    }

                    // Prepare Tier Prices
                    for (const tier of allTiers) {
                        const priceCol = `Harga ${tier.name}`;
                        if (row[priceCol] !== undefined && row[priceCol] !== "") {
                            const price = Number(row[priceCol]);
                            if (!isNaN(price)) {
                                // Collect for bulk upsert of tier prices
                                // Since SQLite doesn't have a clean multi-row upsert with different conditions for all rows easily via Drizzle yet
                                // we'll batch them manually or use a transaction with individual upserts
                                const existingTP = await tx.select({ id: tierPrices.id })
                                    .from(tierPrices)
                                    .where(and(eq(tierPrices.productId, productId), eq(tierPrices.tierId, tier.id)))
                                    .limit(1);

                                if (existingTP.length > 0) {
                                    await tx.update(tierPrices)
                                        .set({ price, isActive: true })
                                        .where(eq(tierPrices.id, existingTP[0].id));
                                } else {
                                    await tx.insert(tierPrices)
                                        .values({ productId, tierId: tier.id, price, isActive: true });
                                }
                            }
                        }
                    }
                }

                revalidatePath("/dashboard/superadmin/products");
                return {
                    success: true,
                    message: `Berhasil mengimport ${imported} barang, memperbarui ${updated} barang.`
                };
            });

        } catch (error: any) {
            console.error("Failed to import products:", error);
            return { success: false, error: error.message || "Gagal mengimport produk." };
        }
    })(), 8000);
}

