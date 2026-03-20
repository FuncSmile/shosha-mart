"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ImageIcon, Loader2 } from "lucide-react";
import { Product, useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";

export default function CatalogClient({
    initialProducts,
    totalCount,
    currentPage,
    initialSearch = ""
}: {
    initialProducts: Product[];
    totalCount: number;
    currentPage: number;
    initialSearch?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const totalPages = Math.ceil(totalCount / 10);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [isPending, startTransition] = useTransition();
    const addToCart = useCartStore((state) => state.addToCart);
    const cart = useCartStore((state) => state.cart);
    const [isTourActive, setIsTourActive] = useState(false);

    useEffect(() => {
        setIsTourActive(localStorage.getItem("product-tour-active") === "true");
        const currentSearch = searchParams.get("search") || "";
        if (searchQuery === currentSearch) return;

        const handler = setTimeout(() => {
            startTransition(() => {
                const params = new URLSearchParams(searchParams.toString());
                if (searchQuery) {
                    params.set("search", searchQuery);
                } else {
                    params.delete("search");
                }
                params.set("page", "1");
                router.push(`${pathname}?${params.toString()}`);
            });
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery, pathname, router, searchParams]);

    // Sync input with URL when navigating (e.g. back button)
    useEffect(() => {
        const currentSearch = searchParams.get("search") || "";
        if (currentSearch !== searchQuery) {
            setSearchQuery(currentSearch);
        }
    }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    const filteredProducts = initialProducts;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Katalog Produk</h1>
                <div className="w-full max-md">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            {isPending ? (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : (
                                <svg className="w-4 h-4 text-neutral-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                </svg>
                            )}
                        </div>
                        <input
                            type="search"
                            className="block w-full p-2 pl-10 text-sm border rounded-lg bg-neutral-50 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Cari produk berdasarkan nama atau SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="relative">
                {isPending && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                        <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-lg shadow-sm border border-neutral-100">
                            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            <p className="text-xs font-medium text-neutral-500">Mencari produk...</p>
                        </div>
                    </div>
                )}
                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 transition-opacity duration-200 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                    {filteredProducts.map((p, index) => {
                        const inCart = cart[p.id]?.quantity || 0;
                        const isStockOut = p.stock === 0;
                        const reachStockLimit = inCart >= p.stock;

                        return (
                            <div key={p.id} id={index === 0 ? "tour-step-3" : undefined} className="border rounded-xl p-3 flex flex-col justify-between bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group">
                                {isStockOut && (
                                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
                                        Stok Habis
                                    </div>
                                )}

                                <div className={isStockOut ? "opacity-60 grayscale" : "h-full flex flex-col"}>
                                    <div className="border border-neutral-100 rounded-lg h-32 md:h-48 w-full flex items-center justify-center overflow-hidden bg-white mb-3 shrink-0 relative group-hover:border-blue-100 transition-colors">
                                        {p.imageUrl ? (
                                            <Image
                                                src={p.imageUrl}
                                                alt={p.name}
                                                width={400}
                                                height={400}
                                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 md:h-12 md:w-12 text-neutral-200" />
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <h3 className="font-medium text-sm md:text-base text-neutral-900 leading-tight line-clamp-2 mb-1" title={p.name}>
                                            {p.name}
                                        </h3>
                                        <p className="text-[10px] md:text-xs text-neutral-500 mb-2 font-mono">SKU: {p.sku}</p>

                                        <div className="mt-auto">
                                            {p.tierPrice !== null && p.tierPrice !== undefined ? (
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-base md:text-lg font-bold text-blue-600">Rp {p.tierPrice.toLocaleString()}</p>
                                                    <span className="text-[10px] text-neutral-400 font-medium">/ {p.unit || "Pcs"}</span>
                                                </div>
                                            ) : (
                                                <p className="text-xs md:text-sm font-medium text-orange-500">Harga Belum Tersedia</p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-3">
                                                <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full font-medium ${p.stock === 0
                                                    ? 'bg-red-50 text-red-600'
                                                    : p.stock < 10
                                                        ? 'bg-orange-50 text-orange-600'
                                                        : 'bg-green-50 text-green-700'
                                                    }`}>
                                                    {p.stock === 0 ? "Stok Kosong" : `Sisa: ${p.stock}`}
                                                </span>
                                                {inCart > 0 && (
                                                    <span className="text-[10px] md:text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                        Di Keranjang: {inCart}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-2 h-8 md:h-10 text-xs md:text-sm"
                                    disabled={p.tierPrice === null || isStockOut || reachStockLimit}
                                    onClick={() => addToCart(p)}
                                    variant={isStockOut ? "secondary" : "default"}
                                >
                                    {p.tierPrice === null ? "Hubungi Admin" : isStockOut ? "Habis" : reachStockLimit ? "Maks" : "+ Keranjang"}
                                </Button>
                            </div>
                        );
                    })}

                    {filteredProducts.length === 0 && !isTourActive && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-200 rounded-xl">
                            <p className="text-neutral-500 text-sm md:text-base">Tidak ada produk yang cocok dengan pencarian Anda.</p>
                        </div>
                    )}

                    {filteredProducts.length === 0 && isTourActive && (
                        <div id="tour-step-3" className="border rounded-xl p-3 flex flex-col justify-between bg-white opacity-50 relative group">
                            <div className="border border-neutral-100 rounded-lg h-32 md:h-48 w-full flex items-center justify-center overflow-hidden bg-white mb-3 shrink-0">
                                <ImageIcon className="h-8 w-8 text-neutral-200" />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <h3 className="font-medium text-sm md:text-base text-neutral-900 leading-tight mb-1">Produk Contoh (Tour)</h3>
                                <p className="text-[10px] md:text-xs text-neutral-500 mb-2 font-mono">SKU: DUMMY</p>
                                <div className="mt-auto">
                                    <p className="text-base md:text-lg font-bold text-blue-600">Rp 10.000</p>
                                </div>
                            </div>
                            <Button className="w-full mt-2 h-8 md:h-10 text-xs md:text-sm" disabled>+ Keranjang</Button>
                        </div>
                    )}
                </div>
            </div>

            <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>
    );
}
