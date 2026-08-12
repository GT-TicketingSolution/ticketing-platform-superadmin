import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/auth.service";

import { getUpcomingRenewals } from "@/server/dashboard/upcoming-renewals.service";

/* -------------------------------------------------------------------------- */
/* GET /api/dashboard/upcoming-renewals                                       */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
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
    /* Days Filter                                                             */
    /* ---------------------------------------------------------------------- */

    const daysParam = request.nextUrl.searchParams.get("days");

    const days = daysParam ? Number(daysParam) : 15;

    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return NextResponse.json(
        {
          success: false,
          message: "Days must be an integer between 1 and 365",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Fetch Renewals                                                          */
    /* ---------------------------------------------------------------------- */

    const data = await getUpcomingRenewals({
      days,
    });

    /* ---------------------------------------------------------------------- */
    /* Response                                                                */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_UPCOMING_RENEWALS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch upcoming renewals",
      },
      { status: 500 },
    );
  }
}
