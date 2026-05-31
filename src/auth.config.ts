import type { DefaultSession } from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";
import { canAccessDeveloperOptions, parseUserRole } from "@/lib/user-roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export const authConfig = {
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  secret: process.env.AUTH_SECRET,
  // Required for `next start` and deployments without a trusted reverse-proxy Host header.
  // Set AUTH_TRUST_HOST=false to disable (e.g. strict production behind a known proxy).
  trustHost: process.env.AUTH_TRUST_HOST !== "false",
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const adminOnlyRoute =
        nextUrl.pathname.startsWith("/dashboard/site-admin") ||
        nextUrl.pathname.startsWith("/dashboard/admin");
      const developerRoute = nextUrl.pathname.startsWith("/dashboard/developer");
      const isApiRoute = nextUrl.pathname.startsWith("/api");

      if (adminOnlyRoute) {
        if (!isLoggedIn) {
          return false;
        }
        const role = parseUserRole(auth!.user.role);
        if (role !== UserRole.ADMIN) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      if (developerRoute) {
        if (!isLoggedIn) {
          return false;
        }
        const role = parseUserRole(auth!.user.role);
        if (!canAccessDeveloperOptions(role)) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      if (isOnDashboard || isApiRoute) {
        return isLoggedIn;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      const userId = (token.id as string) || token.sub;
      if (userId) {
        session.user.id = userId;
      }
      session.user.role = parseUserRole(
        typeof token.role === "string" ? token.role : undefined,
      );
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
