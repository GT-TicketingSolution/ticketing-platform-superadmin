import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/auth.service";

import { getAuditLogs } from "@/server/audit/audit.service";

export async function GET() {
  try {
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

    const data = await getAuditLogs();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_AUDIT_LOGS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch audit logs",
      },
      { status: 500 },
    );
  }
}
