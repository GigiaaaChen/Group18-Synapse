import { betterAuth } from "better-auth";

import { db } from "@/lib/db";

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    freshAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
      },
      xp: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
    },
  },
});
