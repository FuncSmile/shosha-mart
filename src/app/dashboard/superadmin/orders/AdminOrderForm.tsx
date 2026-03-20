"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, Loader2, PackagePlus, AlertCircle } from "lucide-react";
import { createOrderOnBehalf } from "@/app/actions/orders";
import { getProductsForBuyer } from "@/app/actions/products";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

type Buyer = {
    id: string;
    username: string;
    branchName: string | null;
    tierId: string | null;
};

type OrderItem = {
    productId: string;
    name: string;
    sku: string;
    unit: string;
    priceAtPurchase: number;
    quantity: number;
    imageUrl: string | null;
    stock: number;
};

export function AdminOrderForm({ buyers }: { buyers: Buyer[] }) {
    const [open, setOpen] = useState(false);
    const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");
    const [selectedTierId, setSelectedTierId] = useState<string>("");
    const [items, setItems] = useState<OrderItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [orderStatus, setOrderStatus] = useState<"SUCCESS" | "PROCESSED">("SUCCESS");
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [buyerNote, setBuyerNote] = useState("");
    
    const router = useRouter();

    // Reset when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setSelectedBuyerId("");
            setSelectedTierId("");
            setItems([]);
            setSearchTerm("");
            setSearchResults([]);
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setBuyerNote("");
        }
    }, [open]);

    const handleBuyerChange = (buyerId: string) => {
        const buyer = buyers.find(b => b.id === buyerId);
        if (buyer) {
            setSelectedBuyerId(buyerId);
            setSelectedTierId(buyer.tierId || "");
            // Clear items if buyer (tier) changes as prices might be different
            if (items.length > 0) {
                toast.info("Item keranjang dihapus karena Tier buyer berbeda.");
                setItems([]);
            }
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm && selectedTierId) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedTierId]);

    const handleSearch = async () => {
        setIsSearching(true);
        const res = await getProductsForBuyer(selectedTierId, 1, 10, searchTerm);
        if (Array.isArray(res.products)) {
            // Note: getProductsForBuyer already excludes soft-deleted products
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

        if (product.stock <= 0) {
            toast.error("Stok produk kosong.");
            return;
        }

        const newItem: OrderItem = {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            priceAtPurchase: product.finalPrice, // Auto-fill Tier/Base price
            quantity: 1,
            imageUrl: product.imageUrl,
            stock: product.stock
        };

        setItems([...items, newItem]);
        setSearchTerm("");
        setSearchResults([]);
    };

    const updateQuantity = (productId: string, delta: number) => {
        setItems(items.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                if (newQty > item.stock) {
                    toast.warning(`Stok ${item.name} hanya tersedia ${item.stock}.`);
                    return { ...item, quantity: item.stock };
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const updatePrice = (productId: string, newPrice: string) => {
        const price = parseInt(newPrice.replace(/\D/g, '')) || 0;
        setItems(items.map(item => {
            if (item.productId === productId) {
                return { ...item, priceAtPurchase: price };
            }
            return item;
        }));
    };

    const removeItem = (productId: string) => {
        setItems(items.filter(item => item.productId !== productId));
    };

    const handleSave = async () => {
        if (!selectedBuyerId) {
            toast.error("Pilih Buyer terlebih dahulu.");
            return;
        }
        if (items.length === 0) {
            toast.error("Pesanan tidak boleh kosong.");
            return;
        }

        setIsSaving(true);
        const res = await createOrderOnBehalf(
            selectedBuyerId,
            selectedTierId,
            items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                priceAtPurchase: i.priceAtPurchase
            })),
            orderStatus,
            selectedDate ? new Date(selectedDate).getTime() : undefined,
            buyerNote
        );

        if (res.success) {
            toast.success(res.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(res.error || "Gagal membuat pesanan.");
        }
        setIsSaving(false);
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-100">
                    <PackagePlus className="w-4 h-4" />
                    Buat Pesanan Baru
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 shadow-2xl">
                <DialogHeader className="p-6 border-b bg-neutral-50/50">
                    <DialogTitle className="text-xl font-bold">Pesanan Khusus (On Behalf)</DialogTitle>
                </DialogHeader>

                <div className="flex-1 p-6 overflow-y-auto min-h-0 space-y-6">
                    {/* Buyer Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold">Pilih Buyer / Cabang</Label>
                            <Select onValueChange={handleBuyerChange} value={selectedBuyerId}>
                                <SelectTrigger className="h-11 border-neutral-300">
                                    <SelectValue placeholder="Cari cabang..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {buyers.map((buyer) => (
                                        <SelectItem key={buyer.id} value={buyer.id}>
                                            {buyer.branchName} ({buyer.username})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Status Pesanan</Label>
                            <Select onValueChange={(val: any) => setOrderStatus(val)} value={orderStatus}>
                                <SelectTrigger className="h-11 border-neutral-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUCCESS">BERHASIL (Selesai)</SelectItem>
                                    <SelectItem value="PROCESSED">DIPROSES (Sudah di jalan)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label className="font-bold">Tanggal Pesanan</Label>
                            <Input 
                                type="date" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="h-11 border-neutral-300"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label className="font-bold">Catatan Buyer (Opsional)</Label>
                            <Textarea 
                                placeholder="Pesan khusus dari buyer..." 
                                value={buyerNote} 
                                onChange={(e) => setBuyerNote(e.target.value)}
                                className="resize-none"
                            />
                        </div>
                    </div>

                    {/* Product Search Section */}
                    {selectedBuyerId && (
                        <div className="space-y-2 relative">
                            <Label className="font-bold">Tambah Produk</Label>
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
                                                    <span className="text-xs font-bold text-blue-600">Rp {product.finalPrice.toLocaleString()}</span>
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
                    )}

                    {!selectedBuyerId && (
                        <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-neutral-400 bg-neutral-50">
                            <PackagePlus className="h-12 w-12 mb-2 opacity-20" />
                            <p className="text-sm font-medium">Pilih Buyer terlebih dahulu untuk mulai mencari produk.</p>
                        </div>
                    )}

                    {/* Order Items Table */}
                    {items.length > 0 && (
                        <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
                            <Table>
                                <TableHeader className="bg-neutral-50">
                                    <TableRow>
                                        <TableHead className="w-[35%] font-bold">Produk</TableHead>
                                        <TableHead className="w-[20%] text-center font-bold">Kuantitas</TableHead>
                                        <TableHead className="w-[20%] text-right font-bold">Harga Unit (Override)</TableHead>
                                        <TableHead className="w-[15%] text-right font-bold">Subtotal</TableHead>
                                        <TableHead className="w-[10%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
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
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-xs text-neutral-400">Rp</span>
                                                    <Input
                                                        type="text"
                                                        value={item.priceAtPurchase.toLocaleString("id-ID")}
                                                        onChange={(e) => updatePrice(item.productId, e.target.value)}
                                                        className="h-8 w-24 text-right text-xs font-bold border-neutral-300 focus:border-blue-500"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm text-neutral-900">
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
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {items.length > 0 && (
                         <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>SuperAdmin memiliki akses untuk melakukan <b>manual override harga</b> pada input unit harga di atas.</span>
                         </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-left">
                        <span className="text-xs text-neutral-500 uppercase font-black tracking-widest block mb-1">Total Pesanan</span>
                        <span className="text-2xl font-black text-blue-700">Rp {totalAmount.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="font-bold h-11 px-6" onClick={() => setOpen(false)} disabled={isSaving}>
                            Batal
                        </Button>
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 shadow-lg shadow-blue-200" 
                            onClick={handleSave} 
                            disabled={isSaving || items.length === 0 || !selectedBuyerId}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Simpan Pesanan
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
