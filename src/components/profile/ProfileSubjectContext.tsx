"use client";

import { createContext, useContext } from "react";

const ProfileSubjectContext = createContext<string | undefined>(undefined);

export function ProfileSubjectProvider({
  subjectUserId,
  children,
}: {
  subjectUserId?: string;
  children: React.ReactNode;
}) {
  return (
    <ProfileSubjectContext.Provider value={subjectUserId}>
      {children}
    </ProfileSubjectContext.Provider>
  );
}

export function useProfileSubjectUserId() {
  return useContext(ProfileSubjectContext);
}
