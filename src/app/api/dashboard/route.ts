import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/auth.service";

import { getDashboard } from "@/server/dashboard/dashboard.service";

/* -------------------------------------------------------------------------- */
/* GET /api/dashboard                                                         */
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

    const searchParams = request.nextUrl.searchParams;

    const yearParam = searchParams.get("year");

    let year = new Date().getFullYear();

    if (yearParam !== null) {
      const parsedYear = Number(yearParam);

      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 2000 ||
        parsedYear > 2100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid year",
          },
          { status: 400 },
        );
      }

      year = parsedYear;
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
    console.error("GET_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard data",
      },
      { status: 500 },
    );
  }
}
