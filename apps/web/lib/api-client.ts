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

async function readApiPayload<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (
    payload &&
    typeof payload === "object" &&
    payload.meta?.envelope_version === 1 &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data as T;
  }
  return payload as T;
}

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
  if (requestOptions.body && !headers.has("Content-Type") && !(typeof FormData !== "undefined" && requestOptions.body instanceof FormData)) headers.set("Content-Type", "application/json");
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
  return readApiPayload<T>(response);
}


export async function publicApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new ApiError("API belum dikonfigurasi. Hubungi administrator.", 503, "API_NOT_CONFIGURED");
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("X-Request-ID")) headers.set("X-Request-ID", createIdempotencyKey());
  if (!headers.has("X-Correlation-ID")) headers.set("X-Correlation-ID", createIdempotencyKey());
  if (!headers.has("X-Trace-ID")) headers.set("X-Trace-ID", createIdempotencyKey());
  const response = await fetch(`${API_BASE_URL}/api/v1${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers,
    cache: "no-store",
  });
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
  return readApiPayload<T>(response);
}



export type PartnershipProspect = {
  id: string;
  application_id: string;
  reference_code: string;
  company_name: string;
  company_type: string;
  contact_name: string;
  business_email: string;
  business_phone: string;
  status: string;
  assigned_to: string | null;
  assigned_at: string | null;
  last_activity_at: string;
  created_at: string;
  human_needs: string[];
  ai_needs: string[];
  provider_products: string[];
  operating_locations: string | null;
  estimated_workforce: number | null;
};
export type PartnershipProspectPage = {
  data: PartnershipProspect[];
  meta: { has_more: boolean; next_cursor: string | null; request_id?: string | null };
};
export const listPartnershipProspects = (accessToken: string, status?: string) => {
  const query = new URLSearchParams({ limit: "50" });
  if (status) query.set("status", status);
  return apiRequest<PartnershipProspectPage>(`/partnership/prospects?${query.toString()}`, { method: "GET", accessToken });
};
export const updatePartnershipProspect = (
  accessToken: string,
  prospectId: string,
  payload: { status?: string; assigned_to?: string | null; note?: string },
) => apiRequest<{ data: { id: string; reference_code: string; status: string; assigned_to: string | null } }>(
  `/partnership/prospects/${encodeURIComponent(prospectId)}`,
  { method: "PATCH", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload) },
);
export const listPartnershipProspectActivities = (accessToken: string, prospectId: string) =>
  apiRequest<{ data: Array<{ id: string; activity_type: string; from_status: string | null; to_status: string | null; note: string | null; created_at: string }> }>(
    `/partnership/prospects/${encodeURIComponent(prospectId)}/activities`,
    { method: "GET", accessToken },
  );

export type PartnershipAttachment = {
  id: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  sha256: string;
  scan_status: "pending_scan" | "clean" | "infected" | "rejected";
  scan_attempts: number;
  scan_state: "queued" | "scanning" | "retrying" | "dead_letter" | "clean" | "infected" | "rejected";
  uploaded_at: string;
  scanned_at: string | null;
  download_available: boolean;
};
export const listPartnershipProspectAttachments = (accessToken: string, prospectId: string) =>
  apiRequest<{ data: PartnershipAttachment[] }>(
    `/partnership/prospects/${encodeURIComponent(prospectId)}/attachments`,
    { method: "GET", accessToken },
  );
export const createPartnershipAttachmentDownload = (accessToken: string, attachmentId: string) =>
  apiRequest<{ data: { attachment_id: string; filename: string; signed_url: string; expires_in_seconds: number } }>(
    `/partnership/attachments/${encodeURIComponent(attachmentId)}/download`,
    { method: "POST", accessToken },
  );
export const retryPartnershipAttachmentScan = (accessToken: string, attachmentId: string) =>
  apiRequest<{ data: { attachment_id: string; scan_status: string; scan_state: string } }>(
    `/partnership/attachments/${encodeURIComponent(attachmentId)}/retry-scan`,
    { method: "POST", accessToken },
  );

export type PartnershipNotification = {
  id: string;
  event_type: string;
  status: "pending" | "processing" | "sent" | "failed" | "dead_letter";
  attempts: number;
  available_at: string | null;
  processed_at: string | null;
  last_error_code: string | null;
  created_at: string | null;
};
export const listPartnershipProspectNotifications = (accessToken: string, prospectId: string) =>
  apiRequest<{ data: PartnershipNotification[]; meta: { count: number; request_id?: string | null } }>(
    `/partnership/prospects/${encodeURIComponent(prospectId)}/notifications`,
    { method: "GET", accessToken },
  );
export const retryPartnershipNotification = (accessToken: string, notificationId: string) =>
  apiRequest<{ notification_id: string; status: string }>(
    `/partnership/notifications/${encodeURIComponent(notificationId)}/retry`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );

export type PublicCatalogueItem = {
  audience: "human" | "ai";
  service_key: string;
  name: string;
  summary: string;
  scope: string;
  output: string;
  boundary: string;
  governance: string;
  sort_order: number;
};
export type PublicCatalogueResponse = {
  data: {
    human_workforce: PublicCatalogueItem[];
    ai_workforce: PublicCatalogueItem[];
    faqs: Array<{ faq_key: string; question: string; answer: string; sort_order: number }>;
  };
  meta: { source: string; updated_at: string };
};
export const getPublicCatalogue = () =>
  publicApiRequest<PublicCatalogueResponse>("/public/catalogue", { method: "GET" });

export type PublicPartnershipApplicationInput = {
  company_name: string;
  company_type: string;
  contact_name: string;
  contact_title?: string;
  business_email: string;
  business_phone: string;
  website?: string;
  operating_locations?: string;
  estimated_workforce?: number;
  human_needs: string[];
  ai_needs: string[];
  provider_products: string[];
  needs_summary?: string;
  privacy_consent: boolean;
  communication_consent: boolean;
  policy_version: string;
  captcha_token?: string;
  fax_number: string;
};

export type PublicPartnershipApplicationResult = {
  data: {
    id: string;
    reference_code: string;
    status: string;
    upload_token: string;
    notification_status: "queued";
  };
  meta: { request_id?: string | null; correlation_id?: string | null; trace_id?: string | null };
};

export const createPublicPartnershipApplication = (
  payload: PublicPartnershipApplicationInput,
  idempotencyKey: string,
) => publicApiRequest<PublicPartnershipApplicationResult>("/public/partnership-applications", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
  body: JSON.stringify(payload),
});

export const uploadPublicPartnershipAttachment = (
  applicationId: string,
  uploadToken: string,
  file: File,
  idempotencyKey: string,
) => publicApiRequest<{ data: { id: string; scan_status: string; download_available: boolean } }>(
  `/public/partnership-applications/${encodeURIComponent(applicationId)}/attachments`,
  {
    method: "POST",
    headers: {
      "X-Application-Upload-Token": uploadToken,
      "X-File-Name": encodeURIComponent(file.name),
      "Content-Type": file.type,
      "Idempotency-Key": idempotencyKey,
    },
    body: file,
  },
);

export type AgentzyMembership = { id: string; tenant_id: string; tenant_name: string;
  organization_id: string | null; organization_unit_id: string | null;
  branch_id: string | null; department_id: string | null;
  role_keys: string[]; permissions: string[]; status: string };
export type AgentzyIdentity = { user_id: string; email: string | null; display_name: string | null;
  memberships: AgentzyMembership[] };
export type AgentzyTenant = { id: string; name: string; slug: string; status: string; membership_status: string };

export const getMyIdentity = (accessToken: string) =>
  apiRequest<AgentzyIdentity>("/me", { method: "GET", accessToken });

export type AgentzyAuthSession = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  refreshed_at: string | null;
  not_after: string | null;
  aal: string | null;
  user_agent: string | null;
  is_current: boolean;
  is_revoked: boolean;
  revoked_at: string | null;
};
export const listMySessions = (accessToken: string) =>
  apiRequest<{ data: AgentzyAuthSession[]; meta: { current_session_id: string; active_count: number } }>(
    "/me/sessions",
    { method: "GET", accessToken },
  );
export const revokeMySession = (accessToken: string, sessionId: string) =>
  apiRequest<{ status: string; session_id: string; current_session_revoked: boolean }>(
    `/me/sessions/${encodeURIComponent(sessionId)}/revoke`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );
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
      `${path}${path.includes('?') ? '&' : '?'}${query.toString()}`,
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

export const listOrganizationUnits = (accessToken: string, tenantId: string, includeArchived = false) =>
  fetchAllAgentzyPages<AgentzyOrganizationUnit>(
    accessToken,
    `/tenants/${encodeURIComponent(tenantId)}/organization-units${includeArchived ? '?include_archived=true' : ''}`,
  );
export const listBranches = (accessToken: string, tenantId: string, includeArchived = false) =>
  fetchAllAgentzyPages<AgentzyBranch>(
    accessToken,
    `/tenants/${encodeURIComponent(tenantId)}/branches${includeArchived ? '?include_archived=true' : ''}`,
  );
export const listDepartments = (accessToken: string, tenantId: string, includeArchived = false) =>
  fetchAllAgentzyPages<AgentzyDepartment>(
    accessToken,
    `/tenants/${encodeURIComponent(tenantId)}/departments${includeArchived ? '?include_archived=true' : ''}`,
  );


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

export const updateOrganizationUnit = (
  accessToken: string,
  tenantId: string,
  unitId: string,
  payload: { name?: string; code?: string; parent_unit_id?: string | null; unit_type?: string; status?: 'active' | 'inactive' },
) => apiRequest<AgentzyOrganizationUnit>(
  `/tenants/${encodeURIComponent(tenantId)}/organization-units/${encodeURIComponent(unitId)}`,
  { method: "PATCH", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify(payload) },
);
export const archiveOrganizationUnit = (accessToken: string, tenantId: string, unitId: string) =>
  apiRequest<AgentzyOrganizationUnit>(
    `/tenants/${encodeURIComponent(tenantId)}/organization-units/${encodeURIComponent(unitId)}/archive`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
  );
export const restoreOrganizationUnit = (accessToken: string, tenantId: string, unitId: string) =>
  apiRequest<AgentzyOrganizationUnit>(
    `/tenants/${encodeURIComponent(tenantId)}/organization-units/${encodeURIComponent(unitId)}/restore`,
    { method: "POST", accessToken, headers: { "Idempotency-Key": createIdempotencyKey() }, body: JSON.stringify({}) },
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


// Corporate & Contract Management — all business mutations are FastAPI commands.
export type CorporateProfile = {
  tenant_id: string; organization_id: string | null; branch_id: string | null;
  legal_name: string; registration_number: string | null; billing_email: string | null;
  billing_phone: string | null; billing_address: Record<string, unknown>;
  tax_profile: Record<string, unknown>; contact_name: string | null;
  contact_title: string | null; website: string | null; country_code: string;
  profile_status: 'draft' | 'active' | 'suspended' | 'archived';
};
export type CorporateContractService = {
  service_key: string; service_scope: string; quantity: number;
  monthly_fee?: string | number | null; sla?: Record<string, unknown>;
  kpi?: Record<string, unknown>; entitlement?: Record<string, unknown>;
  human_workforce_limit?: number | null; ai_worker_limit?: number | null;
  ai_credits_limit?: string | number | null;
};
export type CorporateContract = {
  id: string; tenant_id?: string; contract_number: string; title: string;
  contract_type: 'master' | 'statement_of_work' | 'amendment';
  status: string; currency: string; effective_start: string | null;
  effective_end: string | null; renewal_at: string | null; current_version: number;
  row_version?: number; organization_id?: string | null; branch_id?: string | null;
  version_id?: string; version_status?: string; signature_status?: string; scope_summary?: string;
  terms?: string | null; services?: CorporateContractService[];
  approvals?: Array<Record<string, unknown>>;
};
export type ContractDocument = {
  id: string; document_type: string; original_filename: string; content_type: string;
  file_size: number; sha256: string | null; lifecycle_status: string; created_at: string;
};
export type ContractInvoice = {
  id: string; contract_id: string; invoice_number: string; title: string;
  currency: string; subtotal: string; tax_amount: string; total_amount: string;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  issued_at: string | null; due_at: string | null; created_at: string;
};
export type ContractPaymentReference = {
  id: string; reference_number: string; payment_method: string; amount: string;
  status: 'reference_created' | 'submitted' | 'confirmed' | 'rejected' | 'reconciled';
  external_reference: string | null; submitted_at: string | null;
  verified_at: string | null; reconciled_at: string | null; created_at: string;
};
export type ContractEntitlement = {
  id: string; contract_id: string; contract_version_id: string; service_key: string;
  service_scope: Record<string, unknown>; sla: Record<string, unknown>;
  kpi: Record<string, unknown>; contract_service_id: string; monthly_fee: string | null;
  quantity: number; human_workforce_limit: number | null;
  ai_worker_limit: number | null; ai_credits_limit: string | null;
  effective_start: string | null; effective_end: string | null;
};

export const getCorporateProfile = (accessToken: string, tenantId: string) =>
  apiRequest<{ data: CorporateProfile | null }>(
    `/corporate/profile?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const upsertCorporateProfile = (
  accessToken: string,
  payload: Omit<CorporateProfile, 'profile_status'>,
) => apiRequest<{ data: CorporateProfile }>('/corporate/profile', {
  method: 'PUT', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
  body: JSON.stringify(payload),
});
export const updateCorporateProfileStatus = (
  accessToken: string, tenantId: string,
  payload: { status: 'active' | 'suspended' | 'archived'; reason: string },
) => apiRequest<{ data: { tenant_id: string; profile_status: string } }>('/corporate/profile/status', {
  method: 'PATCH', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
  body: JSON.stringify({ tenant_id: tenantId, ...payload }),
});
export const listCorporateContracts = (
  accessToken: string, tenantId: string, status?: string,
) => {
  const query = new URLSearchParams({ tenant_id: tenantId, limit: '100' });
  if (status) query.set('status', status);
  return apiRequest<{ data: CorporateContract[]; meta?: { has_more: boolean } }>(
    `/corporate/contracts?${query.toString()}`, { method: 'GET', accessToken },
  );
};
export const getCorporateContract = (accessToken: string, tenantId: string, contractId: string) =>
  apiRequest<{ data: CorporateContract }>(
    `/corporate/contracts/${encodeURIComponent(contractId)}?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const createCorporateContract = (
  accessToken: string,
  payload: {
    tenant_id: string; organization_id?: string | null; branch_id?: string | null;
    parent_contract_id?: string | null; provider_profile_id?: string | null;
    contract_number: string; title: string;
    contract_type: 'master' | 'statement_of_work' | 'amendment'; currency: string;
    effective_start?: string | null; effective_end?: string | null; renewal_at?: string | null;
    scope_summary: string; terms?: string | null;
    commercial_snapshot?: Record<string, unknown>; services: CorporateContractService[];
  },
) => apiRequest<{ data: { id: string; status: string; version: number } }>('/corporate/contracts', {
  method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
  body: JSON.stringify(payload),
});
export const patchCorporateContract = (
  accessToken: string, contractId: string,
  payload: {
    tenant_id: string; expected_row_version: number; title?: string;
    effective_start?: string | null; effective_end?: string | null;
    renewal_at?: string | null; renewal_notice_days?: number;
    organization_id?: string | null; branch_id?: string | null;
  },
) => apiRequest<{ data: { id: string; status: string; row_version: number } }>(
  `/corporate/contracts/${encodeURIComponent(contractId)}`,
  { method: 'PATCH', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify(payload) },
);
export const createCorporateAmendment = (
  accessToken: string, contractId: string,
  payload: {
    tenant_id: string; change_summary: string; scope_summary: string;
    terms?: string | null; effective_from: string;
    commercial_snapshot?: Record<string, unknown>; services: CorporateContractService[];
  },
) => apiRequest<{ data: { contract_id: string; version_id: string; version: number; status: string } }>(
  `/corporate/contracts/${encodeURIComponent(contractId)}/amendments`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify(payload) },
);
export const listContractDocuments = (accessToken: string, tenantId: string, contractId: string) =>
  apiRequest<{ data: ContractDocument[] }>(
    `/corporate/contracts/${encodeURIComponent(contractId)}/documents?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const uploadContractDocument = (
  accessToken: string, tenantId: string, contractId: string, file: File,
  documentType: 'master_agreement' | 'statement_of_work' | 'sla' | 'amendment' | 'supporting',
  versionId?: string,
) => {
  const query = new URLSearchParams({ tenant_id: tenantId, document_type: documentType });
  if (versionId) query.set('contract_version_id', versionId);
  return apiRequest<{ data: ContractDocument }>(
    `/corporate/contracts/${encodeURIComponent(contractId)}/documents?${query.toString()}`,
    { method: 'POST', accessToken, headers: {
      'Content-Type': file.type, 'X-File-Name': file.name,
      'Idempotency-Key': createIdempotencyKey(),
    }, body: file },
  );
};
export const getContractDocumentDownload = (accessToken: string, tenantId: string, documentId: string) =>
  apiRequest<{ data: { signed_url: string; expires_in: number } }>(
    `/corporate/documents/${encodeURIComponent(documentId)}/download?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'POST', accessToken },
  );
export const listContractApprovalPolicies = (accessToken: string, tenantId: string) =>
  apiRequest<{ data: Array<Record<string, unknown>> }>(
    `/corporate/approval-policies?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const createContractApprovalPolicy = (
  accessToken: string, payload: {
    tenant_id: string; policy_name: string; contract_type: 'master' | 'statement_of_work' | 'amendment';
    currency: string; min_amount: string; max_amount?: string | null;
    steps: Array<{ required_permission_key: string; required_role_key?: string | null; minimum_approvals: number }>;
  },
) => apiRequest<{ data: { id: string; policy_name: string } }>('/corporate/approval-policies', {
  method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
  body: JSON.stringify(payload),
});
export const submitContractPolicyReview = (accessToken: string, tenantId: string, contractId: string) =>
  apiRequest<{ data: { id: string; status: string; approval_count: number } }>(
    `/corporate/contracts/${encodeURIComponent(contractId)}/submit-policy-review?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() } },
  );
export const decideContractApproval = (
  accessToken: string, contractId: string, payload: {
    tenant_id: string; approval_id: string; decision: 'approved' | 'rejected'; reason: string;
  },
) => apiRequest<{ data: { approval_id: string; contract_status: string } }>(
  `/corporate/contracts/${encodeURIComponent(contractId)}/policy-decision`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify(payload) },
);
export const requestContractRenewal = (
  accessToken: string, contractId: string, payload: {
    tenant_id: string; renewal_type: 'renewal' | 'extension'; requested_start?: string | null;
    requested_end: string; requested_terms?: string | null;
  },
) => apiRequest<{ data: { id: string; status: string } }>(
  `/corporate/contracts/${encodeURIComponent(contractId)}/renewals`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify(payload) },
);
export const changeContractLifecycle = (
  accessToken: string, tenantId: string, contractId: string,
  action: 'suspend' | 'terminate', reason: string,
) => apiRequest<{ data: { id: string; status: string } }>(
  `/corporate/contracts/${encodeURIComponent(contractId)}/${action}`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ tenant_id: tenantId, reason }) },
);
export const listCorporateInvoices = (accessToken: string, tenantId: string) =>
  apiRequest<{ data: ContractInvoice[] }>(
    `/corporate/invoices?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const createCorporateInvoice = (
  accessToken: string, contractId: string, payload: {
    tenant_id: string; invoice_number: string; title: string; currency: string;
    due_at?: string | null;
    lines: Array<{ service_key: string; quantity: string }>;
  },
) => apiRequest<{ data: { id: string; status: string; total_amount: string } }>(
  `/corporate/contracts/${encodeURIComponent(contractId)}/invoices`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify(payload) },
);
export const issueCorporateInvoice = (accessToken: string, tenantId: string, invoiceId: string) =>
  apiRequest<{ data: { id: string; status: string; invoice_number: string } }>(
    `/corporate/invoices/${encodeURIComponent(invoiceId)}/issue?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() } },
  );
export const createPaymentReference = (
  accessToken: string, invoiceId: string, payload: {
    tenant_id: string; reference_number: string; payment_method: string; amount: string;
  },
) => apiRequest<{ data: { id: string; status: string; payment_confirmed: false } }>(
  `/corporate/invoices/${encodeURIComponent(invoiceId)}/payment-references`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify(payload) },
);
export const listPaymentReferences = (accessToken: string, tenantId: string, invoiceId: string) =>
  apiRequest<{ data: ContractPaymentReference[] }>(
    `/corporate/invoices/${encodeURIComponent(invoiceId)}/payment-references?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const getEffectiveContractEntitlements = (accessToken: string, tenantId: string) =>
  apiRequest<{ data: ContractEntitlement[] }>(
    `/corporate/entitlements/effective?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );


export type CorporateAIWorker = {
  id: string; contract_id: string; service_key: string; worker_code: string;
  display_name: string; model_provider: string; model_key: string;
  capabilities: string[]; status: 'draft' | 'active' | 'suspended' | 'retired';
  created_at: string; updated_at: string;
};
export const listCorporateAIWorkers = (accessToken: string, tenantId: string) =>
  apiRequest<{ data: CorporateAIWorker[] }>(
    `/corporate/ai-workers?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const createCorporateAIWorker = (
  accessToken: string, payload: {
    tenant_id: string; contract_id: string; service_key: string;
    worker_code: string; display_name: string; model_provider: string; model_key: string;
    capabilities?: string[]; runtime_config?: Record<string, unknown>;
  },
) => apiRequest<{ data: { id: string; status: string; worker_code: string } }>(
  '/corporate/ai-workers',
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify(payload) },
);
export const activateCorporateAIWorker = (accessToken: string, tenantId: string, workerId: string) =>
  apiRequest<{ data: { id: string; status: string } }>(
    `/corporate/ai-workers/${encodeURIComponent(workerId)}/activate?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() } },
  );
export const suspendCorporateAIWorker = (accessToken: string, tenantId: string, workerId: string) =>
  apiRequest<{ data: { id: string; status: string } }>(
    `/corporate/ai-workers/${encodeURIComponent(workerId)}/suspend?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() } },
  );


export type ContractVersionRecord = {
  id: string; version_number: number; version_status: string; scope_summary: string;
  content_hash: string; parent_version_id: string | null; change_summary: string | null;
  effective_from: string | null; created_by: string; created_at: string; approved_at: string | null;
};
export type ContractRenewalRecord = {
  id: string; renewal_type: string; requested_start: string | null; requested_end: string;
  requested_terms: string | null; status: string; requested_by: string;
  created_at: string; decided_by: string | null; decided_at: string | null;
};
export const listContractVersions = (accessToken: string, tenantId: string, contractId: string) =>
  apiRequest<{ data: ContractVersionRecord[] }>(
    `/corporate/contracts/${encodeURIComponent(contractId)}/versions?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const listContractRenewals = (accessToken: string, tenantId: string, contractId: string) =>
  apiRequest<{ data: ContractRenewalRecord[] }>(
    `/corporate/contracts/${encodeURIComponent(contractId)}/renewals?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const decideContractRenewal = (
  accessToken: string, tenantId: string, renewalId: string,
  decision: 'approved' | 'rejected', reason: string,
) => apiRequest<{ data: { id: string; status: string } }>(
  `/corporate/renewals/${encodeURIComponent(renewalId)}/decision?${new URLSearchParams({tenant_id:tenantId,decision,reason}).toString()}`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() } },
);
export const revokeContractApprovalDelegation = (
  accessToken: string, tenantId: string, delegationId: string,
) => apiRequest<{ data: { id: string; status: string } }>(
  `/corporate/approval-delegations/${encodeURIComponent(delegationId)}/revoke?tenant_id=${encodeURIComponent(tenantId)}`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() } },
);
export const submitPaymentReference = (
  accessToken: string, referenceId: string, tenantId: string, externalReference: string,
) => apiRequest<{ data: { id: string; status: string; payment_confirmed: false } }>(
  `/corporate/payment-references/${encodeURIComponent(referenceId)}/submit`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({tenant_id:tenantId,external_reference:externalReference}) },
);
export const getCorporateInvoice = (accessToken: string, tenantId: string, invoiceId: string) =>
  apiRequest<{ data: ContractInvoice & { lines: Array<Record<string, unknown>> } }>(
    `/corporate/invoices/${encodeURIComponent(invoiceId)}?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );

export type ContractApprovalDelegation = {
  id: string; delegator_user_id: string; delegatee_user_id: string;
  starts_at: string; ends_at: string; reason: string; status: string;
  created_at: string; revoked_at: string | null;
};
export const listContractApprovalDelegations = (accessToken: string, tenantId: string) =>
  apiRequest<{ data: ContractApprovalDelegation[] }>(
    `/corporate/approval-delegations?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'GET', accessToken },
  );
