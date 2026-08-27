// import { NextRequest, NextResponse } from "next/server";

// import {
//   getAdminRequestById,
//   updateAdminRequest,
//   deleteAdminRequest,
// } from "@/server/admin-request/admin-request.service";

// import { getCurrentUser } from "@/server/auth/auth.service";

// /* -------------------------------------------------------------------------- */
// /* GET /api/admin-requests/[id]                                               */
// /* -------------------------------------------------------------------------- */

// export async function GET(
//   _request: NextRequest,
//   {
//     params,
//   }: {
//     params: Promise<{ id: string }>;
//   },
// ) {
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
//     /* Params                                                                 */
//     /* ---------------------------------------------------------------------- */

//     const { id } = await params;

//     if (!id) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Request ID is required",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Fetch                                                                  */
//     /* ---------------------------------------------------------------------- */

//     const adminRequest = await getAdminRequestById(id);

//     if (!adminRequest) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Admin request not found",
//         },
//         { status: 404 },
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       data: adminRequest,
//     });
//   } catch (error) {
//     console.error("GET_ADMIN_REQUEST_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch admin request",
//       },
//       { status: 500 },
//     );
//   }
// }

// /* -------------------------------------------------------------------------- */
// /* PATCH /api/admin-requests/[id]                                             */
// /* -------------------------------------------------------------------------- */

// export async function PATCH(
//   request: NextRequest,
//   {
//     params,
//   }: {
//     params: Promise<{ id: string }>;
//   },
// ) {
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
//     /* Params                                                                 */
//     /* ---------------------------------------------------------------------- */

//     const { id } = await params;

//     if (!id) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Request ID is required",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Check Existing Request                                                 */
//     /* ---------------------------------------------------------------------- */

//     const existing = await getAdminRequestById(id);

//     if (!existing) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Admin request not found",
//         },
//         { status: 404 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Request Body                                                            */
//     /* ---------------------------------------------------------------------- */

//     const body = await request.json();

//     const updateData: {
//       description?: string;
//       internalNotes?: string | null;

//       status?:
//         | "PENDING"
//         | "IN_PROGRESS"
//         | "ACCEPTED"
//         | "REJECTED"
//         | "CANCELLED";

//       fullName?: string;
//       phone?: string;
//       email?: string;
//       city?: string;
//     } = {};

//     /* ---------------------------------------------------------------------- */
//     /* Description                                                            */
//     /* ---------------------------------------------------------------------- */

//     // Support both:
//     // description: "..."
//     // desc: "..."

//     const description =
//       body.description !== undefined ? body.description : body.desc;

//     if (description !== undefined) {
//       if (typeof description !== "string" || !description.trim()) {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "Description cannot be empty",
//           },
//           { status: 400 },
//         );
//       }

//       updateData.description = description.trim();
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Internal Notes                                                         */
//     /* ---------------------------------------------------------------------- */

//     // Support both:
//     // internalNotes: "..."
//     // notes: "..."

//     const internalNotes =
//       body.internalNotes !== undefined ? body.internalNotes : body.notes;

//     if (internalNotes !== undefined) {
//       if (internalNotes !== null && typeof internalNotes !== "string") {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "Invalid internal notes",
//           },
//           { status: 400 },
//         );
//       }

//       updateData.internalNotes =
//         internalNotes === null ? null : internalNotes.trim();
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Admin Details                                                          */
//     /* ---------------------------------------------------------------------- */
//     /* ---------------------------------------------------------------------- */
//     /* Admin Details                                                          */
//     /* ---------------------------------------------------------------------- */

//     if (body.name !== undefined) {
//       if (typeof body.name !== "string" || !body.name.trim()) {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "Admin name cannot be empty",
//           },
//           { status: 400 },
//         );
//       }

//       updateData.fullName = body.name.trim();
//     }

//     if (body.phone !== undefined) {
//       if (typeof body.phone !== "string" || !body.phone.trim()) {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "Phone cannot be empty",
//           },
//           { status: 400 },
//         );
//       }

//       updateData.phone = body.phone.trim();
//     }

