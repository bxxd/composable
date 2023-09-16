import { NextResponse, NextRequest } from "next/server";
import { getDbInstance } from "@/lib/db";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const db = getDbInstance();
    const data = await req.json();
    const id = nanoid();

    console.log("blob POST...");

    const ip_address = req.headers.get("x-forwarded-for") || req.ip;

    await db.none(
      "INSERT INTO json_blobs (id, data, ip_address) VALUES ($1, $2, $3)",
      [id, JSON.stringify(data), ip_address]
    );

    return NextResponse.json({ id });
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

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const data = await db.one("SELECT data FROM json_blobs WHERE id = $1", [
      id,
    ]);

    // console.log("blob GET... data:", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
