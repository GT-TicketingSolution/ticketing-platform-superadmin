// import { NextRequest, NextResponse } from "next/server";

// import { createAdmin, getAdmins } from "@/server/admin/admin.service";

// import { getCurrentUser } from "@/server/auth/auth.service";

// export async function GET(request: NextRequest) {
//   try {
//     const user = await getCurrentUser();

//     if (!user) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Unauthenticated",
//         },
//         { status: 401 },
//       );
//     }

//     const { searchParams } = new URL(request.url);

//     const page = Number(searchParams.get("page"));
//     const limit = Number(searchParams.get("limit"));
//     const search = searchParams.get("search") ?? undefined;
//     const city = searchParams.get("city") ?? undefined;
//     const status = searchParams.get("status") as
//       | "ACTIVE"
//       | "INACTIVE"
//       | "SUSPENDED"
//       | undefined;

//     const data = await getAdmins({
//       page,
//       limit,
//       search,
//       city,
//       status,
//     });

//     return NextResponse.json({
//       success: true,
//       data,
//     });
//   } catch (error) {
//     console.error("GET_ADMINS_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch admins",
//       },
//       { status: 500 },
//     );
//   }
// }

// /* -------------------------------------------------------------------------- */
// /* POST /api/admins                                                           */
// /* -------------------------------------------------------------------------- */

// export async function POST(request: NextRequest) {
//   try {
//     /* ---------------------------------------------------------------------- */
//     /* Authentication                                                         */
//     /* ---------------------------------------------------------------------- */

//     const user = await getCurrentUser();

//     if (!user) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Unauthenticated",
//         },
//         { status: 401 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Parse Body                                                             */
//     /* ---------------------------------------------------------------------- */

//     const body = await request.json();

//     const {
//       fullName,
//       phone,
//       city,
//       email,
//       subdomain,
//       renewalAmount,
//       joinedAt,
//       nextRenewalDate,
//       status,
//     } = body;

//     /* ---------------------------------------------------------------------- */
//     /* Required Fields                                                        */
//     /* ---------------------------------------------------------------------- */

//     if (
//       !fullName ||
//       !phone ||
//       !city ||
//       !email ||
//       renewalAmount === undefined ||
//       !nextRenewalDate
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             "Full name, phone, city, email, renewal amount and next renewal date are required",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Email Validation                                                       */
//     /* ---------------------------------------------------------------------- */

//     const normalizedEmail = String(email).trim().toLowerCase();

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!emailRegex.test(normalizedEmail)) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid email address",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Renewal Amount Validation                                              */
//     /* ---------------------------------------------------------------------- */

//     const amount = String(renewalAmount).trim();

//     if (!amount || Number.isNaN(Number(amount)) || Number(amount) < 0) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid renewal amount",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Date Validation                                                        */
//     /* ---------------------------------------------------------------------- */

//     const parsedNextRenewalDate = new Date(nextRenewalDate);

//     if (Number.isNaN(parsedNextRenewalDate.getTime())) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid next renewal date",
//         },
//         { status: 400 },
//       );
//     }

//     let parsedJoinedAt: Date | undefined;

//     if (joinedAt) {
//       parsedJoinedAt = new Date(joinedAt);

//       if (Number.isNaN(parsedJoinedAt.getTime())) {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "Invalid joined date",
//           },
//           { status: 400 },
//         );
//       }
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Status Validation                                                      */
//     /* ---------------------------------------------------------------------- */

//     const allowedStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

//     if (status !== undefined && !allowedStatuses.includes(status)) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Status must be ACTIVE, INACTIVE or SUSPENDED",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Create Admin                                                           */
//     /* ---------------------------------------------------------------------- */

