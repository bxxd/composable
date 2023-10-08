import { NextResponse, NextRequest } from "next/server";
import { getDbInstance, releaseDbInstance } from "@/lib/db";

export const dynamic = "force-dynamic";

function getIpAddress(req: NextRequest) {
  return (
    req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || req.ip
  );
}

export async function GET(req: NextRequest) {
  const db = await getDbInstance();

  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { message: "Invalid limit value" },
        { status: 400 }
      );
    }

    const queryText = `
      SELECT
        f.id, c.ticker, c.name, f.form_file, f.reporting_for, f.filed_at, f.filing_period, f.filing_type, f.url, f.created_at, f.model, f.status, f.cost
      FROM filings f inner join companies c on f.company_id = c.id
      ORDER BY id DESC
      LIMIT ${limit}
    `;

    const data = await db.any(queryText);

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await releaseDbInstance();
  }
}
