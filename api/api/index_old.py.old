from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import datetime
import traceback
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def utc_now():
    return datetime.datetime.utcnow().isoformat() + "Z"

def json_response(payload, status_code=200):
    return JSONResponse(
        status_code=status_code,
        content=payload,
        media_type="application/json",
    )

def json_error(message: str, status_code: int = 500, details: str = ""):
    return json_response(
        {
            "ok": False,
            "error": message,
            "details": details,
            "timestamp": utc_now(),
        },
        status_code=status_code,
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return json_error(
        "Unhandled server error",
        500,
        f"{str(exc)}\n{traceback.format_exc()}",
    )

@app.get("/api/health")
async def health():
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    return json_response({
        "ok": True,
        "service": "Avir KPI Analytics Backend",
        "database": "not_tested",
        "supabaseUrlConfigured": bool(supabase_url),
        "supabaseServiceRoleConfigured": bool(service_key),
        "timestamp": utc_now(),
    })

@app.get("/api/filters")
async def filters():
    return json_response({
        "ok": True,
        "uploadBatches": [],
        "payPeriods": [],
        "payCycles": [],
        "acquisitionGroups": [],
        "regions": [],
        "facilities": [],
        "departments": [],
        "positions": [],
        "employees": [],
        "bonusTypes": [],
        "riskCategories": [],
        "comparableStatuses": [],
        "message": "Filters endpoint is live. No parsed payroll data loaded yet.",
        "timestamp": utc_now(),
    })

@app.post("/api/upload")
@app.post("/api/uploads")
async def upload(request: Request, file: UploadFile = File(None)):
    try:
        filename = "unknown"
        size = 0
        content_type = None

        if file is not None:
            filename = file.filename or "unknown"
            content_type = file.content_type
            raw = await file.read()
            size = len(raw)
        else:
            # Fallback for JSON test requests
            try:
                body = await request.json()
                filename = body.get("filename", "unknown")
                size = len(str(body).encode("utf-8"))
                content_type = "application/json"
            except Exception:
                return json_error(
                    "No file was received",
                    400,
                    "POST a multipart/form-data request with field name 'file'.",
                )

        return json_response({
            "ok": True,
            "message": "Upload API route is working and returning JSON.",
            "filename": filename,
            "size": size,
            "contentType": content_type,
            "parserStatus": "upload_received_basic_parser_pending",
            "dashboard_data": {
                "status": "uploaded",
                "summary": {
                    "total_ot": 0,
                    "total_bonus": 0,
                    "facilities": 0
                },
                "labor_pressure": []
            },
            "warnings": [
                "Basic upload route is stable. Detailed Excel parsing and Supabase persistence should be implemented next."
            ],
            "errors": [],
            "timestamp": utc_now(),
        })

    except Exception as exc:
        return json_error(
            "Upload failed",
            500,
            f"{str(exc)}\n{traceback.format_exc()}",
        )

@app.get("/api/dashboard/executive")
async def dashboard_executive():
    return json_response({
        "ok": True,
        "empty": True,
        "message": "No parsed payroll data loaded yet.",
        "data": {
            "kpis": [],
            "charts": [],
            "tables": []
        },
        "timestamp": utc_now(),
    })

@app.post("/api/export/full-workbook")
async def export_full_workbook():
    return json_response({
        "ok": False,
        "error": "Export engine not fully implemented yet",
        "details": "Route exists and returns JSON. Build workbook generation after upload/parser foundation is stable.",
        "timestamp": utc_now(),
    }, status_code=501)
