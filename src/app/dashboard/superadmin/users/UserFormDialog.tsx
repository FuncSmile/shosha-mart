"use client";

import { useState, useEffect } from "react";
import { createUser, updateUser } from "@/app/actions/userActions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface UserFormDialogProps {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    editingUser: any | null;
    onSuccess: () => void;
    admins: any[];
}

export function UserFormDialog({ isOpen, setIsOpen, editingUser, onSuccess, admins }: UserFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Form fields
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("BUYER");
    const [branchName, setBranchName] = useState("");
    const [createdBy, setCreatedBy] = useState("");

    useEffect(() => {
        if (editingUser) {
            setUsername(editingUser.username);
            setPhone(editingUser.phone);
            setPassword(""); // Leave empty unless they want to change it
            setRole(editingUser.role);
            setBranchName(editingUser.branchName || "");
            setCreatedBy(editingUser.createdBy || "");
        } else {
            // Reset for new user
            setUsername("");
            setPhone("");
            setPassword("");
            setRole("BUYER");
            setBranchName("");
            setCreatedBy("");
        }
    }, [editingUser, isOpen]);

    const onSubmit = async () => {
        if (!username || !phone || (!editingUser && !password)) {
            toast.error("Nama, telepon, dan password wajib diisi (untuk user baru).");
            return;
        }

        if (role === "BUYER" && (!branchName || !createdBy)) {
            toast.error("Buyer harus memiliki nama cabang dan admin pengelola.");
            return;
        }

        setIsLoading(true);

        const payload = {
            username,
            phone,
            password: password || undefined, // Only send if updating password or new user
            role,
            branchName: role === "BUYER" ? branchName : null,
            createdBy: role === "BUYER" ? createdBy : null,
        };

        let res;
        if (editingUser) {
            res = await updateUser(editingUser.id, payload);
        } else {
            res = await createUser(payload);
        }

        if (res.success) {
            toast.success(res.message);
            onSuccess();
            setIsOpen(false);
        } else {
            toast.error(res.message);
        }

        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Tambah User Baru"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username / Nama</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">No. Telepon (Digunakan untuk Login)</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="08123456789"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">
                            Password {editingUser && <span className="text-xs text-muted-foreground font-normal">(Kosongkan jika tidak ingin diubah)</span>}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={editingUser ? "******" : "Buat password..."}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Role Pengguna</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                                <SelectItem value="ADMIN_TIER">Admin Tier</SelectItem>
                                <SelectItem value="BUYER">Buyer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {role === "BUYER" && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="branchName">Nama Cabang / Toko</Label>
                                <Input
                                    id="branchName"
                                    value={branchName}
                                    onChange={(e) => setBranchName(e.target.value)}
                                    placeholder="Toko Jaya Abadi"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="createdBy">Dikelola Oleh (Admin Tier)</Label>
                                <Select value={createdBy} onValueChange={setCreatedBy}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Admin Pengelola" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {admins.length > 0 ? (
                                            admins.map(admin => (
                                                <SelectItem key={admin.id} value={admin.id}>
                                                    {admin.username}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>Belum ada Admin Tier terdaftar</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingUser ? "Simpan Perubahan" : "Buat User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
