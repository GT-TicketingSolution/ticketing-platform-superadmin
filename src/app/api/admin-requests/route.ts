// import { NextRequest, NextResponse } from "next/server";

// import {
//   createAdminRequest,
//   getAdminRequests,
//   findAdminForRequest,
// } from "@/server/admin-request/admin-request.service";

// import { getCurrentUser } from "@/server/auth/auth.service";

// /* -------------------------------------------------------------------------- */
// /* GET /api/admin-requests                                                    */
// /* -------------------------------------------------------------------------- */

// export async function GET(request: NextRequest) {
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
//     /* Query Parameters                                                       */
//     /* ---------------------------------------------------------------------- */

//     const searchParams = request.nextUrl.searchParams;

//     const pageParam = searchParams.get("page");
//     const limitParam = searchParams.get("limit");

//     const search = searchParams.get("search")?.trim() || undefined;

//     const statusParam = searchParams.get("status");

//     const adminId = searchParams.get("adminId") || undefined;

//     const city = searchParams.get("city")?.trim() || undefined;

//     /* ---------------------------------------------------------------------- */
//     /* Pagination                                                             */
//     /* ---------------------------------------------------------------------- */

//     const page = pageParam ? Number(pageParam) : 1;
//     const limit = limitParam ? Number(limitParam) : 10;

//     if (!Number.isInteger(page) || page < 1) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Page must be a positive integer",
//         },
//         { status: 400 },
//       );
//     }

//     if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Limit must be between 1 and 100",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Status Validation                                                      */
//     /* ---------------------------------------------------------------------- */

//     const allowedStatuses = [
//       "PENDING",
//       "IN_PROGRESS",
//       "ACCEPTED",
//       "REJECTED",
//       "CANCELLED",
//     ] as const;

//     let status:
//       | "PENDING"
//       | "IN_PROGRESS"
//       | "ACCEPTED"
//       | "REJECTED"
//       | "CANCELLED"
//       | undefined;

//     if (statusParam) {
//       if (
//         !allowedStatuses.includes(
//           statusParam as (typeof allowedStatuses)[number],
//         )
//       ) {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "Invalid request status",
//           },
//           { status: 400 },
//         );
//       }

//       status = statusParam as (typeof allowedStatuses)[number];
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Fetch Requests                                                         */
//     /* ---------------------------------------------------------------------- */

//     const result = await getAdminRequests({
//       page,
//       limit,
//       search,
//       status,
//       adminId,
//       city,
//     });

//     /* ---------------------------------------------------------------------- */
//     /* Response                                                               */
//     /* ---------------------------------------------------------------------- */

//     return NextResponse.json({
//       success: true,
//       data: result.data,
//       pagination: result.pagination,
//     });
//   } catch (error) {
//     console.error("GET_ADMIN_REQUESTS_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch admin requests",
//       },
//       { status: 500 },
//     );
//   }
// }

// /* -------------------------------------------------------------------------- */
// /* POST /api/admin-requests                                                   */
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
//     /* Request Body                                                            */
//     /* ---------------------------------------------------------------------- */

//     const body = await request.json();

//     const { adminId, description, desc, name, phone, email } = body;

//     /* ---------------------------------------------------------------------- */
//     /* Description                                                            */
//     /* ---------------------------------------------------------------------- */

//     const requestDescription =
//       typeof description === "string"
//         ? description
//         : typeof desc === "string"
//           ? desc
//           : "";

//     if (!requestDescription.trim()) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Description cannot be empty",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Find Admin                                                             */
//     /* ---------------------------------------------------------------------- */

//     const admin = await findAdminForRequest({
//       adminId,
//       name,
//       phone,
//       email,
//     });

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
//     /* Create Admin Request                                                   */
//     /* ---------------------------------------------------------------------- */

//     const adminRequest = await createAdminRequest(
//       {
//         adminId: admin.id,
//         description: requestDescription.trim(),
//       },
//       user.id,
//     );

