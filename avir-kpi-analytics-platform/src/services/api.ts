/**
 * Core API Client for Avir KPI Analytics Platform
 * Ensures all responses are JSON and provides detailed diagnostics on failure.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(
        `Expected JSON from [${url}], but received [${contentType || 'unknown'}]. ` +
        `Status [${response.status}]. Response preview: [${text.substring(0, 300)}...]. ` +
        `This usually means a server-side crash or a routing error.`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `API Error: ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    console.error(`[API Client Error] ${endpoint}:`, error);
    throw error;
  }
}
