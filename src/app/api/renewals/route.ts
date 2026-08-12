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

//     const page = Number(searchParams.get("page") ?? 1);
//     const limit = Number(searchParams.get("limit") ?? 10);

//     const search = searchParams.get("search")?.trim() || undefined;

//     const status = searchParams.get("status") || undefined;

//     const paymentStatus = searchParams.get("paymentStatus") || undefined;

//     const paymentMethod = searchParams.get("paymentMethod") || undefined;

//     const adminId = searchParams.get("adminId") || undefined;

//     // validation + getRenewals(...)
//     // use the full GET implementation from above
//   } catch (error) {
//     console.error("GET_RENEWALS_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch renewals",
//       },
//       { status: 500 },
//     );
//   }
// }

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") ?? 10), 1),
      100,
    );

    const search = searchParams.get("search")?.trim() || undefined;

    const statusParam = searchParams.get("status");

    const status =
      statusParam === "PENDING" ||
      statusParam === "PAID" ||
      statusParam === "CANCELLED"
        ? statusParam
        : undefined;

    const paymentStatusParam = searchParams.get("paymentStatus");

    const paymentStatus =
      paymentStatusParam === "PENDING" ||
      paymentStatusParam === "SUCCESS" ||
      paymentStatusParam === "FAILED" ||
      paymentStatusParam === "REFUNDED"
        ? paymentStatusParam
        : undefined;

    const paymentMethodParam = searchParams.get("paymentMethod");

    const paymentMethod =
      paymentMethodParam === "CASH" ||
      paymentMethodParam === "BANK_TRANSFER" ||
      paymentMethodParam === "UPI" ||
      paymentMethodParam === "CARD" ||
      paymentMethodParam === "ONLINE" ||
      paymentMethodParam === "OTHER"
        ? paymentMethodParam
        : undefined;

    const adminId = searchParams.get("adminId") || undefined;

    console.log("🔥 FETCHING RENEWALS:", {
      page,
      limit,
      search,
      status,
      paymentStatus,
      paymentMethod,
      adminId,
    });

    const result = await getRenewals({
      page,
      limit,
      search,
      status,
      paymentStatus,
      paymentMethod,
      adminId,
    });

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

    const body = await request.json();

    const {
      adminId,
      amount,
      startDate,
      dueDate,
      status,
      paymentDate,
      paymentMethod,
      transactionReference,
      paymentStatus,
    } = body;

    /* ---------------------------------------------------------------------- */
    /* Required Fields                                                        */
    /* ---------------------------------------------------------------------- */

    if (!adminId || amount === undefined || !startDate || !dueDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin ID, amount, start date and due date are required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Check Admin                                                            */
    /* ---------------------------------------------------------------------- */

    const admin = await getAdminById(adminId);

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
    /* Amount Validation                                                      */
    /* ---------------------------------------------------------------------- */

    const normalizedAmount = String(amount).trim();

    if (
      !normalizedAmount ||
      Number.isNaN(Number(normalizedAmount)) ||
      Number(normalizedAmount) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid amount",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Date Validation                                                        */
    /* ---------------------------------------------------------------------- */

    const parsedStartDate = new Date(startDate);

    const parsedDueDate = new Date(dueDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedDueDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date",
        },
        { status: 400 },
      );
    }

    if (parsedDueDate < parsedStartDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Due date cannot be before start date",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Status Validation                                                      */
    /* ---------------------------------------------------------------------- */

    const allowedStatuses = ["PENDING", "PAID", "CANCELLED"] as const;

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid renewal status",
        },
        { status: 400 },
      );
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

    if (
      paymentMethod !== undefined &&
      paymentMethod !== null &&
      !allowedPaymentMethods.includes(paymentMethod)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Status Validation                                              */
    /* ---------------------------------------------------------------------- */

    const allowedPaymentStatuses = [
      "PENDING",
      "SUCCESS",
      "FAILED",
      "REFUNDED",
    ] as const;

    if (
      paymentStatus !== undefined &&
      paymentStatus !== null &&
      !allowedPaymentStatuses.includes(paymentStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Date                                                           */
    /* ---------------------------------------------------------------------- */

    let parsedPaymentDate: Date | null = null;

    if (paymentDate) {
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
    /* Create Renewal                                                         */
    /* ---------------------------------------------------------------------- */

    const renewal = await createRenewal(
      {
        adminId,
        amount: normalizedAmount,
        startDate: parsedStartDate,
        dueDate: parsedDueDate,
        status,
        paymentDate: parsedPaymentDate,
        paymentMethod: paymentMethod ?? null,
        transactionReference: transactionReference
          ? String(transactionReference).trim()
          : null,
        paymentStatus: paymentStatus ?? null,
      },
      user.id,
    );

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
        message: "Failed to create renewal",
      },
      { status: 500 },
    );
  }
}
