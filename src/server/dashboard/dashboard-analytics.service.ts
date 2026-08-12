import { and, asc, desc, eq, gt, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { admins, renewals, adminRequests } from "@/server/db/schema";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type DashboardFilters = {
  year?: number;
};

/* -------------------------------------------------------------------------- */
/* Dashboard Stats                                                            */
/* -------------------------------------------------------------------------- */

async function getDashboardStats() {
  const now = new Date();

  /* ------------------------------------------------------------------------ */
  /* Total Admins                                                             */
  /* ------------------------------------------------------------------------ */

  const totalAdminsResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(admins);

  /* ------------------------------------------------------------------------ */
  /* Active Admins                                                            */
  /* ------------------------------------------------------------------------ */

  const activeAdminsResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(admins)
    .where(eq(admins.status, "ACTIVE"));

  /* ------------------------------------------------------------------------ */
  /* Pending Requests                                                         */
  /* ------------------------------------------------------------------------ */

  const pendingRequestsResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(adminRequests)
    .where(eq(adminRequests.status, "PENDING"));

  /* ------------------------------------------------------------------------ */
  /* Upcoming Renewals                                                        */
  /* ------------------------------------------------------------------------ */

  const upcomingRenewalsResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(renewals)
    .where(and(eq(renewals.status, "PENDING"), gt(renewals.dueDate, now)));

  /* ------------------------------------------------------------------------ */
  /* Total Earnings                                                           */
  /* ------------------------------------------------------------------------ */

  const totalEarningsResult = await db
    .select({
      total: sql<string>`coalesce(sum(${renewals.amount}), 0)`,
    })
    .from(renewals)
    .where(
      and(eq(renewals.status, "PAID"), eq(renewals.paymentStatus, "SUCCESS")),
    );

  return {
    totalAdmins: totalAdminsResult[0]?.count ?? 0,
    activeAdmins: activeAdminsResult[0]?.count ?? 0,
    pendingRequests: pendingRequestsResult[0]?.count ?? 0,
    upcomingRenewals: upcomingRenewalsResult[0]?.count ?? 0,
    totalEarnings: totalEarningsResult[0]?.total ?? "0",
  };
}

/* -------------------------------------------------------------------------- */
/* Yearly Earnings                                                            */
/* -------------------------------------------------------------------------- */

async function getYearlyEarnings() {
  const result = await db
    .select({
      year: sql<number>`
        extract(year from ${renewals.paymentDate})::int
      `,
      amount: sql<string>`
        coalesce(sum(${renewals.amount}), 0)
      `,
    })
    .from(renewals)
    .where(
      and(
        eq(renewals.status, "PAID"),
        eq(renewals.paymentStatus, "SUCCESS"),
        sql`${renewals.paymentDate} is not null`,
      ),
    )
    .groupBy(sql`extract(year from ${renewals.paymentDate})`)
    .orderBy(asc(sql`extract(year from ${renewals.paymentDate})`));

  return result;
}

/* -------------------------------------------------------------------------- */
/* Monthly Earnings                                                           */
/* -------------------------------------------------------------------------- */

async function getMonthlyEarnings(year: number) {
  const result = await db
    .select({
      month: sql<number>`
        extract(month from ${renewals.paymentDate})::int
      `,
      amount: sql<string>`
        coalesce(sum(${renewals.amount}), 0)
      `,
    })
    .from(renewals)
    .where(
      and(
        eq(renewals.status, "PAID"),
        eq(renewals.paymentStatus, "SUCCESS"),
        sql`
          extract(year from ${renewals.paymentDate}) = ${year}
        `,
        sql`${renewals.paymentDate} is not null`,
      ),
    )
    .groupBy(sql`extract(month from ${renewals.paymentDate})`)
    .orderBy(asc(sql`extract(month from ${renewals.paymentDate})`));

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return monthNames.map((monthName, index) => {
    const monthNumber = index + 1;

    const existing = result.find((item) => item.month === monthNumber);

    return {
      month: monthNumber,
      monthName,
      amount: existing?.amount ?? "0",
    };
  });
}

/* -------------------------------------------------------------------------- */
/* City Revenue                                                               */
/* -------------------------------------------------------------------------- */

async function getCityRevenue() {
  const result = await db
    .select({
      city: admins.city,
      amount: sql<string>`
        coalesce(sum(${renewals.amount}), 0)
      `,
    })
    .from(renewals)
    .innerJoin(admins, eq(renewals.adminId, admins.id))
    .where(
      and(eq(renewals.status, "PAID"), eq(renewals.paymentStatus, "SUCCESS")),
    )
    .groupBy(admins.city)
    .orderBy(desc(sql`sum(${renewals.amount})`));

  return result;
}

/* -------------------------------------------------------------------------- */
/* Recent Active Admins                                                       */
/* -------------------------------------------------------------------------- */

async function getRecentActiveAdmins(limit = 5) {
  return await db
    .select({
      id: admins.id,
      name: admins.fullName,
      email: admins.email,
      phone: admins.phone,
      city: admins.city,
      subdomain: admins.subdomain,

      joinedDate: admins.joinedAt,

      nextRenewal: admins.nextRenewalDate,

      renewalAmount: admins.renewalAmount,
    })
    .from(admins)
    .where(eq(admins.status, "ACTIVE"))
    .orderBy(desc(admins.createdAt))
    .limit(limit);
}

/* -------------------------------------------------------------------------- */
/* Main Dashboard                                                             */
/* -------------------------------------------------------------------------- */

export async function getDashboard(filters: DashboardFilters = {}) {
  const year = filters.year ?? new Date().getFullYear();

  const [
    stats,
    yearlyEarnings,
    monthlyEarnings,
    cityRevenue,
    recentActiveAdmins,
  ] = await Promise.all([
    getDashboardStats(),
    getYearlyEarnings(),
    getMonthlyEarnings(year),
    getCityRevenue(),
    getRecentActiveAdmins(5),
  ]);

  /* ------------------------------------------------------------------------ */
  /* Highest Annual Revenue                                                   */
  /* ------------------------------------------------------------------------ */

  const highestYear = yearlyEarnings.reduce((highest, current) => {
    if (Number(current.amount) > Number(highest?.amount ?? 0)) {
      return current;
    }

    return highest;
  }, yearlyEarnings[0] ?? null);

  /* ------------------------------------------------------------------------ */
  /* Growth Rate                                                              */
  /* ------------------------------------------------------------------------ */

  let growthRate = 0;

  if (yearlyEarnings.length >= 2) {
    const current = yearlyEarnings[yearlyEarnings.length - 1];

    const previous = yearlyEarnings[yearlyEarnings.length - 2];

    const currentAmount = Number(current.amount);

    const previousAmount = Number(previous.amount);

    if (previousAmount > 0) {
      growthRate = ((currentAmount - previousAmount) / previousAmount) * 100;
    }
  }

  return {
    stats,

    earnings: {
      yearly: yearlyEarnings,

      monthly: {
        year,
        data: monthlyEarnings,
      },

      highestAnnualRevenue: highestYear
        ? {
            year: highestYear.year,
            amount: highestYear.amount,
          }
        : null,

      growthRate: Number(growthRate.toFixed(2)),
    },

    cityRevenue,

    activeAdmins: recentActiveAdmins,
  };
}
