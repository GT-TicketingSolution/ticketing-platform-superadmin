// import { NextRequest, NextResponse } from "next/server";

// import {
//   createRenewal,
//   getRenewals,
//   getAdminById,
// } from "@/server/renewal/renewal.service";

// import { getCurrentUser } from "@/server/auth/auth.service";

// /* -------------------------------------------------------------------------- */
// /* GET /api/renewals                                                          */
// /* -------------------------------------------------------------------------- */

// // export async function GET(request: NextRequest) {
// //   try {
// //     const user = await getCurrentUser();

// //     if (!user) {
// //       return NextResponse.json(
// //         {
// //           success: false,
// //           message: "Unauthenticated",
// //         },
// //         { status: 401 },
// //       );
// //     }

// //     const searchParams = request.nextUrl.searchParams;

// //     const page = Number(searchParams.get("page") ?? 1);
// //     const limit = Number(searchParams.get("limit") ?? 10);

// //     const search = searchParams.get("search")?.trim() || undefined;

// //     const status = searchParams.get("status") || undefined;

// //     const paymentStatus = searchParams.get("paymentStatus") || undefined;

// //     const paymentMethod = searchParams.get("paymentMethod") || undefined;

// //     const adminId = searchParams.get("adminId") || undefined;

// //     // validation + getRenewals(...)
// //     // use the full GET implementation from above
// //   } catch (error) {
// //     console.error("GET_RENEWALS_ERROR:", error);

// //     return NextResponse.json(
// //       {
// //         success: false,
// //         message: "Failed to fetch renewals",
// //       },
// //       { status: 500 },
// //     );
// //   }
// // }

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

//     const searchParams = request.nextUrl.searchParams;

//     const page = Math.max(Number(searchParams.get("page") ?? 1), 1);

//     const limit = Math.min(
//       Math.max(Number(searchParams.get("limit") ?? 10), 1),
//       100,
//     );

//     const search = searchParams.get("search")?.trim() || undefined;

//     const statusParam = searchParams.get("status");

//     const status =
//       statusParam === "PENDING" ||
//       statusParam === "PAID" ||
//       statusParam === "CANCELLED"
//         ? statusParam
//         : undefined;

//     const paymentStatusParam = searchParams.get("paymentStatus");

//     const paymentStatus =
//       paymentStatusParam === "PENDING" ||
//       paymentStatusParam === "SUCCESS" ||
//       paymentStatusParam === "FAILED" ||
//       paymentStatusParam === "REFUNDED"
//         ? paymentStatusParam
//         : undefined;

//     const paymentMethodParam = searchParams.get("paymentMethod");

//     const paymentMethod =
//       paymentMethodParam === "CASH" ||
//       paymentMethodParam === "BANK_TRANSFER" ||
//       paymentMethodParam === "UPI" ||
//       paymentMethodParam === "CARD" ||
//       paymentMethodParam === "ONLINE" ||
//       paymentMethodParam === "OTHER"
//         ? paymentMethodParam
//         : undefined;

//     const adminId = searchParams.get("adminId") || undefined;

//     const result = await getRenewals({
//       page,
//       limit,
//       search,
//       status,
//       paymentStatus,
//       paymentMethod,
//       adminId,
//     });

//     return NextResponse.json({
//       success: true,
//       data: result.data,
//       pagination: result.pagination,
//     });
//   } catch (error) {
//     console.error("GET_RENEWALS_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to fetch renewals",
//       },
//       { status: 500 },
//     );
//   }
// }

// /* -------------------------------------------------------------------------- */
// /* POST /api/renewals                                                         */
// /* -------------------------------------------------------------------------- */

// export async function POST(request: NextRequest) {
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

//     const body = await request.json();

//     const {
//       adminId,
//       amount,
//       status,
//       paymentDate,
//       paymentMethod,
//       transactionReference,
//       paymentStatus,
//     } = body;

//     /* ---------------------------------------------------------------------- */
//     /* Required Fields                                                        */
//     /* ---------------------------------------------------------------------- */

//     if (!adminId || amount === undefined) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Admin ID and amount are required",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Check Admin                                                            */
//     /* ---------------------------------------------------------------------- */

