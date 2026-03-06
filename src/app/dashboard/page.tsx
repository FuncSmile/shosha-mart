import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function DashboardIndex() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role === "SUPERADMIN") {
        redirect("/dashboard/superadmin");
    } else if (session.role === "ADMIN_TIER") {
        redirect("/dashboard/admin-tier");
    } else {
        redirect("/dashboard/buyer");
    }
}