//     /* ---------------------------------------------------------------------- */
//     /* Response                                                               */
//     /* ---------------------------------------------------------------------- */

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Admin request created successfully",
//         data: adminRequest,
//       },
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error("CREATE_ADMIN_REQUEST_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to create admin request",
//       },
//       { status: 500 },
//     );
//   }
// }
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

    const createdAt = searchParams.get("createdAt") || undefined;

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
      createdAt,
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
//     /* Request Body                                                            */
//     /* ---------------------------------------------------------------------- */

//     const body = await request.json();

//     const { adminId, description, desc, name, fullName, phone, email, city } =
//       body;

//     /* ---------------------------------------------------------------------- */
//     /* Description                                                            */
//     /* ---------------------------------------------------------------------- */

//     const requestDescription =
//       typeof description === "string"
//         ? description
//         : typeof desc === "string"
//           ? desc
//           : "";

//     if (!requestDescription.trim()) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Description cannot be empty",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Admin Details                                                          */
//     /* ---------------------------------------------------------------------- */

//     const requestName =
//       typeof fullName === "string"
//         ? fullName.trim()
//         : typeof name === "string"
//           ? name.trim()
//           : "";

//     const requestPhone = typeof phone === "string" ? phone.trim() : "";

//     const requestEmail =
//       typeof email === "string" ? email.trim().toLowerCase() : "";

//     const requestCity = typeof city === "string" ? city.trim() : "";

//     /* ---------------------------------------------------------------------- */
//     /* Validate Admin Details                                                 */
//     /* ---------------------------------------------------------------------- */

//     if (!requestName) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Admin name cannot be empty",
//         },
//         { status: 400 },
//       );
//     }

//     if (!requestPhone) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Phone cannot be empty",
//         },
//         { status: 400 },
//       );
//     }

//     if (!requestEmail) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Email cannot be empty",
//         },
//         { status: 400 },
//       );
//     }

//     if (!requestCity) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "City cannot be empty",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Find Existing Admin                                                    */
//     /* ---------------------------------------------------------------------- */

//     const admin = await findAdminForRequest({
//       adminId,
//       name: requestName,
//       phone: requestPhone,
//       email: requestEmail,
//     });

//     /* ---------------------------------------------------------------------- */
//     /* Invalid Explicit Admin ID                                              */
//     /* ---------------------------------------------------------------------- */

//     /*
//      * If the client explicitly supplied adminId and that Admin
//      * does not exist, this is a real invalid Admin reference.
//      */
//     if (adminId && !admin) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Admin not found",
//         },
//         { status: 404 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Resolve Admin ID                                                       */
//     /* ---------------------------------------------------------------------- */

//     /*
//      * Existing Admin:
//      *     adminId = existing Admin ID
//      *
//      * First Admin request:
//      *     adminId = null
//      */
//     const resolvedAdminId = admin?.id ?? null;

//     /* ---------------------------------------------------------------------- */
//     /* Create Admin Request                                                   */
//     /* ---------------------------------------------------------------------- */

//     const adminRequest = await createAdminRequest(
//       {
//         adminId: resolvedAdminId,

//         fullName: requestName,
//         phone: requestPhone,
//         email: requestEmail,
//         city: requestCity,

//         description: requestDescription.trim(),
//       },
//       user.id,
//     );

//     /* ---------------------------------------------------------------------- */
//     /* Response                                                               */
//     /* ---------------------------------------------------------------------- */

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Admin request created successfully",
//         data: adminRequest,
//       },
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error("CREATE_ADMIN_REQUEST_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to create admin request",
//       },
//       { status: 500 },
//     );
//   }
// }
/* -------------------------------------------------------------------------- */
/* POST /api/admin-requests                                                   */
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

    const adminId =
      typeof body.adminId === "string" && body.adminId.trim()
        ? body.adminId.trim()
        : null;

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : typeof body.name === "string"
          ? body.name.trim()
          : "";

    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const city = typeof body.city === "string" ? body.city.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : typeof body.desc === "string"
          ? body.desc.trim()
          : "";

    const internalNotes =
      typeof body.internalNotes === "string" ? body.internalNotes.trim() : null;

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin name cannot be empty",
        },
        { status: 400 },
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone cannot be empty",
        },
        { status: 400 },
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email cannot be empty",
        },
        { status: 400 },
      );
    }

    if (!city) {
      return NextResponse.json(
        {
          success: false,
          message: "City cannot be empty",
        },
        { status: 400 },
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          message: "Description cannot be empty",
        },
        { status: 400 },
      );
    }

    let admin = null;

    // If adminId is provided, verify that the admin exists.
    if (adminId) {
      admin = await findAdminForRequest({
        adminId,
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
    }

    const adminRequest = await createAdminRequest(
      {
        adminId: admin?.id ?? null,

        // If existing admin, use database values.
        // Otherwise use details supplied in the request.
        fullName: admin?.fullName ?? fullName,
        phone: admin?.phone ?? phone,
        email: admin?.email ?? email,
        city: admin?.city ?? city,

        description,
        internalNotes,
      },
      user.id,
    );

    if (!adminRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create admin request",
        },
        { status: 500 },
      );
    }

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
