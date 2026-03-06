"use client";

import { useTransition, useState } from "react";
import { approveOrder, rejectOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import OrderDetail, { OrderItemDetail } from "@/components/dashboard/OrderDetail";

type OrderRow = {
    id: string;
    totalAmount: number;
    status: string;
    buyerName: string;
    branchName: string | null;
    items: OrderItemDetail[];
};

export default function ApprovalClient({ initialOrders }: { initialOrders: OrderRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

    const handleApprove = (orderId: string) => {
        startTransition(async () => {
            const result = await approveOrder(orderId);
            if (result?.success) {
                toast.success(result.message);
            } else {
                toast.error(result?.error || "Gagal menyetujui pesanan");
            }
        });
    };

    const handleReject = (orderId: string) => {
        const reason = rejectionReasons[orderId];
        if (!reason || reason.trim() === "") {
            toast.error("Harap isi alasan penolakan!");
            return;
        }

        startTransition(async () => {
            const result = await rejectOrder(orderId, reason);
            if (result?.success) {
                toast.success(result.message);
                setRejectionReasons(prev => {
                    const next = { ...prev };
                    delete next[orderId];
                    return next;
                });
            } else {
                toast.error(result?.error || "Gagal menolak pesanan");
            }
        });
    };

    if (initialOrders.length === 0) {
        return <p className="text-muted-foreground p-4">Tidak ada pesanan yang menunggu persetujuan.</p>;
    }

    return (
        <div className="rounded-md border bg-transparent space-y-4">
            {initialOrders.map((order) => (
                <div key={order.id} className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="space-y-1">
                            <div className="text-xs font-mono text-muted-foreground uppercase">Ref: {order.id.slice(0, 8)}</div>
                            <div className="font-bold text-neutral-900">
                                {order.buyerName} {order.branchName ? `(${order.branchName})` : ""}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Nilai Pesanan</div>
                            <div className="font-bold text-blue-600">Rp {order.totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-3 justify-end">
                            <div className="flex w-full sm:w-auto items-center gap-2">
                                <Input
                                    type="text"
                                    placeholder="Alasan tolak..."
                                    value={rejectionReasons[order.id] || ""}
                                    onChange={(e) => setRejectionReasons(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    className="h-9 min-w-[150px] text-sm"
                                    disabled={isPending}
                                />
                                <Button
                                    onClick={() => handleReject(order.id)}
                                    disabled={isPending}
                                    variant="destructive"
                                    size="sm"
                                    className="h-9 px-4"
                                >
                                    Tolak
                                </Button>
                            </div>
                            <Button
                                onClick={() => handleApprove(order.id)}
                                disabled={isPending}
                                size="sm"
                                className="h-9 px-6 bg-green-600 hover:bg-green-700 text-white font-medium"
                            >
                                Setujui
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dashed border-neutral-100">
                        <OrderDetail items={order.items} />
                    </div>
                </div>
            ))}
        </div>
    );
}
