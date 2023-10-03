import logging
import argparse
import asyncio
import json
import time
import aiohttp
import composable.cmn
from types import SimpleNamespace
from composable.services import filings

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
        log.info(f"DATA: {filings.keys()}")
        primaryDocDescriptions = filings["primaryDocDescription"]
        accessionNumbers = filings["accessionNumber"]
        primaryDocuments = filings["primaryDocument"]
        filingDates = filings["filingDate"]
        reportDates = filings["reportDate"]

        for index, description in enumerate(primaryDocDescriptions):
            if description.upper() in ["10-Q", "10-K"]:
                item = SimpleNamespace()
                accession_number = accessionNumbers[index].replace("-", "")
                primaryDocument = primaryDocuments[index]
                item.filingDate = filingDates[index]
                item.reportDate = reportDates[index]
                item.filingType = description
                item.url = f"https://www.sec.gov/Archives/edgar/data/{cik_str}/{accession_number}/{primaryDocument}"
                filing_urls.append(item)
        return filing_urls


async def process(args):
    log.info("process..")
    data = {
        "cik": {"cik_str": "0001318605", "title": "Tesla, Inc.", "ticker": "TSLA"},
        "filing": {
            "filingDate": "2023-07-24",
            "reportDate": "2023-06-30",
            "filingType": "10-Q",
            "url": "https://www.sec.gov/Archives/edgar/data/0001318605/000095017023033872/tsla-20230630.htm",
        },
    }

    await filings.save_company_from_cik_data(data["cik"])

    filing_data = {}
    filing_data["cik"] = int(data["cik"]["cik_str"])
    filing_data["ticker"] = data["cik"]["ticker"]
    filing_data["filing_type"] = data["filing"]["filingType"]
    filing_data["filed_at"] = data["filing"]["filingDate"]
    filing_data["reporting_for"] = data["filing"]["reportDate"]
    filing_data["url"] = data["filing"]["url"]

    await filings.save_filing(filing_data)


async def test1(args):
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
        for item in filings:
            print(f"Filing Type: {item}")
    else:
        print(f"No data found for ticker: {args.ticker.upper()}")

    end_time = time.time()
    print(f"Execution time: {end_time - start_time:.2f} seconds")


async def main(args):
    log.info(f"Hello there! {args}")
    await process(args)


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
