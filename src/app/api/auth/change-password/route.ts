import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { platformAdmin, auditLogs } from "@/server/db/schema";

import { getCurrentUser } from "@/server/auth/auth.service";
import { hashPassword, verifyPassword } from "@/server/auth/password";

export async function PATCH(request: NextRequest) {
  try {
    /* ---------------------------------------------------------------------- */
    /* Authentication                                                         */
    /* ---------------------------------------------------------------------- */

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Parse Body                                                             */
    /* ---------------------------------------------------------------------- */

    const body = await request.json();

    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password and new password are required",
        },
        { status: 400 },
      );
    }

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid password format",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* New Password Validation                                                */
    /* ---------------------------------------------------------------------- */

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long",
        },
        { status: 400 },
      );
    }

    if (!/[A-Za-z]/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least one letter",
        },
        { status: 400 },
      );
    }

    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least one number",
        },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different from current password",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Get Current Admin                                                      */
    /* ---------------------------------------------------------------------- */

    const result = await db
      .select()
      .from(platformAdmin)
      .where(eq(platformAdmin.id, user.id))
      .limit(1);

    const admin = result[0];

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin account not found",
        },
        { status: 404 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Verify Current Password                                                */
    /* ---------------------------------------------------------------------- */

    const passwordValid = await verifyPassword(
      currentPassword,
      admin.passwordHash,
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Hash New Password                                                      */
    /* ---------------------------------------------------------------------- */

    const passwordHash = await hashPassword(newPassword);

    /* ---------------------------------------------------------------------- */
    /* Update Password                                                        */
    /* ---------------------------------------------------------------------- */

    await db
      .update(platformAdmin)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(platformAdmin.id, admin.id));

    /* ---------------------------------------------------------------------- */
    /* Audit Log                                                              */
    /* ---------------------------------------------------------------------- */

    await db.insert(auditLogs).values({
      actorId: admin.id,

      action: "PASSWORD_RESET",

      resourceType: "PLATFORM_ADMIN",

      resourceId: admin.id,

      oldValues: null,

      newValues: null,

      ipAddress: request.headers.get("x-forwarded-for") ?? null,

      userAgent: request.headers.get("user-agent") ?? null,
    });

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to change password",
      },
      { status: 500 },
    );
  }
}
