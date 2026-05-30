import { redirect } from "next/navigation";

export default function SiteAdminPage() {
  redirect("/dashboard/admin?tab=users");
}
