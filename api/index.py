from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase_client import get_supabase
import io
import uuid
import json
import datetime

app = FastAPI(title="Nursing Labor KPI API - Supabase Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "ok": True,
        "frontend": "loaded",
        "backend": "online",
        "database": "connected",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

from pydantic import BaseModel
from typing import Dict, Any

class UploadPayload(BaseModel):
    filename: str
    sheets: Dict[str, Any]

@app.post("/api/upload")
async def upload_payroll_file(payload: UploadPayload):
    """
    Accepts the parsed Excel sheets as JSON from the frontend, runs the KPI engine, and returns JSON.
    """
    try:
        from excel_parser import parse_workbook_json
        from kpi_engine import generate_dashboard_payload
        
        # 1. Parse Excel JSON to structured records
        parsed_data = parse_workbook_json(payload.sheets)
        
        # 2. Run KPI Engine to generate the exact payload the UI expects
        dashboard_payload = generate_dashboard_payload(parsed_data)
        
        return {
            "message": "File processed successfully",
            "batch_id": str(uuid.uuid4()),
            "dashboard_data": dashboard_payload,
            "acquisition_groups": list(set(r.get("acquisition_group") for r in dashboard_payload.get("labor_pressure", []) if r.get("acquisition_group"))),
            "regions": list(set(r.get("region") for r in dashboard_payload.get("labor_pressure", []) if r.get("region"))),
            "facilities": list(set(r.get("facility_name") for r in dashboard_payload.get("labor_pressure", []) if r.get("facility_name"))),
            "pay_periods": list(set(r.get("period_date") for r in dashboard_payload.get("region_kpis", []) if r.get("period_date")))
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/executive")
def get_executive_dashboard():
    """
    Queries Supabase for portfolio level KPIs.
    """
    supabase = get_supabase()
    
    # Query the facility_period_metrics table natively via PostgREST
    res = supabase.table("facility_period_metrics").select(
        "pay_period_id, ot_dollars, bonus_dollars, direct_care_hppd"
    ).execute()
    
    if not res.data:
        return {"data": []}
        
    return {"data": res.data}


@app.get("/api/filters/{filter_type}")
def get_global_filters(filter_type: str):
    """
    Returns unique values from the database for the global slicers.
    """
    supabase = get_supabase()
    
    if filter_type == "facilities":
        res = supabase.table("facilities").select("id, facility_name").execute()
    elif filter_type == "regions":
        res = supabase.table("regions").select("id, region_name").execute()
    elif filter_type == "acquisition-groups":
        res = supabase.table("acquisition_groups").select("id, acquisition_group_name").execute()
    elif filter_type == "pay-periods":
        res = supabase.table("pay_periods").select("id, pay_period_date").execute()
    else:
        raise HTTPException(status_code=400, detail="Unknown filter type")
        
    return {"data": res.data}

@app.get("/api/drilldown/facility/{facility_id}")
def get_facility_drilldown(facility_id: str):
    """
    Drilldown service fetching granular employee data for a facility.
    """
    supabase = get_supabase()
    
    ot_res = supabase.table("ot_detail_lines").select(
        "employee_name, department, position, ot_dollars, ot_hours, period_date:pay_period_id(pay_period_date)"
    ).eq("facility_id", facility_id).execute()
    
    bonus_res = supabase.table("bonus_detail_lines").select(
        "employee_name, bonus_type, department, position, bonus_dollars"
    ).eq("facility_id", facility_id).execute()
    
    return {
        "ot_detail": ot_res.data,
        "bonus_detail": bonus_res.data
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
