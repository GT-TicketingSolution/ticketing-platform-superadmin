import { NextRequest, NextResponse } from "next/server";

import {
  createNotification,
  getNotifications,
} from "@/server/notification/notification.service";

import { getCurrentUser } from "@/server/auth/auth.service";

/* -------------------------------------------------------------------------- */
/* GET /api/notifications                                                     */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* GET /api/notifications                                                     */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  console.log("🔥 GET /api/notifications CALLED");
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

    const typeParam = searchParams.get("type");

    const priorityParam = searchParams.get("priority");

    const statusParam = searchParams.get("status");

    const isReadParam = searchParams.get("isRead");

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
    /* Type Validation                                                        */
    /* ---------------------------------------------------------------------- */

    const allowedTypes = [
      "RENEWAL",
      "ADMIN_REQUEST",
      "SYSTEM",
      "SECURITY",
    ] as const;

    let type: "RENEWAL" | "ADMIN_REQUEST" | "SYSTEM" | "SECURITY" | undefined;

    if (typeParam) {
      if (!allowedTypes.includes(typeParam as (typeof allowedTypes)[number])) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid notification type",
          },
          { status: 400 },
        );
      }

      type = typeParam as "RENEWAL" | "ADMIN_REQUEST" | "SYSTEM" | "SECURITY";
    }

    /* ---------------------------------------------------------------------- */
    /* Priority Validation                                                    */
    /* ---------------------------------------------------------------------- */

    const allowedPriorities = ["HIGH", "MEDIUM", "LOW"] as const;

    let priority: "HIGH" | "MEDIUM" | "LOW" | undefined;

    if (priorityParam) {
      if (
        !allowedPriorities.includes(
          priorityParam as (typeof allowedPriorities)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid notification priority",
          },
          { status: 400 },
        );
      }

      priority = priorityParam as "HIGH" | "MEDIUM" | "LOW";
    }

    /* ---------------------------------------------------------------------- */
    /* Status Validation                                                      */
    /* ---------------------------------------------------------------------- */

    const allowedStatuses = ["OVERDUE", "DUE_SOON", "NEW", "INFO"] as const;

    let status: "OVERDUE" | "DUE_SOON" | "NEW" | "INFO" | undefined;

    if (statusParam) {
      if (
        !allowedStatuses.includes(
          statusParam as (typeof allowedStatuses)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid notification status",
          },
          { status: 400 },
        );
      }

      status = statusParam as "OVERDUE" | "DUE_SOON" | "NEW" | "INFO";
    }

    /* ---------------------------------------------------------------------- */
    /* Read State Validation                                                  */
    /* ---------------------------------------------------------------------- */

    let isRead: boolean | undefined;

    if (isReadParam !== null) {
      if (isReadParam !== "true" && isReadParam !== "false") {
        return NextResponse.json(
          {
            success: false,
            message: "isRead must be true or false",
          },
          { status: 400 },
        );
      }

      isRead = isReadParam === "true";
    }

    /* ---------------------------------------------------------------------- */
    /* Fetch Notifications                                                    */
    /* ---------------------------------------------------------------------- */

    console.log("🔥 FETCHING NOTIFICATIONS FOR PLATFORM ADMIN:", user.id);

    const result = await getNotifications({
      page,
      limit,
      search,
      type,
      priority,
      status,
      isRead,
      platformAdminId: user.id,
    });

    console.log("🔥 NOTIFICATIONS RESULT:", result);

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      data: result.data,

      unreadCount: result.unreadCount,

      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET_NOTIFICATIONS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notifications",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST /api/notifications                                                    */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    console.log("🔥 NOTIFICATION POST USER:", {
      id: user?.id,
      email: user?.email,
    });

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
      type,
      priority,
      status,
      title,
      message,
      adminId,
      renewalId,
      requestId,
    } = body;

    /* ---------------------------------------------------------------------- */
    /* Type                                                                   */
    /* ---------------------------------------------------------------------- */

    const allowedTypes = [
      "RENEWAL",
      "ADMIN_REQUEST",
      "SYSTEM",
      "SECURITY",
    ] as const;

    if (!type || !allowedTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid notification type",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Priority                                                               */
    /* ---------------------------------------------------------------------- */

    const allowedPriorities = ["HIGH", "MEDIUM", "LOW"] as const;

    if (priority !== undefined && !allowedPriorities.includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid notification priority",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Status                                                                  */
    /* ---------------------------------------------------------------------- */

    const allowedStatuses = ["OVERDUE", "DUE_SOON", "NEW", "INFO"] as const;

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid notification status",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Title / Message                                                        */
    /* ---------------------------------------------------------------------- */

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required",
        },
        { status: 400 },
      );
    }

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Message is required",
        },
        { status: 400 },
      );
    }

    if (type === "ADMIN_REQUEST" && !adminId) {
      return NextResponse.json(
        {
          success: false,
          message: "adminId is required for ADMIN_REQUEST notifications",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Create                                                                 */
    /* ---------------------------------------------------------------------- */

    const notification = await createNotification(
      {
        type,
        priority,
        status,
        title,
        message,

        // Who should receive the notification
        platformAdminId: user.id,

        // Related admin, if any
        adminId: adminId ?? null,

        renewalId: renewalId ?? null,
        requestId: requestId ?? null,
      },
      user.id,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Notification created successfully",
        data: notification,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_NOTIFICATION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create notification",
      },
      { status: 500 },
    );
  }
}
