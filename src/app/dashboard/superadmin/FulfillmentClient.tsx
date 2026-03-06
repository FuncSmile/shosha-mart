"use client";

import { useTransition, useEffect, useState } from "react";
import { processOrder, packOrder, bypassDeleteOrder, approveOrder, rejectOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Package, CheckCircle, FileText, Trash2, Check, XCircle, AlertTriangle } from "lucide-react";
import OrderDetail, { OrderItemDetail } from "@/components/dashboard/OrderDetail";
import dynamic from "next/dynamic";
import { InvoicePDF } from "@/components/dashboard/InvoicePDF";

// Dynamic import for PDFDownloadLink to avoid SSR issues
const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

type OrderRow = {
    id: string;
    totalAmount: number;
    status: string;
    tierName: string;
    buyerName: string | null;
    branchName: string | null;
    createdAt: Date | string | number | null;
    adminNotes?: string | null;
    items: OrderItemDetail[];
};

export default function FulfillmentClient({ orders }: { orders: OrderRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [isClient, setIsClient] = useState(false);
    const [rejectingOrder, setRejectingOrder] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handlePack = (orderId: string) => {
        startTransition(async () => {
            const result = await packOrder(orderId);
            if (result?.success) {
                toast.success(result.message);
            } else {
                toast.error(result?.error || "Gagal merubah status");
            }
        });
    };

    const handleProcess = (orderId: string) => {
        startTransition(async () => {
            const result = await processOrder(orderId);
            if (result?.success) {
                toast.success(result.message);
            } else {
                toast.error(result?.error || "Gagal memproses pesanan");
            }
        });
    };

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

    const handleReject = () => {
        if (!rejectingOrder || !rejectReason.trim()) return;

        startTransition(async () => {
            const result = await rejectOrder(rejectingOrder, rejectReason);
            if (result?.success) {
                toast.success(result.message);
                setRejectingOrder(null);
                setRejectReason("");
            } else {
                toast.error(result?.error || "Gagal menolak pesanan");
            }
        });
    };

    const handleDeleteBypass = (orderId: string) => {
        if (!confirm("Peringatan: Anda akan menghapus pesanan ini secara permanen dan mengembalikan stok produk terkait. Lanjutkan?")) return;

        startTransition(async () => {
            const result = await bypassDeleteOrder(orderId);
            if (result?.success) {
                toast.success(result.message);
            } else {
                toast.error(result?.error || "Gagal menghapus pesanan");
            }
        });
    };

    const pendingOrders = orders.filter(o => o.status === "PENDING_APPROVAL");
    const activeOrders = orders.filter(o => ["APPROVED", "PACKING", "PROCESSED"].includes(o.status));
    const allOrders = orders;
    const renderOrderList = (orderList: OrderRow[]) => {
        if (orderList.length === 0) {
            return <p className="text-center text-neutral-500 py-8">Belum ada pesanan.</p>;
        }

        return (
            <div className="space-y-4">
                {orderList.map((order) => (
                    <div key={order.id} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Referensi</span>
                                    <span className="font-mono text-xs font-semibold">{order.id.slice(0, 8)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Tier</span>
                                    <Badge variant="secondary" className="w-fit font-bold">{order.tierName}</Badge>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Pembeli</span>
                                    <span className="font-medium text-neutral-800">{order.buyerName}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Status</span>
                                    <Badge className={
                                        order.status === 'APPROVED' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                            order.status === 'PACKING' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                                                order.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                                                    order.status === 'REJECTED' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                        'bg-green-100 text-green-700 hover:bg-green-100'
                                    }>
                                        {order.status}
                                    </Badge>

                                </div>
                                {order.adminNotes && (
                                    <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        {order.adminNotes}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider text-right">Total Nilai</div>
                                    <div className="text-lg font-bold text-blue-700">Rp {order.totalAmount.toLocaleString("id-ID")}</div>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2 max-w-[300px]">
                                    {order.status === "PENDING_APPROVAL" && (
                                        <>
                                            <Button
                                                onClick={() => handleApprove(order.id)}
                                                disabled={isPending}
                                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2 whitespace-nowrap"
                                            >
                                                <Check className="h-4 w-4" />
                                                Setujui
                                            </Button>
                                            <Dialog open={rejectingOrder === order.id} onOpenChange={(open) => {
                                                if (open) setRejectingOrder(order.id);
                                                else { setRejectingOrder(null); setRejectReason(""); }
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-2 whitespace-nowrap">
                                                        <XCircle className="h-4 w-4" /> Tolak
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Tolak Pesanan Ini?</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label>Alasan Penolakan</Label>
                                                            <Textarea
                                                                placeholder="Berikan alasan agar pembeli mengerti..."
                                                                value={rejectReason}
                                                                onChange={(e) => setRejectReason(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="destructive" onClick={handleReject} disabled={isPending || !rejectReason.trim()}>
                                                            {isPending ? "Memproses..." : "Konfirmasi Tolak"}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </>
                                    )}

                                    {(order.status === "PACKING" || order.status === "PROCESSED") && isClient && (
                                        <PDFDownloadLink
                                            document={<InvoicePDF order={order} />}
                                            fileName={`Invoice-${order.id.slice(0, 8)}.pdf`}
                                        >
                                            {/* @ts-ignore */}
                                            {({ loading }) => (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={loading}
                                                    className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    {loading ? "Menyiapkan..." : "Invoice"}
                                                </Button>
                                            )}
                                        </PDFDownloadLink>
                                    )}

                                    {order.status === "APPROVED" && (
                                        <Button
                                            onClick={() => handlePack(order.id)}
                                            disabled={isPending}
                                            className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm gap-2 whitespace-nowrap"
                                        >
                                            <Package className="h-4 w-4" />
                                            Mulai Packing
                                        </Button>
                                    )}

                                    {order.status === "PACKING" && (
                                        <Button
                                            onClick={() => handleProcess(order.id)}
                                            disabled={isPending}
                                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm gap-2 whitespace-nowrap"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Selesaikan
                                        </Button>
                                    )}

                                    {/* SUPERADMIN Bypass Action */}
                                    <Button
                                        onClick={() => handleDeleteBypass(order.id)}
                                        disabled={isPending}
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        title="Hapus Pesanan (Bypass)"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-neutral-100 mt-4 pt-2">
                            <OrderDetail items={order.items} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="active">
                    Diproses ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="relative">
                    Perlu Persetujuan
                    {pendingOrders.length > 0 && (
                        <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                            {pendingOrders.length}
                        </span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="all">Semua Pesanan ({allOrders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
                {renderOrderList(activeOrders)}
            </TabsContent>

            <TabsContent value="pending">
                {renderOrderList(pendingOrders)}
            </TabsContent>

            <TabsContent value="all">
                {renderOrderList(allOrders)}
            </TabsContent>
        </Tabs>
    );
}
