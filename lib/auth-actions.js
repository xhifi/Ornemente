"use server";

import { auth } from "@/lib/auth-config";
import { headers } from "next/headers";

export async function signInWithGithub(callbackUrl = "/dashboard") {
  try {
    const result = await auth.api.signInSocial({
      body: {
        provider: "github",
        callbackURL: callbackUrl,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message || "Failed to sign in with GitHub" };
  }
}

export async function signInWithGoogle(callbackUrl = "/dashboard") {
  console.log(`SIGNIN WITH GOOGLE FUNCTION INVOKED`);
  console.log(`Using APP_BASE_URL: ${process.env.APP_BASE_URL}`);
  try {
    const result = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: callbackUrl,
        scopes: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
      },
    });
    console.log("Google sign-in success:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return { success: false, error: error.message || "Failed to sign in with Google" };
  }
}

export async function getServerSession() {
  return await auth.api.getSession({ headers: await headers() });
}

export async function signInWithEmail(data) {
  return await auth.api.signInEmail({ body: data });
}

export async function signUpWithEmail(data) {
  return await auth.api.signUpEmail({ body: data });
}

export async function signOutServerSession() {
  return await auth.api.signOut({ headers: await headers() });
}
