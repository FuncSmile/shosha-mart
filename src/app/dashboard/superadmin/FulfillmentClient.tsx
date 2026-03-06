"use client";

import { useTransition, useEffect, useState } from "react";
import { processOrder, packOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Package, CheckCircle, FileText } from "lucide-react";
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
    items: OrderItemDetail[];
};

export default function FulfillmentClient({ orders }: { orders: OrderRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [isClient, setIsClient] = useState(false);

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

    if (orders.length === 0) {
        return <p className="text-center text-neutral-500 py-8">Belum ada pesanan yang perlu diproses.</p>;
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => (
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
                            <div className="flex flex-col">
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Status</span>
                                <Badge className={
                                    order.status === 'APPROVED' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                        order.status === 'PACKING' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                                            'bg-green-100 text-green-700 hover:bg-green-100'
                                }>
                                    {order.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-[10px] text-neutral-400 uppercase tracking-wider text-right">Total Nilai</div>
                                <div className="text-lg font-bold text-blue-700">Rp {order.totalAmount.toLocaleString("id-ID")}</div>
                            </div>

                            <div className="flex gap-2">
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
                                                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
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
                                        className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm px-6 gap-2"
                                    >
                                        <Package className="h-4 w-4" />
                                        Mulai Packing
                                    </Button>
                                )}

                                {order.status === "PACKING" && (
                                    <Button
                                        onClick={() => handleProcess(order.id)}
                                        disabled={isPending}
                                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm px-6 gap-2"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Selesaikan
                                    </Button>
                                )}
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
