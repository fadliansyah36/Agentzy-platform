from contextlib import asynccontextmanager
from uuid import uuid4

import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as v1_router
from app.core.config import get_settings
from app.db.session import engine

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="Agentzy API",
    version="0.1.0",
    description="Unified Human & AI Workforce Platform API",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    expose_headers=["X-Request-ID", "X-Correlation-ID", "X-Trace-ID"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "X-Request-ID",
        "X-Correlation-ID",
        "X-Trace-ID",
    ],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    def normalized_id(header_name: str) -> str:
        value = request.headers.get(header_name, "").strip()
        return value if 8 <= len(value) <= 128 else str(uuid4())

    request_id = normalized_id("X-Request-ID")
    correlation_id = normalized_id("X-Correlation-ID")
    trace_id = normalized_id("X-Trace-ID")
    request.state.request_id = request_id
    request.state.correlation_id = correlation_id
    request.state.trace_id = trace_id
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        correlation_id=correlation_id,
        trace_id=trace_id,
        path=request.url.path,
    )
    try:
        response = await call_next(request)
        logger.info(
            "api_request_completed",
            method=request.method,
            status_code=response.status_code,
        )
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Trace-ID"] = trace_id
        return response
    finally:
        structlog.contextvars.clear_contextvars()


def _error_context(request: Request) -> dict:
    return {
        "request_id": getattr(request.state, "request_id", None),
        "correlation_id": getattr(request.state, "correlation_id", None),
        "trace_id": getattr(request.state, "trace_id", None),
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = "REQUEST_REJECTED" if exc.status_code < 500 else "API_ERROR"
    message = exc.detail if isinstance(exc.detail, str) else "Permintaan tidak dapat diproses."
    error = {"code": code, "message": message, **_error_context(request)}
    if not isinstance(exc.detail, str):
        error["details"] = jsonable_encoder(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Data permintaan tidak valid.",
                "details": jsonable_encoder(exc.errors()),
                **_error_context(request),
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    logger.exception("unhandled_api_error", error_type=type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                **_error_context(request),
            }
        },
    )


@app.get("/health", tags=["Operations"])
async def health():
    return {"status": "ok", "service": "agentzy-api", "version": app.version}


app.include_router(v1_router, prefix=settings.api_v1_prefix)
