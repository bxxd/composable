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
from composable.services import filings
from fastapi import BackgroundTasks


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
async def upload_edgar(document: EdgarDocument, background_tasks: BackgroundTasks):
    data = document.dict()

    company = await filings.save_company_from_cik_data(data["cik"])

    filing_data = {}
    filing_data["cik"] = int(data["cik"]["cik_str"])
    filing_data["ticker"] = data["cik"]["ticker"]

    filing_data["filing_type"] = data["filing"]["filingType"]
    filing_data["filed_at"] = data["filing"]["filingDate"]
    filing_data["reporting_for"] = data["filing"]["reportDate"]
    filing_data["url"] = data["filing"]["url"]

    filing = await filings.save_filing(filing_data)

    background_tasks.add_task(filings.save_excerpts, company, filing)

    return {"parsed_content": "test"}
