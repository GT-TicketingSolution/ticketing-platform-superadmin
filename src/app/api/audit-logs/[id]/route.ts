import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/auth.service";

import { getAuditLogById } from "@/server/audit/audit.service";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Audit log ID is required",
        },
        { status: 400 },
      );
    }

    const auditLog = await getAuditLogById(id);

    if (!auditLog) {
      return NextResponse.json(
        {
          success: false,
          message: "Audit log not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: auditLog,
    });
  } catch (error) {
    console.error("GET_AUDIT_LOG_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch audit log",
      },
      { status: 500 },
    );
  }
}
