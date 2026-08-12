import { NextRequest, NextResponse } from "next/server";

import { createAdmin, getAdmins } from "@/server/admin/admin.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/admins                                                            */
/* -------------------------------------------------------------------------- */

export async function GET() {
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
    /* Fetch Admins                                                           */
    /* ---------------------------------------------------------------------- */

    const data = await getAdmins();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_ADMINS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admins",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST /api/admins                                                           */
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
    /* Parse Body                                                             */
    /* ---------------------------------------------------------------------- */

    const body = await request.json();

    const {
      fullName,
      phone,
      city,
      email,
      subdomain,
      renewalAmount,
      joinedAt,
      nextRenewalDate,
      status,
    } = body;

    /* ---------------------------------------------------------------------- */
    /* Required Fields                                                        */
    /* ---------------------------------------------------------------------- */

    if (
      !fullName ||
      !phone ||
      !city ||
      !email ||
      renewalAmount === undefined ||
      !nextRenewalDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Full name, phone, city, email, renewal amount and next renewal date are required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Email Validation                                                       */
    /* ---------------------------------------------------------------------- */

    const normalizedEmail = String(email).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Renewal Amount Validation                                              */
    /* ---------------------------------------------------------------------- */

    const amount = String(renewalAmount).trim();

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid renewal amount",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Date Validation                                                        */
    /* ---------------------------------------------------------------------- */

    const parsedNextRenewalDate = new Date(nextRenewalDate);

    if (Number.isNaN(parsedNextRenewalDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid next renewal date",
        },
        { status: 400 },
      );
    }

    let parsedJoinedAt: Date | undefined;

    if (joinedAt) {
      parsedJoinedAt = new Date(joinedAt);

      if (Number.isNaN(parsedJoinedAt.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid joined date",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Status Validation                                                      */
    /* ---------------------------------------------------------------------- */

    const allowedStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be ACTIVE, INACTIVE or SUSPENDED",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Create Admin                                                           */
    /* ---------------------------------------------------------------------- */

    const admin = await createAdmin(
      {
        fullName: String(fullName),
        phone: String(phone),
        city: String(city),
        email: normalizedEmail,
        subdomain: subdomain ? String(subdomain) : null,
        renewalAmount: amount,
        joinedAt: parsedJoinedAt,
        nextRenewalDate: parsedNextRenewalDate,
        status,
      },
      user.id,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Admin created successfully",
        data: admin,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("CREATE_ADMIN_ERROR:", error);

    /* ---------------------------------------------------------------------- */
    /* Unique Constraint                                                      */
    /* ---------------------------------------------------------------------- */

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message:
            "An admin with this email, phone or subdomain already exists",
        },
        { status: 409 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Internal Error                                                         */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create admin",
      },
      { status: 500 },
    );
  }
}
