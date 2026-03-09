"use server";

import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@/lib/db/schema";
import { eq, sql, and, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import * as xlsx from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { sendWhatsappReminder } from "@/lib/whatsapp";

const sanitizePrice = (val: any): number => {
    if (typeof val === 'number') return Math.floor(val);
    if (!val) return 0;

    const cleaned = String(val).replace(/[^0-9.,]/g, "");

    // Check for multiple occurrences of dots or commas
    const dots = (cleaned.match(/\./g) || []).length;
    const commas = (cleaned.match(/,/g) || []).length;

    let numericString = cleaned;

    if (dots > 1) {
        // Multiple dots -> thousand separators
        numericString = cleaned.replace(/\./g, "");
    } else if (commas > 1) {
        // Multiple commas -> thousand separators
        numericString = cleaned.replace(/,/g, "");
    } else if (dots === 1 && commas === 1) {
        // Both exist: find which one is last (decimal)
        const lastDot = cleaned.lastIndexOf('.');
        const lastComma = cleaned.lastIndexOf(',');
        if (lastDot > lastComma) {
            // English: 40,000.00
            numericString = cleaned.replace(/,/g, "").split('.')[0];
        } else {
            // Indonesian: 40.000,00
            numericString = cleaned.replace(/\./g, "").split(',')[0];
        }
    } else if (dots === 1) {
        // Single dot: thousand (1.000) or decimal (1.5)?
        const parts = cleaned.split('.');
        if (parts[1].length === 3) {
            numericString = cleaned.replace(/\./g, "");
        } else {
            numericString = parts[0];
        }
    } else if (commas === 1) {
        // Single comma: thousand (1,000) or decimal (1,5)?
        const parts = cleaned.split(',');
        if (parts[1].length === 3) {
            numericString = cleaned.replace(/,/g, "");
        } else {
            numericString = parts[0];
        }
    }

    return parseInt(numericString) || 0;
};

export async function importOrders(formData: FormData, targetTierId: string, allowNegativeStock: boolean = false) {
    try {
        const session = await getSession();
        if (!session || session.role !== "SUPERADMIN") {
            return { success: false, error: "Hanya SuperAdmin yang dapat mengimport data." };
        }

        const file = formData.get("file") as File;
        if (!file) return { success: false, error: "File tidak ditemukan." };

        const buffer = Buffer.from(await file.arrayBuffer());
        const wb = xlsx.read(buffer, { type: "buffer" });
        const ws = wb.Sheets[wb.SheetNames[0]];

        const cellA1 = ws['A1']?.v;
        if (!cellA1) return { success: false, error: "Nama cabang (Cell A1) tidak ditemukan." };

        const branchName = String(cellA1).replace(/CABANG:?\s*/i, "").trim();

        const branchUser = await db.query.users.findFirst({
            where: and(eq(users.role, "BUYER"), eq(users.branchName, branchName))
        });

        if (!branchUser) {
            return { success: false, error: `Cabang '${branchName}' tidak ditemukan di database.` };
        }

        const data = xlsx.utils.sheet_to_json(ws, { range: 1 });
        if (data.length === 0) return { success: false, error: "Data pesanan tidak ditemukan." };

        return await db.transaction(async (tx) => {
            let successCount = 0;
            let fallbackCount = 0;
            const errors: string[] = [];
            const ordersGroupedByDate = new Map<string, any[]>();

            for (let i = 0; i < data.length; i++) {
                const row = data[i] as any;
                const dateRaw = row["TANGGAL"];
                const productName = row["NAMA BARANG"];
                const qty = Number(row["QTY"]);
                const rawPriceUnit = row["HARGA UNIT"];

                if (!productName || isNaN(qty)) continue;

                // 1. Find Product
                const product = await tx.query.products.findFirst({
                    where: eq(products.name, productName),
                    with: {
                        tierPrices: {
                            where: (tp, { eq }) => eq(tp.tierId, targetTierId)
                        }
                    }
                });

                if (!product) {
                    errors.push(`Baris ${i + 3}: Produk '${productName}' tidak ditemukan.`);
                    continue;
                }

                // 2. Resolve Price Hierarchy
                // Hierarchy: Excel (>0) -> Tier Price -> Base Price
                let priceAtPurchase = sanitizePrice(rawPriceUnit);

                if (priceAtPurchase <= 0) {
                    // Fallback to Tier Price
                    const tierPriceObj = product.tierPrices?.[0];
                    if (tierPriceObj && tierPriceObj.price !== null) {
                        priceAtPurchase = tierPriceObj.price;
                        console.log(`[Import Info] Baris ${i + 3}: Menggunakan harga TIER (Rp ${priceAtPurchase}) untuk '${productName}'`);
                    } else {
                        // Fallback to Base Price
                        priceAtPurchase = product.basePrice;
                        console.log(`[Import Info] Baris ${i + 3}: Menggunakan harga BASE (Rp ${priceAtPurchase}) untuk '${productName}'`);
                    }
                    fallbackCount++;
                }

                if (!allowNegativeStock && product.stock < qty) {
                    throw new Error(`Stok '${productName}' tidak mencukupi di baris ${i + 3} (Tersedia: ${product.stock}, Perlu: ${qty}).`);
                }

                const dateStr = dateRaw ? (typeof dateRaw === 'number' ?
                    new Date((dateRaw - 25569) * 86400 * 1000).toISOString().split('T')[0] :
                    String(dateRaw)) : new Date().toISOString().split('T')[0];

                if (!ordersGroupedByDate.has(dateStr)) {
                    ordersGroupedByDate.set(dateStr, []);
                }
                ordersGroupedByDate.get(dateStr)?.push({
                    productId: product.id,
                    quantity: qty,
                    priceAtPurchase,
                    name: productName
                });
            }

            if (ordersGroupedByDate.size === 0) {
                throw new Error("Tidak ada data valid untuk diimport. " + errors.join(", "));
            }

            for (const [date, items] of Array.from(ordersGroupedByDate.entries())) {
                const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.priceAtPurchase), 0);

                const [newOrder] = await tx.insert(orders).values({
                    buyerId: branchUser.id,
                    tierId: targetTierId,
                    totalAmount,
                    status: "SUCCESS",
                    createdAt: new Date(date).getTime()
                }).returning();

                await tx.insert(orderItems).values(
                    items.map(item => ({
                        orderId: newOrder.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        priceAtPurchase: item.priceAtPurchase
                    }))
                );

                for (const item of items) {
                    await tx.update(products)
                        .set({ stock: sql`${products.stock} - ${item.quantity}` })
                        .where(eq(products.id, item.productId));
                }

                successCount++;
            }

            revalidatePath("/dashboard/superadmin");
            revalidatePath("/dashboard/admin-tier/reports");

            return {
                success: true,
                message: `Berhasil mengimport ${successCount} pesanan. ${fallbackCount} harga diambil dari database (Tier/Base) karena kolom Excel kosong.`,
                errors: errors.length > 0 ? errors : undefined
            };
        });

    } catch (error: any) {
        console.error("Import failed:", error);
        return { success: false, error: error.message || "Gagal mengimport pesanan." };
    }
}


