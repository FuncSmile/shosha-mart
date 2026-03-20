"use client";

import dynamic from "next/dynamic";

const AdminOrderForm = dynamic(() => import("./orders/AdminOrderForm").then(mod => mod.AdminOrderForm), { ssr: false });
const ImportOrderDialog = dynamic(() => import("./orders/ImportOrderDialog").then(mod => mod.ImportOrderDialog), { ssr: false });

type Buyer = {
    id: string;
    username: string;
    branchName: string | null;
    tierId: string | null;
};

export default function SuperAdminActions({ buyers }: { buyers: Buyer[] }) {
    return (
        <div className="flex items-center gap-2">
            <AdminOrderForm buyers={buyers} />
            <ImportOrderDialog />
        </div>
    );
}
