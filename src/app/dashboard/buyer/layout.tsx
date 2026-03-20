import { getSession } from "@/lib/auth/session";
import BuyerLayoutClient from "./BuyerLayoutClient";

export default async function BuyerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    return (
        <BuyerLayoutClient userId={session?.id ?? ""} hasCompletedTour={session?.hasCompletedTour ?? false}>
            {children}
        </BuyerLayoutClient>
    );
}
