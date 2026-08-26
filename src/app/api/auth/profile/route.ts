import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { platformAdmin } from "@/server/db/schema";

import { getCurrentUser } from "@/server/auth/auth.service";
import { createAuditLog } from "@/server/audit/audit.service";

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

    const name = body.name;
    const email = body.email;
    const phone = body.phone;

    /* ---------------------------------------------------------------------- */
    /* Empty Update                                                           */
    /* ---------------------------------------------------------------------- */

    if (name === undefined && email === undefined && phone === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "No fields provided for update",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Name Validation                                                        */
    /* ---------------------------------------------------------------------- */

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Name cannot be empty",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Email Validation                                                       */
    /* ---------------------------------------------------------------------- */

    let emailValue: string | undefined;

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Email cannot be empty",
          },
          { status: 400 },
        );
      }

      emailValue = email.trim().toLowerCase();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(emailValue)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email address",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Phone Validation                                                       */
    /* ---------------------------------------------------------------------- */

    let phoneValue: string | undefined;

    if (phone !== undefined) {
      if (typeof phone !== "string" || !phone.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Phone number cannot be empty",
          },
          { status: 400 },
        );
      }

      // Remove spaces and hyphens for validation/normalization
      const normalizedPhone = phone.replace(/[\s-]/g, "");

      // Accept:
      // 9876543210
      // +919876543210
      const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;

      if (!phoneRegex.test(normalizedPhone)) {
        return NextResponse.json(
          {
            success: false,
            message: "Please enter a valid Indian phone number",
          },
          { status: 400 },
        );
      }

      // Always store phone number in canonical international format
      phoneValue = normalizedPhone.startsWith("+91")
        ? normalizedPhone
        : `+91${normalizedPhone}`;
    }

    /* ---------------------------------------------------------------------- */
    /* Get Current Super Admin                                                */
    /* ---------------------------------------------------------------------- */

    const result = await db
      .select()
      .from(platformAdmin)
      .where(eq(platformAdmin.id, user.id))
      .limit(1);

    const existingAdmin = result[0];

    if (!existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Super Admin not found",
        },
        { status: 404 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Update Data                                                            */
    /* ---------------------------------------------------------------------- */

    const updateData: Partial<typeof platformAdmin.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (emailValue !== undefined) {
      updateData.email = emailValue;
    }

    if (phoneValue !== undefined) {
      updateData.phone = phoneValue;
    }

    /* ---------------------------------------------------------------------- */
    /* Update Profile                                                         */
    /* ---------------------------------------------------------------------- */

    const updatedResult = await db
      .update(platformAdmin)
      .set(updateData)
      .where(eq(platformAdmin.id, user.id))
      .returning();

    const updatedAdmin = updatedResult[0];

    if (!updatedAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update profile",
        },
        { status: 500 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Audit Log                                                              */
    /* ---------------------------------------------------------------------- */

    await createAuditLog({
      actorId: user.id,

      action: "UPDATE",

      resourceType: "PLATFORM_ADMIN",

      resourceId: user.id,

      oldValues: {
        name: existingAdmin.name,
        email: existingAdmin.email,
        phone: existingAdmin.phone,
      },

      newValues: {
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
      },

      ipAddress: request.headers.get("x-forwarded-for") ?? null,

      userAgent: request.headers.get("user-agent") ?? null,
    });

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
      },
    });
  } catch (error: any) {
    console.error("UPDATE_PROFILE_ERROR:", error);

    /* ---------------------------------------------------------------------- */
    /* Unique Constraint                                                      */
    /* ---------------------------------------------------------------------- */

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "Email or phone number is already in use",
        },
        { status: 409 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Internal Error                                                         */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
      },
      { status: 500 },
    );
  }
}
