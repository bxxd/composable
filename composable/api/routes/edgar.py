from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from composable.services.edgar import (
    get_cik_data_for_ticker,
    get_filings,
    fetch_document,
)
from composable.cmn.utils import namespace_to_dict
from pydantic import BaseModel, HttpUrl
import aiohttp

import logging

log = logging.getLogger(__name__)

router = APIRouter()


class CIKResponse(BaseModel):
    cik_str: str
    title: str
    ticker: str


class FilingsItem(BaseModel):
    filingDate: str
    reportDate: str
    filingType: str
    url: str


class EdgarResponse(BaseModel):
    cik: CIKResponse
    filings: List[FilingsItem]


class EdgarDocument(BaseModel):
    cik: CIKResponse
    filing: FilingsItem


@router.get("/cik/{ticker}", response_model=CIKResponse)
async def get_cik(ticker: str):
    try:
        cik_data = await get_cik_data_for_ticker(ticker.upper())
        if not cik_data:
            raise HTTPException(status_code=404, detail="Ticker not found")
        return namespace_to_dict(cik_data)
    except Exception as e:
        log.error(f"Error while fetching CIK for {ticker}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/filings/{ticker}", response_model=EdgarResponse)
async def get_ticker_filings(
    ticker: str,
    year: Optional[int] = None,
    quarter: Optional[int] = None,
    filing_type: Optional[str] = None,
    annual: Optional[bool] = False,
):
    try:
        cik_data = await get_cik_data_for_ticker(ticker.upper())
        if not cik_data:
            raise HTTPException(status_code=404, detail="Ticker not found")
        filings = await get_filings(
            cik_data.cik_str, year, quarter, filing_type, annual
        )
        filings = [namespace_to_dict(item) for item in filings]

        return {"cik": namespace_to_dict(cik_data), "filings": filings}
    except Exception as e:
        log.error(f"Error while fetching filings for {ticker}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/upload")
async def upload_edgar(document: EdgarDocument):
    # Fetch and parse the EDGAR document
    content = await fetch_document(document.filing.url)

    log.info(f"Content: {content[:700]}...")

    return {"parsed_content": "test"}


x = {
    "cik": {"cik_str": "0001318605", "title": "Tesla, Inc.", "ticker": "TSLA"},
    "filing": {
        "filingDate": "2023-07-24",
        "reportDate": "2023-06-30",
        "filingType": "10-Q",
        "url": "https://www.sec.gov/Archives/edgar/data/0001318605/000095017023033872/tsla-20230630.htm",
    },
}
