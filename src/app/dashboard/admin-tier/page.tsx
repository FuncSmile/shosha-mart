import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import ApprovalClient from "./ApprovalClient";

export default async function AdminTierDashboard() {
    const session = await getSession();

    if (!session || session.role !== "ADMIN_TIER" || !session.tierId) {
        redirect("/login");
    }

    const pendingOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.status, "PENDING_APPROVAL"),
            eq(orders.tierId, session.tierId)
        ),
        with: {
            buyer: true,
            items: {
                with: {
                    product: true,
                },
            },
        },
        orderBy: [desc(orders.createdAt)],
    });

    const formattedOrders = pendingOrders.map(o => ({
        id: o.id,
        totalAmount: o.totalAmount,
        status: o.status,
        buyerName: o.buyer.username,
        branchName: o.buyer.branchName,
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

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Persetujuan Pesanan (Admin Tier)</h1>
            <ApprovalClient initialOrders={formattedOrders} />
        </div>
    );
}
