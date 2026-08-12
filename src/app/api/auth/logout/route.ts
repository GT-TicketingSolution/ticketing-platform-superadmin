import { NextRequest, NextResponse } from "next/server";

import { logout } from "@/server/auth/auth.service";
import { SESSION_COOKIE } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for") ?? undefined;

    const userAgent = request.headers.get("user-agent") ?? undefined;

    await logout(ipAddress, userAgent);

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Remove session cookie from browser
    response.cookies.delete(SESSION_COOKIE);

    return response;
  } catch (error) {
    console.error("LOGOUT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
      },
      { status: 500 },
    );
  }
}
