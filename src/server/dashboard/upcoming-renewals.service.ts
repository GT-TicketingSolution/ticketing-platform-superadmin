import { and, asc, eq, gt, lte } from "drizzle-orm";

import { db } from "@/server/db";
import { admins, renewals } from "@/server/db/schema";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type UpcomingRenewalsFilters = {
  days?: number;
};

/* -------------------------------------------------------------------------- */
/* Get Upcoming Renewals                                                      */
/* -------------------------------------------------------------------------- */

export async function getUpcomingRenewals(
  filters: UpcomingRenewalsFilters = {},
) {
  const days = filters.days ?? 15;

  const now = new Date();

  const futureLimit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  /* ------------------------------------------------------------------------ */
  /* Renewals                                                                  */
  /* ------------------------------------------------------------------------ */

  const renewalData = await db
    .select({
      id: renewals.id,

      adminId: renewals.adminId,
      adminName: admins.fullName,
      adminEmail: admins.email,
      adminPhone: admins.phone,
      city: admins.city,

      amount: renewals.amount,

      startDate: renewals.startDate,
      dueDate: renewals.dueDate,

      status: renewals.status,
      paymentStatus: renewals.paymentStatus,
      paymentMethod: renewals.paymentMethod,

      transactionReference: renewals.transactionReference,
    })
    .from(renewals)
    .innerJoin(admins, eq(renewals.adminId, admins.id))
    .where(
      and(eq(renewals.status, "PENDING"), lte(renewals.dueDate, futureLimit)),
    )
    .orderBy(asc(renewals.dueDate));

  /* ------------------------------------------------------------------------ */
  /* Calculate Days Remaining + Urgency                                        */
  /* ------------------------------------------------------------------------ */

  const renewalList = renewalData.map((renewal) => {
    const difference = renewal.dueDate.getTime() - now.getTime();

    const daysRemaining = Math.ceil(difference / (24 * 60 * 60 * 1000));

    let urgency: "OVERDUE" | "DUE_SOON" | "UPCOMING";

    if (daysRemaining < 0) {
      urgency = "OVERDUE";
    } else if (daysRemaining <= 7) {
      urgency = "DUE_SOON";
    } else {
      urgency = "UPCOMING";
    }

    return {
      ...renewal,
      daysRemaining,
      urgency,
    };
  });

  /* ------------------------------------------------------------------------ */
  /* Summary                                                                   */
  /* ------------------------------------------------------------------------ */

  const overdue = renewalList.filter(
    (renewal) => renewal.urgency === "OVERDUE",
  ).length;

  const dueWithin7Days = renewalList.filter(
    (renewal) => renewal.daysRemaining >= 0 && renewal.daysRemaining <= 7,
  ).length;

  const dueWithin15Days = renewalList.filter(
    (renewal) => renewal.daysRemaining >= 0 && renewal.daysRemaining <= 15,
  ).length;

  return {
    summary: {
      overdue,
      dueWithin7Days,
      dueWithin15Days,
      total: renewalList.length,
    },

    renewals: renewalList,
  };
}
