import AdminTabsContainer from "@/components/admin/AdminTabsContainer";
import { auth } from "@/auth";

async function AdminPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex flex-col col-span-3">
      <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
        Administration
      </h3>
      <AdminTabsContainer isAdmin={isAdmin} />
    </div>
  );
}

export default AdminPage;
