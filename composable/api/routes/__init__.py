from fastapi import APIRouter
from composable.api.routes.edgar import router as edgar_router

router = APIRouter()

router.include_router(edgar_router, prefix="/edgar", tags=["edgar"])


@router.get("/")
async def root():
    return "Hello World"
