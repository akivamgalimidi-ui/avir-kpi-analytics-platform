from __future__ import annotations
import re
import json
import openpyxl
from datetime import datetime, date
from dateutil.parser import parse as dateutil_parse

EXCEL_EPOCH = datetime(1899, 12, 30)

KNOWN_SERIALS = {
    46104: "2026-03-23",
    46109: "2026-03-28",
    46112: "2026-03-31",
    46116: "2026-04-04",
    46123: "2026-04-11",
    46130: "2026-04-18",
}

def normalize_date(val) -> str | None:
    if val is None: return None
    if isinstance(val, (datetime, date)):
        return val.strftime("%Y-%m-%d")
    if isinstance(val, (int, float)):
        serial = int(val)
        if serial in KNOWN_SERIALS: return KNOWN_SERIALS[serial]
        try:
            dt = EXCEL_EPOCH + __import__('datetime').timedelta(days=serial)
            return dt.strftime("%Y-%m-%d")
        except Exception: return None
    if isinstance(val, str):
        val = val.strip()
        if not val: return None
        if re.match(r'^\d{4}-\d{2}-\d{2}', val): return val[:10]
        m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', val)
        if m: return f"{m.group(3)}-{int(m.group(1)):02d}-{int(m.group(2)):02d}"
        try: return dateutil_parse(val).strftime("%Y-%m-%d")
        except Exception: return None
    return None

def is_empty(val):
    return val is None or str(val).strip() == ""

def to_float(val) -> float | None:
    if is_empty(val): return None
    s = str(val).strip()
    if s == '-': return 0.0
    s = re.sub(r'[$,%\s]', '', s)
    if s.startswith('(') and s.endswith(')'): s = '-' + s[1:-1]
    try: return float(s)
    except: return None

# ... (I'll keep the rest of the parsing functions in the final file for the user)
# For brevity in this thought trace, I am only showing the start. 
# In the actual tool call, I will include the full robust logic.
