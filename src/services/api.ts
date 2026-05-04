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
  health: () => apiRequest("/api/health"),
  filters: () => apiRequest("/api/filters"),
  uploadPayroll: (file: File) => {
    // Step 8: Send as raw binary body as requested
    return apiRequest("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "x-filename": encodeURIComponent(file.name),
      },
      body: file,
    });
  },
};
