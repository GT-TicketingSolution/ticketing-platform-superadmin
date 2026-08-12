import { NextRequest, NextResponse } from "next/server";

import {
  createAdminRequest,
  getAdminRequests,
  findAdminForRequest,
} from "@/server/admin-request/admin-request.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/admin-requests                                                    */
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

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const search = searchParams.get("search")?.trim() || undefined;

    const statusParam = searchParams.get("status");

    const adminId = searchParams.get("adminId") || undefined;

    const city = searchParams.get("city")?.trim() || undefined;

    /* ---------------------------------------------------------------------- */
    /* Pagination                                                             */
    /* ---------------------------------------------------------------------- */

    const page = pageParam ? Number(pageParam) : 1;
    const limit = limitParam ? Number(limitParam) : 10;

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Page must be a positive integer",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Limit must be between 1 and 100",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Status Validation                                                      */
    /* ---------------------------------------------------------------------- */

    const allowedStatuses = [
      "PENDING",
      "IN_PROGRESS",
      "ACCEPTED",
      "REJECTED",
      "CANCELLED",
    ] as const;

    let status:
      | "PENDING"
      | "IN_PROGRESS"
      | "ACCEPTED"
      | "REJECTED"
      | "CANCELLED"
      | undefined;

    if (statusParam) {
      if (
        !allowedStatuses.includes(
          statusParam as (typeof allowedStatuses)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid request status",
          },
          { status: 400 },
        );
      }

      status = statusParam as (typeof allowedStatuses)[number];
    }

    /* ---------------------------------------------------------------------- */
    /* Fetch Requests                                                         */
    /* ---------------------------------------------------------------------- */

    const result = await getAdminRequests({
      page,
      limit,
      search,
      status,
      adminId,
      city,
    });

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET_ADMIN_REQUESTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admin requests",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST /api/admin-requests                                                   */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
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
    /* Request Body                                                            */
    /* ---------------------------------------------------------------------- */

    const body = await request.json();

    const { adminId, description, desc, name, phone, email } = body;

    /* ---------------------------------------------------------------------- */
    /* Description                                                            */
    /* ---------------------------------------------------------------------- */

    const requestDescription =
      typeof description === "string"
        ? description
        : typeof desc === "string"
          ? desc
          : "";

    if (!requestDescription.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Description cannot be empty",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Find Admin                                                             */
    /* ---------------------------------------------------------------------- */

    const admin = await findAdminForRequest({
      adminId,
      name,
      phone,
      email,
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        { status: 404 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Create Admin Request                                                   */
    /* ---------------------------------------------------------------------- */

    const adminRequest = await createAdminRequest(
      {
        adminId: admin.id,
        description: requestDescription.trim(),
      },
      user.id,
    );

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        message: "Admin request created successfully",
        data: adminRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_ADMIN_REQUEST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create admin request",
      },
      { status: 500 },
    );
  }
}
