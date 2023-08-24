import { NextResponse } from "next/server";
import { Pool } from "pg";

// Connection configuration
const pool = new Pool({
  host: "localhost",
  database: "edgar",
  port: 5432,
  user: "composable",
  password: "composable4m3",
});

export async function GET(req: Request) {
  try {
    console.log("hi there");
    // Query the database
    // const query =
    //   "select title, category, subcategory, insight, excerpt, tokens from excerpts order by id asc limit 10;";

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
    ORDER BY id ASC
    LIMIT 100
) AS e
LEFT JOIN tags AS t ON e.id = t.excerpt_id
GROUP BY e.id, e.title, e.category, e.subcategory, e.insight, e.excerpt, e.tokens
ORDER BY e.id ASC;`;

    const result = await pool.query(query);
    console.log("result", result.rows);
    // Send the results as JSON
    return NextResponse.json(result.rows);
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
