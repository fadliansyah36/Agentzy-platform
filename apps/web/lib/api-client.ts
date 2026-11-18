const API_BASE_URL = (process.env.NEXT_PUBLIC_AGENTZY_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown,
    readonly requestId?: string | null,
    readonly correlationId?: string | null,
    readonly traceId?: string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "headers"> & { accessToken: string; headers?: HeadersInit };

export async function apiRequest<T>(path: string, options: ApiOptions): Promise<T> {
  if (!API_BASE_URL) throw new ApiError("API belum dikonfigurasi. Hubungi administrator.", 503, "API_NOT_CONFIGURED");
  const { accessToken, headers: inputHeaders, ...requestOptions } = options;
  const headers = new Headers(inputHeaders);
  const requestId = createIdempotencyKey();
  if (!headers.has("X-Request-ID")) headers.set("X-Request-ID", requestId);
  if (!headers.has("X-Correlation-ID")) headers.set("X-Correlation-ID", requestId);
  if (!headers.has("X-Trace-ID")) headers.set("X-Trace-ID", createIdempotencyKey());
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Accept", "application/json");
  if (requestOptions.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE_URL}/api/v1${path.startsWith("/") ? path : `/${path}`}`,
    { ...requestOptions, headers, cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const error = payload?.error ?? payload;
    throw new ApiError(
      error?.message ?? payload?.detail ?? "Permintaan ke Agentzy API gagal.",
      response.status,
      error?.code,
      error?.details ?? payload?.detail,
      error?.request_id ?? response.headers.get("X-Request-ID"),
      error?.correlation_id ?? response.headers.get("X-Correlation-ID"),
      error?.trace_id ?? response.headers.get("X-Trace-ID"),
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type AgentzyMembership = { id: string; tenant_id: string; tenant_name: string;
  organization_id: string | null; organization_unit_id: string | null;
  branch_id: string | null; department_id: string | null;
  role_keys: string[]; permissions: string[]; status: string };
export type AgentzyIdentity = { user_id: string; email: string | null; display_name: string | null;
  memberships: AgentzyMembership[] };
export type AgentzyTenant = { id: string; name: string; slug: string; status: string; membership_status: string };

export const getMyIdentity = (accessToken: string) =>
  apiRequest<AgentzyIdentity>("/me", { method: "GET", accessToken });
export const getMyTenants = (accessToken: string) =>
  fetchAllAgentzyPages<AgentzyTenant>(accessToken, "/tenants");


export type AgentzyRoleTemplate = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
  scope_type: string;
  tenant_id: string | null;
  permissions: string[];
};


type AgentzyPage<T> = {
  data: T[];
  meta: { has_more: boolean; next_cursor: string | null; request_id?: string | null };
};

const fetchAllAgentzyPages = async <T>(accessToken: string, path: string): Promise<T[]> => {
  const rows: T[] = [];
  let cursor: string | null = null;
  do {
    const query = new URLSearchParams({ limit: '100' });
    if (cursor) query.set('cursor', cursor);
    const page = await apiRequest<AgentzyPage<T>>(
      `${path}?${query.toString()}`,
      { method: 'GET', accessToken },
    );
    rows.push(...page.data);
    cursor = page.meta.next_cursor;
  } while (cursor);
  return rows;
};

export type AgentzyTenantMembership = {
  id: string;
  tenant_id: string;
  user_id: string;
  organization_id: string | null;
  organization_unit_id: string | null;
  branch_id: string | null;
  department_id: string | null;
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
export type InviteTenantMemberInput = {
  email: string; full_name: string; role_key: string;
  organization_id?: string | null; organization_unit_id?: string | null;
  branch_id?: string | null; department_id?: string | null;
};

export const createTenant = (accessToken: string, payload: CreateTenantInput) =>
  apiRequest<AgentzyPlatformTenant>("/tenants", {
    method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() },
    body: JSON.stringify(payload),
  });

export const createOrganization = (accessToken: string, tenantId: string, payload: CreateOrganizationInput) =>
  apiRequest<AgentzyOrganization>(`/tenants/${encodeURIComponent(tenantId)}/organizations`, {
    method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload),
  });

export type AgentzyMembershipInvitationResult = {
  id: string;
  tenant_id: string;
  user_id: string;
  status: 'invited';
  created_at: string;
  email: string;
  role_key: string;
  invitation_status: 'sent';
};

export const inviteTenantMember = (accessToken: string, tenantId: string, payload: InviteTenantMemberInput) =>
  apiRequest<AgentzyMembershipInvitationResult>(`/tenants/${encodeURIComponent(tenantId)}/memberships/invite`, {
    method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload),
  });

export const listTenantMemberships = (accessToken: string, tenantId: string) =>
  fetchAllAgentzyPages<AgentzyTenantMembership>(accessToken, `/tenants/${encodeURIComponent(tenantId)}/memberships`);

export const listRoleTemplates = (accessToken: string) =>
  fetchAllAgentzyPages<AgentzyRoleTemplate>(accessToken, "/roles");


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
  fetchAllAgentzyPages<AgentzyPlatformTenant>(accessToken, "/tenants/directory");


export type UpdateTenantInput = Partial<CreateTenantInput> & { status?: 'pending' | 'active' | 'suspended' | 'archived' };

export const updateTenant = (accessToken: string, tenantId: string, payload: UpdateTenantInput) =>
  apiRequest<AgentzyPlatformTenant>(`/tenants/${encodeURIComponent(tenantId)}`, {
    method: "PATCH", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload),
  });

export const archiveTenant = (accessToken: string, tenantId: string) =>
  apiRequest<{ id: string; name: string; slug: string; status: string }>(
    `/tenants/${encodeURIComponent(tenantId)}`, { method: "DELETE", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() } },
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
  fetchAllAgentzyPages<AgentzyOrganization>(accessToken, `/tenants/${encodeURIComponent(tenantId)}/organizations`);

export type AgentzyPermissionContext = {
  user_id: string;
  memberships: Array<{
    membership_id: string;
    tenant_id: string;
    tenant_name: string;
    organization_id: string | null;
    organization_unit_id: string | null;
    branch_id: string | null;
    department_id: string | null;
    status: string;
    roles: string[];
    permissions: string[];
  }>;
};

export const getMyPermissions = (accessToken: string) =>
  apiRequest<AgentzyPermissionContext>("/me/permissions", { method: "GET", accessToken });

export const updateMyIdentity = (
  accessToken: string,
  payload: { display_name?: string | null; locale?: string; timezone?: string }
) => apiRequest<AgentzyIdentity>("/me", {
  method: "PATCH", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload),
});

export const revokeMySessions = (accessToken: string) =>
  apiRequest<{ status: string; scope: string }>("/auth/session/revoke", {
    method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}),
  });

export type AgentzyOrganizationUnit = {
  id: string; tenant_id: string; organization_id: string; parent_unit_id: string | null;
  name: string; code: string; unit_type: string; status: string;
};
export type AgentzyBranch = {
  id: string; tenant_id: string; organization_id: string; organization_unit_id: string | null;
  name: string; code: string; status: string;
};
export type AgentzyDepartment = {
  id: string; tenant_id: string; organization_id: string; branch_id: string | null;
  parent_department_id: string | null; name: string; code: string; status: string;
};

export type AgentzyWorkforceTenantContext = {
  tenant_id: string;
  membership_id: string | null;
  organization_id: string | null;
  organization_unit_id: string | null;
  branch_id: string | null;
  department_id: string | null;
  role_keys: string[];
  permissions: string[];
  organizations: AgentzyOrganization[];
  organization_units: AgentzyOrganizationUnit[];
  branches: AgentzyBranch[];
  departments: AgentzyDepartment[];
};

export const getWorkforceTenantContext = (accessToken: string, tenantId: string) =>
  apiRequest<AgentzyWorkforceTenantContext>(
    `/tenants/${encodeURIComponent(tenantId)}/workforce-context`,
    { method: "GET", accessToken },
  );

export const listOrganizationUnits = (accessToken: string, tenantId: string) =>
  fetchAllAgentzyPages<AgentzyOrganizationUnit>(accessToken, `/tenants/${encodeURIComponent(tenantId)}/organization-units`);
export const listBranches = (accessToken: string, tenantId: string) =>
  fetchAllAgentzyPages<AgentzyBranch>(accessToken, `/tenants/${encodeURIComponent(tenantId)}/branches`);
export const listDepartments = (accessToken: string, tenantId: string) =>
  fetchAllAgentzyPages<AgentzyDepartment>(accessToken, `/tenants/${encodeURIComponent(tenantId)}/departments`);


export const updateBranch = (
  accessToken: string,
  tenantId: string,
  branchId: string,
  payload: { name?: string; code?: string; organization_unit_id?: string | null; status?: 'active' | 'inactive' | 'archived' },
) => apiRequest<AgentzyBranch>(
  `/tenants/${encodeURIComponent(tenantId)}/branches/${encodeURIComponent(branchId)}`,
  { method: "PATCH", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload) },
);

export const updateDepartment = (
  accessToken: string,
  tenantId: string,
  departmentId: string,
  payload: { name?: string; code?: string; branch_id?: string | null; parent_department_id?: string | null; status?: 'active' | 'inactive' | 'archived' },
) => apiRequest<AgentzyDepartment>(
  `/tenants/${encodeURIComponent(tenantId)}/departments/${encodeURIComponent(departmentId)}`,
  { method: "PATCH", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload) },
);

export const archiveBranch = (accessToken: string, tenantId: string, branchId: string) =>
  apiRequest<AgentzyBranch>(
    `/tenants/${encodeURIComponent(tenantId)}/branches/${encodeURIComponent(branchId)}/archive`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );

export const restoreBranch = (accessToken: string, tenantId: string, branchId: string) =>
  apiRequest<AgentzyBranch>(
    `/tenants/${encodeURIComponent(tenantId)}/branches/${encodeURIComponent(branchId)}/restore`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );

export const archiveDepartment = (accessToken: string, tenantId: string, departmentId: string) =>
  apiRequest<AgentzyDepartment>(
    `/tenants/${encodeURIComponent(tenantId)}/departments/${encodeURIComponent(departmentId)}/archive`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );

export const restoreDepartment = (accessToken: string, tenantId: string, departmentId: string) =>
  apiRequest<AgentzyDepartment>(
    `/tenants/${encodeURIComponent(tenantId)}/departments/${encodeURIComponent(departmentId)}/restore`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );

export const acceptTenantMembership = (accessToken: string, tenantId: string, membershipId: string) =>
  apiRequest<{ id: string; tenant_id: string; user_id: string; status: string }>(
    `/tenants/${encodeURIComponent(tenantId)}/memberships/${encodeURIComponent(membershipId)}/accept`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );

export const suspendTenantMembership = (accessToken: string, tenantId: string, membershipId: string) =>
  apiRequest<{ id: string; status: string }>(
    `/tenants/${encodeURIComponent(tenantId)}/memberships/${encodeURIComponent(membershipId)}/suspend`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );

export const revokeTenantMembership = (accessToken: string, tenantId: string, membershipId: string) =>
  apiRequest<{ id: string; status: string }>(
    `/tenants/${encodeURIComponent(tenantId)}/memberships/${encodeURIComponent(membershipId)}/revoke`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );

export const activateTenantMembership = (accessToken: string, tenantId: string, membershipId: string) =>
  apiRequest<{ id: string; status: string }>(
    `/tenants/${encodeURIComponent(tenantId)}/memberships/${encodeURIComponent(membershipId)}/activate`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );


export type ReassignMembershipHierarchyInput = {
  organization_id: string | null;
  organization_unit_id: string | null;
  branch_id: string | null;
  department_id: string | null;
};
export const reassignMembershipHierarchy = (
  accessToken: string,
  tenantId: string,
  membershipId: string,
  payload: ReassignMembershipHierarchyInput,
) => apiRequest<{
  id: string; tenant_id: string; user_id: string;
  organization_id: string | null; organization_unit_id: string | null;
  branch_id: string | null; department_id: string | null; status: string;
}>(
  `/tenants/${encodeURIComponent(tenantId)}/memberships/${encodeURIComponent(membershipId)}/assignment`,
  { method: 'PATCH', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: JSON.stringify(payload) },
);

export const replaceMembershipRole = (
  accessToken: string,
  tenantId: string,
  membershipId: string,
  payload: { role_key: string; scope_type?: string; scope_id?: string | null; valid_until?: string | null },
) => apiRequest<{
  membership_id: string; role_key: string; previous_role_keys: string[];
  scope_type: string; scope_id: string | null; valid_until: string | null;
}>(
  `/tenants/${encodeURIComponent(tenantId)}/memberships/${encodeURIComponent(membershipId)}/roles`,
  { method: "PUT", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload) },
);

export type AgentzyMembershipRoleAssignment = {
  membership_id: string;
  role_key: string;
  scope_type: string;
  scope_id: string | null;
};

export const assignMembershipRole = (
  accessToken: string,
  tenantId: string,
  membershipId: string,
  payload: { role_key: string; scope_type?: string; scope_id?: string | null; valid_until?: string | null },
) => apiRequest<AgentzyMembershipRoleAssignment>(
  `/tenants/${encodeURIComponent(tenantId)}/memberships/${encodeURIComponent(membershipId)}/roles`,
  { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload) },
);

export const createOrganizationUnit = (
  accessToken: string,
  tenantId: string,
  payload: { organization_id: string; parent_unit_id?: string | null; name: string; code: string; unit_type: string },
) => apiRequest<AgentzyOrganizationUnit>(
  `/tenants/${encodeURIComponent(tenantId)}/organization-units`,
  { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload) },
);

export const createBranch = (
  accessToken: string,
  tenantId: string,
  payload: { organization_id: string; organization_unit_id?: string | null; name: string; code: string },
) => apiRequest<AgentzyBranch>(
  `/tenants/${encodeURIComponent(tenantId)}/branches`,
  { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload) },
);

export const createDepartment = (
  accessToken: string,
  tenantId: string,
  payload: { organization_id: string; branch_id?: string | null; parent_department_id?: string | null; name: string; code: string },
) => apiRequest<AgentzyDepartment>(
  `/tenants/${encodeURIComponent(tenantId)}/departments`,
  { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload) },
);

export type AgentzyInvitation = {
  id: string; tenant_id: string; tenant_name: string;
  invitation_expires_at: string | null; role_keys: string[]; permission_keys: string[];
};
export const getMyInvitations = (accessToken: string) =>
  apiRequest<{ invitations: AgentzyInvitation[] }>("/me/invitations", {
    method: "GET", accessToken,
  });

export type AgentzyPermissionDefinition = {
  key: string; domain: string; action: string; description: string | null;
  resource: string | null; risk_level: 'standard' | 'sensitive' | 'privileged' | 'critical';
};
export const listPermissionRegistry = (accessToken: string) =>
  fetchAllAgentzyPages<AgentzyPermissionDefinition>(accessToken, "/permissions");
export const replaceRolePermissions = (
  accessToken: string,
  roleId: string,
  permissionKeys: string[],
) => apiRequest<{ role_id: string; permission_keys: string[] }>(
  `/roles/${encodeURIComponent(roleId)}/permissions`,
  { method: "PUT", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({ permission_keys: permissionKeys }) },
);


export type CreateAgentzyRoleInput = {
  key: string;
  name: string;
  description?: string | null;
  scope_type: 'platform' | 'tenant';
};
export const createAgentzyRole = (accessToken: string, payload: CreateAgentzyRoleInput) =>
  apiRequest<AgentzyRoleTemplate>("/roles", {
    method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload),
  });
export const updateAgentzyRole = (
  accessToken: string,
  roleId: string,
  payload: { name?: string; description?: string | null },
) => apiRequest<AgentzyRoleTemplate>(`/roles/${encodeURIComponent(roleId)}`, {
  method: "PATCH", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload),
});
export const deleteAgentzyRole = (accessToken: string, roleId: string) =>
  apiRequest<{ id: string; status: string }>(`/roles/${encodeURIComponent(roleId)}`, {
    method: "DELETE", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() },
  });


export type AgentzyBreakGlassRequest = {
  id: string;
  tenant_id?: string | null;
  requester_user_id?: string;
  approver_user_id?: string | null;
  reason?: string;
  requested_scope?: { permission_keys: string[]; tenant_ids: string[]; duration_minutes?: number };
  status: 'requested' | 'approved' | 'active' | 'expired' | 'revoked' | 'rejected' | 'reviewed';
  requested_at?: string;
  approved_at?: string | null;
  activated_at?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  reviewed_at?: string | null;
};
const createIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `agentzy-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const listBreakGlassRequests = async (accessToken: string) => ({
  data: await fetchAllAgentzyPages<AgentzyBreakGlassRequest>(
    accessToken, '/security/break-glass/requests',
  ),
});
export const requestBreakGlass = (
  accessToken: string,
  payload: { reason: string; permission_keys: string[]; tenant_ids: string[]; duration_minutes: number },
) => apiRequest<AgentzyBreakGlassRequest>('/security/break-glass/requests', {
  method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
  body: JSON.stringify(payload),
});
export const approveBreakGlass = (accessToken: string, requestId: string) =>
  apiRequest<AgentzyBreakGlassRequest>(`/security/break-glass/requests/${encodeURIComponent(requestId)}/approve`, {
    method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
  });
export const activateBreakGlass = (accessToken: string, requestId: string, durationMinutes: number) =>
  apiRequest<AgentzyBreakGlassRequest>(`/security/break-glass/requests/${encodeURIComponent(requestId)}/activate`, {
    method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ duration_minutes: durationMinutes }),
  });
