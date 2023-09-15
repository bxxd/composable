import logging
import argparse
import asyncio
import json
import time
import aiohttp
import composable.cmn

log = logging.getLogger(__name__)

SEC_HEADERS = {
    "User-Agent": "composable.parts abuse@composable.parts",
    "Host": "data.sec.gov",
}


async def fetch(session, url):
    async with session.get(url, headers=SEC_HEADERS) as response:
        return await response.text()


async def get_filings(cik_str):
    cik_str = str(cik_str).zfill(10)
    async with aiohttp.ClientSession() as session:
        url = f"https://data.sec.gov/submissions/CIK{cik_str}.json"
        log.info(f"Fetching: {url}")
        resp_text = await fetch(session, url)
        try:
            data = json.loads(resp_text)
        except json.decoder.JSONDecodeError as e:
            log.error(f"Failed to parse JSON response: {e}")
            # log.info(f"Response: {resp_text}")
            return []
        filings = data["filings"]["recent"]
        filing_urls = []
        primaryDocDescriptions = filings["primaryDocDescription"]
        accessionNumbers = filings["accessionNumber"]
        primaryDocuments = filings["primaryDocument"]
        for index, description in enumerate(primaryDocDescriptions):
            if description.upper() in ["10-Q", "10-K"]:
                accession_number = accessionNumbers[index].replace("-", "")
                primaryDocument = primaryDocuments[index]
                url = f"https://www.sec.gov/Archives/edgar/data/{cik_str}/{accession_number}/{primaryDocument}"
                filing_urls.append((description, url))
        return filing_urls


async def main(args):
    log.info(f"Hello there! {args}")

    start_time = time.time()

    # Load and parse the JSON data
    try:
        with open("/home/breed/Downloads/company_tickers.json", "r") as file:
            data = json.load(file)
    except Exception as e:
        log.error(f"Failed to load JSON data: {e}")
        return

    # Convert data to a dictionary for easier lookup
    data_dict = {
        item["ticker"]: {"cik_str": item["cik_str"], "title": item["title"]}
        for item in data.values()
    }

    ticker_info = data_dict.get(args.ticker.upper())
    if ticker_info:
        cik_str = ticker_info["cik_str"]
        filings = await get_filings(cik_str)
        for filing_type, url in filings:
            print(f"Filing Type: {filing_type}\nURL: {url}")
    else:
        print(f"No data found for ticker: {args.ticker.upper()}")

    end_time = time.time()
    print(f"Execution time: {end_time - start_time:.2f} seconds")


def parse_args():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--ticker", "-t", required=True, help="The ticker to search for"
    )
    parser.add_argument("--debug", "-d", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(main(args))
