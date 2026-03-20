"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approveOrder, rejectOrder } from "@/app/actions/orders";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type Status = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PACKING' | 'PROCESSED';

export default function ApprovalActions({ orderId, initialStatus = 'PENDING_APPROVAL' }: { orderId: string, initialStatus?: string }) {
    const [isPending, startTransition] = useTransition();
    const [rejectReason, setRejectReason] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(
        initialStatus,
        (state, newStatus: string) => newStatus
    );

    const handleApprove = async () => {
        startTransition(async () => {
            setOptimisticStatus('APPROVED');
            const res = await approveOrder(orderId);
            if (!res.success) {
                // Error handling will be caught by global boundary or we could add a toast here
            }
        });
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        
        startTransition(async () => {
            setOptimisticStatus('REJECTED');
            setDialogOpen(false);
            const res = await rejectOrder(orderId, rejectReason);
            if (!res.success) {
                // Rollback happens automatically on re-render if we don't handle it
            }
        });
    };

    if (optimisticStatus !== 'PENDING_APPROVAL') {
        return (
            <div className="flex items-center gap-2 text-sm font-medium animate-in fade-in duration-300">
                {optimisticStatus === 'APPROVED' ? (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" /> Disetujui
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        <XCircle className="w-4 h-4" /> Ditolak
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="flex gap-2 justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={isPending}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        Reject
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Tolak Pesanan</DialogTitle>
                        <DialogDescription>
                            Silakan masukkan alasan pembatalan untuk pesanan ini. Pembeli akan melihat alasan ini di riwayat pesanan mereka.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Alasan Pembatalan</Label>
                            <Input
                                id="reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Misal: Stok tidak mencukupi, minimum pembelian tidak tercapai..."
                                disabled={isPending}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>Batal</Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isPending || !rejectReason.trim()}
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Memproses...</>
                            ) : (
                                "Konfirmasi Tolak"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                size="sm"
                onClick={handleApprove}
                disabled={isPending}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[80px]"
            >
                {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> ...</>
                ) : (
                    "Approve"
                )}
            </Button>
        </div>
    );
}
