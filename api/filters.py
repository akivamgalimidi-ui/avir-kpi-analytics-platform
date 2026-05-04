from http.server import BaseHTTPRequestHandler
import json
import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        payload = {
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
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }

        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