//     const admin = await createAdmin(
//       {
//         fullName: String(fullName),
//         phone: String(phone),
//         city: String(city),
//         email: normalizedEmail,
//         subdomain: subdomain ? String(subdomain) : null,
//         renewalAmount: amount,
//         joinedAt: parsedJoinedAt,
//         nextRenewalDate: parsedNextRenewalDate,
//         status,
//       },
//       user.id,
//     );

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Admin created successfully",
//         data: admin,
//       },
//       { status: 201 },
//     );
//   } catch (error: any) {
//     console.error("CREATE_ADMIN_ERROR:", error);

//     /* ---------------------------------------------------------------------- */
//     /* Unique Constraint                                                      */
//     /* ---------------------------------------------------------------------- */

//     if (error?.code === "23505") {
//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             "An admin with this email, phone or subdomain already exists",
//         },
//         { status: 409 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Internal Error                                                         */
//     /* ---------------------------------------------------------------------- */

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to create admin",
//       },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";

import { createAdmin, getAdmins } from "@/server/admin/admin.service";

import { getCurrentUser } from "@/server/auth/auth.service";

const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

function errorResponse(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}

/* -------------------------------------------------------------------------- */
/* GET /api/admins                                                            */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  try {
    /* ---------------------------------------------------------------------- */
    /* Authentication                                                          */
    /* ---------------------------------------------------------------------- */

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Unauthenticated", 401);
    }

    /* ---------------------------------------------------------------------- */
    /* Query Parameters                                                        */
    /* ---------------------------------------------------------------------- */

    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    let page: number | undefined;
    let limit: number | undefined;

    /* ---------------------------------------------------------------------- */
    /* Page Validation                                                         */
    /* ---------------------------------------------------------------------- */

    if (pageParam !== null) {
      page = Number(pageParam);

      if (!Number.isInteger(page) || page < 1) {
        return errorResponse(
          "Invalid page. Page must be a positive integer.",
          400,
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Limit Validation                                                        */
    /* ---------------------------------------------------------------------- */

    if (limitParam !== null) {
      limit = Number(limitParam);

      if (!Number.isInteger(limit) || limit < 1) {
        return errorResponse(
          "Invalid limit. Limit must be a positive integer.",
          400,
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Filters                                                                 */
    /* ---------------------------------------------------------------------- */

    const search = searchParams.get("search")?.trim() || undefined;
    const city = searchParams.get("city")?.trim() || undefined;
    const statusParam = searchParams.get("status");

    let status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;

    if (statusParam !== null) {
      if (
        !ALLOWED_STATUSES.includes(
          statusParam as (typeof ALLOWED_STATUSES)[number],
        )
      ) {
        return errorResponse(
          "Invalid status. Status must be ACTIVE, INACTIVE or SUSPENDED.",
          400,
        );
      }

      status = statusParam as "ACTIVE" | "INACTIVE" | "SUSPENDED";
    }

    /* ---------------------------------------------------------------------- */
    /* Fetch Admins                                                            */
    /* ---------------------------------------------------------------------- */

    const data = await getAdmins({
      page,
      limit,
      search,
      city,
      status,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_ADMINS_ERROR:", error);

    return errorResponse("Failed to fetch admins", 500);
  }
}

/* -------------------------------------------------------------------------- */
/* POST /api/admins                                                           */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    /* ---------------------------------------------------------------------- */
    /* Authentication                                                          */
    /* ---------------------------------------------------------------------- */

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Unauthenticated", 401);
    }

    /* ---------------------------------------------------------------------- */
    /* Parse Body                                                              */
    /* ---------------------------------------------------------------------- */

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Extract Fields                                                          */
    /* ---------------------------------------------------------------------- */

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
    /* Required Fields                                                         */
    /* ---------------------------------------------------------------------- */

    if (typeof fullName !== "string" || !fullName.trim()) {
      return errorResponse("Full name is required", 400);
    }

    if (typeof phone !== "string" || !phone.trim()) {
      return errorResponse("Phone is required", 400);
    }

    if (typeof city !== "string" || !city.trim()) {
      return errorResponse("City is required", 400);
    }

    if (typeof email !== "string" || !email.trim()) {
      return errorResponse("Email is required", 400);
    }

    if (
      renewalAmount === undefined ||
      renewalAmount === null ||
      String(renewalAmount).trim() === ""
    ) {
      return errorResponse("Renewal amount is required", 400);
    }

    if (typeof nextRenewalDate !== "string" || !nextRenewalDate.trim()) {
      return errorResponse("Next renewal date is required", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Email Validation                                                        */
    /* ---------------------------------------------------------------------- */

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return errorResponse("Invalid email address", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Ticketing Email Domain Validation                                      */
    /* ---------------------------------------------------------------------- */

    if (!normalizedEmail.endsWith("@ticketing.com")) {
      return errorResponse("Email must end with @ticketing.com", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Subdomain Validation                                                    */
    /* ---------------------------------------------------------------------- */

    let normalizedSubdomain: string | null = null;

    if (subdomain !== undefined && subdomain !== null) {
      if (typeof subdomain !== "string") {
        return errorResponse("Invalid subdomain", 400);
      }

      normalizedSubdomain = subdomain.trim().toLowerCase();

      if (!normalizedSubdomain) {
        normalizedSubdomain = null;
      }
    }

    if (normalizedSubdomain && !normalizedSubdomain.endsWith("ticketing.com")) {
      return errorResponse("Subdomain must end with ticketing.com", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Renewal Amount Validation                                               */
    /* ---------------------------------------------------------------------- */

    const amount = String(renewalAmount).trim();
    const numericAmount = Number(amount);

    if (!amount || !Number.isFinite(numericAmount) || numericAmount < 0) {
      return errorResponse(
        "Renewal amount must be a valid non-negative number",
        400,
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Next Renewal Date Validation                                            */
    /* ---------------------------------------------------------------------- */

    const parsedNextRenewalDate = new Date(nextRenewalDate);

    if (Number.isNaN(parsedNextRenewalDate.getTime())) {
      return errorResponse("Invalid next renewal date", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Joined Date Validation                                                  */
    /* ---------------------------------------------------------------------- */

    let parsedJoinedAt: Date | undefined;

    if (joinedAt !== undefined && joinedAt !== null) {
      if (typeof joinedAt !== "string") {
        return errorResponse("Invalid joined date", 400);
      }

      parsedJoinedAt = new Date(joinedAt);

      if (Number.isNaN(parsedJoinedAt.getTime())) {
        return errorResponse("Invalid joined date", 400);
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Status Validation                                                       */
    /* ---------------------------------------------------------------------- */

    if (status !== undefined && status !== null) {
      if (
        typeof status !== "string" ||
        !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])
      ) {
        return errorResponse(
          "Status must be ACTIVE, INACTIVE or SUSPENDED",
          400,
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Create Admin                                                            */
    /* ---------------------------------------------------------------------- */

    const admin = await createAdmin(
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        email: normalizedEmail,
        subdomain: normalizedSubdomain,
        renewalAmount: amount,
        joinedAt: parsedJoinedAt,
        nextRenewalDate: parsedNextRenewalDate,
        status: status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined,
      },
      user.id,
    );

    if (!admin) {
      return errorResponse("Failed to create admin", 500);
    }

    /* ---------------------------------------------------------------------- */
    /* Success                                                                 */
    /* ---------------------------------------------------------------------- */

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
    /* Duplicate Record                                                        */
    /* ---------------------------------------------------------------------- */

    if (error?.code === "23505") {
      return errorResponse(
        "An admin with this email, phone or subdomain already exists",
        409,
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Database Error                                                          */
    /* ---------------------------------------------------------------------- */

    if (error?.code === "23503") {
      return errorResponse("Invalid related record", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Internal Error                                                          */
    /* ---------------------------------------------------------------------- */

    return errorResponse("Failed to create admin", 500);
  }
}
