import { NextRequest, NextResponse } from "next/server";

import { checkRenewalNotifications } from "@/server/renewal/renewal-notification.service";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is not configured");

      return NextResponse.json(
        {
          success: false,
          message: "Cron secret is not configured",
        },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const result = await checkRenewalNotifications();

    return NextResponse.json({
      success: true,
      message: "Renewal notifications checked successfully",
      data: result,
    });
  } catch (error) {
    console.error("RENEWAL_NOTIFICATION_CRON_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to check renewal notifications",
      },
      { status: 500 },
    );
  }
}
