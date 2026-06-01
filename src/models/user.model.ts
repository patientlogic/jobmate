export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role?: string;
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  displayName?: string;
  avatarUrl?: string | null;
  iat?: number;
  exp?: number;
};
