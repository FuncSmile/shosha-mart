"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getUserOrderHistory } from "@/app/actions/orders";
import OrderDetail from "@/components/dashboard/OrderDetail";
import { Loader2 } from "lucide-react";

export function UserHistoryDialog({
    isOpen,
    setIsOpen,
    userId,
    username
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    userId: string | null;
    username: string | null;
}) {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchHistory();
        } else {
            setOrders([]);
        }
    }, [isOpen, userId]);

    const fetchHistory = async () => {
        if (!userId) return;
        setIsLoading(true);
        const res = await getUserOrderHistory(userId);
        if (res.success && res.orders) {
            setOrders(res.orders);
        }
        setIsLoading(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING_APPROVAL":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Menunggu Persetujuan</Badge>;
            case "APPROVED":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Pesanan Disetujui</Badge>;
            case "PACKING":
                return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">Sedang Dipacking</Badge>;
            case "PROCESSED":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Selesai</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle>Riwayat Pembelanjaan: {username}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 p-6 overflow-y-auto min-h-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Memuat riwayat...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <Card key={order.id} className="overflow-hidden border-neutral-200 shadow-sm">
                                    <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-100">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Ref ID</span>
                                                    <span className="font-mono text-xs font-semibold">{order.id}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Tanggal</span>
                                                    <span className="text-sm font-medium">
                                                        {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Status</span>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Total Pembayaran</div>
                                                <div className="text-xl font-bold text-blue-700">Rp {order.totalAmount.toLocaleString("id-ID")}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-0">
                                        {order.status === "REJECTED" && order.rejectionReason && (
                                            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                                                <span className="font-bold block mb-1">Alasan Penolakan:</span>
                                                {order.rejectionReason}
                                            </div>
                                        )}
                                        <div className="px-6 py-2">
                                            <OrderDetail items={order.items} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-muted/50 border border-dashed rounded-2xl text-muted-foreground">
                            Belum ada riwayat pesanan untuk user ini.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
