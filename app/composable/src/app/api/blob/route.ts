import { NextResponse, NextRequest } from "next/server";
import { getDbInstance, releaseDbInstance } from "@/lib/db";
import { getEmbedding } from "@/app/api/lib/embedding";

export const dynamic = "force-dynamic";

function extractAllText(data: any): string {
  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      // data is an array
      const texts: string[] = data.map((item) => extractAllText(item));
      return texts.join(" ");
    } else {
      // data is a dictionary
      const texts: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (key === "text") {
          texts.push(value as string);
        }
        if (typeof value === "object" && value !== null) {
          texts.push(extractAllText(value));
        }
      }
      return texts.join(" ");
    }
  } else {
    // data is neither a dictionary nor a list
    return "";
  }
}

export async function POST(req: NextRequest) {
  const db = await getDbInstance();
  try {
    const data = await req.json();

    console.log("blob POST...");

    const ip_address = req.headers.get("x-forwarded-for") || req.ip;

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

    if (id) {
      queryText = `SELECT id, data, created_at, ai_model, ${
        original
          ? `original`
          : `CASE WHEN original IS NOT NULL THEN true ELSE false END AS original`
      }, likes FROM json_blobs WHERE id = $1 `;
      queryParams = [id];
    } else {
      let embedding: any;

      if (search_term) {
        embedding = await getEmbedding(search_term);
      }

      queryText = `SELECT id
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
