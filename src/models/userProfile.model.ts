export type ProfileExperience = {
  id: string;
  userProfileId: string;
  title: string;
  company: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProfile = {
  id: string;
  userId: string;
  displayName: string;
  headline: string;
  bio: string | null;
  avatarUrl: string | null;
  skills: string[];
  resumeUrl: string | null;
  resumeName: string | null;
  createdAt: Date;
  updatedAt: Date;
  experiences: ProfileExperience[];
};
