// import { and, asc, eq, gte, lte } from "drizzle-orm";

// import { db } from "@/server/db";
// import { admins, renewals } from "@/server/db/schema";

// /* -------------------------------------------------------------------------- */
// /* Types                                                                      */
// /* -------------------------------------------------------------------------- */

// export type UpcomingRenewalsFilters = {
//   days?: number;
// };

// /* -------------------------------------------------------------------------- */
// /* Get Upcoming Renewals                                                      */
// /* -------------------------------------------------------------------------- */

// export async function getUpcomingRenewals(
//   filters: UpcomingRenewalsFilters = {},
// ) {
//   const days = filters.days ?? 15;

//   const now = new Date();

//   const futureLimit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

//   /* ------------------------------------------------------------------------ */
//   /* Renewals                                                                  */
//   /* ------------------------------------------------------------------------ */

//   const dueSoonLimit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

//   const renewalData = await db
//     .select({
//       id: renewals.id,
//       adminId: renewals.adminId,
//       adminName: admins.fullName,
//       adminEmail: admins.email,
//       adminPhone: admins.phone,
//       city: admins.city,
//       amount: renewals.amount,
//       startDate: renewals.startDate,
//       dueDate: renewals.dueDate,
//       status: renewals.status,
//       paymentStatus: renewals.paymentStatus,
//       paymentMethod: renewals.paymentMethod,
//       transactionReference: renewals.transactionReference,
//     })
//     .from(renewals)
//     .innerJoin(admins, eq(renewals.adminId, admins.id))
//     .where(and(gte(renewals.dueDate, now), lte(renewals.dueDate, dueSoonLimit)))
//     .orderBy(asc(renewals.dueDate));
//   /* ------------------------------------------------------------------------ */
//   /* Calculate Days Remaining + Urgency                                        */
//   /* ------------------------------------------------------------------------ */

//   const renewalList = renewalData.map((renewal) => {
//     const difference = renewal.dueDate.getTime() - now.getTime();

//     const daysRemaining = Math.ceil(difference / (24 * 60 * 60 * 1000));

//     let urgency: "OVERDUE" | "DUE_SOON" | "UPCOMING";

//     if (daysRemaining < 0) {
//       urgency = "OVERDUE";
//     } else if (daysRemaining <= 7) {
//       urgency = "DUE_SOON";
//     } else {
//       urgency = "UPCOMING";
//     }

//     return {
//       ...renewal,
//       daysRemaining,
//       urgency,
//     };
//   });

//   /* ------------------------------------------------------------------------ */
//   /* Summary                                                                   */
//   /* ------------------------------------------------------------------------ */

//   const overdue = renewalList.filter(
//     (renewal) => renewal.urgency === "OVERDUE",
//   ).length;

//   const dueWithin7Days = renewalList.filter(
//     (renewal) => renewal.daysRemaining >= 0 && renewal.daysRemaining <= 7,
//   ).length;

//   const dueWithin15Days = renewalList.filter(
//     (renewal) => renewal.daysRemaining >= 0 && renewal.daysRemaining <= 15,
//   ).length;

//   return {
//     summary: {
//       overdue,
//       dueWithin7Days,
//       dueWithin15Days,
//       total: renewalList.length,
//     },

//     renewals: renewalList,
//   };
// }
import { and, asc, eq, gte, lte } from "drizzle-orm";

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
  const envDueSoonDays = Number(process.env.DUE_SOON_LIMIT_DAYS);

  const dueSoonDays =
    filters.days !== undefined && filters.days > 0
      ? filters.days
      : Number.isFinite(envDueSoonDays) && envDueSoonDays > 0
        ? envDueSoonDays
        : 30;

  const now = new Date();

  const dueSoonLimit = new Date(
    now.getTime() + dueSoonDays * 24 * 60 * 60 * 1000,
  );

  /* ------------------------------------------------------------------------ */
  /* Renewals                                                                 */
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
    .where(and(gte(renewals.dueDate, now), lte(renewals.dueDate, dueSoonLimit)))
    .orderBy(asc(renewals.dueDate));

  /* ------------------------------------------------------------------------ */
  /* Calculate Days Remaining + Urgency                                       */
  /* ------------------------------------------------------------------------ */

  const renewalList = renewalData.map((renewal) => {
    const difference = renewal.dueDate.getTime() - now.getTime();

    const daysRemaining = Math.ceil(difference / (24 * 60 * 60 * 1000));

    let urgency: "OVERDUE" | "DUE_SOON" | "UPCOMING";

    if (daysRemaining < 0) {
      urgency = "OVERDUE";
    } else if (daysRemaining <= dueSoonDays) {
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
  /* Summary                                                                  */
  /* ------------------------------------------------------------------------ */

  const overdue = renewalList.filter(
    (renewal) => renewal.urgency === "OVERDUE",
  ).length;

  const dueWithin7Days = renewalList.filter(
    (renewal) => renewal.daysRemaining >= 0 && renewal.daysRemaining <= 7,
  ).length;

  const dueWithinDays = renewalList.filter(
    (renewal) =>
      renewal.daysRemaining >= 0 && renewal.daysRemaining <= dueSoonDays,
  ).length;

  return {
    summary: {
      overdue,
      dueWithin7Days,
      dueWithinDays,
      total: renewalList.length,
    },
    renewals: renewalList,
  };
}
