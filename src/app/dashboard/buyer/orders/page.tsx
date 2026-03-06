import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import OrderDetail from "@/components/dashboard/OrderDetail";

export default async function BuyerOrdersPage() {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        redirect("/login");
    }

    const myOrdersData = await db.query.orders.findMany({
        where: eq(orders.buyerId, session.id),
        with: {
            items: {
                with: {
                    product: true,
                },
            },
        },
        orderBy: [desc(orders.createdAt)],
    });

    const myOrders = myOrdersData.map(o => ({
        ...o,
        items: o.items.map(item => ({
            id: item.id,
            name: item.product?.name || "Produk Terhapus",
            sku: item.product?.sku || "-",
            unit: item.product?.unit || "Pcs",
            imageUrl: item.product?.imageUrl || null,
            quantity: item.quantity,
            price: item.priceAtPurchase,
        })),
    }));

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
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Riwayat Pesanan</h1>

            <div className="space-y-4">
                {myOrders.map((order) => (
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

                {myOrders.length === 0 && (
                    <div className="text-center py-20 bg-white border border-dashed rounded-2xl border-neutral-200 text-neutral-400">
                        Belum ada pesanan yang dibuat.
                    </div>
                )}
            </div>
        </div>
    );
}
