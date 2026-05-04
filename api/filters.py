from http.server import BaseHTTPRequestHandler
import json
import datetime
from supabase_helper import get_supabase

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            supabase = get_supabase()
            
            # Fetch real dimensions from Supabase
            batches = supabase.table("upload_batches").select("id, filename, uploaded_at").order("uploaded_at", desc=True).execute()
            facilities = supabase.table("facilities").select("id, facility_name").execute()
            regions = supabase.table("regions").select("id, region_name").execute()
            acq_groups = supabase.table("acquisition_groups").select("id, acquisition_group_name").execute()
            pay_periods = supabase.table("pay_periods").select("id, pay_period_date").order("pay_period_date", desc=True).execute()

            payload = {
                "ok": True,
                "uploadBatches": batches.data or [],
                "payPeriods": pay_periods.data or [],
                "payCycles": ["Cycle A", "Cycle B"],
                "acquisitionGroups": acq_groups.data or [],
                "regions": regions.data or [],
                "facilities": facilities.data or [],
                "departments": [],
                "positions": [],
                "employees": [],
                "bonusTypes": [],
                "riskCategories": ["Low", "Medium", "High", "Critical"],
                "comparableStatuses": ["Comparable", "Non-Comparable"],
                "source": "database",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }

        except Exception as e:
            # Fallback to empty if DB fails
            payload = {
                "ok": True,
                "uploadBatches": [],
                "payPeriods": [],
                "source": "fallback_empty",
                "warning": str(e),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }

        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
