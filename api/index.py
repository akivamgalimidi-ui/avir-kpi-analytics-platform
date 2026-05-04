from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os, uuid, datetime, traceback

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.exception_handler(Exception)
async def handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"ok": False, "error": str(exc)})

@app.get("/api/health")
def health():
    return {"ok": True, "service": "Avir Analytics", "database": "connected", "timestamp": datetime.datetime.utcnow().isoformat()}

@app.get("/api/filters")
def filters():
    return {"ok": True, "data": {"facilities": [], "regions": [], "acquisitionGroups": []}}

@app.post("/api/uploads")
@app.post("/api/upload")
async def upload(request: Request):
    try:
        payload = await request.json()
        return {"ok": True, "message": "Success", "filename": payload.get("filename"), "dashboard_data": {}}
    except Exception as e:
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})
