from http.server import BaseHTTPRequestHandler
import json
import datetime
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        payload = {
            "ok": True,
            "service": "Avir KPI Analytics Backend",
            "database": "not_tested",
            "supabaseUrlConfigured": bool(os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")),
            "supabaseServiceRoleConfigured": bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }

        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
