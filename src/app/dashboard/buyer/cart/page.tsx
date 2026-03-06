import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import CartPageClient from "./CartPageClient";

export default async function BuyerCartPage() {
    const session = await getSession();

    if (!session || session.role !== "BUYER" || !session.tierId) {
        redirect("/login");
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8 text-neutral-800 tracking-tight">Keranjang Belanja</h1>
            <CartPageClient buyerId={session.id} tierId={session.tierId} />
        </div>
    );
}
