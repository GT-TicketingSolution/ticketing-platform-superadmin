import { and, asc, desc, eq, gt, lte, sql } from "drizzle-orm";

import { db } from "@/server/db";

import { admins, renewals, adminRequests } from "@/server/db/schema";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type DashboardFilters = {
  year?: number;
  city?: string;
  from?: Date;
  to?: Date;
};

/* -------------------------------------------------------------------------- */
/* Dashboard Stats                                                            */
/* -------------------------------------------------------------------------- */

async function getDashboardStats(city?: string, from?: Date, to?: Date) {
  const now = new Date();

  /* ------------------------------------------------------------------------ */
  /* Total Admins                                                             */
  /* ------------------------------------------------------------------------ */

  const totalAdminConditions = [];

  if (city) {
    totalAdminConditions.push(eq(admins.city, city));
  }

  if (from) {
    totalAdminConditions.push(gteDate(admins.createdAt, from));
  }

  if (to) {
    totalAdminConditions.push(lteDate(admins.createdAt, to));
  }

  const totalAdminsResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(admins)
    .where(
      totalAdminConditions.length > 0
        ? and(...totalAdminConditions)
        : undefined,
    );

  /* ------------------------------------------------------------------------ */
  /* Active Admins                                                            */
  /* ------------------------------------------------------------------------ */

  const activeAdminConditions = [
    eq(admins.status, "ACTIVE"),
    ...(city ? [eq(admins.city, city)] : []),
    ...(from ? [gteDate(admins.createdAt, from)] : []),
    ...(to ? [lteDate(admins.createdAt, to)] : []),
  ];

  const activeAdminsResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(admins)
    .where(and(...activeAdminConditions));

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

  const upcomingRenewalConditions = [
    eq(renewals.status, "PENDING"),
    gt(renewals.dueDate, now),
    ...(city ? [eq(admins.city, city)] : []),
    ...(from ? [gteDate(renewals.dueDate, from)] : []),
    ...(to ? [lteDate(renewals.dueDate, to)] : []),
  ];

  const upcomingRenewalsResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(renewals)
    .innerJoin(admins, eq(renewals.adminId, admins.id))
    .where(and(...upcomingRenewalConditions));

  /* ------------------------------------------------------------------------ */
  /* Total Earnings                                                           */
  /* ------------------------------------------------------------------------ */

  const totalEarningsConditions = [
    eq(renewals.status, "PAID"),
    eq(renewals.paymentStatus, "SUCCESS"),
    ...(city ? [eq(admins.city, city)] : []),
    ...(from ? [gteDate(renewals.paymentDate, from)] : []),
    ...(to ? [lteDate(renewals.paymentDate, to)] : []),
  ];

  const totalEarningsResult = await db
    .select({
      total: sql<number>`
        coalesce(sum(${renewals.amount}), 0)::float
      `,
    })
    .from(renewals)
    .innerJoin(admins, eq(renewals.adminId, admins.id))
    .where(and(...totalEarningsConditions));

  return {
    totalAdmins: totalAdminsResult[0]?.count ?? 0,
    activeAdmins: activeAdminsResult[0]?.count ?? 0,
    pendingRequests: pendingRequestsResult[0]?.count ?? 0,
    upcomingRenewals: upcomingRenewalsResult[0]?.count ?? 0,
    totalEarnings: totalEarningsResult[0]?.total ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Date Helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Inclusive start-of-day comparison.
 */
function gteDate(column: any, date: Date) {
  return sql`${column} >= ${date}`;
}

/**
 * Inclusive end-of-day comparison.
 *
 * The API passes a date such as 2026-08-26.
 * We convert it to the end of that day so the entire date is included.
 */
function lteDate(column: any, date: Date) {
  const endOfDay = new Date(date);

  endOfDay.setHours(23, 59, 59, 999);

  return sql`${column} <= ${endOfDay}`;
}

/* -------------------------------------------------------------------------- */
/* Yearly Earnings                                                            */
/* -------------------------------------------------------------------------- */

async function getYearlyEarnings(city?: string, from?: Date, to?: Date) {
  const conditions = [
    eq(renewals.status, "PAID"),
    eq(renewals.paymentStatus, "SUCCESS"),
    sql`${renewals.paymentDate} is not null`,
    ...(city ? [eq(admins.city, city)] : []),
    ...(from ? [gteDate(renewals.paymentDate, from)] : []),
    ...(to ? [lteDate(renewals.paymentDate, to)] : []),
  ];

  const result = await db
    .select({
      year: sql<number>`
        extract(year from ${renewals.paymentDate})::int
      `,
      amount: sql<number>`
        coalesce(sum(${renewals.amount}), 0)::float
      `,
    })
    .from(renewals)
    .innerJoin(admins, eq(renewals.adminId, admins.id))
    .where(and(...conditions))
    .groupBy(sql`extract(year from ${renewals.paymentDate})`)
    .orderBy(asc(sql`extract(year from ${renewals.paymentDate})`));

  return result;
}

/* -------------------------------------------------------------------------- */
/* Monthly Earnings                                                           */
/* -------------------------------------------------------------------------- */

async function getMonthlyEarnings(
  year: number,
  city?: string,
  from?: Date,
  to?: Date,
) {
  const conditions = [
    eq(renewals.status, "PAID"),
    eq(renewals.paymentStatus, "SUCCESS"),
    sql`extract(year from ${renewals.paymentDate}) = ${year}`,
    sql`${renewals.paymentDate} is not null`,
    ...(city ? [eq(admins.city, city)] : []),
    ...(from ? [gteDate(renewals.paymentDate, from)] : []),
    ...(to ? [lteDate(renewals.paymentDate, to)] : []),
  ];

  const result = await db
    .select({
      month: sql<number>`
        extract(month from ${renewals.paymentDate})::int
      `,
      amount: sql<number>`
        coalesce(sum(${renewals.amount}), 0)::float
      `,
    })
    .from(renewals)
    .innerJoin(admins, eq(renewals.adminId, admins.id))
    .where(and(...conditions))
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
      amount: existing?.amount ?? 0,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* City Revenue                                                               */
/* -------------------------------------------------------------------------- */

async function getCityRevenue(
  year?: number,
  city?: string,
  from?: Date,
  to?: Date,
) {
  const conditions = [
    eq(renewals.status, "PAID"),
    eq(renewals.paymentStatus, "SUCCESS"),
    ...(city ? [eq(admins.city, city)] : []),
    ...(year
      ? [sql`extract(year from ${renewals.paymentDate}) = ${year}`]
      : []),
    ...(from ? [gteDate(renewals.paymentDate, from)] : []),
    ...(to ? [lteDate(renewals.paymentDate, to)] : []),
  ];

  const result = await db
    .select({
      city: admins.city,
      amount: sql<number>`
        coalesce(sum(${renewals.amount}), 0)::float
      `,
    })
    .from(renewals)
    .innerJoin(admins, eq(renewals.adminId, admins.id))
    .where(and(...conditions))
    .groupBy(admins.city)
    .orderBy(desc(sql`sum(${renewals.amount})`));

  return result;
}

/* -------------------------------------------------------------------------- */
/* Recent Active Admins                                                       */
/* -------------------------------------------------------------------------- */

async function getRecentActiveAdmins(
  limit = 5,
  city?: string,
  from?: Date,
  to?: Date,
) {
  /* ------------------------------------------------------------------------ */
  /* Get recent active admins                                                 */
  /* ------------------------------------------------------------------------ */

  const adminConditions = [
    eq(admins.status, "ACTIVE"),
    ...(city ? [eq(admins.city, city)] : []),
    ...(from ? [gteDate(admins.createdAt, from)] : []),
    ...(to ? [lteDate(admins.createdAt, to)] : []),
  ];

  const activeAdmins = await db
    .select({
      id: admins.id,
      name: admins.fullName,
      email: admins.email,
      phone: admins.phone,
      city: admins.city,
      subdomain: admins.subdomain,
      joinedDate: admins.joinedAt,
    })
    .from(admins)
    .where(and(...adminConditions))
    .orderBy(desc(admins.createdAt))
    .limit(limit);

  if (activeAdmins.length === 0) {
    return [];
  }

  /* ------------------------------------------------------------------------ */
  /* Get next pending renewal for these admins                               */
  /* ------------------------------------------------------------------------ */

  const adminIds = activeAdmins.map((admin) => admin.id);

  const renewalConditions = [
    sql`${renewals.adminId} IN ${adminIds}`,
    eq(renewals.status, "PENDING"),
    gt(renewals.dueDate, new Date()),
  ];

  const renewalData = await db
    .select({
      adminId: renewals.adminId,
      dueDate: renewals.dueDate,
      amount: renewals.amount,
    })
    .from(renewals)
    .where(and(...renewalConditions))
    .orderBy(asc(renewals.dueDate));

  /* ------------------------------------------------------------------------ */
  /* Attach earliest renewal to each admin                                   */
  /* ------------------------------------------------------------------------ */

  const renewalMap = new Map<
    string,
    {
      dueDate: Date;
      amount: number;
    }
  >();

  for (const renewal of renewalData) {
    if (!renewalMap.has(renewal.adminId)) {
      renewalMap.set(renewal.adminId, {
        dueDate: renewal.dueDate,
        amount: Number(renewal.amount),
      });
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Return admins with next renewal information                             */
  /* ------------------------------------------------------------------------ */

  return activeAdmins.map((admin) => {
    const renewal = renewalMap.get(admin.id);

    return {
      ...admin,
      nextRenewal: renewal?.dueDate ?? null,
      renewalAmount: renewal?.amount ?? null,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Main Dashboard                                                             */
/* -------------------------------------------------------------------------- */

export async function getDashboard(filters: DashboardFilters = {}) {
  const year = filters.year ?? new Date().getFullYear();

  const city = filters.city;
  const from = filters.from;
  const to = filters.to;

  const [
    stats,
    yearlyEarnings,
    monthlyEarnings,
    cityRevenue,
    recentActiveAdmins,
  ] = await Promise.all([
    getDashboardStats(city, from, to),

    getYearlyEarnings(city, from, to),

    getMonthlyEarnings(year, city, from, to),

    getCityRevenue(year, city, from, to),

    getRecentActiveAdmins(5, city, from, to),
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

  if (yearlyEarnings.length >= 1) {
    const current = yearlyEarnings[yearlyEarnings.length - 1];

    const currentAmount = Number(current.amount ?? 0);

    const previousYear = yearlyEarnings.find(
      (item) => item.year === current.year - 1,
    );

    const previousAmount = Number(previousYear?.amount ?? 0);

    if (currentAmount > 0 && previousAmount <= 0) {
      growthRate = 100;
    } else if (previousAmount > 0) {
      growthRate = ((currentAmount - previousAmount) / previousAmount) * 100;
    } else {
      growthRate = 0;
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
