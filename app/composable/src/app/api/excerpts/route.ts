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

// export const runtime = "edge";

export async function GET(req: Request) {
  try {
    console.log("hi there");
    // Query the database
    const query =
      "select title, tokens from excerpts order by id asc limit 10;";
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