export async function submitOrder(
    buyerId: string,
    tierId: string,
    cartItems: { productId: string; quantity: number; priceAtPurchase: number }[],
    manualDate?: number
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
                    ...(manualDate ? { createdAt: manualDate } : {}) // Inject manual date if present
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

            // 5. Send WhatsApp Reminder (async, don't await so it doesn't block)
            // We fetch the buyer info here because we are still within the transaction/action scope
            // but we'll run the actual fetch call in a separate try-catch to not fail the order.
            (async () => {
                try {
                    const buyer = await db.query.users.findFirst({
                        where: eq(users.id, buyerId),
                    });

                    if (buyer) {
                        const invoiceNumber = newOrder.id.split("-")[0].toUpperCase();
                        const dateStr = format(new Date(), "dd MMMM yyyy HH:mm", { locale: id });
                        const branchName = buyer.branchName || "-";
                        
                        // Fetch product names for the reminder
                        const productIds = cartItems.map(i => i.productId);
                        const fetchedProducts = await db.query.products.findMany({
                            where: inArray(products.id, productIds)
                        });

                        const itemLines = cartItems.map(item => {
                            const p = fetchedProducts.find(fp => fp.id === item.productId);
                            return `- ${p?.name || "Produk"}: ${item.quantity} ${p?.unit || "Pcs"}`;
                        }).join("\n");

                        const message = `*PESANAN BARU TERIMA - SHOSHA MART*\n\n` +
                            `No. Invoice: #${invoiceNumber}\n` +
                            `Tanggal: ${dateStr}\n` +
                            `Cabang: ${branchName} (${buyer.username})\n\n` +
                            `*Daftar Barang:*\n${itemLines}\n\n` +
                            `*Total Pembelian: Rp ${totalAmount.toLocaleString('id-ID')}*\n\n` +
                            `Mohon Admin segera cek pesanan di dashboard:\n` +
                            `https://shosha-mart-plum.vercel.app/dashboard/\n\n` +
                            `Terima kasih.`;
                        
                        // Send to the specified Group ID
                        const groupId = "120363042860463569@g.us";
                        await sendWhatsappReminder(groupId, message);
                    }
                } catch (error) {
                    console.error("[WhatsApp Reminder] Error in background task:", error);
                }
            })();
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
        const session = await getSession();
        if (!session || (session.role !== "ADMIN_TIER" && session.role !== "SUPERADMIN")) {
            return { success: false, error: "Akses ditolak." };
        }

        const adminNotes = session.role === "SUPERADMIN" ? "Approved by SuperAdmin" : null;

        await db
            .update(orders)
            .set({
                status: "APPROVED",
                ...(adminNotes ? { adminNotes } : {})
            })
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
        const session = await getSession();
        if (!session || (session.role !== "ADMIN_TIER" && session.role !== "SUPERADMIN")) {
            return { success: false, error: "Akses ditolak." };
        }

        if (!reason || reason.trim() === "") {
            return { error: "Alasan pembatalan harus diisi" };
        }

        const finalReason = session.role === "SUPERADMIN" ? `[SuperAdmin]: ${reason}` : reason;

        await db.transaction(async (tx) => {
            await tx
                .update(orders)
                .set({
                    status: "REJECTED",
                    rejectionReason: finalReason
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
        const session = await getSession();
        if (!session || session.role !== "SUPERADMIN") {
            return { success: false, error: "Akses ditolak." };
        }

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
        const session = await getSession();
        if (!session || session.role !== "SUPERADMIN") {
            return { success: false, error: "Akses ditolak." };
        }

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

export async function bypassDeleteOrder(orderId: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== "SUPERADMIN") {
            return { success: false, error: "Hanya SuperAdmin yang dapat menghapus pesanan." };
        }

        await db.transaction(async (tx) => {
            // Restore stock before deleting items
            const items = await tx.select({ productId: orderItems.productId, quantity: orderItems.quantity })
                .from(orderItems)
                .where(eq(orderItems.orderId, orderId));

            for (const item of items) {
                await tx.update(products)
                    .set({ stock: sql`${products.stock} + ${item.quantity}` })
                    .where(eq(products.id, item.productId));
            }

            // Delete order items
            await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));

            // Delete order 
            await tx.delete(orders).where(eq(orders.id, orderId));
        });

        revalidatePath("/dashboard/superadmin");
        return { success: true, message: "Pesanan berhasil dihapus secara permanen!" };
    } catch (error) {
        return { success: false, error: "Gagal menghapus pesanan." };
    }
}

export async function getUserOrderHistory(userId: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "SUPERADMIN" && session.role !== "ADMIN_TIER")) {
            return { success: false, error: "Akses ditolak." };
        }

        const ordersData = await db.query.orders.findMany({
            where: eq(orders.buyerId, userId),
            with: {
                items: {
                    with: {
                        product: true,
                    },
                },
            },
            orderBy: [desc(orders.createdAt)],
        });

        const formattedOrders = ordersData.map(o => ({
            ...o,
            items: o.items.map(item => ({
                id: item.id,
                name: item.product?.name || "Produk Terhapus",
                sku: item.product?.sku || "-",
                unit: item.product?.unit || "Pcs",
                imageUrl: item.product?.imageUrl || null,
                quantity: item.quantity,
                price: item.priceAtPurchase,
            })),
        }));

        return { success: true, orders: formattedOrders };
    } catch (error) {
        console.error("Failed to fetch user order history:", error);
        return { success: false, error: "Gagal mengambil riwayat pesanan." };
    }
}

