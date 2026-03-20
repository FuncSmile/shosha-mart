"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, Loader2 } from "lucide-react";
import { updateOrderItems } from "@/app/actions/orders";
import { getProductsForBuyer } from "@/app/actions/products";
import { toast } from "sonner";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";

type EditableItem = {
    productId: string;
    name: string;
    sku: string;
    unit: string;
    priceAtPurchase: number;
    quantity: number;
    imageUrl: string | null;
};

export function EditOrderDialog({
    isOpen,
    setIsOpen,
    orderId,
    initialItems,
    tierId,
    initialBuyerNote,
    initialAdminNotes,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    orderId: string;
    initialItems: EditableItem[];
    tierId: string;
    initialBuyerNote?: string;
    initialAdminNotes?: string;
}) {
    const [items, setItems] = useState<EditableItem[]>(initialItems);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [buyerNote, setBuyerNote] = useState(initialBuyerNote || "");
    const [adminNotes, setAdminNotes] = useState(initialAdminNotes || "");

    useEffect(() => {
        if (isOpen) {
            setItems(JSON.parse(JSON.stringify(initialItems)));
            setBuyerNote(initialBuyerNote || "");
            setAdminNotes(initialAdminNotes || "");
        }
    }, [isOpen, initialItems, initialBuyerNote, initialAdminNotes]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearch = async () => {
        setIsSearching(true);
        const res = await getProductsForBuyer(tierId, 1, 10, searchTerm);
        if (Array.isArray(res.products)) {
            setSearchResults(res.products);
        }
        setIsSearching(false);
    };

    const addItem = (product: any) => {
        const existing = items.find(i => i.productId === product.id);
        if (existing) {
            toast.error("Produk sudah ada di dalam pesanan.");
            return;
        }

        const newItem: EditableItem = {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            priceAtPurchase: product.finalPrice,
            quantity: 1,
            imageUrl: product.imageUrl
        };

        setItems([...items, newItem]);
        setSearchTerm("");
        setSearchResults([]);
    };

    const updateQuantity = (productId: string, delta: number) => {
        setItems(items.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (productId: string) => {
        setItems(items.filter(item => item.productId !== productId));
    };

    const handleSave = async () => {
        if (items.length === 0) {
            toast.error("Pesanan tidak boleh kosong.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await updateOrderItems(
                orderId,
                items.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    priceAtPurchase: i.priceAtPurchase
                })),
                buyerNote,
                adminNotes
            );

            if (res.success) {
                toast.success("message" in res ? res.message : "Pesanan berhasil diperbarui!");
                setIsOpen(false);
            } else {
                toast.error("error" in res ? res.error : "Gagal memperbarui pesanan.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan teknis saat memperbarui pesanan.");
        } finally {
            setIsSaving(false);
        }
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 shadow-2xl">
                <DialogHeader className="p-6 border-b bg-neutral-50/50">
                    <DialogTitle className="text-xl font-bold">Edit Pesanan</DialogTitle>
                </DialogHeader>

                <div className="flex-1 p-6 overflow-y-auto min-h-0 space-y-6">
                    {/* Product Search Section */}
                    <div className="space-y-2 relative">
                        <label className="text-sm font-semibold text-neutral-700">Tambah Produk</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Cari produk berdasarkan nama atau SKU..."
                                className="pl-10 h-11 border-neutral-300 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {isSearching && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl p-4 flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        )}
                        {!isSearching && searchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl overflow-hidden divide-y">
                                {searchResults.map((product) => (
                                    <div
                                        key={product.id}
                                        className="p-3 hover:bg-neutral-50 flex items-center justify-between cursor-pointer group transition-colors"
                                        onClick={() => addItem(product)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 relative rounded border overflow-hidden shrink-0 bg-neutral-100">
                                                {product.imageUrl ? (
                                                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center"><Search className="h-4 w-4 text-neutral-300" /></div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-neutral-900">{product.name}</span>
                                                <span className="text-xs text-neutral-500 font-mono">SKU: {product.sku} • Stok: {product.stock} {product.unit}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 gap-1 text-blue-600 font-bold">
                                            <Plus className="h-4 w-4" /> Tambah
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Order Items Table */}
                    <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
                        <Table>
                            <TableHeader className="bg-neutral-50">
                                <TableRow>
                                    <TableHead className="w-[40%] font-bold">Produk</TableHead>
                                    <TableHead className="w-[20%] text-center font-bold">Kuantitas</TableHead>
                                    <TableHead className="w-[15%] text-right font-bold">Harga</TableHead>
                                    <TableHead className="w-[15%] text-right font-bold">Subtotal</TableHead>
                                    <TableHead className="w-[10%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <TableRow key={item.productId} className="hover:bg-neutral-50/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 relative rounded border shrink-0 bg-neutral-100 overflow-hidden">
                                                        {item.imageUrl ? (
                                                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-neutral-300 text-[10px]">No Image</div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold truncate">{item.name}</span>
                                                        <span className="text-xs text-neutral-500 font-mono">{item.sku}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-3">
                                                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-md border-neutral-300" onClick={() => updateQuantity(item.productId, -1)}>-</Button>
                                                    <span className="text-sm font-bold min-w-[3ch] text-center">{item.quantity}</span>
                                                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-md border-neutral-300" onClick={() => updateQuantity(item.productId, 1)}>+</Button>
                                                    <span className="text-[10px] text-neutral-400 font-bold uppercase ml-1">{item.unit}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                Rp {item.priceAtPurchase.toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm text-neutral-900 border-l border-neutral-50/50">
                                                Rp {(item.priceAtPurchase * item.quantity).toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600 transition-colors"
                                                    onClick={() => removeItem(item.productId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-neutral-400">
                                            Tidak ada item. Silakan cari dan tambah produk di atas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-neutral-700">Catatan Buyer</label>
                            <Textarea 
                                placeholder="Edit pesan khusus buyer..." 
                                value={buyerNote} 
                                onChange={(e) => setBuyerNote(e.target.value)}
                                className="resize-none text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-neutral-700">Catatan Admin Internal</label>
                            <Textarea 
                                placeholder="Contoh: Disetujui karena..." 
                                value={adminNotes} 
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="resize-none text-xs"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-left">
                        <span className="text-xs text-neutral-500 uppercase font-black tracking-widest block mb-1">Total Estimasi</span>
                        <span className="text-2xl font-black text-blue-700">Rp {totalAmount.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="font-bold h-11 px-6" onClick={() => setIsOpen(false)} disabled={isSaving}>
                            Batal
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 shadow-lg shadow-blue-200" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Simpan Perubahan
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
