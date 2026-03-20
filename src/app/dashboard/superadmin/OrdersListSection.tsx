import { db } from "@/lib/db";
import { orders, users, tiers, orderItems } from "@/lib/db/schema";
import { eq, sql, desc, and, gte, lte, inArray } from "drizzle-orm";
import FulfillmentClient from "./FulfillmentClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrdersListSection({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    // Parse filters (duplicated from page for isolation, acceptable in streaming pattern)
    const startDate = searchParams?.startDate ? parseInt(searchParams.startDate as string) : undefined;
    const endDate = searchParams?.endDate ? parseInt(searchParams.endDate as string) : undefined;
    const branchId = searchParams?.branchId ? searchParams.branchId as string : undefined;
    const searchQuery = searchParams?.q ? searchParams.q as string : undefined;
    const statusFilter = searchParams?.status ? (searchParams.status as string).split(",") : ["PENDING_APPROVAL"];

    const conditions: any[] = [
        inArray(orders.status, statusFilter)
    ];

    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);
    const defaultEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999);

    const activeStart = startDate || defaultStart;
    const activeEnd = endDate || defaultEnd;

    conditions.push(gte(orders.createdAt, activeStart));
    conditions.push(lte(orders.createdAt, activeEnd));

    if (branchId && branchId !== "all") {
        conditions.push(eq(orders.buyerId, branchId));
    }

    if (searchQuery) {
        conditions.push(sql`(
            ${users.username} LIKE ${`%${searchQuery}%`} OR 
            ${users.branchName} LIKE ${`%${searchQuery}%`} OR 
            ${orders.id} LIKE ${`%${searchQuery}%`}
        )`);
    }

    const approvedOrdersData = await db
        .select({
            order: orders,
            buyer: users,
            tier: tiers,
        })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .innerJoin(tiers, eq(orders.tierId, tiers.id))
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt));

    const orderIds = approvedOrdersData.map(o => o.order.id);
    const allItems = orderIds.length > 0
        ? await db.query.orderItems.findMany({
            where: inArray(orderItems.orderId, orderIds),
            with: { product: true }
        })
        : [];

    const approvedOrders = approvedOrdersData.map(o => {
        const items = allItems.filter(item => item.orderId === o.order.id);
        return {
            id: o.order.id,
            totalAmount: o.order.totalAmount,
            status: o.order.status,
            tierName: o.tier.name,
            tierId: o.order.tierId,
            buyerName: o.buyer.username,
            branchName: o.buyer.branchName,
            buyerPhone: o.buyer.phone,
            createdAt: o.order.createdAt,
            buyerNote: o.order.buyerNote,
            adminNotes: o.order.adminNotes,
            items: items.map(item => ({
                id: item.id,
                productId: item.productId,
                name: item.product?.name || "Produk Terhapus",
                sku: item.product?.sku || "-",
                unit: item.product?.unit || "Pcs",
                imageUrl: item.product?.imageUrl || null,
                quantity: item.quantity,
                price: item.priceAtPurchase,
            })),
        };
    });

    return (
        <Card className="mt-12">
            <CardHeader>
                <CardTitle>Manajemen Pesanan Keseluruhan</CardTitle>
            </CardHeader>
            <CardContent>
                <FulfillmentClient orders={approvedOrders} />
            </CardContent>
        </Card>
    );
}
