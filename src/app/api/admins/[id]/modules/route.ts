import { NextRequest, NextResponse } from "next/server";

import {
  adminExists,
  getAdminModules,
  getModules,
  moduleExists,
  grantModuleAccess,
  revokeModuleAccess,
} from "@/server/admin/admin-module.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/admins/[id]/modules                                               */
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
          message: "Admin ID is required",
        },
        { status: 400 },
      );
    }

    const exists = await adminExists(id);

    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        { status: 404 },
      );
    }

    const data = await getAdminModules(id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_ADMIN_MODULES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admin modules",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST /api/admins/[id]/modules                                              */
/* -------------------------------------------------------------------------- */

export async function POST(
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
          message: "Admin ID is required",
        },
        { status: 400 },
      );
    }

    const exists = await adminExists(id);

    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const moduleId = body.moduleId;

    if (!moduleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Module ID is required",
        },
        { status: 400 },
      );
    }

    const module = await moduleExists(moduleId);

    if (!module) {
      return NextResponse.json(
        {
          success: false,
          message: "Module not found",
        },
        { status: 404 },
      );
    }

    if (!module.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "This module is inactive",
        },
        { status: 400 },
      );
    }

    try {
      const access = await grantModuleAccess(id, moduleId, user.id);

      return NextResponse.json(
        {
          success: true,
          message: "Module access granted successfully",
          data: access,
        },
        { status: 201 },
      );
    } catch (error: any) {
      if (error?.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "Admin already has access to this module",
          },
          { status: 409 },
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("GRANT_ADMIN_MODULE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to grant module access",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE /api/admins/[id]/modules                                             */
/*                                                                            */
/* Body: { moduleId: "..." }                                                  */
/* -------------------------------------------------------------------------- */

export async function DELETE(
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
          message: "Admin ID is required",
        },
        { status: 400 },
      );
    }

    const exists = await adminExists(id);

    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const moduleId = body.moduleId;

    if (!moduleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Module ID is required",
        },
        { status: 400 },
      );
    }

    const deleted = await revokeModuleAccess(id, moduleId, user.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin does not have access to this module",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Module access revoked successfully",
    });
  } catch (error) {
    console.error("REVOKE_ADMIN_MODULE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to revoke module access",
      },
      { status: 500 },
    );
  }
}
