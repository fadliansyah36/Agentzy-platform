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
  const { accessToken, headers: inputHeaders, ...requestOptions } = options;
  const headers = new Headers(inputHeaders);
  headers.set("Authorization", `Bearer ${accessToken}`);
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
  organization_id: string | null; role_keys: string[]; permissions: string[]; status: string };
export type AgentzyIdentity = { user_id: string; email: string | null; display_name: string | null;
  memberships: AgentzyMembership[] };
export type AgentzyTenant = { id: string; name: string; slug: string; status: string; membership_status: string };

export const getMyIdentity = (accessToken: string) =>
  apiRequest<AgentzyIdentity>("/me", { method: "GET", accessToken });
export const getMyTenants = (accessToken: string) =>
  apiRequest<AgentzyTenant[]>("/tenants", { method: "GET", accessToken });


export type AgentzyRoleTemplate = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
};

export type AgentzyTenantMembership = {
  id: string;
  tenant_id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  status: string;
  joined_at: string | null;
  created_at: string;
  role_keys: string[];
};

export type CreateTenantInput = { name: string; slug: string; tenant_type: 'corporate' | 'provider' | 'internal' | 'other' };
export type CreateOrganizationInput = {
  name: string;
  slug: string;
  organization_type?: 'company' | 'division' | 'department' | 'branch' | 'team';
  parent_id?: string | null;
};
export type InviteTenantMemberInput = { email: string; full_name: string; role_key: string };

export const createTenant = (accessToken: string, payload: CreateTenantInput) =>
  apiRequest<AgentzyPlatformTenant>("/tenants", { method: "POST", accessToken, body: JSON.stringify(payload) });

export const createOrganization = (accessToken: string, tenantId: string, payload: CreateOrganizationInput) =>
  apiRequest<Record<string, unknown>>(`/tenants/${encodeURIComponent(tenantId)}/organizations`, {
    method: "POST", accessToken, body: JSON.stringify(payload),
  });

export const inviteTenantMember = (accessToken: string, tenantId: string, payload: InviteTenantMemberInput) =>
  apiRequest<Record<string, unknown>>(`/tenants/${encodeURIComponent(tenantId)}/memberships/invite`, {
    method: "POST", accessToken, body: JSON.stringify(payload),
  });

export const listTenantMemberships = (accessToken: string, tenantId: string) =>
  apiRequest<AgentzyTenantMembership[]>(`/tenants/${encodeURIComponent(tenantId)}/memberships`, {
    method: "GET", accessToken,
  });

export const listRoleTemplates = (accessToken: string) =>
  apiRequest<AgentzyRoleTemplate[]>("/roles", { method: "GET", accessToken });


export type AgentzyPlatformTenant = {
  id: string;
  name: string;
  slug: string;
  tenant_type: 'corporate' | 'provider' | 'internal' | 'other';
  status: 'pending' | 'active' | 'suspended' | 'archived';
  created_at: string;
  updated_at: string;
};

export const listPlatformTenants = (accessToken: string) =>
  apiRequest<AgentzyPlatformTenant[]>("/tenants/directory", { method: "GET", accessToken });


export type UpdateTenantInput = Partial<CreateTenantInput> & { status?: 'pending' | 'active' | 'suspended' | 'archived' };

export const updateTenant = (accessToken: string, tenantId: string, payload: UpdateTenantInput) =>
  apiRequest<AgentzyPlatformTenant>(`/tenants/${encodeURIComponent(tenantId)}`, {
    method: "PATCH", accessToken, body: JSON.stringify(payload),
  });

export const archiveTenant = (accessToken: string, tenantId: string) =>
  apiRequest<{ id: string; name: string; slug: string; status: string }>(
    `/tenants/${encodeURIComponent(tenantId)}`, { method: "DELETE", accessToken },
  );


export type AgentzyOrganization = {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  organization_type: 'company' | 'division' | 'department' | 'branch' | 'team';
  status: string;
};

export const listTenantOrganizations = (accessToken: string, tenantId: string) =>
  apiRequest<AgentzyOrganization[]>(`/tenants/${encodeURIComponent(tenantId)}/organizations`, {
    method: "GET", accessToken,
  });
