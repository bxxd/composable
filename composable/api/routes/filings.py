from fastapi import APIRouter, Request
from typing import Optional
import logging
import asyncio

log = logging.getLogger(__name__)


router = APIRouter()


@router.get("/")
async def root():
    return "Hello World"


# @router.post("/")
# async def
