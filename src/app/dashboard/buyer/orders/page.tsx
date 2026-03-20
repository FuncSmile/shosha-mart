import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { eq, desc, and, or, sql, like } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import OrderDetail from "@/components/dashboard/OrderDetail";
import ReorderButton from "./ReorderButton";

export default async function BuyerOrdersPage(
    props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        redirect("/login");
    }

    const searchQuery = typeof searchParams?.q === "string" ? searchParams.q : "";

    // For complex search (like by product name inside order), we might need a more complex query
    // But for now let's support searching by Order ID or Status, and if we want product name, we should join

    const myOrdersData = await db.query.orders.findMany({
        where: and(
            eq(orders.buyerId, session.id),
            searchQuery ? or(
                like(orders.id, `%${searchQuery}%`),
                like(orders.status, `%${searchQuery.toUpperCase()}%`)
            ) : undefined
        ),
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
            productId: item.productId,
            name: item.product?.name || "Produk Terhapus",
            sku: item.product?.sku || "-",
            unit: item.product?.unit || "Pcs",
            imageUrl: item.product?.imageUrl || null,
            quantity: item.quantity,
            price: item.priceAtPurchase,
            stock: item.product?.stock || 0,
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">Riwayat Pesanan</h1>
                <form action="" method="GET" className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                        name="q"
                        placeholder="Cari ID Pesanan atau Status..."
                        className="pl-9"
                        defaultValue={searchQuery}
                    />
                </form>
            </div>

            <div className="space-y-4">
                {myOrders.map((order, index) => (
                    <Card key={order.id} id={index === 0 ? "tour-step-7" : undefined} className="overflow-hidden border-neutral-200 shadow-sm">
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
                                    <div className="mt-2">
                                        <ReorderButton items={order.items} />
                                    </div>
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
                            {order.buyerNote && (
                                <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                                    <span className="font-bold block mb-1">Catatan Anda:</span>
                                    {order.buyerNote}
                                </div>
                            )}
                            <div className="px-6 py-2">
                                <OrderDetail items={order.items} />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {myOrders.length === 0 && session.hasCompletedTour === false && (
                    <Card id="tour-step-7" className="overflow-hidden border-neutral-200 shadow-sm opacity-50 mt-4">
                        <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-100">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Ref ID</span>
                                        <span className="font-mono text-xs font-semibold">DUMMY-ORDER</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Tanggal</span>
                                        <span className="text-sm font-medium">Hari ini</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Status</span>
                                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Menunggu Persetujuan</Badge>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Total Pembayaran</div>
                                    <div className="text-xl font-bold text-blue-700">Rp 10.000</div>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <div className="px-6 py-4 text-center text-sm text-neutral-500">
                                Ini adalah pesanan contoh untuk panduan (Tour).
                            </div>
                        </CardContent>
                    </Card>
                )}

                {myOrders.length === 0 && session.hasCompletedTour !== false && (
                    <div className="text-center py-20 bg-white border border-dashed rounded-2xl border-neutral-200 text-neutral-400">
                        Belum ada pesanan yang dibuat.
                    </div>
                )}
            </div>
        </div>
    );
}
