import { NextResponse, NextRequest } from "next/server";
import { getDbInstance, releaseDbInstance } from "@/lib/db";
import { getEmbedding } from "@/lib/embedding";
import { extractAllText } from "@/lib/dataUtils";

export const dynamic = "force-dynamic";

function getIpAddress(req: NextRequest) {
  return (
    req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || req.ip
  );
}

export async function POST(req: NextRequest) {
  const db = await getDbInstance();
  try {
    const data = await req.json();

    console.log("blob POST...");

    const ip_address = getIpAddress(req);

    const original = data.original || null;

    if (!data.data) {
      return NextResponse.json({ message: "Missing data" }, { status: 400 });
    }

    let embedding = await getEmbedding(extractAllText(data.data));

    const result = await db.one(
      "INSERT INTO json_blobs (data, ip_address, ai_model, original, embedding) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [
        JSON.stringify(data.data),
        ip_address,
        data.ai_model,
        original,
        embedding,
      ]
    );

    return NextResponse.json({ id: result.id });
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

export async function GET(req: NextRequest) {
  // console.log("GET req", req);
  const db = await getDbInstance();
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const limitParam = url.searchParams.get("limit");
    const original = url.searchParams.has("original");
    let search_term = url.searchParams.get("search_term");
    const sort = url.searchParams.get("sort"); // New sort parameter

    console.log(
      "blob GET...",
      "id",
      id,
      "limit",
      limitParam,
      "original",
      original,
      "search_term",
      search_term,
      "sort",
      sort
    );

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

    if (id && !integerId) {
      console.log("id is not an integer");
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    let queryText: string;
    let queryParams: (string | number)[];

    const ip_address = getIpAddress(req);

    const getMine = () => {
      if (process.env.SUPER_USER === "true") {
        return ", true AS is_mine";
      } else {
        if (ip_address) {
          return `, ip_address = '${ip_address}' AS is_mine`;
        } else {
          return `, ip_address IS NULL AS is_mine`;
        }
      }
    };

    if (id) {
      queryText = `SELECT id, data, created_at, ai_model ${getMine()} ${
        original
          ? `,original`
          : `,CASE WHEN original IS NOT NULL THEN true ELSE false END AS original`
      }, likes FROM json_blobs WHERE id = $1 `;
      queryParams = [id];
    } else {
      let embedding: any;

      if (search_term) {
        embedding = await getEmbedding(search_term);
      }

      queryText = `SELECT id ${getMine()}
        ${
          embedding
            ? `,embedding <=> '${JSON.stringify(
                embedding
              )}' AS embedding_distance`
            : ``
        } FROM json_blobs ${
        embedding
          ? `ORDER BY embedding_distance ASC`
          : `ORDER BY ${
              sort === "likes"
                ? "likes DESC, created_at DESC"
                : "created_at DESC"
            } `
      } LIMIT ${limit}`;
      queryParams = [];
    }

    // console.log("queryText", queryText);

    const data = await db.any(queryText, queryParams);

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

export async function DELETE(req: NextRequest) {
  const db = await getDbInstance();

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const integerId = id ? parseInt(id, 10) : null;

    if (!integerId || isNaN(integerId) || integerId <= 0) {
      return NextResponse.json(
        { message: "Invalid or missing ID value" },
        { status: 400 }
      );
    }

    const ip_address = getIpAddress(req);

    // Check if the record exists and if the IP address matches or both are undefined/null
    const record = await db.oneOrNone(
      `SELECT ip_address FROM json_blobs WHERE id = $1`,
      [integerId]
    );

    if (!record) {
      return NextResponse.json(
        { message: "Record not found" },
        { status: 404 }
      );
    }

    // Check if the IP addresses either match, or if both are undefined/null
    if (process.env.SUPER_USER !== "true") {
      if (
        record.ip_address !== ip_address &&
        !(typeof ip_address === "undefined" && record.ip_address === null)
      ) {
        return NextResponse.json(
          { message: "You are not authorized to delete this record" },
          { status: 403 }
        );
      }
    }

    // If IP matches, delete the record
    await db.none(`DELETE FROM json_blobs WHERE id = $1`, [integerId]);

    return NextResponse.json({ message: "Record deleted successfully" });
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
