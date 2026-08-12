import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);

    return Response.json({
      success: true,
      message: "Backend is healthy",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return Response.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 },
    );
  }
}
