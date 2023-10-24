import { NextResponse } from "next/server";
import { getDbInstance, releaseDbInstance } from "@/lib/db";

import { Excerpt } from "@/lib/types";

interface QueryResult extends Excerpt {}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = await getDbInstance();
  try {
    const url = new URL(req.url);

    console.log("get excerpts..", url);

    const filing_id = url.searchParams.get("filing_id");

    const query = `SELECT
    e.id AS id,
    e.title AS title,
    e.category AS category,
    e.subcategory AS subcategory,
    e.insight AS insight,
    e.excerpt AS excerpt,
    e.tokens AS tokens,
    e.index AS index,
    ARRAY_AGG(t.tag) AS tags
FROM (
    SELECT * FROM excerpts
    WHERE filing_id = ${filing_id}
    ORDER BY id ASC
    LIMIT 100
) AS e
LEFT JOIN tags AS t ON e.id = t.excerpt_id
GROUP BY e.id, e.title, e.category, e.subcategory, e.insight, e.excerpt, e.tokens, e.index
ORDER BY e.index ASC;`;

    console.log("query", query);

    const result: QueryResult[] = await db.any(query);
    console.log("result length", result.length);

    // console.log(JSON.stringify(result));
    // Send the results as JSON
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        message: "An error occurred while fetching data",
      },
      { status: 500 }
    );
  } finally {
    await releaseDbInstance();
  }
}
