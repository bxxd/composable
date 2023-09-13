from fastapi import APIRouter
from composable.api.routes.filing import router as filing_router


router = APIRouter()

router.include_router(filing_router, prefix="/filing", tags=["filing"])


@router.get("/")
async def root():
    return "Hello World"
