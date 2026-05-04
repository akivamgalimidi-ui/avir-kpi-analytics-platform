from http.server import BaseHTTPRequestHandler
import json
import datetime
import traceback
import io
import openpyxl
import os
from supabase_helper import get_supabase, get_or_create_org

def json_response(handler, payload, status=200):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_length) if content_length > 0 else b""
            
            if not raw:
                return json_response(self, {"ok": False, "error": "Empty file body"}, status=400)

            # 1. Load Workbook
            wb = openpyxl.load_workbook(io.BytesIO(raw), data_only=True)
            sheet_names = wb.sheetnames
            
            # 2. Basic Metadata Extraction
            summary = {
                "filename": self.headers.get("x-filename", "uploaded_file.xlsx"),
                "fileSize": len(raw),
                "sheetsDetected": sheet_names,
                "sheetRowCounts": {},
                "payPeriodsDetected": [],
                "facilitiesDetected": [],
                "regionsDetected": [],
                "acquisitionGroupsDetected": [],
                "warnings": [],
                "errors": []
            }

            for sn in sheet_names:
                summary["sheetRowCounts"][sn] = wb[sn].max_row

            # 3. Persistence Foundation
            batch_id = None
            db_status = "Skipped (No Config)"
            try:
                supabase = get_supabase()
                org_id = get_or_create_org(supabase)
                
                # Create Upload Batch
                batch_res = supabase.table("upload_batches").insert({
                    "organization_id": org_id,
                    "filename": summary["filename"],
                    "status": "processing",
                    "rows_parsed": sum(summary["sheetRowCounts"].values())
                }).execute()
                
                if batch_res.data:
                    batch_id = batch_res.data[0]["id"]
                    db_status = "Saved to Supabase"
            except Exception as db_err:
                summary["warnings"].append(f"Database save failed: {str(db_err)}")
                db_status = "Error: " + str(db_err)

            # 4. Dimension Extraction (Minimal for Foundation)
            # We look at 'Analysis by Region' to find regions
            if "Analysis by Region" in sheet_names:
                sheet = wb["Analysis by Region"]
                # Rough logic: Facilities are usually in Column A starting from row 2-5
                for row in range(5, min(sheet.max_row, 50)):
                    val = sheet.cell(row=row, column=1).value
                    if val and isinstance(val, str) and "Total" not in val:
                        summary["facilitiesDetected"].append(val)
                summary["facilitiesDetected"] = list(set(summary["facilitiesDetected"]))

            # 5. Final Response
            json_response(self, {
                "ok": True,
                "uploadBatchId": batch_id,
                "filename": summary["filename"],
                "fileSize": summary["fileSize"],
                "sheetsDetected": summary["sheetsDetected"],
                "sheetRowCounts": summary["sheetRowCounts"],
                "facilitiesDetected": summary["facilitiesDetected"],
                "parserStatus": "workbook_ingested_and_logged",
                "databaseStatus": db_status,
                "warnings": summary["warnings"]
            })

        except Exception as exc:
            json_response(self, {
                "ok": False,
                "error": "Excel parsing failed",
                "details": str(exc),
                "traceback": traceback.format_exc()
            }, status=500)
