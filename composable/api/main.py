from fastapi import FastAPI
import logging
from composable.api.routes import router


log = logging.getLogger(__name__)

app = FastAPI()

app.include_router(router)
