import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";

import { platformAdmin, passwordResetTokens } from "@/server/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();

    /* ---------------------------------------------------------------------- */
    /* Validate Email                                                         */
    /* ---------------------------------------------------------------------- */

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Find Super Admin                                                       */
    /* ---------------------------------------------------------------------- */

    const result = await db
      .select()
      .from(platformAdmin)
      .where(eq(platformAdmin.email, email))
      .limit(1);

    const admin = result[0];

    /*
     * Don't reveal whether the Super Admin
     * account exists.
     */
    if (!admin) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a reset link has been sent.",
      });
    }

    /* ---------------------------------------------------------------------- */
    /* Generate Reset Token                                                   */
    /* ---------------------------------------------------------------------- */

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    /* ---------------------------------------------------------------------- */
    /* Token Expiry                                                           */
    /* ---------------------------------------------------------------------- */

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    /* ---------------------------------------------------------------------- */
    /* Store Reset Token                                                      */
    /* ---------------------------------------------------------------------- */

    await db.insert(passwordResetTokens).values({
      platformAdminId: admin.id,
      tokenHash,
      expiresAt,
    });

    /* ---------------------------------------------------------------------- */
    /* Reset URL                                                              */
    /* ---------------------------------------------------------------------- */

    const resetUrl =
      `${process.env.NEXT_PUBLIC_APP_URL}` +
      `/reset-password?token=${rawToken}`;

    /*
     * Development only.
     *
     * In production this URL should be sent
     * through your email service.
     */
    console.log("PASSWORD RESET URL:", resetUrl);

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
