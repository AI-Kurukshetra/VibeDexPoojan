import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "vibedex_session";
const SECRET = process.env.SESSION_SECRET || "vibedex-dev-secret-change-in-prod";

export type SessionUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: "shipper" | "carrier" | "admin";
};

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

function encode(session: SessionUser): string {
  const payload = JSON.stringify(session);
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

function decode(cookieValue: string): SessionUser | null {
  const i = cookieValue.lastIndexOf(".");
  if (i === -1) return null;
  const encoded = cookieValue.slice(0, i);
  const sig = cookieValue.slice(i + 1);
  if (sig.length === 0) return null;
  try {
    const expected = sign(encoded);
    if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8")))
      return null;
    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    const session = JSON.parse(payload) as SessionUser;
    if (!session.id || !session.email || !session.role) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return decode(value);
}

export async function setSession(user: SessionUser) {
  const store = await cookies();
  store.set(COOKIE_NAME, encode(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function getSessionFromCookieHeader(cookieHeader: string | null): SessionUser | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const value = match?.[1];
  if (!value) return null;
  return decode(decodeURIComponent(value));
}