export async function updateOrderItems(
    orderId: string,
    newItems: { productId: string; quantity: number; priceAtPurchase: number }[]
) {
    try {
        const session = await getSession();
        if (!session || session.role !== "SUPERADMIN") {
            return { success: false, error: "Hanya SuperAdmin yang dapat mengedit pesanan." };
        }

        return await db.transaction(async (tx) => {
            // 1. Get existing items 
            const existingItems = await tx.select()
                .from(orderItems)
                .where(eq(orderItems.orderId, orderId));

            // 2. Restore all old stock first
            for (const item of existingItems) {
                await tx.update(products)
                    .set({ stock: sql`${products.stock} + ${item.quantity}` })
                    .where(eq(products.id, item.productId));
            }

            // 3. Delete old items
            await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));

            // 4. Validate and deduct new stock
            for (const item of newItems) {
                const productData = await tx.select({ stock: products.stock, name: products.name })
                    .from(products)
                    .where(eq(products.id, item.productId));

                if (productData.length === 0) {
                    throw new Error(`Produk tidak ditemukan`);
                }

                if (productData[0].stock < item.quantity) {
                    throw new Error(`Stok produk ${productData[0].name} tidak mencukupi (Sisa: ${productData[0].stock})`);
                }

                await tx.update(products)
                    .set({ stock: sql`${products.stock} - ${item.quantity}` })
                    .where(eq(products.id, item.productId));
            }

            // 5. Insert new items
            await tx.insert(orderItems).values(
                newItems.map(item => ({
                    orderId,
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtPurchase: item.priceAtPurchase
                }))
            );

            // 6. Update order total amount
            const newTotalAmount = newItems.reduce((sum, item) => sum + (item.quantity * item.priceAtPurchase), 0);
            await tx.update(orders)
                .set({ totalAmount: newTotalAmount })
                .where(eq(orders.id, orderId));

            revalidatePath("/dashboard/superadmin");
            return { success: true, message: "Pesanan berhasil diperbarui!" };
        });
    } catch (error: any) {
        console.error("Failed to update order items:", error);
        return { success: false, error: error.message || "Gagal memperbarui pesanan." };
    }
}
