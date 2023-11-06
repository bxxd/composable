from fastapi import APIRouter
from composable.api.routes.edgar import router as edgar_router
from composable.api.routes.social import router as social_router

router = APIRouter()

router.include_router(edgar_router, prefix="/api/edgar", tags=["edgar"])
router.include_router(social_router, prefix="/api/social-image", tags=["social"])


@router.get("/api")
async def root():
    return "Hello World"