//     const admin = await getAdminById(adminId);

//     if (!admin) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Admin not found",
//         },
//         { status: 404 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Calculate Renewal Dates                                                */
//     /* ---------------------------------------------------------------------- */

//     if (!admin.joinedAt) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Admin joined date is not available",
//         },
//         { status: 400 },
//       );
//     }

//     // Start date = admin joined date
//     const parsedStartDate = new Date(admin.joinedAt);

//     // Next renewal date = joined date + 1 year
//     const parsedDueDate = new Date(admin.joinedAt);
//     parsedDueDate.setFullYear(parsedDueDate.getFullYear() + 1);

//     /* ---------------------------------------------------------------------- */
//     /* Amount Validation                                                      */
//     /* ---------------------------------------------------------------------- */

//     const normalizedAmount = String(amount).trim();

//     if (
//       !normalizedAmount ||
//       Number.isNaN(Number(normalizedAmount)) ||
//       Number(normalizedAmount) < 0
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid amount",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Status Validation                                                      */
//     /* ---------------------------------------------------------------------- */

//     const allowedStatuses = ["PENDING", "PAID", "CANCELLED"] as const;

//     if (status !== undefined && !allowedStatuses.includes(status)) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid renewal status",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Payment Method Validation                                              */
//     /* ---------------------------------------------------------------------- */

//     const allowedPaymentMethods = [
//       "CASH",
//       "BANK_TRANSFER",
//       "UPI",
//       "CARD",
//       "ONLINE",
//       "OTHER",
//     ] as const;

//     if (
//       paymentMethod !== undefined &&
//       paymentMethod !== null &&
//       !allowedPaymentMethods.includes(paymentMethod)
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid payment method",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Payment Status Validation                                              */
//     /* ---------------------------------------------------------------------- */

//     const allowedPaymentStatuses = [
//       "PENDING",
//       "SUCCESS",
//       "FAILED",
//       "REFUNDED",
//     ] as const;

//     if (
//       paymentStatus !== undefined &&
//       paymentStatus !== null &&
//       !allowedPaymentStatuses.includes(paymentStatus)
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid payment status",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Payment Date                                                           */
//     /* ---------------------------------------------------------------------- */

//     let parsedPaymentDate: Date | null = null;

//     if (paymentDate) {
//       parsedPaymentDate = new Date(paymentDate);

//       if (Number.isNaN(parsedPaymentDate.getTime())) {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "Invalid payment date",
//           },
//           { status: 400 },
//         );
//       }
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Create Renewal                                                         */
//     /* ---------------------------------------------------------------------- */

//     const renewal = await createRenewal(
//       {
//         adminId,
//         amount: normalizedAmount,

//         // Calculated from joinedAt
//         startDate: parsedStartDate,
//         dueDate: parsedDueDate,

