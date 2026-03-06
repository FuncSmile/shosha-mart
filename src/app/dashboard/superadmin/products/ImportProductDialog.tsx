"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadProductTemplate, importProducts } from "@/app/actions/products";
import { useRouter } from "next/navigation";

export function ImportProductDialog() {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isDownloading, setIsDownloading] = useState(false);
    const router = useRouter();

    const handleDownloadTemplate = async () => {
        setIsDownloading(true);
        try {
            const result = await downloadProductTemplate();
            if (result.success && result.base64) {
                const link = document.createElement("a");
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.base64}`;
                link.download = "Template_Import_Produk.xlsx";
                link.click();
            } else {
                toast.error(result.error || "Gagal mengunduh template");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem saat mengunduh");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Pilih file Excel terlebih dahulu");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        startTransition(async () => {
            try {
                const result = await importProducts(formData) as { success: boolean; message?: string; error?: string };
                if (result.success) {
                    toast.success(result.message);
                    setOpen(false);
                    setFile(null);
                    router.refresh(); // Refresh the page to show latest products
                } else {
                    toast.error(result.error || "Gagal mengimport data");
                }
            } catch (error) {
                toast.error("Kesalahan jaringan atau server.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Import Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Produk dari Excel</DialogTitle>
                    <DialogDescription>
                        Unggah file Excel (<code>.xlsx</code>) untuk menambah atau memperbarui data produk sekaligus.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    <div className="flex flex-col gap-2 p-4 border rounded-md bg-muted/50">
                        <h4 className="text-sm font-medium">1. Unduh Template</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                            Gunakan template yang disediakan untuk menghindari error format.
                        </p>
                        <Button
                            variant="secondary"
                            className="w-full flex items-center gap-2"
                            onClick={handleDownloadTemplate}
                            disabled={isDownloading}
                        >
                            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Download Template Excel
                        </Button>
                    </div>

                    <form onSubmit={handleImport} className="flex flex-col gap-2 p-4 border rounded-md">
                        <h4 className="text-sm font-medium">2. Unggah File</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                            Maksimal 5MB. Gunakan SKU yang sama untuk memperbarui produk yang ada.
                        </p>

                        <div className="grid w-full max-w-sm items-center gap-1.5 mt-2">
                            <Label htmlFor="excel-file">File Excel</Label>
                            <Input
                                id="excel-file"
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                disabled={isPending}
                            />
                        </div>

                        <Button type="submit" className="w-full mt-4 flex items-center gap-2" disabled={isPending || !file}>
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Mulai Import
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
