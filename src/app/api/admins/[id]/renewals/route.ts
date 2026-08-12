import { NextRequest, NextResponse } from "next/server";

import {
  getRenewalsByAdminId,
  getAdminById,
} from "@/server/renewal/renewal.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/admins/[id]/renewals                                              */
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
    /* Get Admin ID                                                            */
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
    /* Check Admin                                                             */
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

    /* ---------------------------------------------------------------------- */
    /* Get Renewal History                                                     */
    /* ---------------------------------------------------------------------- */

    const renewals = await getRenewalsByAdminId(id);

    /* ---------------------------------------------------------------------- */
    /* Current Renewal                                                        */
    /* ---------------------------------------------------------------------- */

    const current =
      renewals.find((renewal) => renewal.status === "PENDING") ?? null;

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,

      data: {
        admin: {
          id: admin.id,
          name: admin.fullName,
          email: admin.email,
        },

        current,

        history: renewals,
      },
    });
  } catch (error) {
    console.error("GET_ADMIN_RENEWALS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admin renewals",
      },
      { status: 500 },
    );
  }
}