//         status,
//         paymentDate: parsedPaymentDate,
//         paymentMethod: paymentMethod ?? null,
//         transactionReference: transactionReference
//           ? String(transactionReference).trim()
//           : null,
//         paymentStatus: paymentStatus ?? null,
//       },
//       user.id,
//     );

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Renewal created successfully",
//         data: renewal,
//       },
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error("CREATE_RENEWAL_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to create renewal",
//       },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";

import {
  createRenewal,
  getRenewals,
  getAdminById,
} from "@/server/renewal/renewal.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/renewals                                                          */
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
    /* Query Parameters                                                        */
    /* ---------------------------------------------------------------------- */

    const searchParams = request.nextUrl.searchParams;

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    let page = 1;
    let limit = 10;

    /* ---------------------------------------------------------------------- */
    /* Page Validation                                                         */
    /* ---------------------------------------------------------------------- */

    if (pageParam !== null) {
      page = Number(pageParam);

      if (!Number.isInteger(page) || page < 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid page. Page must be a positive integer.",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Limit Validation                                                        */
    /* ---------------------------------------------------------------------- */

    if (limitParam !== null) {
      limit = Number(limitParam);

      if (!Number.isInteger(limit) || limit < 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid limit. Limit must be a positive integer.",
          },
          { status: 400 },
        );
      }

      if (limit > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Limit cannot be greater than 100.",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Search                                                                 */
    /* ---------------------------------------------------------------------- */

    const search = searchParams.get("search")?.trim() || undefined;

    /* ---------------------------------------------------------------------- */
    /* Renewal Status                                                         */
    /* ---------------------------------------------------------------------- */

    const statusParam = searchParams.get("status");

    const allowedStatuses = ["PENDING", "PAID", "CANCELLED"] as const;

    let status: "PENDING" | "PAID" | "CANCELLED" | undefined;

    if (statusParam !== null) {
      if (
        !allowedStatuses.includes(
          statusParam as (typeof allowedStatuses)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid status. Status must be PENDING, PAID or CANCELLED.",
          },
          { status: 400 },
        );
      }

      status = statusParam as "PENDING" | "PAID" | "CANCELLED";
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Status                                                          */
    /* ---------------------------------------------------------------------- */

    const paymentStatusParam = searchParams.get("paymentStatus");

    const allowedPaymentStatuses = [
      "PENDING",
      "SUCCESS",
      "FAILED",
      "REFUNDED",
    ] as const;

    let paymentStatus:
      | "PENDING"
      | "SUCCESS"
      | "FAILED"
      | "REFUNDED"
      | undefined;

    if (paymentStatusParam !== null) {
      if (
        !allowedPaymentStatuses.includes(
          paymentStatusParam as (typeof allowedPaymentStatuses)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment status. Payment status must be PENDING, SUCCESS, FAILED or REFUNDED.",
          },
          { status: 400 },
        );
      }

      paymentStatus = paymentStatusParam as
        | "PENDING"
        | "SUCCESS"
        | "FAILED"
        | "REFUNDED";
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Method                                                          */
    /* ---------------------------------------------------------------------- */

    const paymentMethodParam = searchParams.get("paymentMethod");

    const allowedPaymentMethods = [
      "CASH",
      "BANK_TRANSFER",
      "UPI",
      "CARD",
      "ONLINE",
      "OTHER",
    ] as const;

    let paymentMethod:
      | "CASH"
      | "BANK_TRANSFER"
      | "UPI"
      | "CARD"
      | "ONLINE"
      | "OTHER"
      | undefined;

    if (paymentMethodParam !== null) {
      if (
        !allowedPaymentMethods.includes(
          paymentMethodParam as (typeof allowedPaymentMethods)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment method.",
          },
          { status: 400 },
        );
      }

      paymentMethod = paymentMethodParam as
        | "CASH"
        | "BANK_TRANSFER"
        | "UPI"
        | "CARD"
        | "ONLINE"
        | "OTHER";
    }

    /* ---------------------------------------------------------------------- */
    /* Admin ID                                                                */
    /* ---------------------------------------------------------------------- */

    const adminId = searchParams.get("adminId")?.trim() || undefined;

    /* ---------------------------------------------------------------------- */
    /* Fetch Renewals                                                          */
    /* ---------------------------------------------------------------------- */

    const result = await getRenewals({
      page,
      limit,
      search,
      status,
      paymentStatus,
      paymentMethod,
      adminId,
    });

    /* ---------------------------------------------------------------------- */
    /* Success                                                                 */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET_RENEWALS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch renewals",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST /api/renewals                                                         */
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
    /* Parse Request Body                                                      */
    /* ---------------------------------------------------------------------- */

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body",
        },
        { status: 400 },
      );
    }

    const {
      adminId,
      amount,
      status,
      paymentDate,
      paymentMethod,
      transactionReference,
      paymentStatus,
    } = body;

    /* ---------------------------------------------------------------------- */
    /* Required Fields                                                         */
    /* ---------------------------------------------------------------------- */

    if (typeof adminId !== "string" || !adminId.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin ID is required",
        },
        { status: 400 },
      );
    }

    if (
      amount === undefined ||
      amount === null ||
      String(amount).trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount is required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Check Admin                                                             */
    /* ---------------------------------------------------------------------- */

    const admin = await getAdminById(adminId.trim());

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
    /* Check Admin Joined Date                                                */
    /* ---------------------------------------------------------------------- */

    if (!admin.joinedAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin joined date is not available",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Calculate Renewal Dates                                                */
    /* ---------------------------------------------------------------------- */

    /*
     * Renewal period is calculated from the admin's
     * original joining date.
     *
     * Example:
     *
     * joinedAt  = 2025-08-26
     * startDate = 2025-08-26
     * dueDate   = 2026-08-26
     */

    const parsedStartDate = new Date(admin.joinedAt);

    const parsedDueDate = new Date(admin.joinedAt);

    parsedDueDate.setFullYear(parsedDueDate.getFullYear() + 1);

    /* ---------------------------------------------------------------------- */
    /* Amount Validation                                                      */
    /* ---------------------------------------------------------------------- */

    const normalizedAmount = String(amount).trim();

    const numericAmount = Number(normalizedAmount);

    if (
      !normalizedAmount ||
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be a valid non-negative number",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Status Validation                                                      */
    /* ---------------------------------------------------------------------- */

    const allowedStatuses = ["PENDING", "PAID", "CANCELLED"] as const;

    if (status !== undefined && status !== null) {
      if (
        typeof status !== "string" ||
        !allowedStatuses.includes(status as (typeof allowedStatuses)[number])
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Status must be PENDING, PAID or CANCELLED",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Method Validation                                              */
    /* ---------------------------------------------------------------------- */

    const allowedPaymentMethods = [
      "CASH",
      "BANK_TRANSFER",
      "UPI",
      "CARD",
      "ONLINE",
      "OTHER",
    ] as const;

    if (paymentMethod !== undefined && paymentMethod !== null) {
      if (
        typeof paymentMethod !== "string" ||
        !allowedPaymentMethods.includes(
          paymentMethod as (typeof allowedPaymentMethods)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment method",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Status Validation                                               */
    /* ---------------------------------------------------------------------- */

    const allowedPaymentStatuses = [
      "PENDING",
      "SUCCESS",
      "FAILED",
      "REFUNDED",
    ] as const;

    if (paymentStatus !== undefined && paymentStatus !== null) {
      if (
        typeof paymentStatus !== "string" ||
        !allowedPaymentStatuses.includes(
          paymentStatus as (typeof allowedPaymentStatuses)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment status",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Date                                                            */
    /* ---------------------------------------------------------------------- */

    let parsedPaymentDate: Date | null = null;

    if (
      paymentDate !== undefined &&
      paymentDate !== null &&
      paymentDate !== ""
    ) {
      if (typeof paymentDate !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment date",
          },
          { status: 400 },
        );
      }

      parsedPaymentDate = new Date(paymentDate);

      if (Number.isNaN(parsedPaymentDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment date",
          },
          { status: 400 },
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Transaction Reference                                                  */
    /* ---------------------------------------------------------------------- */

    let normalizedTransactionReference: string | null = null;

    if (transactionReference !== undefined && transactionReference !== null) {
      normalizedTransactionReference =
        String(transactionReference).trim() || null;
    }

    /* ---------------------------------------------------------------------- */
    /* Create Renewal                                                          */
    /* ---------------------------------------------------------------------- */

    const renewal = await createRenewal(
      {
        adminId: admin.id,

        amount: normalizedAmount,

        /*
         * IMPORTANT:
         * These dates are NOT taken from the frontend.
         * They are calculated from admins.joinedAt.
         */
        startDate: parsedStartDate,

        dueDate: parsedDueDate,

        status: status as "PENDING" | "PAID" | "CANCELLED" | undefined,

        paymentDate: parsedPaymentDate,

        paymentMethod: paymentMethod as
          | "CASH"
          | "BANK_TRANSFER"
          | "UPI"
          | "CARD"
          | "ONLINE"
          | "OTHER"
          | null
          | undefined,

        transactionReference: normalizedTransactionReference,

        paymentStatus: paymentStatus as
          | "PENDING"
          | "SUCCESS"
          | "FAILED"
          | "REFUNDED"
          | null
          | undefined,
      },
      user.id,
    );

    if (!renewal) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create renewal",
        },
        { status: 500 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Success                                                                 */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        message: "Renewal created successfully",
        data: renewal,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_RENEWAL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create renewal",
      },
      { status: 500 },
    );
  }
}
