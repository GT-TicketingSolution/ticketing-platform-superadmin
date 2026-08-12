import { NextResponse } from "next/server";

import { getModules } from "@/server/admin/admin-module.service";

import { getCurrentUser } from "@/server/auth/auth.service";

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

    const data = await getModules();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_MODULES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch modules",
      },
      { status: 500 },
    );
  }
}
