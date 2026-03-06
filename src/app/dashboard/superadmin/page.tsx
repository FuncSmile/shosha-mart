import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders, users, tiers } from "@/lib/db/schema";
import { eq, inArray, sql, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import FulfillmentClient from "./FulfillmentClient";
import { Suspense } from "react";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

export default async function SuperAdminDashboard() {
    const session = await getSession();

    if (!session || session.role !== "SUPERADMIN") {
        redirect("/dashboard");
    }

    // Fetch all orders with relational data for SuperAdmin Management
    const approvedOrdersData = await db.query.orders.findMany({
        with: {
            tier: true,
            buyer: true,
            items: {
                with: {
                    product: true,
                },
            },
        },
        orderBy: [desc(orders.createdAt)],
    });

    const approvedOrders = approvedOrdersData.map(o => ({
        id: o.id,
        totalAmount: o.totalAmount,
        status: o.status,
        tierName: o.tier.name,
        buyerName: o.buyer.username,
        branchName: o.buyer.branchName,
        createdAt: o.createdAt,
        adminNotes: o.adminNotes, // Include adminNotes
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

    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalUsers = totalUsersResult[0].count;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard Utama</h1>
                    <p className="text-neutral-500">Ringkasan performa seluruh tier dan total penjualan yang disetujui.</p>
                </div>

                <Card className="w-full md:w-auto">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
                        <CardTitle className="text-sm font-medium text-neutral-500 mr-8">Total Pengguna Aktif</CardTitle>
                        <Users className="h-4 w-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{totalUsers}</div>
                    </CardContent>
                </Card>
            </div>

            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardAnalytics role="SUPERADMIN" />
            </Suspense>

            <Card className="mt-12">
                <CardHeader>
                    <CardTitle>Manajemen Pesanan Keseluruhan</CardTitle>
                </CardHeader>
                <CardContent>
                    <FulfillmentClient orders={approvedOrders} />
                </CardContent>
            </Card>
        </div>
    );
}
