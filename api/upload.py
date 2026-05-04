from http.server import BaseHTTPRequestHandler
import json
import datetime
import traceback

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
            content_type = self.headers.get("Content-Type", "")
            
            # Read the raw body
            raw = self.rfile.read(content_length) if content_length > 0 else b""

            json_response(self, {
                "ok": True,
                "message": "Upload endpoint is reachable and returning JSON.",
                "contentType": content_type,
                "receivedBytes": len(raw),
                "parserStatus": "upload_route_stable_no_parse_yet",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            })

        except Exception as exc:
            json_response(self, {
                "ok": False,
                "error": "Upload endpoint failed",
                "details": str(exc),
                "traceback": traceback.format_exc()
            }, status=500)
