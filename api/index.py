from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import datetime
import traceback

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

def json_error(message: str, status_code: int = 500, details: str = ""):
    return JSONResponse(
        status_code=status_code,
        content={
            "ok": False,
            "error": message,
            "details": details,
            "timestamp": utc_now(),
        },
        media_type="application/json",
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
    return {
        "ok": True,
        "service": "Avir KPI Analytics Backend",
        "database": "not_configured",
        "supabaseConfigured": False,
        "timestamp": utc_now(),
    }

@app.get("/api/filters")
async def filters():
    return {
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
    }

@app.post("/api/upload")
@app.post("/api/uploads")
async def upload(request: Request, file: UploadFile = File(None)):
    try:
        filename = None
        size = 0

        if file is not None:
            filename = file.filename
            raw = await file.read()
            size = len(raw)
        else:
            try:
                body = await request.json()
                filename = body.get("filename", "unknown")
                size = len(str(body))
            except Exception:
                filename = "unknown"
                size = 0

        return {
            "ok": True,
            "message": "Upload API route is working and returning JSON.",
            "filename": filename,
            "size": size,
            "parserStatus": "upload_received_basic_parser_pending",
            "dashboard_data": {
                "status": "uploaded",
                "summary": {
                    "total_ot": 0,
                    "total_bonus": 0,
                    "facilities": 0,
                },
                "labor_pressure": [],
            },
            "warnings": [
                "Basic upload endpoint is stable. Detailed Excel parsing and Supabase persistence should be implemented next."
            ],
            "errors": [],
            "timestamp": utc_now(),
        }

    except Exception as exc:
        return json_error("Upload failed", 500, f"{str(exc)}\n{traceback.format_exc()}")

@app.get("/api/dashboard/executive")
async def dashboard_executive():
    return {
        "ok": True,
        "empty": True,
        "message": "No parsed payroll data loaded yet.",
        "data": {
            "kpis": [],
            "charts": [],
            "tables": [],
        },
    }

@app.post("/api/export/full-workbook")
async def export_full_workbook():
    return {
        "ok": False,
        "error": "Export engine not fully implemented yet",
        "details": "Route exists and returns JSON. Build workbook generation after upload/parser foundation is stable.",
    }