export const revokeBreakGlass = (accessToken: string, requestId: string) =>
  apiRequest<AgentzyBreakGlassRequest>(`/security/break-glass/requests/${encodeURIComponent(requestId)}/revoke`, {
    method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
  });
export const reviewBreakGlass = (accessToken: string, requestId: string, notes: string) =>
  apiRequest<AgentzyBreakGlassRequest>(`/security/break-glass/requests/${encodeURIComponent(requestId)}/review`, {
    method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ notes }),
  });

export type AgentzyAuditLog = {
  id: string;
  tenant_id: string | null;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AgentzySecurityAlert = {
  id: string; tenant_id: string | null; source_type: 'audit_log' | 'auth_provider_event';
  source_id: string; alert_key: string; severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'acknowledged' | 'resolved'; title: string; summary: string;
  actor_user_id: string | null; subject_user_id: string | null;
  request_id: string | null; correlation_id: string | null; trace_id: string | null;
  details: Record<string, unknown>; occurred_at: string; acknowledged_by: string | null;
  acknowledged_at: string | null; resolved_at: string | null; created_at: string;
};
export const listSecurityAlerts = (accessToken: string, filters: {
  tenant_id?: string; status?: 'open' | 'acknowledged' | 'resolved';
  severity?: 'critical' | 'high' | 'medium' | 'low'; limit?: number;
} = {}) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const encoded = query.toString();
  const suffix = encoded ? `?${encoded}` : '';
  return apiRequest<{ data: AgentzySecurityAlert[]; meta: { has_more: boolean; next_cursor: string | null; request_id: string | null } }>(
    `/security/alerts${suffix}`, { method: 'GET', accessToken },
  );
};
export const acknowledgeSecurityAlert = (accessToken: string, alertId: string) =>
  apiRequest<AgentzySecurityAlert>(
    `/security/alerts/${encodeURIComponent(alertId)}/acknowledge`,
    { method: 'PATCH', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: JSON.stringify({}) },
  );

export const listAuditLogs = (
  accessToken: string,
  params: { tenant_id?: string; limit?: number; cursor?: string; resource_type?: string } = {},
) => {
  const query = new URLSearchParams();
  if (params.tenant_id) query.set('tenant_id', params.tenant_id);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.resource_type) query.set('resource_type', params.resource_type);
  return apiRequest<{ data: AgentzyAuditLog[]; meta: { has_more: boolean; next_cursor: string | null; request_id: string | null } }>(
    `/security/audit?${query.toString()}`, { method: 'GET', accessToken },
  );
};
export async function exportAuditLogs(accessToken: string, tenantId?: string): Promise<Blob> {
  const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : '';
  const response = await fetch(`${API_BASE_URL}/api/v1/security/audit/export${query}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/csv' },
    cache: 'no-store',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.error?.message ?? 'Audit export failed.', response.status);
  }
  return response.blob();
}

export const rejectBreakGlass = (accessToken: string, requestId: string) =>
  apiRequest<AgentzyBreakGlassRequest>(`/security/break-glass/requests/${encodeURIComponent(requestId)}/reject`, {
    method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
  });
