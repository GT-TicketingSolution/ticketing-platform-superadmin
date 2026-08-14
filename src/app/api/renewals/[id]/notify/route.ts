import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

import { db } from "@/server/db";
import { renewals, renewalNotifications } from "@/server/db/schema";
import { admins } from "@/server/db/schema/admins";

/* -------------------------------------------------------------------------- */
/* Resend Configuration                                                       */
/* -------------------------------------------------------------------------- */

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not configured");
}

const resend = new Resend(resendApiKey);

/* -------------------------------------------------------------------------- */
/* Renewal Email Configuration                                                */
/* -------------------------------------------------------------------------- */

const resendRenewalFromEmail = process.env.RESEND_RENEWAL_FROM_EMAIL ?? "";

const resendRenewalFromName = process.env.RESEND_RENEWAL_FROM_NAME ?? "";

const renewalSubject =
  process.env.RESEND_RENEWAL_SUBJECT ?? "Subscription Renewal Reminder";

const renewalSignature =
  process.env.RESEND_RENEWAL_SIGNATURE ?? "Ticketing Solution Renewals";

const ticketingSolutionName =
  process.env.TICKETING_SOLUTION_NAME ?? "Ticketing Solution";

/* -------------------------------------------------------------------------- */
/* Validate Configuration                                                     */
/* -------------------------------------------------------------------------- */

if (!resendRenewalFromEmail) {
  throw new Error("RESEND_RENEWAL_FROM_EMAIL is not configured");
}

if (!resendRenewalFromName) {
  throw new Error("RESEND_RENEWAL_FROM_NAME is not configured");
}

/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    /* ---------------------------------------------------------------------- */
    /* Find Renewal + Admin                                                   */
    /* ---------------------------------------------------------------------- */

    const result = await db
      .select({
        renewal: renewals,
        admin: admins,
      })
      .from(renewals)
      .innerJoin(admins, eq(renewals.adminId, admins.id))
      .where(eq(renewals.id, id))
      .limit(1);

    const record = result[0];

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          message: "Renewal not found",
        },
        { status: 404 },
      );
    }

    const { renewal, admin } = record;

    /* ---------------------------------------------------------------------- */
    /* Validate Admin Email                                                   */
    /* ---------------------------------------------------------------------- */

    if (!admin.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin email not found",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Email Data                                                              */
    /* ---------------------------------------------------------------------- */

    const renewalDate = renewal.dueDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const amount = Number(renewal.amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    /* ---------------------------------------------------------------------- */
    /* Sender                                                                  */
    /* ---------------------------------------------------------------------- */

    const fromEmail = `${resendRenewalFromName} <${resendRenewalFromEmail}>`;

    /* ---------------------------------------------------------------------- */
    /* Send Email                                                              */
    /* ---------------------------------------------------------------------- */

    const { data, error } = await resend.emails.send({
      from: fromEmail,

      to: [admin.email],

      subject: renewalSubject,

      html: `
        <div
          style="
            margin: 0;
            padding: 12px 0;
            background: #f4f6f8;
            font-family: Arial, Helvetica, sans-serif;
          "
        >
          <div
            style="
              max-width: 750px;
              margin: 0 auto;
              background: #ffffff;
            "
          >

            <!-- Header -->
            <div
              style="
                background: #214d73;
                padding: 38px 20px;
                text-align: center;
              "
            >
              <h1
                style="
                  margin: 0;
                  color: #ffffff;
                  font-size: 32px;
                  line-height: 1.2;
                  font-weight: 700;
                "
              >
                ${ticketingSolutionName}
              </h1>
            </div>

            <!-- Content -->
            <div
              style="
                padding: 42px 40px;
                color: #182033;
              "
            >

              <!-- Heading -->
              <h2
                style="
                  margin: 0 0 24px;
                  color: #182033;
                  font-size: 28px;
                  line-height: 1.3;
                  font-weight: 700;
                "
              >
                ${renewalSubject}
              </h2>

              <!-- Greeting -->
              <p
                style="
                  margin: 0 0 20px;
                  color: #667085;
                  font-size: 18px;
                  line-height: 1.6;
                "
              >
                Hello ${admin.fullName},
              </p>

              <!-- Introduction -->
              <p
                style="
                  margin: 0 0 24px;
                  color: #667085;
                  font-size: 18px;
                  line-height: 1.6;
                "
              >
                This is a reminder that your ${ticketingSolutionName}
                subscription is due for renewal.
              </p>

              <!-- Renewal Details -->
              <div
                style="
                  margin: 0 0 28px;
                  padding: 22px 24px;
                  background: #f5f7fa;
                  border-radius: 10px;
                "
              >

                <p
                  style="
                    margin: 0 0 12px;
                    color: #667085;
                    font-size: 16px;
                    line-height: 1.5;
                  "
                >
                  <strong style="color: #182033;">
                    Renewal Date:
                  </strong>
                  ${renewalDate}
                </p>

                <p
                  style="
                    margin: 0 0 12px;
                    color: #667085;
                    font-size: 16px;
                    line-height: 1.5;
                  "
                >
                  <strong style="color: #182033;">
                    Renewal Amount:
                  </strong>
                  ₹${amount}
                </p>

                <p
                  style="
                    margin: 0;
                    color: #667085;
                    font-size: 16px;
                    line-height: 1.5;
                  "
                >
                  <strong style="color: #182033;">
                    Status:
                  </strong>
                  ${renewal.status}
                </p>

              </div>

              <!-- Reminder -->
              <p
                style="
                  margin: 0 0 30px;
                  color: #667085;
                  font-size: 17px;
                  line-height: 1.6;
                "
              >
                Please complete your renewal before the due date
                to ensure uninterrupted access to your services.
              </p>

              <!-- Additional Information -->
              <p
                style="
                  margin: 30px 0 0;
                  color: #667085;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                If you have already completed your renewal,
                you can safely ignore this email.
              </p>

              <!-- Signature -->
              <p
                style="
                  margin: 28px 0 0;
                  color: #667085;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                Regards,<br />
                <strong style="color: #182033;">
                  ${renewalSignature}
                </strong>
              </p>

            </div>
          </div>
        </div>
      `,
    });

    /* ---------------------------------------------------------------------- */
    /* Handle Resend Error                                                     */
    /* ---------------------------------------------------------------------- */

    if (error) {
      await db.insert(renewalNotifications).values({
        renewalId: renewal.id,
        adminId: admin.id,
        type: "RENEWAL_REMINDER",
        channel: "EMAIL",
        status: "FAILED",
        recipientEmail: admin.email,
        subject: renewalSubject,
        sentAt: null,
        errorMessage: error.message,
      });

      console.error("RESEND_RENEWAL_EMAIL_ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to send renewal notification",
        },
        { status: 500 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Save Successful Notification                                           */
    /* ---------------------------------------------------------------------- */

    await db.insert(renewalNotifications).values({
      renewalId: renewal.id,
      adminId: admin.id,
      type: "RENEWAL_REMINDER",
      channel: "EMAIL",
      status: "SENT",
      recipientEmail: admin.email,
      subject: renewalSubject,
      sentAt: new Date(),
      errorMessage: null,
    });

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      message: "Renewal notification sent successfully",
      data: {
        email: admin.email,
        resendId: data?.id ?? null,
      },
    });
  } catch (error) {
    console.error("RENEWAL_NOTIFICATION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
