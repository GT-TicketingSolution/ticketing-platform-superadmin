import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/server/db";

import { platformAdmin, sessions, auditLogs } from "@/server/db/schema";

import { verifyPassword } from "./password";

import {
  generateSessionToken,
  hashToken,
  SESSION_COOKIE,
  SESSION_DURATION,
} from "./session";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AuthenticatedAdmin = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

/* -------------------------------------------------------------------------- */
/* Find Platform Admin                                                        */
/* -------------------------------------------------------------------------- */

export async function findPlatformAdminByEmail(email: string) {
  const result = await db
    .select()
    .from(platformAdmin)
    .where(eq(platformAdmin.email, email.trim().toLowerCase()))
    .limit(1);

  return result[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Authenticate Platform Admin                                                */
/* -------------------------------------------------------------------------- */

export async function authenticateUser(email: string, password: string) {
  const admin = await findPlatformAdminByEmail(email);

  if (!admin) {
    return {
      success: false as const,
      reason: "INVALID_CREDENTIALS" as const,
    };
  }

  const validPassword = await verifyPassword(password, admin.passwordHash);

  if (!validPassword) {
    return {
      success: false as const,
      reason: "INVALID_CREDENTIALS" as const,
    };
  }

  return {
    success: true as const,
    admin,
  };
}

/* -------------------------------------------------------------------------- */
/* Create Session                                                             */
/* -------------------------------------------------------------------------- */

export async function createSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const sessionToken = generateSessionToken();

  const tokenHash = hashToken(sessionToken);

  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    platformAdminId: adminId,
    tokenHash,
    expiresAt,
  });

  /* ------------------------------------------------------------------------ */
  /* Update Last Login                                                        */
  /* ------------------------------------------------------------------------ */

  await db
    .update(platformAdmin)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(platformAdmin.id, adminId));

  /* ------------------------------------------------------------------------ */
  /* Audit Login                                                              */
  /* ------------------------------------------------------------------------ */

  await db.insert(auditLogs).values({
    actorId: adminId,
    action: "LOGIN",
    resourceType: "PLATFORM_ADMIN",
    resourceId: adminId,
    oldValues: null,
    newValues: null,
    ipAddress,
    userAgent,
  });

  /* ------------------------------------------------------------------------ */
  /* Cookie                                                                   */
  /* ------------------------------------------------------------------------ */

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return {
    expiresAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Get Current Session                                                        */
/* -------------------------------------------------------------------------- */

export async function getCurrentSession() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashToken(sessionToken);

  const result = await db
    .select({
      session: sessions,
      admin: platformAdmin,
    })
    .from(sessions)
    .innerJoin(platformAdmin, eq(sessions.platformAdminId, platformAdmin.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  const data = result[0];

  if (!data) {
    cookieStore.delete(SESSION_COOKIE);

    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Session Expired                                                          */
  /* ------------------------------------------------------------------------ */

  if (data.session.expiresAt <= new Date()) {
    await db.delete(sessions).where(eq(sessions.id, data.session.id));

    cookieStore.delete(SESSION_COOKIE);

    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Update Last Used                                                         */
  /* ------------------------------------------------------------------------ */

  await db
    .update(sessions)
    .set({
      lastUsedAt: new Date(),
    })
    .where(eq(sessions.id, data.session.id));

  return data;
}

/* -------------------------------------------------------------------------- */
/* Get Current Authenticated Admin                                            */
/* -------------------------------------------------------------------------- */

export async function getCurrentUser(): Promise<AuthenticatedAdmin | null> {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  return {
    id: session.admin.id,
    name: session.admin.name,
    email: session.admin.email,
    phone: session.admin.phone,
  };
}

/* -------------------------------------------------------------------------- */
/* Require Authentication                                                     */
/* -------------------------------------------------------------------------- */

export async function requireAuthentication() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError(
      "AUTHENTICATION_REQUIRED",
      "Authentication required",
    );
  }

  return user;
}

/* -------------------------------------------------------------------------- */
/* Logout                                                                     */
/* -------------------------------------------------------------------------- */

export async function logout(ipAddress?: string, userAgent?: string) {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    cookieStore.delete(SESSION_COOKIE);

    return;
  }

  const tokenHash = hashToken(sessionToken);

  /* ------------------------------------------------------------------------ */
  /* Find Session Before Deleting                                             */
  /* ------------------------------------------------------------------------ */

  const result = await db
    .select({
      session: sessions,
      admin: platformAdmin,
    })
    .from(sessions)
    .innerJoin(platformAdmin, eq(sessions.platformAdminId, platformAdmin.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  const data = result[0];

  /* ------------------------------------------------------------------------ */
  /* Delete Session                                                           */
  /* ------------------------------------------------------------------------ */

  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));

  /* ------------------------------------------------------------------------ */
  /* Audit Logout                                                             */
  /* ------------------------------------------------------------------------ */

  if (data) {
    await db.insert(auditLogs).values({
      actorId: data.admin.id,
      action: "LOGOUT",
      resourceType: "PLATFORM_ADMIN",
      resourceId: data.admin.id,
      oldValues: null,
      newValues: null,
      ipAddress,
      userAgent,
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

/* -------------------------------------------------------------------------- */
/* Logout All Sessions                                                        */
/* -------------------------------------------------------------------------- */

export async function logoutAllSessions(adminId: string) {
  await db.delete(sessions).where(eq(sessions.platformAdminId, adminId));

  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}

/* -------------------------------------------------------------------------- */
/* Update Last Login                                                          */
/* -------------------------------------------------------------------------- */

export async function updateLastLogin(adminId: string) {
  await db
    .update(platformAdmin)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(platformAdmin.id, adminId));
}

/* -------------------------------------------------------------------------- */
/* Authentication Error                                                       */
/* -------------------------------------------------------------------------- */

export class AuthenticationError extends Error {
  constructor(
    public code: "AUTHENTICATION_REQUIRED" | "INVALID_CREDENTIALS",
    message: string,
  ) {
    super(message);

    this.name = "AuthenticationError";
  }
}
