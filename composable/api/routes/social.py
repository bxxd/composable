from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.responses import FileResponse
from pyppeteer import launch
import aiofiles
import os
from datetime import datetime, timedelta
import asyncio

import logging

log = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{path:path}")
async def get_screenshot(path: str, cache: bool = True):
    cache_key = path.replace("/", "-")
    cache_path = f"/tmp/{cache_key}.png"

    # Check if the file exists and is less than 24 hours old
    if cache and os.path.exists(cache_path):
        mtime = datetime.fromtimestamp(os.path.getmtime(cache_path))
        if datetime.now() - mtime < timedelta(days=1):
            # The file is fresh and should be served from cache
            return FileResponse(
                cache_path,
                media_type="image/png",
                headers={
                    "Cache-Control": "public, s-maxage=86400",  # 24 hours
                },
            )

    log.info("creating screenshot")
    # If the file doesn't exist or is outdated, create a new one
    browser = await launch(
        headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"], dumpio=True
    )  # dumpio=True enables verbose logging
    log.info("browser launched")
    try:
        pages = (
            await browser.pages()
        )  # Get all open pages, which should include the initial blank page
        page = (
            pages[0] if pages else await browser.newPage()
        )  # Use the initial page if available

        await page.setViewport({"width": 1200, "height": 600})
        page = await browser.newPage()
        log.info("new page created")
        await page.setViewport({"width": 1200, "height": 600})
        log.info("viewport set")

        # Replace `getURL` with the actual logic you have to construct the URL
        domain = "https://composable.parts"
        # domain = "http://localhost:3000"
        page_url = f"{domain}/{path}"
        log.info(f"page_url: {page_url}")

        await page.goto(
            page_url, {"waitUntil": "networkidle0"}
        )  # Wait for page to load

        # Wait for 3 seconds
        log.info("waiting for 3 seconds")
        await asyncio.sleep(3)
        log.info("done waiting")

        # Take the screenshot
        await page.screenshot({"path": cache_path})
        log.info("screenshot taken")
        await browser.close()

        # Return the screenshot as a response
        log.info("returning screenshot")
        return FileResponse(
            cache_path,
            media_type="image/png",
            headers={
                "Cache-Control": "public, s-maxage=86400",  # 24 hours
            },
        )

    except Exception as e:
        log.error(f"An error occurred: {e}")
        await browser.close()
        raise HTTPException(status_code=500, detail=str(e))
