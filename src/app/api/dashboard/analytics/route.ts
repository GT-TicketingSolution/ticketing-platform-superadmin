import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/auth.service";
import { getDashboard } from "@/server/dashboard/dashboard-analytics.service";

/* -------------------------------------------------------------------------- */
/* GET /api/dashboard/analytics                                               */
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
    /* Year                                                                    */
    /* ---------------------------------------------------------------------- */

    const yearParam = request.nextUrl.searchParams.get("year");

    let year: number | undefined;

    if (yearParam !== null) {
      year = Number(yearParam);

      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid year",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Dashboard                                                               */
    /* ---------------------------------------------------------------------- */

    const data = await getDashboard({
      year,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_DASHBOARD_ANALYTICS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard analytics",
      },
      { status: 500 },
    );
  }
}
