// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { pool } from "./lib/db";

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: "Ov23lirNTXUNko4RGHv1",
      clientSecret: "b953df7cb526a2e90e8a51201ba1e200e7ffce58",
    },
  },
});
