import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { customSession } from "better-auth/plugins";
import { pool } from "./db";
import getUserRoles from "@/data/dal/auth/users/get-user-roles";

const aggregateRoles = async ({ user, session }) => {
  const assignedRoles = await getUserRoles(user.id);
  const aggregatePermissions = assignedRoles.data.flatMap((role) => role.permissions?.filter(Boolean) || []);
  return { user: { ...user, roles: assignedRoles.data, permissions: aggregatePermissions }, session: { ...session } };
};

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      onError: (error) => {
        console.error("Google OAuth error:", error);
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
  },
  user: {
    modelName: "users",
    deleteUser: {
      enabled: true,
    },
    fields: {
      id: "id",
      createdAt: "created_at",
      updatedAt: "updated_at",
      emailVerified: "email_verified",
      email: "email",
      name: "name",
      image: "image",
      role: "provider_role",
    },
  },

  session: {
    modelName: "sessions",
    fields: {
      id: "id",
      createdAt: "created_at",
      updatedAt: "updated_at",
      expiresAt: "expires_at",
      userId: "user_id",
      token: "token",
      fresh: "fresh",
      ipAddress: "ip_address",
      userAgent: "user_agent",
    },
  },
  account: {
    modelName: "accounts",
    fields: {
      id: "id",
      createdAt: "created_at",
      updatedAt: "updated_at",
      userId: "user_id",
      providerId: "provider_id",
      accountId: "account_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      scope: "scope",
      idToken: "id_token",
    },
  },
  verification: {
    modelName: "verifications",
    fields: {
      id: "id",
      createdAt: "created_at",
      updatedAt: "updated_at",
      expiresAt: "expires_at",
      identifier: "identifier",
      value: "value",
    },
  },
  advanced: {
    cookiePrefix: "sbq",
  },
  plugins: [nextCookies(), customSession(aggregateRoles)],
});
