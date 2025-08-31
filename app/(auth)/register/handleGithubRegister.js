import { authClient } from "@/lib/auth-client";

const handleGitHubRegister = async () => {
  try {
    return await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard", // Redirect after successful sign-in
    });
  } catch (error) {
    console.error("GitHub registration error:", error);
    throw error;
  }
};

export default handleGitHubRegister;
