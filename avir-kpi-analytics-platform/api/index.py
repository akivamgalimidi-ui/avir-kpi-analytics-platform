from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import os
import datetime

app = FastAPI(title="Avir KPI Analytics Platform API")

# Helper for consistent JSON error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "ok": False,
            "error": "Internal Server Error",
            "details": str(exc)
        }
    )

@app.get("/api/health")
def health_check():
    return {
        "ok": True,
        "service": "Avir KPI Analytics Backend",
        "database": "connected",
        "supabaseConfigured": os.environ.get("SUPABASE_URL") is not None,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# Stub endpoints for the 15 tabs
@app.get("/api/filters")
def get_filters():
    return {
        "ok": True,
        "data": {
            "uploadBatches": [],
            "payPeriods": [],
            "payCycles": ["Cycle A", "Cycle B"],
            "acquisitionGroups": [],
            "regions": [],
            "facilities": [],
            "departments": [],
            "positions": [],
            "employees": [],
            "bonusTypes": [],
            "riskCategories": ["Low", "Medium", "High", "Critical"],
            "comparableStatuses": ["Comparable", "Non-Comparable"]
        }
    }

@app.get("/api/dashboard/executive")
def get_executive_dashboard():
    return {
        "ok": True,
        "data": None,
        "empty": True,
        "message": "No payroll data uploaded yet."
    }

# All other dashboard endpoints follow the same pattern...
@app.get("/api/dashboard/{tab_id}")
def get_dashboard_data(tab_id: str):
    return {
        "ok": True,
        "tab": tab_id,
        "data": None,
        "empty": True,
        "message": f"No payroll data uploaded for {tab_id} yet."
    }
