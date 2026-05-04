import os
from supabase import create_client, Client

def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("Supabase configuration missing (URL or Key)")
        
    return create_client(url, key)

def get_or_create_org(supabase: Client, name: str = "Default Organization"):
    res = supabase.table("organizations").select("id").eq("name", name).execute()
    if res.data:
        return res.data[0]["id"]
    
    res = supabase.table("organizations").insert({"name": name}).execute()
    return res.data[0]["id"]
