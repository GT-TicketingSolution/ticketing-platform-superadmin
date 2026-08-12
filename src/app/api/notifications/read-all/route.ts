import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/auth.service";

import { markAllNotificationsAsRead } from "@/server/notification/notification.service";

export async function PATCH() {
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
    /* Mark All As Read                                                       */
    /* ---------------------------------------------------------------------- */

    const result = await markAllNotificationsAsRead(user.id);

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    console.error("MARK_ALL_NOTIFICATIONS_READ_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark notifications as read",
      },
      { status: 500 },
    );
  }
}
