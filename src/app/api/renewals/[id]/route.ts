import { NextRequest, NextResponse } from "next/server";

import {
  getRenewalById,
  updateRenewal,
  getAdminById,
} from "@/server/renewal/renewal.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/renewals/[id]                                                     */
/* -------------------------------------------------------------------------- */

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Renewal ID is required",
        },
        { status: 400 },
      );
    }

    const renewal = await getRenewalById(id);

    if (!renewal) {
      return NextResponse.json(
        {
          success: false,
          message: "Renewal not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: renewal,
    });
  } catch (error) {
    console.error("GET_RENEWAL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch renewal",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* PATCH /api/renewals/[id]                                                   */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Renewal ID is required",
        },
        { status: 400 },
      );
    }

    const existing = await getRenewalById(id);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Renewal not found",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const updateData: any = {};

    /* ---------------------------------------------------------------------- */
    /* Admin                                                                  */
    /* ---------------------------------------------------------------------- */

    if (body.adminId !== undefined) {
      const admin = await getAdminById(body.adminId);

      if (!admin) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin not found",
          },
          { status: 404 },
        );
      }

      updateData.adminId = body.adminId;
    }

    /* ---------------------------------------------------------------------- */
    /* Amount                                                                 */
    /* ---------------------------------------------------------------------- */

    if (body.amount !== undefined) {
      const amount = String(body.amount).trim();

      if (!amount || Number.isNaN(Number(amount)) || Number(amount) < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid amount",
          },
          { status: 400 },
        );
      }

      updateData.amount = amount;
    }

    /* ---------------------------------------------------------------------- */
    /* Dates                                                                   */
    /* ---------------------------------------------------------------------- */

    if (body.startDate !== undefined) {
      const startDate = new Date(body.startDate);

      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid start date",
          },
          { status: 400 },
        );
      }

      updateData.startDate = startDate;
    }

    if (body.dueDate !== undefined) {
      const dueDate = new Date(body.dueDate);

      if (Number.isNaN(dueDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid due date",
          },
          { status: 400 },
        );
      }

      updateData.dueDate = dueDate;
    }

    /* ---------------------------------------------------------------------- */
    /* Status                                                                  */
    /* ---------------------------------------------------------------------- */

    if (body.status !== undefined) {
      const allowed = ["PENDING", "PAID", "CANCELLED"];

      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid renewal status",
          },
          { status: 400 },
        );
      }

      updateData.status = body.status;
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Date                                                            */
    /* ---------------------------------------------------------------------- */

    if (body.paymentDate !== undefined) {
      if (body.paymentDate === null) {
        updateData.paymentDate = null;
      } else {
        const paymentDate = new Date(body.paymentDate);

        if (Number.isNaN(paymentDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid payment date",
            },
            { status: 400 },
          );
        }

        updateData.paymentDate = paymentDate;
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Method                                                          */
    /* ---------------------------------------------------------------------- */

    if (body.paymentMethod !== undefined) {
      const allowed = [
        "CASH",
        "BANK_TRANSFER",
        "UPI",
        "CARD",
        "ONLINE",
        "OTHER",
      ];

      if (
        body.paymentMethod !== null &&
        !allowed.includes(body.paymentMethod)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment method",
          },
          { status: 400 },
        );
      }

      updateData.paymentMethod = body.paymentMethod;
    }

    /* ---------------------------------------------------------------------- */
    /* Transaction Reference                                                  */
    /* ---------------------------------------------------------------------- */

    if (body.transactionReference !== undefined) {
      updateData.transactionReference =
        body.transactionReference === null
          ? null
          : String(body.transactionReference).trim();
    }

    /* ---------------------------------------------------------------------- */
    /* Payment Status                                                          */
    /* ---------------------------------------------------------------------- */

    if (body.paymentStatus !== undefined) {
      const allowed = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];

      if (
        body.paymentStatus !== null &&
        !allowed.includes(body.paymentStatus)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment status",
          },
          { status: 400 },
        );
      }

      updateData.paymentStatus = body.paymentStatus;
    }

    /* ---------------------------------------------------------------------- */
    /* Date Relationship                                                      */
    /* ---------------------------------------------------------------------- */

    const finalStartDate = updateData.startDate ?? existing.startDate;

    const finalDueDate = updateData.dueDate ?? existing.dueDate;

    if (finalDueDate < finalStartDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Due date cannot be before start date",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Prevent Empty Update                                                   */
    /* ---------------------------------------------------------------------- */

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No fields provided for update",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Update                                                                  */
    /* ---------------------------------------------------------------------- */

    const renewal = await updateRenewal(id, updateData, user.id, user.id);

    return NextResponse.json({
      success: true,
      message: "Renewal updated successfully",
      data: renewal,
    });
  } catch (error) {
    console.error("UPDATE_RENEWAL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update renewal",
      },
      { status: 500 },
    );
  }
}
