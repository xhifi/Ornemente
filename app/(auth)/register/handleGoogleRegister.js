import { authClient } from "@/lib/auth-client";

const handleGoogleRegister = async () => {
  try {
    return await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard", // Redirect after successful sign-in
    });
  } catch (error) {
    console.error("Google registration error:", error);
    throw error;
  }
};

export default handleGoogleRegister;
