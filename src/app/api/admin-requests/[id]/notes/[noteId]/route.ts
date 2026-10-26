import { NextRequest, NextResponse } from "next/server";

import {
  updateAdminRequestNote,
  deleteAdminRequestNote,
} from "@/server/admin-request/admin-request.service";

import { getCurrentUser } from "@/server/auth/auth.service";

type RouteContext = {
  params: Promise<{ id: string; noteId: string }>;
};

/* -------------------------------------------------------------------------- */
/* PATCH /api/admin-requests/[id]/notes/[noteId]                              */
/* -------------------------------------------------------------------------- */

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

    const { id, noteId } = await params;

    const body = await request.json();

    if (typeof body.note !== "string" || !body.note.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Note cannot be empty",
        },
        { status: 400 },
      );
    }

    const updatedNote = await updateAdminRequestNote(id, noteId, body.note);

    if (!updatedNote) {
      return NextResponse.json(
        {
          success: false,
          message: "Note not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Note updated successfully",
      data: updatedNote,
    });
  } catch (error) {
    console.error("UPDATE_ADMIN_REQUEST_NOTE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update note",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE /api/admin-requests/[id]/notes/[noteId]                             */
/* -------------------------------------------------------------------------- */

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
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

    const { id, noteId } = await params;

    const deletedNote = await deleteAdminRequestNote(id, noteId);

    if (!deletedNote) {
      return NextResponse.json(
        {
          success: false,
          message: "Note not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_ADMIN_REQUEST_NOTE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete note",
      },
      { status: 500 },
    );
  }
}
