const API_BASE_URL = (process.env.NEXT_PUBLIC_AGENTZY_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "headers"> & { accessToken: string; headers?: HeadersInit };

export async function apiRequest<T>(path: string, options: ApiOptions): Promise<T> {
  if (!API_BASE_URL) throw new ApiError("API belum dikonfigurasi. Hubungi administrator.", 503, "API_NOT_CONFIGURED");
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${options.accessToken}`);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE_URL}/api/v1${path.startsWith("/") ? path : `/${path}`}`,
    { ...options, headers, cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.error?.message ?? payload?.detail ?? "Permintaan ke Agentzy API gagal.",
      response.status, payload?.error?.code);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type AgentzyMembership = { id: string; tenant_id: string; tenant_name: string;
  organization_id: string | null; role_keys: string[]; status: string };
export type AgentzyIdentity = { user_id: string; email: string | null; display_name: string | null;
  memberships: AgentzyMembership[] };
export type AgentzyTenant = { id: string; name: string; slug: string; status: string; membership_status: string };

export const getMyIdentity = (accessToken: string) =>
  apiRequest<AgentzyIdentity>("/me", { method: "GET", accessToken });
export const getMyTenants = (accessToken: string) =>
  apiRequest<AgentzyTenant[]>("/tenants", { method: "GET", accessToken });
