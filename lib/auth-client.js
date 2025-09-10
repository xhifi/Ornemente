import { createAuthClient } from "better-auth/react";
import { toast } from "sonner"; // Assuming you're using sonner for toast notifications

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
      console.log(`Auth error: ${e.error.message}`);
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
