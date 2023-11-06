import { NextResponse, NextRequest } from "next/server";
import getURL from "@/lib/getURL";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathName = url.pathname.split("/");

  console.log(`pathName: ${pathName}`);
  const cacheKey = pathName.slice(3).join("-");
  const cachePath = `/tmp/${cacheKey}.png`;

  // Check if the file exists and is less than 24 hours old
  if (fs.existsSync(cachePath)) {
    const stats = fs.statSync(cachePath);
    const mtime = new Date(stats.mtime);
    const now = new Date();
    if (now.getTime() - mtime.getTime() < 86400000) {
      // 86400000 milliseconds in 24 hours
      console.log("returning cached image");
      const screenshotBuffer = fs.readFileSync(cachePath);
      return new NextResponse(screenshotBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, s-maxage=86400", // 24 hours
        },
      });
    }
  }

  // If the file doesn't exist or is outdated, create a new one
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1200,
    height: 600,
    deviceScaleFactor: 1,
  });

  const afterSocialImage = pathName.slice(3).join("/");
  const pageURL = getURL(`/${afterSocialImage}`);
  await page.goto(pageURL, { waitUntil: "networkidle2" });

  console.log("waiting 3 seconds");
  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log("done waiting 3 seconds");

  const screenshotBuffer = await page.screenshot();
  await browser.close();

  // Write the screenshot to the cache path
  fs.writeFileSync(cachePath, screenshotBuffer);

  return new NextResponse(screenshotBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=86400", // 24 hours
    },
  });
}
