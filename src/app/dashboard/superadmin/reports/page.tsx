import { getSession } from "@/lib/auth/session";
import { getReportData } from "@/app/actions/reports";
import { getAllTiers } from "@/app/actions/pricing";
import { redirect } from "next/navigation";
import { ReportClient } from "@/components/reports/ReportClient";

export default async function SuperAdminReportsPage() {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
        redirect("/login");
    }

    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const endDate = new Date().getTime();

    const [reportData, tiers] = await Promise.all([
        getReportData({
            startDate,
            endDate,
            role: session.role,
            adminId: session.id,
        }),
        getAllTiers()
    ]);

    return (
        <div className="container mx-auto py-8 lg:px-4">
            <ReportClient
                initialData={reportData}
                role={session.role}
                adminId={session.id}
                tiers={tiers}
            />
        </div>
    );
}
