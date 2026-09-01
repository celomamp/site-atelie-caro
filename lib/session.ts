// lib/session.ts
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_PASSWORD } from "@/lib/session-config";

type SessionData = { isAdmin: boolean };

export async function getSession() {
  return getIronSession<SessionData>(cookies(), {
    password: SESSION_PASSWORD,
    cookieName: SESSION_COOKIE,
  });
}

export async function isAdmin() {
  const session = await getSession();
  return !!session.isAdmin;
}
