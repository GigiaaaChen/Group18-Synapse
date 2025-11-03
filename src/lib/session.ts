import type { NextRequest } from "next/server";

import { db } from "@/lib/db";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  sessionToken: string;
}

class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

const extractToken = (request: NextRequest): string | undefined => {
  const header =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");

  if (!header) {
    return undefined;
  }

  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) {
    return undefined;
  }

  return value.trim();
};

export const requireUser = async (
  request: NextRequest,
): Promise<AuthenticatedUser> => {
  const token = extractToken(request);

  if (!token) {
    throw new UnauthorizedError();
  }

  const result = await db.query<{
    id: string;
    email: string;
    name: string | null;
    token: string;
  }>(
    `
      SELECT u."id", u."email", u."name", s."token"
      FROM "session" s
      INNER JOIN "user" u ON u."id" = s."userId"
      WHERE s."token" = $1
        AND s."expiresAt" > NOW()
      LIMIT 1
    `,
    [token],
  );

  const record = result.rows[0];

  if (!record) {
    throw new UnauthorizedError();
  }

  return {
    id: record.id,
    email: record.email,
    name: record.name,
    sessionToken: record.token,
  };
};

export { UnauthorizedError };
