import { NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";

import { Filing, Excerpt, Company } from "@/lib/types";

interface QueryResult extends Excerpt {}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    console.log("get excerpts..", url);

    const filing_id = url.searchParams.get("filing_id");
    // const search_term = url.searchParams.get("search_term");

    const query = `SELECT
    e.id AS id,
    e.title AS title,
    e.category AS category,
    e.subcategory AS subcategory,
    e.insight AS insight,
    e.excerpt AS excerpt,
    e.tokens AS tokens,
    ARRAY_AGG(t.tag) AS tags
FROM (
    SELECT * FROM excerpts
    WHERE filing_id = $1
    ORDER BY id ASC
    LIMIT 100
) AS e
LEFT JOIN tags AS t ON e.id = t.excerpt_id
GROUP BY e.id, e.title, e.category, e.subcategory, e.insight, e.excerpt, e.tokens
ORDER BY e.id ASC;`;

    let db_query = getDbInstance();
    const result: QueryResult[] = await db_query.any(query, filing_id);
    console.log("result length", result.length);
    // Send the results as JSON
    return NextResponse.json(result);
    // res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        message: "An error occurred while fetching data",
      },
      { status: 500 }
    );
  }
}
