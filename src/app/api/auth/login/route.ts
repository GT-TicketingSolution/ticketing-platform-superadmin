import { NextRequest, NextResponse } from "next/server";

import { authenticateUser, createSession } from "@/server/auth/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = body.email?.trim();
    const password = body.password;

    /* ---------------------------------------------------------------------- */
    /* Validate Input                                                         */
    /* ---------------------------------------------------------------------- */

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Authenticate                                                           */
    /* ---------------------------------------------------------------------- */

    const result = await authenticateUser(email, password);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      );
    }

    const admin = result.admin;

    /* ---------------------------------------------------------------------- */
    /* Create Session                                                         */
    /* ---------------------------------------------------------------------- */

    await createSession(
      admin.id,
      request.headers.get("x-forwarded-for") ?? undefined,
      request.headers.get("user-agent") ?? undefined,
    );

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      message: "Login successful",

      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
      },
    });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
