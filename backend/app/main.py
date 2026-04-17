from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import invoices, bundles, categories, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure upload directory exists
    import os
    from app.config import settings
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="Taiwan Invoice OCR API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(invoices.router, prefix=API_PREFIX)
app.include_router(bundles.router, prefix=API_PREFIX)
app.include_router(categories.router, prefix=API_PREFIX)
app.include_router(export.router, prefix=API_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}
