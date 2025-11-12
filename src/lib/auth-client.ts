"use client";

import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signOut, useSession, getSession } = authClient;

export const signUp = {
  email: async (data: {
    email: string;
    password: string;
    name: string;
    username: string;
    callbackURL?: string;
  }) => {
    return authClient.signUp.email(data as any);
  },
};
