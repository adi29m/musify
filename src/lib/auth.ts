import "server-only";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "music_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = { id: string; email: string; name: string };

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "dev-secret-change-me") {
    throw new Error("Set JWT_SECRET to a private random value before using authentication.");
  }
  return secret;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), { algorithm: "HS256", expiresIn: MAX_AGE });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      maxAge: MAX_AGE,
    });
    if (typeof payload === "string" ||
        typeof payload.id !== "string" || !payload.id ||
        typeof payload.email !== "string" || !payload.email ||
        typeof payload.name !== "string" || !payload.name ||
        typeof payload.exp !== "number") return null;
    return { id: payload.id, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = signToken(user);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: u.id },
    select: { id: true, email: true, name: true },
  });
  if (!dbUser) return null;
  return { id: dbUser.id, email: dbUser.email, name: dbUser.name } as SessionUser;
}
