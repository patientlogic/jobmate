import { auth } from "@/auth";
import ProfileContainer from "@/components/profile/ProfileContainer";
import React from "react";

async function Profile() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="col-span-3">
      <ProfileContainer isAdmin={isAdmin} />
    </div>
  );
}

export default Profile;
