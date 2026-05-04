from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import datetime
import traceback
import os
import uuid

# Import local modules if they exist
try:
    from .supabase_client import get_supabase
    from .excel_parser import parse_workbook_json
    from .kpi_engine import generate_dashboard_payload
except ImportError:
    try:
        from supabase_client import get_supabase
        from excel_parser import parse_workbook_json
        from kpi_engine import generate_dashboard_payload
    except ImportError:
        # Fallback placeholders if modules are missing during initial deployment
        def get_supabase(): return None
        def parse_workbook_json(s): return {"sheets": list(s.keys())}
        def generate_dashboard_payload(p): return {"labor_pressure": [], "summary": {"total_ot": 0, "total_bonus": 0, "facilities": 0}}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def json_error(message: str, status_code: int = 500, details: str = ""):
    return JSONResponse(
        status_code=status_code,
        content={
            "ok": False,
            "error": message,
            "details": details,
            "timestamp": datetime.datetime.utcnow().isoformat()
        },
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return json_error(
        "Unhandled server error",
        500,
        f"{str(exc)}\n{traceback.format_exc()}"
    )

@app.get("/api/health")
async def health():
    return {
        "ok": True,
        "service": "Avir KPI Analytics Backend",
        "database": "not_configured",
        "timestamp": datetime.datetime.utcnow().isoformat()
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
        "comparableStatuses": []
    }

@app.post("/api/upload")
@app.post("/api/uploads")
async def upload(file: UploadFile = File(None), request: Request = None):
    try:
        filename = "unknown.xlsx"
        sheets = {}

        if file is not None:
            filename = file.filename
            # Handle direct file upload if needed
            return {"ok": True, "message": "File received", "filename": filename}
        else:
            body = await request.json()
            filename = body.get("filename", "unknown.xlsx")
            sheets = body.get("sheets", {})

        # 1. Parse Excel JSON
        parsed_data = parse_workbook_json(sheets)
        
        # 2. Run KPI Engine
        dashboard_payload = generate_dashboard_payload(parsed_data)
        
        return {
            "ok": True,
            "message": "Upload successful",
            "filename": filename,
            "dashboard_data": dashboard_payload,
            "batch_id": str(uuid.uuid4())
        }

    except Exception as exc:
        traceback.print_exc()
        return json_error("Upload failed", 500, str(exc))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
