"use client";

import { useState, useTransition, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createProduct, updateProduct, deleteProduct, restoreProduct } from "@/app/actions/products";
import { uploadImageAction } from "@/app/actions/upload";
import Image from "next/image";
import { ImageIcon, Search, RotateCcw, ArchiveX, LayoutGrid, List, Package, Archive, AlertTriangle, TrendingUp } from "lucide-react";
import { ImportProductDialog } from "./ImportProductDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


type Product = {
    id: string;
    name: string;
    sku: string;
    basePrice: number;
    stock: number;
    unit: string;
    imageUrl: string | null;
    deletedAt: Date | string | number | null;
};

type FormDataState = {
    name: string;
    sku: string;
    basePrice: number;
    stock: number;
    unit: string;
    imageUrl: string;
    imageType: "upload" | "link";
    file: File | null;
    previewUrl: string;
};

const initialFormState: FormDataState = {
    name: "", sku: "", basePrice: 0, stock: 0, unit: "Pcs", imageUrl: "", imageType: "link", file: null, previewUrl: ""
};

export default function ProductList({
    initialProducts,
    totalCount,
    currentPage
}: {
    initialProducts: Product[],
    totalCount: number,
    currentPage: number
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

    const totalPages = Math.ceil(totalCount / 10);

    const [isPending, startTransition] = useTransition();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<FormDataState>(initialFormState);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");


    const updateFilters = (q?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (q !== undefined) {
            if (q) params.set("q", q);
            else params.delete("q");
        }
        params.set("page", "1");
        router.push(`/dashboard/superadmin/products?${params.toString()}`);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (searchParams.get("q") || "")) {
                updateFilters(searchQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                file,
                previewUrl: URL.createObjectURL(file)
            }));
        }
    };

    const handleSave = async (isEdit: boolean) => {
        setUploading(true);
        let finalImageUrl = formData.imageUrl;

        if (formData.imageType === "upload" && formData.file) {
            const formDataUpload = new FormData();
            formDataUpload.append("file", formData.file);
            const uploadResult = await uploadImageAction(formDataUpload);

            if (uploadResult.success && uploadResult.url) {
                finalImageUrl = uploadResult.url;
            } else {
                alert(uploadResult.error || "Gagal mengunggah gambar");
                setUploading(false);
                return;
            }
        }

        startTransition(async () => {
            const productData = {
                name: formData.name,
                sku: formData.sku,
                basePrice: formData.basePrice,
                stock: formData.stock,
                unit: formData.unit,
                imageUrl: finalImageUrl || undefined
            };

            const result = isEdit && editingProduct
                ? await updateProduct(editingProduct.id, productData)
                : await createProduct(productData);

            if (result.success) {
                setIsAddOpen(false);
                setEditingProduct(null);
                setFormData(initialFormState);
            } else {
                alert(result?.error || "Terjadi kesalahan");
            }
            setUploading(false);
        });
    };

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Arsipkan produk '${name}'? Order history akan tetap tersimpan.`)) return;
        startTransition(async () => {
            const result = await deleteProduct(id);
            if (!result?.success) {
                alert(result?.error);
            }
        });
    };

    const handleRestore = (id: string) => {
        startTransition(async () => {
            const result = await restoreProduct(id);
            if (!result?.success) {
                alert(result?.error);
            }
        });
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku,
            basePrice: product.basePrice,
            stock: product.stock,
            unit: product.unit || "Pcs",
            imageUrl: product.imageUrl || "",
            imageType: product.imageUrl?.startsWith("https://") ? "link" : "upload", // simple heuristic
            file: null,
            previewUrl: product.imageUrl || ""
        });
    };

    const renderProductForm = (isEdit: boolean) => (
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Produk</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input id="sku" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="basePrice">Base Price</Label>
                            <Input id="basePrice" type="number" value={formData.basePrice} onChange={(e) => setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Satuan (Unit)</Label>
                            <Input id="unit" placeholder="Pcs, Box, etc" value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stock">Stok (Jumlah Barang)</Label>
                        <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))} />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex bg-neutral-100 rounded-md p-1 h-9 items-center">
                        <button
                            type="button"
                            className={`flex-1 text-sm font-medium rounded-sm py-1 transition-all ${formData.imageType === 'link' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                            onClick={() => setFormData(prev => ({ ...prev, imageType: 'link' }))}
                        >
                            Link URL
                        </button>
                        <button
                            type="button"
                            className={`flex-1 text-sm font-medium rounded-sm py-1 transition-all ${formData.imageType === 'upload' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                            onClick={() => setFormData(prev => ({ ...prev, imageType: 'upload' }))}
                        >
                            Upload File
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label>Gambar Produk</Label>
                        {formData.imageType === "link" ? (
                            <Input
                                key="link-input"
                                placeholder="https://..."
                                value={formData.imageUrl || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value, previewUrl: e.target.value }))}
                            />
                        ) : (
                            <Input
                                key="upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        )}
                    </div>

                    <div className="border rounded-md aspect-square w-full max-w-[200px] flex items-center justify-center overflow-hidden bg-neutral-50 mx-auto mt-4">
                        {formData.previewUrl ? (
                            <Image
                                src={formData.previewUrl}
                                alt="Preview"
                                width={200}
                                height={200}
                                className="object-cover w-full h-full"
                                unoptimized={formData.imageType === "link" || formData.previewUrl.startsWith("blob:")}
                            />
                        ) : (
                            <div className="text-neutral-400 flex flex-col items-center">
                                <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                                <span className="text-xs">Preview Area</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => handleSave(isEdit)} disabled={isPending || uploading}>
                    {uploading ? "Mengunggah..." : isPending ? "Menyimpan..." : "Simpan"}
                </Button>
            </DialogFooter>
        </div>
    );

    return (
        <div className="space-y-3">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="bg-white/50 backdrop-blur-sm border-neutral-200/50 shadow-sm overflow-hidden flex flex-col justify-center py-2 h-max">
                    <div className="px-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total</span>
                        <Package className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="px-3">
                        <div className="text-xl font-bold leading-none">{totalCount}</div>
                    </div>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-neutral-200/50 shadow-sm overflow-hidden flex flex-col justify-center py-2 h-max">
                    <div className="px-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-amber-600">Tipis</span>
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <div className="px-3">
                        <div className="text-xl font-bold leading-none">
                            {initialProducts.filter(p => !p.deletedAt && p.stock < 10 && p.stock > 0).length}
                        </div>
                    </div>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-neutral-200/50 shadow-sm overflow-hidden flex flex-col justify-center py-2 h-max">
                    <div className="px-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-red-600">Habis</span>
                        <Archive className="h-3.5 w-3.5 text-red-500" />
                    </div>
                    <div className="px-3">
                        <div className="text-xl font-bold leading-none">
                            {initialProducts.filter(p => !p.deletedAt && p.stock === 0).length}
                        </div>
                    </div>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-neutral-200/50 shadow-sm overflow-hidden flex flex-col justify-center py-2 h-max">
                    <div className="px-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Arsip</span>
                        <ArchiveX className="h-3.5 w-3.5 text-neutral-400" />
                    </div>
                    <div className="px-3">
                        <div className="text-xl font-bold leading-none">
                            {initialProducts.filter(p => !!p.deletedAt).length}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-2 rounded-lg border border-neutral-200/60 shadow-sm">
                <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                        <Input
                            placeholder="Cari..."
                            className="pl-8 h-8 text-xs border-neutral-200 shadow-none focus-visible:ring-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "grid")} className="h-8">
                        <TabsList className="grid w-[80px] grid-cols-2 h-8 p-0.5">
                            <TabsTrigger value="list" className="h-7 text-[10px]">
                                <List className="h-3.5 w-3.5" />
                            </TabsTrigger>
                            <TabsTrigger value="grid" className="h-7 text-[10px]">
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ImportProductDialog />
                    <Dialog open={isAddOpen} onOpenChange={(open) => {
                        setIsAddOpen(open);
                        if (!open) setFormData(initialFormState);
                    }}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-8 text-xs gap-1.5 shadow-none">
                                <ImageIcon className="w-3.5 h-3.5" />
                                Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl border-neutral-200">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold">New Product</DialogTitle>
                            </DialogHeader>
                            {renderProductForm(false)}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {viewMode === "list" ? (
                <Card className="border-neutral-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-neutral-50/50">
                                <TableRow className="h-10 hover:bg-transparent">
                                    <TableHead className="w-[80px] pl-4 font-semibold text-neutral-600 text-[11px] uppercase">Gbr</TableHead>
                                    <TableHead className="font-semibold text-neutral-600 text-[11px] uppercase">Product Name</TableHead>
                                    <TableHead className="font-semibold text-neutral-600 text-[11px] uppercase">SKU</TableHead>
                                    <TableHead className="font-semibold text-neutral-600 text-[11px] uppercase">Unit</TableHead>
                                    <TableHead className="font-semibold text-neutral-600 text-[11px] uppercase">Price</TableHead>
                                    <TableHead className="font-semibold text-neutral-600 text-[11px] uppercase">Stock</TableHead>
                                    <TableHead className="text-right pr-4 font-semibold text-neutral-600 text-[11px] uppercase">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialProducts.map((product) => (
                                    <TableRow key={product.id} className={`${product.deletedAt ? "opacity-60 bg-neutral-50/50" : "hover:bg-neutral-50/30"} transition-colors h-12`}>
                                        <TableCell className="pl-4 py-1.5">
                                            <div className="w-9 h-9 rounded-md border border-neutral-100 overflow-hidden bg-white flex items-center justify-center shadow-sm relative">
                                                {product.imageUrl ? (
                                                    <Image
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        width={36}
                                                        height={36}
                                                        className="object-cover w-full h-full"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-4 w-4 text-neutral-300" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-1.5 font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-neutral-900 text-xs line-clamp-1">{product.name}</span>
                                                {product.deletedAt && (
                                                    <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">Archived</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1 py-0.5 rounded font-mono">{product.sku}</span>
                                        </TableCell>
                                        <TableCell className="py-1.5 text-xs text-neutral-500">{product.unit}</TableCell>
                                        <TableCell className="py-1.5 font-semibold text-neutral-900 text-xs">
                                            Rp{product.basePrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-xs font-bold leading-none ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-amber-500' : 'text-neutral-800'}`}>{product.stock}</span>
                                                <div className="w-12 h-1 bg-neutral-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${product.stock === 0 ? 'bg-red-500' : product.stock < 10 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-4 py-1.5">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-neutral-200" onClick={() => openEdit(product)} disabled={!!product.deletedAt}><ImageIcon className="w-3.5 h-3.5" /></Button>
                                                {product.deletedAt ? (
                                                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-green-200 text-green-700 hover:bg-green-50" onClick={() => handleRestore(product.id)} disabled={isPending}><RotateCcw className="w-3.5 h-3.5" /></Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => handleDelete(product.id, product.name)} disabled={isPending}><ArchiveX className="w-3.5 h-3.5" /></Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {initialProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-2 text-neutral-400">
                                                <Search className="h-8 w-8 opacity-20" />
                                                <p>Tidak ada produk yang ditemukan.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {initialProducts.map((product) => (
                        <Card key={product.id} className={`group relative overflow-hidden transition-all hover:shadow-md border-neutral-200 flex flex-col ${product.deletedAt ? "opacity-60 bg-neutral-50" : "bg-white"}`}>
                            <div className="aspect-square relative flex items-center justify-center bg-neutral-50/50 border-b overflow-hidden">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                        unoptimized
                                    />
                                ) : (
                                    <ImageIcon className="h-10 w-10 text-neutral-200" />
                                )}
                                
                                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                    {product.deletedAt && (
                                        <Badge variant="destructive" className="bg-red-600 shadow-sm border-none text-[9px] h-5 px-1.5">ARSIP</Badge>
                                    )}
                                    {product.stock === 0 && !product.deletedAt && (
                                        <Badge variant="destructive" className="bg-red-600 shadow-sm border-none text-[9px] h-5 px-1.5">HABIS</Badge>
                                    )}
                                    {product.stock > 0 && product.stock < 10 && !product.deletedAt && (
                                        <Badge variant="secondary" className="bg-amber-500 text-white shadow-sm border-none text-[9px] h-5 px-1.5">TIPIS</Badge>
                                    )}
                                </div>
                            </div>
                            
                            <CardContent className="p-3 flex-1 flex flex-col gap-2">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-neutral-900 text-sm line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <code className="text-neutral-500 font-mono">{product.sku}</code>
                                        <span className="text-neutral-400">{product.unit}</span>
                                    </div>
                                </div>
                                
                                <div className="mt-auto pt-2 border-t flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-neutral-400 uppercase font-medium">Base Price</span>
                                            <span className="text-sm font-bold text-neutral-900">Rp {product.basePrice.toLocaleString()}</span>
                                        </div>
                                        <div className="text-right flex flex-col">
                                            <span className="text-[10px] text-neutral-400 uppercase font-medium">Stok</span>
                                            <span className={`text-sm font-bold ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-amber-600' : 'text-neutral-900'}`}>{product.stock}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-1.5 mt-1">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 h-8 text-[11px] border-neutral-200" 
                                            onClick={() => openEdit(product)}
                                            disabled={!!product.deletedAt}
                                        >
                                            Edit
                                        </Button>
                                        {product.deletedAt ? (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 border-green-200 text-green-700 hover:bg-green-50"
                                                onClick={() => handleRestore(product.id)}
                                                disabled={isPending}
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleDelete(product.id, product.name)}
                                                disabled={isPending}
                                            >
                                                <ArchiveX className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {initialProducts.length === 0 && (
                        <div className="col-span-full py-12 text-center text-neutral-400">
                             Tidak ada produk yang ditemukan.
                        </div>
                    )}
                </div>
            )}

            <div className="pt-4 border-t border-neutral-100">
                <Pagination totalPages={totalPages} currentPage={currentPage} />
            </div>

            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="max-w-2xl border-neutral-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Edit Produk</DialogTitle>
                    </DialogHeader>
                    {renderProductForm(true)}
                </DialogContent>
            </Dialog>
        </div>
    );

}
