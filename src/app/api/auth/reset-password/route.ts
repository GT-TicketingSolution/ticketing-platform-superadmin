import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";

import {
  platformAdmin,
  passwordResetTokens,
  sessions,
  auditLogs,
} from "@/server/db/schema";

import { hashPassword } from "@/server/auth/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const token = body.token;
    const password = body.password;

    /* ---------------------------------------------------------------------- */
    /* Validate Input                                                         */
    /* ---------------------------------------------------------------------- */

    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Token and password are required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Password Validation                                                    */
    /* ---------------------------------------------------------------------- */

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long",
        },
        { status: 400 },
      );
    }

    if (!/[A-Za-z]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least one letter",
        },
        { status: 400 },
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least one number",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Hash Reset Token                                                       */
    /* ---------------------------------------------------------------------- */

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    /* ---------------------------------------------------------------------- */
    /* Find Reset Token                                                       */
    /* ---------------------------------------------------------------------- */

    const result = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    const resetToken = result[0];

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Check Expiry                                                           */
    /* ---------------------------------------------------------------------- */

    if (resetToken.expiresAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "This reset link has expired",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Check Already Used                                                     */
    /* ---------------------------------------------------------------------- */

    if (resetToken.usedAt) {
      return NextResponse.json(
        {
          success: false,
          message: "This reset link has already been used",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Hash New Password                                                      */
    /* ---------------------------------------------------------------------- */

    const passwordHash = await hashPassword(password);

    /* ---------------------------------------------------------------------- */
    /* Update Super Admin Password                                            */
    /* ---------------------------------------------------------------------- */

    await db
      .update(platformAdmin)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(platformAdmin.id, resetToken.platformAdminId));

    /* ---------------------------------------------------------------------- */
    /* Mark Reset Token Used                                                  */
    /* ---------------------------------------------------------------------- */

    await db
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetTokens.id, resetToken.id));

    /* ---------------------------------------------------------------------- */
    /* Invalidate Existing Sessions                                           */
    /* ---------------------------------------------------------------------- */

    await db
      .delete(sessions)
      .where(eq(sessions.platformAdminId, resetToken.platformAdminId));

    /* ---------------------------------------------------------------------- */
    /* Audit Password Reset                                                   */
    /* ---------------------------------------------------------------------- */

    const ipAddress = request.headers.get("x-forwarded-for") ?? undefined;

    const userAgent = request.headers.get("user-agent") ?? undefined;

    await db.insert(auditLogs).values({
      actorId: resetToken.platformAdminId,

      action: "PASSWORD_RESET",

      resourceType: "PLATFORM_ADMIN",

      resourceId: resetToken.platformAdminId,

      oldValues: null,

      newValues: null,

      ipAddress,

      userAgent,
    });

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
