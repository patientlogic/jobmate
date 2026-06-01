import { redirect } from "next/navigation";

export default function MyProfilePage() {
  redirect("/dashboard/settings?section=my-profile");
}
