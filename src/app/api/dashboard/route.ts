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
    /* Query Parameters                                                       */
    /* ---------------------------------------------------------------------- */

    const searchParams = request.nextUrl.searchParams;

    /* ---------------------------------------------------------------------- */
    /* Year                                                                   */
    /* ---------------------------------------------------------------------- */

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
    /* City                                                                   */
    /* ---------------------------------------------------------------------- */

    const cityParam = searchParams.get("city");

    const city =
      cityParam && cityParam.trim().length > 0 ? cityParam.trim() : undefined;

    /* ---------------------------------------------------------------------- */
    /* From Date                                                              */
    /* ---------------------------------------------------------------------- */

    const fromParam = searchParams.get("from");

    let from: Date | undefined;

    if (fromParam !== null) {
      // Expected format: YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fromParam)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid from date. Expected format: YYYY-MM-DD",
          },
          { status: 400 },
        );
      }

      from = new Date(`${fromParam}T00:00:00`);

      if (Number.isNaN(from.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid from date",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* To Date                                                                */
    /* ---------------------------------------------------------------------- */

    const toParam = searchParams.get("to");

    let to: Date | undefined;

    if (toParam !== null) {
      // Expected format: YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid to date. Expected format: YYYY-MM-DD",
          },
          { status: 400 },
        );
      }

      to = new Date(`${toParam}T00:00:00`);

      if (Number.isNaN(to.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid to date",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Date Range Validation                                                  */
    /* ---------------------------------------------------------------------- */

    if (from && to && from > to) {
      return NextResponse.json(
        {
          success: false,
          message: "From date cannot be greater than to date",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Dashboard                                                              */
    /* ---------------------------------------------------------------------- */

    const data = await getDashboard({
      year,
      city,
      from,
      to,
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