export const createContractApprovalDelegation = (
  accessToken: string, payload: {
    tenant_id: string; delegatee_user_id: string; starts_at: string; ends_at: string; reason: string;
  },
) => apiRequest<{ data: { id: string; status: string } }>('/corporate/approval-delegations', {
  method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
  body: JSON.stringify(payload),
});
export const archiveContractDocument = (accessToken: string, tenantId: string, documentId: string) =>
  apiRequest<{ data: { id: string; status: string } }>(
    `/corporate/documents/${encodeURIComponent(documentId)}/archive?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() } },
  );

export const verifyPaymentReference = (
  accessToken: string, referenceId: string, payload: {
    tenant_id: string; decision: 'approved' | 'rejected';
    evidence_reference: string; reason: string;
  },
) => apiRequest<{ data: { id: string; status: string; payment_confirmed: boolean } }>(
  `/corporate/payment-references/${encodeURIComponent(referenceId)}/verify`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify(payload) },
);

export const updateContractSignatureStatus = (
  accessToken: string, tenantId: string, contractId: string,
  payload: { status: 'pending'|'signed'|'rejected'|'cancelled'|'expired'; provider?: string; signature_reference?: string; reason?: string },
) => apiRequest<{ data: { id: string; signature_status: string } }>(
  `/corporate/contracts/${encodeURIComponent(contractId)}/signature-status`,
  { method: 'PATCH', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({tenant_id:tenantId,...payload}) },
);

export type CorporateProviderProfile = {
  id: string; provider_code: string; provider_name: string;
  provider_type: 'isp'|'telecom'|'managed_service'|'technology'|'other';
  registration_number: string | null; contact_email: string | null; contact_phone: string | null;
  service_regions: string[]; status: 'draft'|'active'|'suspended'|'archived';
  created_at: string; updated_at: string;
};
export const listCorporateProviderProfiles = (accessToken: string, tenantId: string) =>
  apiRequest<{data:CorporateProviderProfile[]}>(
    `/corporate/provider-profiles?tenant_id=${encodeURIComponent(tenantId)}`,
    {method:'GET',accessToken},
  );
export const createCorporateProviderProfile = (accessToken: string, payload: {
  tenant_id:string;provider_code:string;provider_name:string;provider_type:CorporateProviderProfile['provider_type'];
  registration_number?:string|null;contact_email?:string|null;contact_phone?:string|null;
  service_regions?:string[];service_metadata?:Record<string,unknown>;
}) => apiRequest<{data:{id:string;status:string}}>('/corporate/provider-profiles',{
  method:'POST',accessToken,headers:{'Idempotency-Key':createIdempotencyKey()},body:JSON.stringify(payload),
});
export const updateCorporateProviderProfile = (accessToken:string,providerId:string,payload:{
  tenant_id:string;provider_name?:string;provider_type?:CorporateProviderProfile['provider_type'];
  registration_number?:string|null;contact_email?:string|null;contact_phone?:string|null;
  service_regions?:string[];service_metadata?:Record<string,unknown>;
}) => apiRequest<{data:{id:string;status:string}}>(
  `/corporate/provider-profiles/${encodeURIComponent(providerId)}`,
  {method:'PATCH',accessToken,headers:{'Idempotency-Key':createIdempotencyKey()},body:JSON.stringify(payload)},
);
export const updateCorporateProviderProfileStatus = (accessToken:string,tenantId:string,providerId:string,status:'active'|'suspended'|'archived',reason:string) =>
  apiRequest<{data:{id:string;status:string}}>(
    `/corporate/provider-profiles/${encodeURIComponent(providerId)}/status?${new URLSearchParams({tenant_id:tenantId,status,reason}).toString()}`,
    {method:'PATCH',accessToken,headers:{'Idempotency-Key':createIdempotencyKey()}},
  );

export type ContractOperationalMetrics = {
  active_contracts:number; draft_contracts:number; pending_approvals:number;
  expired_contracts:number; expiring_30_days:number; pending_renewals:number;
  quarantined_documents:number; available_documents:number;
  outstanding_invoices:number; outstanding_amount:string; as_of:string;
};
export const getContractOperationalMetrics = (accessToken:string,tenantId:string) =>
  apiRequest<{data:ContractOperationalMetrics}>(
    `/corporate/metrics/contracts?tenant_id=${encodeURIComponent(tenantId)}`,
    {method:'GET',accessToken},
  );

export const activateCorporateContract = (
  accessToken: string, tenantId: string, contractId: string,
) => apiRequest<{ data: { id: string; status: string; replayed?: boolean } }>(
  `/corporate/contracts/${encodeURIComponent(contractId)}/activate?${new URLSearchParams({tenant_id:tenantId}).toString()}`,
  { method: 'POST', accessToken, headers: { 'Idempotency-Key': createIdempotencyKey() } },
);


// Human Workforce Passport & Onboarding — Phase 04 typed API contracts.
export type WorkforceLifecycleStatus = "invited"|"registered"|"identity_pending"|"verified"|"onboarding"|"eligible"|"active"|"inactive"|"suspended"|"offboarded";
export type WorkforceProfile = {
  id:string; tenant_id:string; user_id:string; membership_id:string|null; worker_code:string;
  display_name:string; legal_name:string|null; job_family:string|null; job_title:string|null;
  lifecycle_status:WorkforceLifecycleStatus; engagement_status:string; timezone:string; locale:string;
  experience_years:number; profile_metadata:Record<string,unknown>; created_at:string; updated_at:string;
};
export type WorkforcePassport = WorkforceProfile & {
  engagements:Record<string,unknown>[]; skills:Record<string,unknown>[]; certifications:Record<string,unknown>[];
  availability:Record<string,unknown>[]; training:Record<string,unknown>[]; assignments:Record<string,unknown>[];
  onboarding:Record<string,unknown>[]; history:Record<string,unknown>[];
};
export type WorkforcePage<T> = {data:T[]};
const workforcePath=(path:string,tenantId:string)=>`/workforce/${path}${path.includes("?")?"&":"?"}tenant_id=${encodeURIComponent(tenantId)}`;
export const getMyWorkforcePassport=(accessToken:string,tenantId:string)=>
  apiRequest<{data:WorkforcePassport}>(workforcePath("passport",tenantId),{method:"GET",accessToken});
export const listWorkforceProfiles=(accessToken:string,tenantId:string,status?:WorkforceLifecycleStatus)=>
  apiRequest<WorkforcePage<WorkforceProfile>>(workforcePath(`profiles${status?`?status=${encodeURIComponent(status)}`:""}`,tenantId),{method:"GET",accessToken});
export const createWorkforceProfile=(accessToken:string,payload:{
  tenant_id:string;user_id:string;membership_id:string;worker_code:string;display_name:string;
  legal_name?:string|null;job_family?:string|null;job_title?:string|null;timezone?:string;locale?:string;
  experience_years?:number;profile_metadata?:Record<string,unknown>;
})=>apiRequest<{data:WorkforceProfile}>("/workforce/profiles",{method:"POST",accessToken,
  headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const updateWorkforceProfile=(accessToken:string,profileId:string,payload:Record<string,unknown>&{tenant_id:string})=>
  apiRequest<{data:WorkforceProfile}>(`/workforce/profiles/${encodeURIComponent(profileId)}`,{method:"PATCH",accessToken,
    headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const submitWorkforceIdentity=(accessToken:string,profileId:string,payload:{
  tenant_id:string;verification_type?:string;
})=>apiRequest<{data:Record<string,unknown>}>(`/workforce/profiles/${encodeURIComponent(profileId)}/identity`,{
  method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const decideWorkforceIdentity=(accessToken:string,verificationId:string,payload:{
  tenant_id:string;decision:"verified"|"rejected"|"in_review";reason:string;reviewer_notes?:string;expires_at?:string|null;
})=>apiRequest<{data:Record<string,unknown>}>(`/workforce/identity/${encodeURIComponent(verificationId)}/decision`,{
  method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const registerWorkforceIdentityDocument=(accessToken:string,verificationId:string,payload:{
  tenant_id:string;verification_id:string;storage_path:string;document_type:string;original_filename:string;
  content_type:"application/pdf"|"image/jpeg"|"image/png";file_size_bytes:number;sha256:string;retention_until?:string|null;
})=>apiRequest<{data:Record<string,unknown>}>(`/workforce/identity/${encodeURIComponent(verificationId)}/documents`,{
  method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const getWorkforceDocumentDownload=(accessToken:string,tenantId:string,documentId:string)=>
  apiRequest<{data:{document_id:string;filename:string;signed_url:string;expires_in_seconds:number}}>(
    `/workforce/documents/${encodeURIComponent(documentId)}/download?tenant_id=${encodeURIComponent(tenantId)}`,{method:"POST",accessToken});
export const listWorkforceEngagements=(accessToken:string,tenantId:string,profileId:string)=>
  apiRequest<WorkforcePage<Record<string,unknown>>>(`/workforce/profiles/${encodeURIComponent(profileId)}/engagements?tenant_id=${encodeURIComponent(tenantId)}`,{method:"GET",accessToken});
export const createWorkforceEngagement=(accessToken:string,profileId:string,payload:Record<string,unknown>&{tenant_id:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/profiles/${encodeURIComponent(profileId)}/engagements`,{
    method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const listWorkforceSkills=(accessToken:string,tenantId:string)=>
  apiRequest<WorkforcePage<Record<string,unknown>>>(`/workforce/skills?tenant_id=${encodeURIComponent(tenantId)}`,{method:"GET",accessToken});
export const createWorkforceSkill=(accessToken:string,payload:{tenant_id:string;skill_key:string;name:string;category:string;description?:string})=>
  apiRequest<{data:Record<string,unknown>}>("/workforce/skills",{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const addWorkforceSkill=(accessToken:string,profileId:string,payload:{tenant_id:string;skill_id:string;proficiency:string;experience_months:number;evidence_reference?:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/profiles/${encodeURIComponent(profileId)}/skills`,{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const addWorkforceCertification=(accessToken:string,profileId:string,payload:Record<string,unknown>&{tenant_id:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/profiles/${encodeURIComponent(profileId)}/certifications`,{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const verifyWorkforceCertification=(accessToken:string,tenantId:string,certificationId:string,decision:"verified"|"rejected",reason:string)=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/certifications/${encodeURIComponent(certificationId)}/verify?${new URLSearchParams({tenant_id:tenantId,decision,reason})}`,{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()}});
export const listWorkforceAvailability=(accessToken:string,tenantId:string,profileId:string,startsAt?:string,endsAt?:string)=>{
  const q=new URLSearchParams({tenant_id:tenantId});if(startsAt)q.set("starts_at",startsAt);if(endsAt)q.set("ends_at",endsAt);
  return apiRequest<WorkforcePage<Record<string,unknown>>>(`/workforce/profiles/${encodeURIComponent(profileId)}/availability?${q}`,{method:"GET",accessToken});
};
export const createWorkforceAvailability=(accessToken:string,profileId:string,payload:Record<string,unknown>&{tenant_id:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/profiles/${encodeURIComponent(profileId)}/availability`,{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const listWorkforceCourses=(accessToken:string,tenantId:string)=>
  apiRequest<WorkforcePage<Record<string,unknown>>>(`/workforce/training/courses?tenant_id=${encodeURIComponent(tenantId)}`,{method:"GET",accessToken});
export const createWorkforceCourse=(accessToken:string,payload:Record<string,unknown>&{tenant_id:string})=>
  apiRequest<{data:Record<string,unknown>}>("/workforce/training/courses",{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const enrollWorkforceTraining=(accessToken:string,profileId:string,payload:{tenant_id:string;course_id:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/profiles/${encodeURIComponent(profileId)}/training/enroll`,{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const updateWorkforceTrainingProgress=(accessToken:string,enrollmentId:string,payload:Record<string,unknown>&{tenant_id:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/training/enrollments/${encodeURIComponent(enrollmentId)}`,{method:"PATCH",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const listWorkforceOnboarding=(accessToken:string,tenantId:string,profileId:string)=>
  apiRequest<WorkforcePage<Record<string,unknown>>>(`/workforce/profiles/${encodeURIComponent(profileId)}/onboarding?tenant_id=${encodeURIComponent(tenantId)}`,{method:"GET",accessToken});
export const createWorkforceOnboardingTask=(accessToken:string,profileId:string,payload:Record<string,unknown>&{tenant_id:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/profiles/${encodeURIComponent(profileId)}/onboarding`,{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const updateWorkforceOnboardingTask=(accessToken:string,taskId:string,payload:{tenant_id:string;status:"in_progress"|"completed"|"waived"|"blocked";reason:string;completion_reference?:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/onboarding/tasks/${encodeURIComponent(taskId)}`,{method:"PATCH",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const transitionWorkforceLifecycle=(accessToken:string,profileId:string,payload:{tenant_id:string;to_status:WorkforceLifecycleStatus;reason:string;metadata?:Record<string,unknown>})=>
  apiRequest<{data:WorkforceProfile}>(`/workforce/profiles/${encodeURIComponent(profileId)}/lifecycle`,{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const listWorkforceAssignments=(accessToken:string,tenantId:string,profileId:string)=>
  apiRequest<WorkforcePage<Record<string,unknown>>>(`/workforce/profiles/${encodeURIComponent(profileId)}/assignments?tenant_id=${encodeURIComponent(tenantId)}`,{method:"GET",accessToken});
export const createWorkforceAssignment=(accessToken:string,profileId:string,payload:Record<string,unknown>&{tenant_id:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/profiles/${encodeURIComponent(profileId)}/assignments`,{method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});

export const registerMyWorkforceProfile=(accessToken:string,payload:{
  tenant_id:string;worker_code:string;display_name:string;legal_name?:string|null;
  job_family?:string|null;job_title?:string|null;timezone?:string;experience_years?:number;
})=>apiRequest<{data:WorkforceProfile}>("/workforce/register",{method:"POST",accessToken,
  headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const listWorkforceIdentityVerifications=(accessToken:string,tenantId:string,status:"pending"|"in_review"|"verified"|"rejected"|"expired"|"all"="pending")=>
  apiRequest<WorkforcePage<Record<string,unknown>>>(`/workforce/identity/verifications?tenant_id=${encodeURIComponent(tenantId)}&status=${status}`,{method:"GET",accessToken});

export const uploadWorkforceIdentityDocument=(accessToken:string,tenantId:string,verificationId:string,file:File,documentType:string)=>{
  const form=new FormData();
  form.append('file',file);
  return apiRequest<{data:Record<string,unknown>}>(
    `/workforce/identity/${encodeURIComponent(verificationId)}/upload?tenant_id=${encodeURIComponent(tenantId)}&document_type=${encodeURIComponent(documentType)}`,
    {method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:form},
  );
};

export const verifyWorkforceSkill=(accessToken:string,tenantId:string,workerSkillId:string,reason:string)=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/skills/${encodeURIComponent(workerSkillId)}/verify`,{
    method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},
    body:JSON.stringify({tenant_id:tenantId,reason})});
export const renewWorkforceCertification=(accessToken:string,certificationId:string,payload:{
  tenant_id:string;certificate_reference:string;issued_at?:string|null;valid_from:string;expires_at?:string|null;
  evidence_metadata?:Record<string,unknown>;
})=>apiRequest<{data:Record<string,unknown>}>(`/workforce/certifications/${encodeURIComponent(certificationId)}/renew`,{
  method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const activateWorkforceEngagement=(accessToken:string,engagementId:string,payload:{tenant_id:string;reason:string})=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/engagements/${encodeURIComponent(engagementId)}/activate`,{
    method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify(payload)});
export const changeWorkforceEngagementStatus=(accessToken:string,engagementId:string,tenantId:string,targetStatus:"suspended"|"ended",reason:string)=>
  apiRequest<{data:Record<string,unknown>}>(`/workforce/engagements/${encodeURIComponent(engagementId)}/status?${new URLSearchParams({tenant_id:tenantId,target_status:targetStatus})}`,{
    method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify({tenant_id:tenantId,reason})});
export const redactWorkforceDocument=(accessToken:string,tenantId:string,documentId:string,reason:string)=>
  apiRequest<{data:{document_id:string;redacted:boolean}}>(`/workforce/documents/${encodeURIComponent(documentId)}/redact?tenant_id=${encodeURIComponent(tenantId)}`,{
    method:"POST",accessToken,headers:{"Idempotency-Key":createIdempotencyKey()},body:JSON.stringify({tenant_id:tenantId,reason})});
