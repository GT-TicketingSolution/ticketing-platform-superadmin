import { NextRequest, NextResponse } from "next/server";

import {
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from "@/server/admin/admin.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/admins/[id]                                                       */
/* -------------------------------------------------------------------------- */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    /* Get ID                                                                 */
    /* ---------------------------------------------------------------------- */

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin ID is required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Fetch Admin                                                            */
    /* ---------------------------------------------------------------------- */

    const admin = await getAdminById(id);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("GET_ADMIN_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admin",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* PATCH /api/admins/[id]                                                     */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    /* Get ID                                                                 */
    /* ---------------------------------------------------------------------- */

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin ID is required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Check Admin Exists                                                     */
    /* ---------------------------------------------------------------------- */

    const existingAdmin = await getAdminById(id);

    if (!existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        { status: 404 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Parse Body                                                             */
    /* ---------------------------------------------------------------------- */

    const body = await request.json();

    /* ---------------------------------------------------------------------- */
    /* Build Update Data                                                      */
    /* ---------------------------------------------------------------------- */

    const updateData: {
      fullName?: string;
      phone?: string;
      city?: string;
      email?: string;
      subdomain?: string | null;
      renewalAmount?: string;
      joinedAt?: Date;
      nextRenewalDate?: Date;
      status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    } = {};

    if (body.fullName !== undefined) {
      if (typeof body.fullName !== "string" || !body.fullName.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Full name cannot be empty",
          },
          { status: 400 },
        );
      }

      updateData.fullName = body.fullName.trim();
    }

    if (body.phone !== undefined) {
      if (typeof body.phone !== "string" || !body.phone.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Phone cannot be empty",
          },
          { status: 400 },
        );
      }

      updateData.phone = body.phone.trim();
    }

    if (body.city !== undefined) {
      if (typeof body.city !== "string" || !body.city.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "City cannot be empty",
          },
          { status: 400 },
        );
      }

      updateData.city = body.city.trim();
    }

    if (body.email !== undefined) {
      if (typeof body.email !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email",
          },
          { status: 400 },
        );
      }

      const email = body.email.trim().toLowerCase();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email address",
          },
          { status: 400 },
        );
      }

      updateData.email = email;
    }

    if (body.subdomain !== undefined) {
      if (body.subdomain !== null && typeof body.subdomain !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid subdomain",
          },
          { status: 400 },
        );
      }

      updateData.subdomain =
        body.subdomain === null ? null : body.subdomain.trim().toLowerCase();
    }

    if (body.renewalAmount !== undefined) {
      const amount = String(body.renewalAmount).trim();

      if (!amount || Number.isNaN(Number(amount)) || Number(amount) < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid renewal amount",
          },
          { status: 400 },
        );
      }

      updateData.renewalAmount = amount;
    }

    if (body.joinedAt !== undefined) {
      const joinedAt = new Date(body.joinedAt);

      if (Number.isNaN(joinedAt.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid joined date",
          },
          { status: 400 },
        );
      }

      updateData.joinedAt = joinedAt;
    }

    if (body.nextRenewalDate !== undefined) {
      const nextRenewalDate = new Date(body.nextRenewalDate);

      if (Number.isNaN(nextRenewalDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid next renewal date",
          },
          { status: 400 },
        );
      }

      updateData.nextRenewalDate = nextRenewalDate;
    }

    if (body.status !== undefined) {
      const allowedStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Status must be ACTIVE, INACTIVE or SUSPENDED",
          },
          { status: 400 },
        );
      }

      updateData.status = body.status;
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
    /* Update Admin                                                           */
    /* ---------------------------------------------------------------------- */

    const admin = await updateAdmin(id, updateData, user.id);

    return NextResponse.json({
      success: true,
      message: "Admin updated successfully",
      data: admin,
    });
  } catch (error: any) {
    console.error("UPDATE_ADMIN_ERROR:", error);

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

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update admin",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE /api/admins/[id]                                                    */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    /* Get ID                                                                 */
    /* ---------------------------------------------------------------------- */

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin ID is required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Check Admin Exists                                                     */
    /* ---------------------------------------------------------------------- */

    const existingAdmin = await getAdminById(id);

    if (!existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        { status: 404 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Delete Admin                                                           */
    /* ---------------------------------------------------------------------- */

    await deleteAdmin(id, user.id);

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_ADMIN_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete admin",
      },
      { status: 500 },
    );
  }
}
