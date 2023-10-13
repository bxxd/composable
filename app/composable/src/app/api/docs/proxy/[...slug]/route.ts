// pages/api/edgar.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "https://api.kittie.ai";

// Define a function for handling GET requests
export async function GET(req: Request, res: Response) {
  try {
    const url = new URL(req.url);
    let slug = url.pathname.replace("/api/docs/proxy/", "/api/");
    const apiUrl = `${FASTAPI_URL}${slug}`;

    console.log("GET req", req, "apiUrl", apiUrl);

    const response = await fetch(apiUrl);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying GET request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Define a function for handling POST requests
export async function POST(req: Request) {
  const body = await req.json();

  try {
    const url = new URL(req.url);
    let slug = url.pathname.replace("/api/docs/proxy/", "/api/");
    const apiUrl = `${FASTAPI_URL}${slug}`;

    console.log("POST req", req, "apiUrl", apiUrl);
    console.log("POST body", body);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add other headers if necessary
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying POST request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
