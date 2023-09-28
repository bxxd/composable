import logging
import argparse
import asyncio
import json
import time
import aiohttp
import os
import composable.cmn
from types import SimpleNamespace
from datetime import datetime, timedelta

log = logging.getLogger(__name__)

SEC_HEADERS = {
    "User-Agent": "composable.parts abuse@composable.parts",
    "Host": "data.sec.gov",
}


async def fetch(session, url, headers=SEC_HEADERS):
    async with session.get(url, headers=headers) as response:
        return await response.text()


async def get_filings(cik_str, year=None, quarter=None, filing_type=None, annual=False):
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
            if filing_type and description.upper() != filing_type.upper():
                continue

            if year and int(reportDates[index].split("-")[0]) != year:
                continue

            if quarter:
                month = int(reportDates[index].split("-")[1])
                if (
                    (quarter == 1 and month not in [1, 2, 3])
                    or (quarter == 2 and month not in [4, 5, 6])
                    or (quarter == 3 and month not in [7, 8, 9])
                    or (quarter == 4 and month not in [10, 11, 12])
                ):
                    continue

            if annual and description.upper() != "10-K":
                continue

            if description.upper() not in ["10-Q", "10-K"]:
                continue

            item = SimpleNamespace()
            accession_number = accessionNumbers[index].replace("-", "")
            primaryDocument = primaryDocuments[index]
            item.filingDate = filingDates[index]
            item.reportDate = reportDates[index]
            item.filingType = description
            item.url = f"https://www.sec.gov/Archives/edgar/data/{cik_str}/{accession_number}/{primaryDocument}"
            filing_urls.append(item)

        return filing_urls


def is_file_older_than_one_day(file_path: str) -> bool:
    """
    Checks if the file at the given path is older than one day.

    Parameters:
        file_path (str): The path to the file.

    Returns:
        bool: True if the file is older than one day, False otherwise.
    """
    if not os.path.exists(file_path):
        return True

    file_modification_time = datetime.fromtimestamp(os.path.getmtime(file_path))
    return datetime.now() - file_modification_time > timedelta(days=1)


async def get_cik_data_for_ticker(ticker: str) -> str:
    """
    Gets the CIK from a ticker using the local ticker-to-CIK mapping.

    Parameters:
        ticker (str): The stock ticker symbol.

    Returns:
        str: The CIK string if found, or None otherwise.
    """
    file_path = "/tmp/company_tickers.json"

    # Check if ticker file exists, if not download
    if not os.path.exists(file_path):
        # You can implement a function here that fetches and saves the ticker-to-CIK mapping
        await download_and_save_tickers_to_file(file_path)
    elif is_file_older_than_one_day(file_path):
        await download_and_save_tickers_to_file(file_path)

    try:
        with open(file_path, "r") as file:
            data = json.load(file)
    except Exception as e:
        log.error(f"Failed to load JSON data: {e}")
        return None

    # Return the CIK if the ticker exists in the dictionary
    item = data.get(ticker, {})
    return SimpleNamespace(**item)


async def download_and_save_tickers_to_file(file_path: str):
    log.info("downloading tickers..")
    url = "https://www.sec.gov/files/company_tickers.json"
    async with aiohttp.ClientSession() as session:
        content = await fetch(session, url, headers={})
        try:
            data = json.loads(content)
            data_dict = {}
            for item in data.values():
                cik_str = str(item["cik_str"]).zfill(10)
                data_dict[item["ticker"]] = {
                    "cik_str": cik_str,
                    "title": item["title"],
                    "ticker": item["ticker"],
                }
            with open(file_path, "w") as file:
                file.write(json.dumps(data_dict))
        except Exception as e:
            log.error("Failed to parse JSON response")
            raise Exception(f"Failed to parse JSON response e: {e}")


async def main(args):
    log.info(f"Hello there! {args}")
    cik = await get_cik_data_for_ticker(args.ticker.upper())
    log.info(f"got cik {cik} for ticker {args.ticker}")

    filings = await get_filings(cik.cik_str)
    log.info(f"got filings {filings}")


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
