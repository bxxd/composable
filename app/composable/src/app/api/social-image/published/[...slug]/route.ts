import { NextResponse, NextRequest } from "next/server";
import getURL from "@/lib/getURL";
import puppeteer from "puppeteer";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathName = url.pathname.split("/");
  const id = pathName[4];

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setViewport({
    width: 1200,
    height: 600,
    deviceScaleFactor: 1,
  });

  const pageURL = getURL(`/published/${id}`);
  console.log(`pageURL: ${pageURL}`);
  await page.goto(pageURL, { waitUntil: "networkidle2" });

  const screenshotBuffer = await page.screenshot();

  await browser.close();

  return new NextResponse(screenshotBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=86400", // 24 hours
      "CDN-Cache-Control": "public, s-maxage=86400", // 24 hours
      "Vercel-CDN-Cache-Control": "public, s-maxage=86400", // 24 hours
    },
  });
}
