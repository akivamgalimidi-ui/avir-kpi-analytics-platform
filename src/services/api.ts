export async function apiRequest(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON from ${path} but received ${contentType || "unknown"}; Status ${res.status}. Response preview: ${text.slice(0, 300)}`
    );
  }

  const data = await res.json();

  if (!res.ok || data.ok === false) {
    throw new Error(data.error || data.details || `Request failed: ${path}`);
  }

  return data;
}

export const api = {
  ping: () => apiRequest("/api/ping"),
  health: () => apiRequest("/api/health"),
  filters: () => apiRequest("/api/filters"),
  uploadPayroll: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest("/api/upload", {
      method: "POST",
      body: formData,
    });
  },
  dashboardExecutive: () => apiRequest("/api/dashboard/executive"),
  exportFullWorkbook: () => apiRequest("/api/export/full-workbook", { method: "POST" }),
};