//     if (body.email !== undefined) {
//       if (typeof body.email !== "string" || !body.email.trim()) {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "Email cannot be empty",
//           },
//           { status: 400 },
//         );
//       }

//       updateData.email = body.email.trim().toLowerCase();
//     }

//     if (body.city !== undefined) {
//       if (typeof body.city !== "string" || !body.city.trim()) {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "City cannot be empty",
//           },
//           { status: 400 },
//         );
//       }

//       updateData.city = body.city.trim();
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Status                                                                 */
//     /* ---------------------------------------------------------------------- */

//     if (body.status !== undefined) {
//       const allowedStatuses = [
//         "PENDING",
//         "IN_PROGRESS",
//         "ACCEPTED",
//         "REJECTED",
//         "CANCELLED",
//       ] as const;

//       if (
//         !allowedStatuses.includes(
//           body.status as (typeof allowedStatuses)[number],
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

//       updateData.status = body.status as (typeof allowedStatuses)[number];
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Empty Update                                                           */
//     /* ---------------------------------------------------------------------- */

//     if (Object.keys(updateData).length === 0) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "No fields provided for update",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Update                                                                 */
//     /* ---------------------------------------------------------------------- */

//     const updated = await updateAdminRequest(id, updateData, user.id);

//     if (!updated) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Failed to update admin request",
//         },
//         { status: 500 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Response                                                               */
//     /* ---------------------------------------------------------------------- */

//     return NextResponse.json({
//       success: true,
//       message: "Admin request updated successfully",
//       data: updated,
//     });
//   } catch (error) {
//     console.error("UPDATE_ADMIN_REQUEST_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to update admin request",
//       },
//       { status: 500 },
//     );
//   }
// }

// /* -------------------------------------------------------------------------- */
// /* DELETE /api/admin-requests/[id]                                            */
// /* -------------------------------------------------------------------------- */

// export async function DELETE(
//   _request: NextRequest,
//   {
//     params,
//   }: {
//     params: Promise<{ id: string }>;
//   },
// ) {
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
//     /* Params                                                                 */
//     /* ---------------------------------------------------------------------- */

//     const { id } = await params;

//     if (!id) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Request ID is required",
//         },
//         { status: 400 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Check Existing Request                                                 */
//     /* ---------------------------------------------------------------------- */

//     const existing = await getAdminRequestById(id);

//     if (!existing) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Admin request not found",
//         },
//         { status: 404 },
//       );
//     }

//     /* ---------------------------------------------------------------------- */
//     /* Delete                                                                 */
//     /* ---------------------------------------------------------------------- */

//     const deleted = await deleteAdminRequest(id, user.id);

