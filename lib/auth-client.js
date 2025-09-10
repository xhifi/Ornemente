import { createAuthClient } from "better-auth/react";
import { toast } from "sonner"; // Assuming you're using sonner for toast notifications

export const authClient = createAuthClient({
  baseURL: process.env.APP_BASE_URL,
  fetchOptions: {
    async onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
      console.log(`Auth error: `, e);
      console.log(`AUTH RES`, await e.response.json());
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
