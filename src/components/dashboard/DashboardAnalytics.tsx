import { getAnalyticsData } from "@/app/actions/analytics";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

export default async function DashboardAnalytics({ role }: { role: string }) {
    const data = await getAnalyticsData();
    return <DashboardCharts data={data} role={role} />;
}
