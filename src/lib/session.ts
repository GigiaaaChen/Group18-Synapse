import type { NextRequest } from "next/server";
import { cookies as headerCookies } from "next/headers";
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

const parseCookieHeader = (cookieHeader: string | null): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [k, ...rest] = part.split("=");
    if (!k) return acc;
    const name = k.trim();
    const value = rest.join("=").trim();
    if (name) acc[name] = value;
    return acc;
  }, {});
};

const getAllCookieValues = async (request: NextRequest): Promise<string[]> => {
  const values = new Set<string>();

  try {
    for (const [name, cookie] of Object.entries((request as any).cookies?.getAll?.() ?? {})) {
      const v = (cookie as any)?.value ?? "";
      if (v) values.add(v);
    }
  } catch {
  }

  try {
    const store = await headerCookies();
    const all = store.getAll?.() ?? [];
    for (const c of all) {
      const v = c?.value ?? "";
      if (v) values.add(v);
    }
  } catch {
  }

  const headerMap = parseCookieHeader(request.headers.get("cookie"));
  for (const v of Object.values(headerMap)) {
    if (v) values.add(v);
  }

  return Array.from(values);
};

const extractBearer = (request: NextRequest): string | undefined => {
  const auth = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!auth) return undefined;
  const [scheme, value] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return undefined;
  return value.trim();
};

export const requireUser = async (request: NextRequest): Promise<AuthenticatedUser> => {
  const bearer = extractBearer(request);
  const candidates: string[] = [];

  if (bearer) candidates.push(bearer);

  const cookieValues = await getAllCookieValues(request);
  for (const v of cookieValues) candidates.push(v);

  const seen = new Set<string>();
  for (const token of candidates) {
    const t = token.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);

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
      [t],
    );

    const record = result.rows[0];
    if (record) {
      return {
        id: record.id,
        email: record.email,
        name: record.name,
        sessionToken: record.token,
      };
    }
  }

  throw new UnauthorizedError();
};

export { UnauthorizedError };
