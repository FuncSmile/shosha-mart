import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders, users, tiers, orderItems } from "@/lib/db/schema";
import { eq, sql, desc, and, gte, lte, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FulfillmentClient from "./FulfillmentClient";
import { Suspense } from "react";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import SuperAdminActions from "./SuperAdminActions";
import StockAlert from "@/components/dashboard/StockAlert";
import { products as productsTable } from "@/lib/db/schema";
import { Metadata } from "next";
import OrdersListSection from "./OrdersListSection";
import LoaderSkeleton from "@/components/dashboard/LoaderSkeleton";

export const metadata: Metadata = {
    title: "SuperAdmin Dashboard",
};

export default async function SuperAdminDashboard(
    props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();

    if (!session || session.role !== "SUPERADMIN") {
        redirect("/dashboard");
    }

    // Parallel Initial Data Fetching (Optimization)
    const [branches, lowStockProducts] = await Promise.all([
        db.query.users.findMany({
            where: eq(users.role, "BUYER"),
            columns: {
                id: true,
                username: true,
                branchName: true,
                tierId: true,
            }
        }),
        db.select({
            id: productsTable.id,
            name: productsTable.name,
            sku: productsTable.sku,
            stock: productsTable.stock,
            unit: productsTable.unit,
        })
        .from(productsTable)
        .where(lte(productsTable.stock, 10))
        .orderBy(desc(productsTable.stock))
    ]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard Utama</h1>
                    <p className="text-neutral-500">Ringkasan performa seluruh tier dan total penjualan yang disetujui.</p>
                </div>
                <SuperAdminActions buyers={branches} />
            </div>

            <DashboardFilters role="SUPERADMIN" branches={branches} />

            <StockAlert products={lowStockProducts} />

            <Suspense fallback={<DashboardSkeleton />} key={`analytics-${searchParams?.startDate}-${searchParams?.endDate}`}>
                <DashboardAnalytics
                    role="SUPERADMIN"
                    startDate={searchParams?.startDate ? parseInt(searchParams.startDate as string) : undefined}
                    endDate={searchParams?.endDate ? parseInt(searchParams.endDate as string) : undefined}
                    branchId={searchParams?.branchId ? searchParams.branchId as string : undefined}
                />
            </Suspense>

            <Suspense fallback={<LoaderSkeleton />}>
                <OrdersListSection searchParams={searchParams || {}} />
            </Suspense>
        </div>
    );
}
