from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.responses import FileResponse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
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

    # Set up Selenium WebDriver
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument(
        f"user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36"
    )

    # Initialize the WebDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    try:
        # Set the browser window size
        driver.set_window_size(1200, 630)
        log.info("browser window size set")

        # Construct the URL and navigate to the page
        domain = "https://composable.parts"
        page_url = f"{domain}/{path}"
        driver.get(page_url)
        log.info(f"Page URL loaded: {page_url}")

        # Wait for 3 seconds to ensure all scripts are executed
        await asyncio.sleep(3)
        log.info("done waiting")

        # Take the screenshot
        driver.save_screenshot(cache_path)
        log.info("screenshot taken")

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
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        driver.quit()  # Close the browser
