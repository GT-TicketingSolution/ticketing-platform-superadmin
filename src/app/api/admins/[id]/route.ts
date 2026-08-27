import { NextRequest, NextResponse } from "next/server";
import {
  getAdminById,
  updateAdmin,
  deleteAdmin,
  type UpdateAdminInput,
} from "@/server/admin/admin.service";
import { getCurrentUser } from "@/server/auth/auth.service";

const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

/* -------------------------------------------------------------------------- */
/* GET /api/admins/[id]                                                       */
/* -------------------------------------------------------------------------- */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    /* ---------------------------------------------------------------------- */
    /* Authentication                                                          */
    /* ---------------------------------------------------------------------- */

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Unauthenticated", 401);
    }

    /* ---------------------------------------------------------------------- */
    /* Get ID                                                                  */
    /* ---------------------------------------------------------------------- */

    const { id } = await params;

    if (!id) {
      return errorResponse("Admin ID is required", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Fetch Admin                                                             */
    /* ---------------------------------------------------------------------- */

    const admin = await getAdminById(id);

    if (!admin) {
      return errorResponse("Admin not found", 404);
    }

    return NextResponse.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("GET_ADMIN_ERROR:", error);

    return errorResponse("Failed to fetch admin", 500);
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
    /* Authentication                                                          */
    /* ---------------------------------------------------------------------- */

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Unauthenticated", 401);
    }

    /* ---------------------------------------------------------------------- */
    /* Get ID                                                                  */
    /* ---------------------------------------------------------------------- */

    const { id } = await params;

    if (!id) {
      return errorResponse("Admin ID is required", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Check Admin Exists                                                      */
    /* ---------------------------------------------------------------------- */

    const existingAdmin = await getAdminById(id);

    if (!existingAdmin) {
      return errorResponse("Admin not found", 404);
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
    /* Build Update Data                                                       */
    /* ---------------------------------------------------------------------- */

    const updateData: UpdateAdminInput = {};

    /* ---------------------------------------------------------------------- */
    /* Full Name                                                               */
    /* ---------------------------------------------------------------------- */

    if (body.fullName !== undefined) {
      if (typeof body.fullName !== "string" || !body.fullName.trim()) {
        return errorResponse("Full name cannot be empty", 400);
      }

      updateData.fullName = body.fullName.trim();
    }

    /* ---------------------------------------------------------------------- */
    /* Business Name                                                           */
    /* ---------------------------------------------------------------------- */

    if (body.businessName !== undefined) {
      if (typeof body.businessName !== "string" || !body.businessName.trim()) {
        return errorResponse("Business name cannot be empty", 400);
      }

      if (body.businessName.trim().length > 150) {
        return errorResponse(
          "Business name must not exceed 150 characters",
          400,
        );
      }

      updateData.businessName = body.businessName.trim();
    }

    /* ---------------------------------------------------------------------- */
    /* Phone                                                                   */
    /* ---------------------------------------------------------------------- */

    if (body.phone !== undefined) {
      if (typeof body.phone !== "string" || !body.phone.trim()) {
        return errorResponse("Phone cannot be empty", 400);
      }

      updateData.phone = body.phone.trim();
    }

    /* ---------------------------------------------------------------------- */
    /* City                                                                    */
    /* ---------------------------------------------------------------------- */

    if (body.city !== undefined) {
      if (typeof body.city !== "string" || !body.city.trim()) {
        return errorResponse("City cannot be empty", 400);
      }

      updateData.city = body.city.trim();
    }

    /* ---------------------------------------------------------------------- */
    /* Email                                                                   */
    /* ---------------------------------------------------------------------- */

    if (body.email !== undefined) {
      if (typeof body.email !== "string" || !body.email.trim()) {
        return errorResponse("Invalid email address", 400);
      }

      const email = body.email.trim().toLowerCase();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return errorResponse("Invalid email address", 400);
      }

      updateData.email = email;
    }

    /* ---------------------------------------------------------------------- */
    /* Subdomain                                                               */
    /* ---------------------------------------------------------------------- */

    if (body.subdomain !== undefined) {
      if (body.subdomain !== null && typeof body.subdomain !== "string") {
        return errorResponse("Invalid subdomain", 400);
      }

      if (body.subdomain === null) {
        updateData.subdomain = null;
      } else {
        let normalizedSubdomain = body.subdomain.trim().toLowerCase();

        /*
         * Frontend can send:
         *
         * abc
         * abc.ticketing.com
         */

        if (normalizedSubdomain.endsWith(".ticketing.com")) {
          normalizedSubdomain = normalizedSubdomain.replace(
            /\.ticketing\.com$/,
            "",
          );
        }

        if (!normalizedSubdomain) {
          updateData.subdomain = null;
        } else if (!/^[a-z0-9-]+$/.test(normalizedSubdomain)) {
          return errorResponse(
            "Subdomain can only contain lowercase letters, numbers, and hyphens",
            400,
          );
        } else {
          /*
           * updateAdmin() expects only the prefix
           * and appends .ticketing.com.
           */
          updateData.subdomain = normalizedSubdomain;
        }
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Module Access Roles                                                    */
    /* ---------------------------------------------------------------------- */

    /* ---------------------------------------------------------------------- */
    /* Module Access Roles                                                    */
    /* ---------------------------------------------------------------------- */

    if (body.moduleIds !== undefined) {
      if (
        !Array.isArray(body.moduleIds) ||
        !body.moduleIds.every(
          (moduleId) =>
            typeof moduleId === "string" && moduleId.trim().length > 0,
        )
      ) {
        return errorResponse(
          "moduleIds must be an array of non-empty strings",
          400,
        );
      }

      updateData.moduleIds = [
        ...new Set(body.moduleIds.map((moduleId) => moduleId.trim())),
      ];
    }
    /* ---------------------------------------------------------------------- */
    /* Renewal Amount                                                          */
    /* ---------------------------------------------------------------------- */

    if (body.renewalAmount !== undefined) {
      const numericAmount = Number(body.renewalAmount);

      if (!Number.isFinite(numericAmount) || numericAmount < 0) {
        return errorResponse(
          "Renewal amount must be a valid non-negative number",
          400,
        );
      }

      updateData.renewalAmount = numericAmount;
    }

    /* ---------------------------------------------------------------------- */
    /* Joined Date                                                             */
    /* ---------------------------------------------------------------------- */

    if (body.joinedAt !== undefined) {
      if (
        typeof body.joinedAt !== "string" &&
        !(body.joinedAt instanceof Date)
      ) {
        return errorResponse("Invalid joined date", 400);
      }

      const joinedAt = new Date(body.joinedAt as string | Date);

      if (Number.isNaN(joinedAt.getTime())) {
        return errorResponse("Invalid joined date", 400);
      }

      updateData.joinedAt = joinedAt;
    }

    /* ---------------------------------------------------------------------- */
    /* Next Renewal Date                                                      */
    /* ---------------------------------------------------------------------- */

    if (body.nextRenewalDate !== undefined) {
      if (
        typeof body.nextRenewalDate !== "string" &&
        !(body.nextRenewalDate instanceof Date)
      ) {
        return errorResponse("Invalid next renewal date", 400);
      }

      const nextRenewalDate = new Date(body.nextRenewalDate as string | Date);

      if (Number.isNaN(nextRenewalDate.getTime())) {
        return errorResponse("Invalid next renewal date", 400);
      }

      updateData.nextRenewalDate = nextRenewalDate;
    }

    /* ---------------------------------------------------------------------- */
    /* Status                                                                  */
    /* ---------------------------------------------------------------------- */

    if (body.status !== undefined) {
      if (
        typeof body.status !== "string" ||
        !ALLOWED_STATUSES.includes(
          body.status as (typeof ALLOWED_STATUSES)[number],
        )
      ) {
        return errorResponse(
          "Status must be ACTIVE, INACTIVE or SUSPENDED",
          400,
        );
      }

      updateData.status = body.status as "ACTIVE" | "INACTIVE" | "SUSPENDED";
    }

    /* ---------------------------------------------------------------------- */
    /* Prevent Empty Update                                                    */
    /* ---------------------------------------------------------------------- */

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No fields provided for update", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Update Admin                                                            */
    /* ---------------------------------------------------------------------- */

    const admin = await updateAdmin(id, updateData, user.id);

    if (!admin) {
      return errorResponse("Admin not found", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Admin updated successfully",
      data: admin,
    });
  } catch (error: any) {
    console.error("UPDATE_ADMIN_ERROR:", error);

    /* ---------------------------------------------------------------------- */
    /* Unique Constraint                                                       */
    /* ---------------------------------------------------------------------- */

    if (error?.code === "23505") {
      return errorResponse(
        "An admin with this email, phone or subdomain already exists",
        409,
      );
    }

    return errorResponse("Failed to update admin", 500);
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
    /* Authentication                                                          */
    /* ---------------------------------------------------------------------- */

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Unauthenticated", 401);
    }

    /* ---------------------------------------------------------------------- */
    /* Get ID                                                                  */
    /* ---------------------------------------------------------------------- */

    const { id } = await params;

    if (!id) {
      return errorResponse("Admin ID is required", 400);
    }

    /* ---------------------------------------------------------------------- */
    /* Check Admin Exists                                                      */
    /* ---------------------------------------------------------------------- */

    const existingAdmin = await getAdminById(id);

    if (!existingAdmin) {
      return errorResponse("Admin not found", 404);
    }

    /* ---------------------------------------------------------------------- */
    /* Delete Admin                                                            */
    /* ---------------------------------------------------------------------- */

    await deleteAdmin(id, user.id);

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_ADMIN_ERROR:", error);

    return errorResponse("Failed to delete admin", 500);
  }
}
