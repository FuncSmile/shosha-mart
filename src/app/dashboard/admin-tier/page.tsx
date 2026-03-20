import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import ApprovalClient from "./ApprovalClient";
import { Suspense } from "react";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { Metadata } from "next";
import PendingOrdersSection from "./PendingOrdersSection";
import LoaderSkeleton from "@/components/dashboard/LoaderSkeleton";

export const metadata: Metadata = {
    title: "Manajemen Pesanan",
};

export default async function AdminTierDashboard(
    props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();

    if (!session || session.role !== "ADMIN_TIER" || !session.tierId) {
        redirect("/login");
    }

    // Fetch branches for filter dropdown (buyers created by this Admin_Tier)
    const branches = await db.query.users.findMany({
        where: eq(users.createdBy, session.id),
        columns: {
            id: true,
            username: true,
            branchName: true,
        }
    });

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Manajemen Pesanan (Admin Tier)</h1>

            <DashboardFilters role="ADMIN_TIER" branches={branches} />

            <Suspense fallback={<DashboardSkeleton />} key={`analytics-${searchParams?.startDate}-${searchParams?.endDate}`}>
                <DashboardAnalytics
                    role="ADMIN_TIER"
                    startDate={searchParams?.startDate ? parseInt(searchParams.startDate as string) : undefined}
                    endDate={searchParams?.endDate ? parseInt(searchParams.endDate as string) : undefined}
                    branchId={searchParams?.branchId ? searchParams.branchId as string : undefined}
                />
            </Suspense>

            <Suspense fallback={<LoaderSkeleton />}>
                <PendingOrdersSection 
                    searchParams={searchParams || {}} 
                    session={{ id: session.id, tierId: session.tierId }}
                    branches={branches}
                />
            </Suspense>
        </div>
    );
}
