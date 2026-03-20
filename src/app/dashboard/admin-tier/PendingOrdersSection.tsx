import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, inArray, sql } from "drizzle-orm";
import ApprovalClient from "./ApprovalClient";

export default async function PendingOrdersSection({
    searchParams,
    session,
    branches
}: {
    searchParams: { [key: string]: string | string[] | undefined };
    session: { id: string; tierId: string };
    branches: { id: string }[];
}) {
    const startDate = searchParams?.startDate ? parseInt(searchParams.startDate as string) : undefined;
    const endDate = searchParams?.endDate ? parseInt(searchParams.endDate as string) : undefined;
    const branchId = searchParams?.branchId ? searchParams.branchId as string : undefined;
    const searchQuery = searchParams?.q ? searchParams.q as string : undefined;
    const statusFilter = searchParams?.status ? (searchParams.status as string).split(",") : ["PENDING_APPROVAL"];

    const conditions: any[] = [
        inArray(orders.status, statusFilter),
        eq(orders.tierId, session.tierId)
    ];

    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);
    const defaultEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999);

    const activeStart = startDate || defaultStart;
    const activeEnd = endDate || defaultEnd;

    conditions.push(gte(orders.createdAt, activeStart));
    conditions.push(lte(orders.createdAt, activeEnd));

    if (branchId) {
        const isManaged = branches.some(b => b.id === branchId);
        if (isManaged) {
            conditions.push(eq(orders.buyerId, branchId));
        } else {
            conditions.push(eq(orders.buyerId, "invalid-branch"));
        }
    } else {
        const managedBuyerIds = branches.map(b => b.id);
        if (managedBuyerIds.length > 0) {
            conditions.push(inArray(orders.buyerId, managedBuyerIds));
        } else {
            conditions.push(eq(orders.buyerId, "no-buyers-yet"));
        }
    }

    if (searchQuery) {
        conditions.push(sql`(
            ${users.username} LIKE ${`%${searchQuery}%`} OR 
            ${users.branchName} LIKE ${`%${searchQuery}%`} OR 
            ${orders.id} LIKE ${`%${searchQuery}%`}
        )`);
    }

    const pendingOrders = await db.query.orders.findMany({
        where: and(...conditions),
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
        buyerPhone: o.buyer.phone,
        buyerNote: o.buyerNote,
        createdAt: o.createdAt,
        items: o.items.map(item => ({
            id: item.id,
            productId: item.productId,
            name: item.product?.name || "Produk Terhapus",
            sku: item.product?.sku || "-",
            unit: item.product?.unit || "Pcs",
            imageUrl: item.product?.imageUrl || null,
            quantity: item.quantity,
            price: item.priceAtPurchase,
        })),
    }));

    return (
        <div className="mt-12">
            <ApprovalClient initialOrders={formattedOrders} />
        </div>
    );
}
