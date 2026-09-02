import { clearAuthSession, getAuthHeaders } from "./session";
import Swal from "sweetalert2";

/**
 * API Client Core
 * 
 * Tanggung jawab: Wrapper dasar untuk fetch API dengan penanganan error global.
 * Semua request menggunakan relative path (/api/...) agar melewati Vite proxy.
 */

function resolveBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL || "";
  return url.replace(/\/$/, "");
}

const BASE_URL = resolveBaseUrl();

function getAdminHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("admin_session_token");
  return token ? { "X-Admin-Authorization": token } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = {};
  
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error(`[API] Failed to parse JSON response:`, text);
    if (!res.ok) {
      throw new Error(`Server error (${res.status}): ${text.substring(0, 100)}`);
    }
  }
  
  if (!res.ok) {
    if (res.status === 401) {
      clearAuthSession();
    }

    // Demo mode — tampilkan Swal dan lempar error silent
    if (data?.error === "demo_mode_disabled") {
      const label = data?.message || "Fitur ini dinonaktifkan dalam mode demo.";
      Swal.fire({
        icon: "info",
        title: "Mode Demo",
        text: label,
        confirmButtonText: "Mengerti",
        confirmButtonColor: "#f97316",
      });
      throw new Error("demo_mode_disabled");
    }

    const msg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(", ") : "Server error");
    throw new Error(msg as string);
  }
  
  return data as T;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  if (path.includes("NaN")) {
    console.warn(`[API] Warning: Path contains NaN: ${path}`);
  }
  console.log(`[API] GET ${path}`);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { ...getAuthHeaders(), ...getAdminHeaders() },
      credentials: "include",
    });
    return handleResponse<T>(res);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      console.warn(`[API] Network error connecting to ${BASE_URL}${path} - backend might not be running`);
      // Return empty data for local development when backend is down
      return {} as T;
    }
    throw err;
  }
}

export function getFullApiUrl(path: string): string {
  // Kembalikan URL absolut untuk kebutuhan eksternal (misalnya share link)
  const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function apiPost<T = any>(path: string, body: Record<string, any>): Promise<T> {
  if (path.includes("NaN") || JSON.stringify(body).includes("NaN")) {
    console.warn(`[API] Warning: Path or Body contains NaN: ${path}`, body);
  }
  console.log(`[API] POST ${path}`, body);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...getAdminHeaders(),
      },
      body: JSON.stringify(body),
      credentials: "include",
    });
    return handleResponse<T>(res);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      console.warn(`[API] Network error connecting to ${BASE_URL}${path} - backend might not be running`);
      return {} as T;
    }
    throw err;
  }
}

export async function apiPut<T = any>(path: string, body: Record<string, any>): Promise<T> {
  console.log(`[API] PUT ${path}`, body);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...getAdminHeaders(),
      },
      body: JSON.stringify(body),
      credentials: "include",
    });
    return handleResponse<T>(res);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      console.warn(`[API] Network error connecting to ${BASE_URL}${path} - backend might not be running`);
      return {} as T;
    }
    throw err;
  }
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  console.log(`[API] DELETE ${path}`);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders(), ...getAdminHeaders() },
      credentials: "include",
    });
    return handleResponse<T>(res);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      console.warn(`[API] Network error connecting to ${BASE_URL}${path} - backend might not be running`);
      return {} as T;
    }
    throw err;
  }
}

export async function apiPostForm<T = any>(path: string, formData: FormData): Promise<T> {
  console.log(`[API] POST Form ${path}`);
  try {
    const headers = { ...getAuthHeaders(), ...getAdminHeaders() };
    // Remove Content-Type header to let browser set it automatically with boundary
    delete headers['Content-Type'];
    
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });
    return handleResponse<T>(res);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      console.warn(`[API] Network error connecting to ${BASE_URL}${path} - backend might not be running`);
      return {} as T;
    }
    throw err;
  }
}
