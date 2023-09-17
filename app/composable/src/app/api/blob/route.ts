import { NextResponse, NextRequest } from "next/server";
import { getDbInstance } from "@/lib/db";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const db = getDbInstance();
    const data = await req.json();

    console.log("blob POST...");

    const ip_address = req.headers.get("x-forwarded-for") || req.ip;

    const result = await db.one(
      "INSERT INTO json_blobs (data, ip_address, ai_model) VALUES ($1, $2, $3) RETURNING id",
      [JSON.stringify(data.data), ip_address, data.ai_model]
    );

    return NextResponse.json({ id: result.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getDbInstance();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { message: "Invalid limit value" },
        { status: 400 }
      );
    }

    const integerId = id ? parseInt(id, 10) : null;

    if (integerId && (isNaN(integerId) || integerId <= 0)) {
      return NextResponse.json(
        { message: "Invalid ID value" },
        { status: 400 }
      );
    }

    // If id is not null, fetch data limited by the "limit" parameter
    const data = id
      ? await db.any(
          "SELECT id, data, created_at, ai_model FROM json_blobs WHERE id = $1 ORDER BY created_at DESC LIMIT $2 ",
          [id, limit]
        )
      : await db.any(
          "SELECT id, data, created_at, ai_model FROM json_blobs  ORDER BY created_at DESC LIMIT $1",
          [limit]
        );

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
