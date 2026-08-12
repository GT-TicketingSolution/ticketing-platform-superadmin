import { NextRequest, NextResponse } from "next/server";

import {
  getNotificationById,
  updateNotification,
  deleteNotification,
} from "@/server/notification/notification.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/notifications/[id]                                                */
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

    const notification = await getNotificationById(id, undefined, user.id);

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("GET_NOTIFICATION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notification",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* PATCH /api/notifications/[id]                                              */
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

    const existing = await getNotificationById(id, undefined, user.id);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const updateData: {
      priority?: "HIGH" | "MEDIUM" | "LOW";

      status?: "OVERDUE" | "DUE_SOON" | "NEW" | "INFO";

      title?: string;
      message?: string;
      isRead?: boolean;
    } = {};

    /* ---------------------------------------------------------------------- */
    /* Priority                                                               */
    /* ---------------------------------------------------------------------- */

    if (body.priority !== undefined) {
      const allowed = ["HIGH", "MEDIUM", "LOW"] as const;

      if (!allowed.includes(body.priority)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid notification priority",
          },
          { status: 400 },
        );
      }

      updateData.priority = body.priority;
    }

    /* ---------------------------------------------------------------------- */
    /* Status                                                                  */
    /* ---------------------------------------------------------------------- */

    if (body.status !== undefined) {
      const allowed = ["OVERDUE", "DUE_SOON", "NEW", "INFO"] as const;

      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid notification status",
          },
          { status: 400 },
        );
      }

      updateData.status = body.status;
    }

    /* ---------------------------------------------------------------------- */
    /* Title                                                                   */
    /* ---------------------------------------------------------------------- */

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Title cannot be empty",
          },
          { status: 400 },
        );
      }

      updateData.title = body.title.trim();
    }

    /* ---------------------------------------------------------------------- */
    /* Message                                                                 */
    /* ---------------------------------------------------------------------- */

    if (body.message !== undefined) {
      if (typeof body.message !== "string" || !body.message.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Message cannot be empty",
          },
          { status: 400 },
        );
      }

      updateData.message = body.message.trim();
    }

    /* ---------------------------------------------------------------------- */
    /* Read State                                                              */
    /* ---------------------------------------------------------------------- */

    if (body.isRead !== undefined) {
      if (typeof body.isRead !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isRead must be a boolean",
          },
          { status: 400 },
        );
      }

      updateData.isRead = body.isRead;
    }

    /* ---------------------------------------------------------------------- */
    /* Empty Update                                                            */
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

    const updated = await updateNotification(id, updateData, user.id, user.id);

    return NextResponse.json({
      success: true,
      message: "Notification updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("UPDATE_NOTIFICATION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update notification",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE /api/notifications/[id]                                             */
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

    const existing = await getNotificationById(id, undefined, user.id);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 },
      );
    }

    await deleteNotification(id, user.id, user.id);

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_NOTIFICATION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete notification",
      },
      { status: 500 },
    );
  }
}
