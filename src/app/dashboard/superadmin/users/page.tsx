import { getSession } from "@/lib/auth/session";
import { getUsers, getAdmins } from "@/app/actions/userActions";
import { redirect } from "next/navigation";
import { UserManagementClient } from "./UserManagementClient";

export default async function SuperAdminUsersPage() {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
        redirect("/login");
    }

    const [initialUsers, initialAdmins] = await Promise.all([
        getUsers(),
        getAdmins()
    ]);

    return (
        <div className="container mx-auto py-8 lg:px-4">
            <UserManagementClient
                initialUsers={initialUsers}
                initialAdmins={initialAdmins}
            />
        </div>
    );
}