//     if (!deleted) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Failed to delete admin request",
//         },
//         { status: 500 },
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Admin request deleted successfully",
//     });
//   } catch (error) {
//     console.error("DELETE_ADMIN_REQUEST_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to delete admin request",
//       },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminRequestById,
  updateAdminRequest,
  deleteAdminRequest,
  addAdminRequestNote,
} from "@/server/admin-request/admin-request.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/admin-requests/[id]                                               */
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
    /* Params                                                                 */
    /* ---------------------------------------------------------------------- */

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Request ID is required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Fetch                                                                  */
    /* ---------------------------------------------------------------------- */

    const adminRequest = await getAdminRequestById(id);

    if (!adminRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin request not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: adminRequest,
    });
  } catch (error) {
    console.error("GET_ADMIN_REQUEST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admin request",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* PATCH /api/admin-requests/[id]                                             */
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
    /* Params                                                                 */
    /* ---------------------------------------------------------------------- */

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Request ID is required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Check Existing Request                                                 */
    /* ---------------------------------------------------------------------- */

    const existing = await getAdminRequestById(id);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin request not found",
        },
        { status: 404 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Request Body                                                            */
    /* ---------------------------------------------------------------------- */

    const body = await request.json();

    const note =
      body.note !== undefined
        ? body.note
        : body.addNote !== undefined
          ? body.addNote
          : undefined;

    if (note !== undefined) {
      if (typeof note !== "string" || !note.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Note cannot be empty",
          },
          { status: 400 },
        );
      }

      await addAdminRequestNote(id, note, user.id);
    }

    const updateData: {
      description?: string;
      internalNotes?: string | null;

      status?:
        | "PENDING"
        | "IN_PROGRESS"
        | "ACCEPTED"
        | "REJECTED"
        | "CANCELLED";

      fullName?: string;
      phone?: string;
      email?: string;
      city?: string;
    } = {};

    /* ---------------------------------------------------------------------- */
    /* Description                                                            */
    /* ---------------------------------------------------------------------- */

    // Supports:
    // description: "..."
    // desc: "..."

    const description =
      body.description !== undefined ? body.description : body.desc;

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Description cannot be empty",
          },
          { status: 400 },
        );
      }

      updateData.description = description.trim();
    }

    /* ---------------------------------------------------------------------- */
    /* Internal Notes                                                         */
    /* ---------------------------------------------------------------------- */

    // Supports:
    // internalNotes: "..."
    // notes: "..."

    const internalNotes =
      body.internalNotes !== undefined ? body.internalNotes : body.notes;

    if (internalNotes !== undefined) {
      if (internalNotes !== null && typeof internalNotes !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid internal notes",
          },
          { status: 400 },
        );
      }

      updateData.internalNotes =
        internalNotes === null ? null : internalNotes.trim();
    }

    /* ---------------------------------------------------------------------- */
    /* Proposed / Admin Details                                               */
    /* ---------------------------------------------------------------------- */

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin name cannot be empty",
          },
          { status: 400 },
        );
      }

      updateData.fullName = body.name.trim();
    }

    if (body.fullName !== undefined) {
      if (typeof body.fullName !== "string" || !body.fullName.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin name cannot be empty",
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

    if (body.email !== undefined) {
      if (typeof body.email !== "string" || !body.email.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Email cannot be empty",
          },
          { status: 400 },
        );
      }

      updateData.email = body.email.trim().toLowerCase();
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

    /* ---------------------------------------------------------------------- */
    /* Status                                                                 */
    /* ---------------------------------------------------------------------- */

    if (body.status !== undefined) {
      const allowedStatuses = [
        "PENDING",
        "IN_PROGRESS",
        "ACCEPTED",
        "REJECTED",
        "CANCELLED",
      ] as const;

      if (
        !allowedStatuses.includes(
          body.status as (typeof allowedStatuses)[number],
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

      updateData.status = body.status as (typeof allowedStatuses)[number];
    }

    /* ---------------------------------------------------------------------- */
    /* Empty Update                                                           */
    /* ---------------------------------------------------------------------- */

    if (Object.keys(updateData).length === 0 && note === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "No fields provided for update",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Add Note Only                                                          */
    /* ---------------------------------------------------------------------- */

    if (note !== undefined && Object.keys(updateData).length === 0) {
      const createdNote = await addAdminRequestNote(id, note, user.id);

      if (!createdNote) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to add note",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Admin request note added successfully",
        data: createdNote,
      });
    }

    /* ---------------------------------------------------------------------- */
    /* Update Request                                                         */
    /* ---------------------------------------------------------------------- */

    const updated = await updateAdminRequest(id, updateData, user.id);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update admin request",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        note !== undefined
          ? "Admin request updated and note added successfully"
          : "Admin request updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("UPDATE_ADMIN_REQUEST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update admin request",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE /api/admin-requests/[id]                                            */
/* -------------------------------------------------------------------------- */

export async function DELETE(
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
    /* Params                                                                 */
    /* ---------------------------------------------------------------------- */

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Request ID is required",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Check Existing Request                                                 */
    /* ---------------------------------------------------------------------- */

    const existing = await getAdminRequestById(id);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin request not found",
        },
        { status: 404 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Delete                                                                 */
    /* ---------------------------------------------------------------------- */

    const deleted = await deleteAdminRequest(id, user.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to delete admin request",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin request deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_ADMIN_REQUEST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete admin request",
      },
      { status: 500 },
    );
  }
}
