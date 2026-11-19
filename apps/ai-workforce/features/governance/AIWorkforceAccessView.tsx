'use client';

import React, { useMemo, useState } from 'react';
import { Building2, RefreshCw, ShieldCheck, UserPlus, Users } from 'lucide-react';
import type {
  AgentzyBranch,
  AgentzyDepartment,
  AgentzyOrganization,
  AgentzyOrganizationUnit,
  AgentzyRoleTemplate,
  AgentzyTenantMembership,
  InviteTenantMemberInput,
  ReassignMembershipHierarchyInput,
} from '@/apps/web/lib/api-client';

type Props = {
  tenantId: string;
  tenantName: string;
  memberships: AgentzyTenantMembership[];
  roles: AgentzyRoleTemplate[];
  organizations: AgentzyOrganization[];
  organizationUnits: AgentzyOrganizationUnit[];
  branches: AgentzyBranch[];
  departments: AgentzyDepartment[];
  loading: boolean;
  error: string | null;
  onInvite: (payload: InviteTenantMemberInput) => Promise<void>;
  onReplaceRole: (membershipId: string, roleKey: string) => Promise<void>;
  onActivate: (membershipId: string) => Promise<void>;
  onSuspend: (membershipId: string) => Promise<void>;
  onRevoke: (membershipId: string) => Promise<void>;
  onReassign: (membershipId: string, payload: ReassignMembershipHierarchyInput) => Promise<void>;
};

type ScopeDraft = ReassignMembershipHierarchyInput;

export function AIWorkforceAccessView({
  tenantId,
  tenantName,
  memberships,
  roles,
  organizations,
  organizationUnits,
  branches,
  departments,
  loading,
  error,
  onInvite,
  onReplaceRole,
  onActivate,
  onSuspend,
  onRevoke,
  onReassign,
}: Props) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviteScope, setInviteScope] = useState<ScopeDraft>({
    organization_id: '',
    organization_unit_id: '',
    branch_id: '',
    department_id: '',
  });
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [scopeDrafts, setScopeDrafts] = useState<Record<string, ScopeDraft>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const tenantRoles = useMemo(
    () => roles.filter((role) => role.scope_type === 'tenant' && (role.tenant_id === null || role.tenant_id === tenantId)),
    [roles, tenantId],
  );
  const activeOrganizations = organizations.filter((item) => item.status === 'active');
  const activeUnits = organizationUnits.filter((item) => item.status === 'active');
  const activeBranches = branches.filter((item) => item.status === 'active');
  const activeDepartments = departments.filter((item) => item.status === 'active');

  const run = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key);
    setActionError(null);
    try {
      await action();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Perubahan akses tidak dapat disimpan.');
    } finally {
      setBusyKey(null);
    }
  };

  const submitInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteRole) {
      setActionError('Pilih role tenant sebelum mengirim undangan.');
      return;
    }
    await run('invite', async () => {
      await onInvite({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role_key: inviteRole,
        organization_id: inviteScope.organization_id || null,
        organization_unit_id: inviteScope.organization_unit_id || null,
        branch_id: inviteScope.branch_id || null,
        department_id: inviteScope.department_id || null,
      });
      setEmail('');
      setFullName('');
      setInviteScope({ organization_id: '', organization_unit_id: '', branch_id: '', department_id: '' });
    });
  };

  const scopeFor = (member: AgentzyTenantMembership): ScopeDraft =>
    scopeDrafts[member.id] ?? {
      organization_id: member.organization_id ?? '',
      organization_unit_id: member.organization_unit_id ?? '',
      branch_id: member.branch_id ?? '',
      department_id: member.department_id ?? '',
    };

  const updateScope = (memberId: string, patch: Partial<ScopeDraft>) => {
    setScopeDrafts((current) => ({
      ...current,
      [memberId]: { ...(current[memberId] ?? { organization_id: '', organization_unit_id: '', branch_id: '', department_id: '' }), ...patch },
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">Tenant Identity &amp; Access Control</p>
          <h2 className="text-lg font-bold text-[#17324D]">Membership, Role &amp; Hierarchy</h2>
          <p className="text-xs text-[#526675]">Semua perubahan diproses melalui FastAPI dan audit lifecycle tenant.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[9px] border border-[#D8E3E9] bg-white px-3 py-2 text-xs font-semibold text-[#17324D]">
          <Building2 className="h-4 w-4 text-[#0284C7]" /> {tenantName}
        </div>
      </div>

      {(error || actionError) && (
        <div role="alert" className="rounded-[10px] border border-[#E7B9B9] bg-[#FFF6F6] px-3 py-2 text-xs text-[#A33A3A]">
          {actionError ?? error}
        </div>
      )}

      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-[#0284C7]" />
          <h3 className="text-sm font-bold text-[#17324D]">Undang anggota tenant</h3>
        </div>
        <form onSubmit={submitInvite} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-[#526675]">
            Nama lengkap
            <input required minLength={1} maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-10 w-full rounded-[8px] border border-[#D8E3E9] px-3 text-sm font-normal text-[#17324D]" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[#526675]">
            Email
            <input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 w-full rounded-[8px] border border-[#D8E3E9] px-3 text-sm font-normal text-[#17324D]" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[#526675]">
            Role tenant
            <select required value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="h-10 w-full rounded-[8px] border border-[#D8E3E9] bg-white px-3 text-sm font-normal text-[#17324D]">
              <option value="">Pilih role</option>
              {tenantRoles.map((role) => <option key={role.id} value={role.key}>{role.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-[#526675]">
            Organisasi
            <select value={inviteScope.organization_id ?? ''} onChange={(event) => setInviteScope({ organization_id: event.target.value, organization_unit_id: '', branch_id: '', department_id: '' })} className="h-10 w-full rounded-[8px] border border-[#D8E3E9] bg-white px-3 text-sm font-normal text-[#17324D]">
              <option value="">Seluruh tenant</option>
              {activeOrganizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-[#526675]">
            Unit organisasi
            <select value={inviteScope.organization_unit_id ?? ''} disabled={!inviteScope.organization_id} onChange={(event) => setInviteScope((current) => ({ ...current, organization_unit_id: event.target.value, branch_id: '', department_id: '' }))} className="h-10 w-full rounded-[8px] border border-[#D8E3E9] bg-white px-3 text-sm font-normal text-[#17324D] disabled:bg-[#F5F8FA]">
              <option value="">Semua unit</option>
              {activeUnits.filter((item) => item.organization_id === inviteScope.organization_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-[#526675]">
            Cabang
            <select value={inviteScope.branch_id ?? ''} disabled={!inviteScope.organization_id} onChange={(event) => setInviteScope((current) => ({ ...current, branch_id: event.target.value, department_id: '' }))} className="h-10 w-full rounded-[8px] border border-[#D8E3E9] bg-white px-3 text-sm font-normal text-[#17324D] disabled:bg-[#F5F8FA]">
              <option value="">Semua cabang</option>
              {activeBranches.filter((item) => item.organization_id === inviteScope.organization_id && item.organization_unit_id === (inviteScope.organization_unit_id || null)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-[#526675] md:col-span-2">
            Departemen
            <select value={inviteScope.department_id ?? ''} disabled={!inviteScope.organization_id} onChange={(event) => setInviteScope((current) => ({ ...current, department_id: event.target.value }))} className="h-10 w-full rounded-[8px] border border-[#D8E3E9] bg-white px-3 text-sm font-normal text-[#17324D] disabled:bg-[#F5F8FA]">
              <option value="">Semua departemen</option>
              {activeDepartments.filter((item) => item.organization_id === inviteScope.organization_id && item.branch_id === (inviteScope.branch_id || null)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={busyKey === 'invite' || loading || tenantRoles.length === 0} className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#0284C7] px-4 text-xs font-semibold text-white disabled:opacity-40">
              <UserPlus className="h-4 w-4" /> {busyKey === 'invite' ? 'Mengirim undangan…' : 'Kirim undangan'}
            </button>
          </div>
        </form>
        {tenantRoles.length === 0 && <p className="mt-3 text-xs text-[#A36B16]">Tidak ada role tenant yang tersedia pada registry untuk tenant ini.</p>}
      </section>

      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0284C7]" />
            <h3 className="text-sm font-bold text-[#17324D]">Anggota tenant ({memberships.length})</h3>
          </div>
          {loading && <span className="text-[11px] text-[#718391]">Memuat…</span>}
        </div>
        {memberships.length === 0 && !loading ? (
          <div className="rounded-[10px] bg-[#F5F8FA] px-4 py-6 text-center text-xs text-[#718391]">Belum ada membership pada tenant ini.</div>
        ) : (
          <div className="space-y-3">
            {memberships.map((member) => {
              const scope = scopeFor(member);
              const roleValue = roleDrafts[member.id] ?? member.role_keys[0] ?? '';
              const rowBusy = busyKey === member.id;
              return (
                <article key={member.id} className="rounded-[11px] border border-[#E4EDF2] p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#17324D]">{member.display_name || member.email || member.user_id}</p>
                      <p className="mt-0.5 text-[11px] text-[#718391]">{member.email || 'Email tidak tersedia'} · {member.status}</p>
                      <p className="mt-1 text-[11px] text-[#526675]">Role: {member.role_keys.join(', ') || '—'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.status === 'active' && <button type="button" disabled={rowBusy} onClick={() => void run(member.id, () => onSuspend(member.id))} className="h-8 rounded-[7px] border border-[#D8E3E9] px-3 text-[11px] font-semibold text-[#526675] disabled:opacity-40">Suspend</button>}
                      {member.status === 'suspended' && <button type="button" disabled={rowBusy} onClick={() => void run(member.id, () => onActivate(member.id))} className="h-8 rounded-[7px] border border-[#A7D8C0] bg-[#F2FBF6] px-3 text-[11px] font-semibold text-[#247A55] disabled:opacity-40">Aktifkan</button>}
                      {['active', 'invited', 'suspended'].includes(member.status) && <button type="button" disabled={rowBusy} onClick={() => void run(member.id, () => onRevoke(member.id))} className="h-8 rounded-[7px] border border-[#E7B9B9] px-3 text-[11px] font-semibold text-[#A33A3A] disabled:opacity-40">Cabut akses</button>}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="flex gap-2">
                      <select value={roleValue} onChange={(event) => setRoleDrafts((current) => ({ ...current, [member.id]: event.target.value }))} className="h-9 min-w-0 flex-1 rounded-[8px] border border-[#D8E3E9] bg-white px-2 text-xs text-[#17324D]">
                        <option value="">Pilih role</option>
                        {tenantRoles.map((role) => <option key={role.id} value={role.key}>{role.name}</option>)}
                      </select>
                      <button type="button" disabled={!roleValue || rowBusy || member.role_keys.length === 1 && roleValue === member.role_keys[0]} onClick={() => void run(member.id, () => onReplaceRole(member.id, roleValue))} className="h-9 rounded-[8px] border border-[#D8E3E9] px-3 text-[11px] font-semibold text-[#17324D] disabled:opacity-40">Ganti role</button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#718391]"><ShieldCheck className="h-4 w-4 text-[#0284C7]" /> Perubahan role dan scope tercatat pada audit tenant.</div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <select value={scope.organization_id ?? ''} onChange={(event) => updateScope(member.id, { organization_id: event.target.value, organization_unit_id: '', branch_id: '', department_id: '' })} className="h-9 rounded-[8px] border border-[#D8E3E9] bg-white px-2 text-[11px] text-[#17324D]">
                      <option value="">Seluruh tenant</option>
                      {activeOrganizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <select value={scope.organization_unit_id ?? ''} disabled={!scope.organization_id} onChange={(event) => updateScope(member.id, { organization_unit_id: event.target.value, branch_id: '', department_id: '' })} className="h-9 rounded-[8px] border border-[#D8E3E9] bg-white px-2 text-[11px] text-[#17324D] disabled:bg-[#F5F8FA]">
                      <option value="">Semua unit</option>
                      {activeUnits.filter((item) => item.organization_id === scope.organization_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <select value={scope.branch_id ?? ''} disabled={!scope.organization_id} onChange={(event) => updateScope(member.id, { branch_id: event.target.value, department_id: '' })} className="h-9 rounded-[8px] border border-[#D8E3E9] bg-white px-2 text-[11px] text-[#17324D] disabled:bg-[#F5F8FA]">
                      <option value="">Semua cabang</option>
                      {activeBranches.filter((item) => item.organization_id === scope.organization_id && item.organization_unit_id === (scope.organization_unit_id || null)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <select value={scope.department_id ?? ''} disabled={!scope.organization_id} onChange={(event) => updateScope(member.id, { department_id: event.target.value })} className="h-9 rounded-[8px] border border-[#D8E3E9] bg-white px-2 text-[11px] text-[#17324D] disabled:bg-[#F5F8FA]">
                      <option value="">Semua departemen</option>
                      {activeDepartments.filter((item) => item.organization_id === scope.organization_id && item.branch_id === (scope.branch_id || null)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button type="button" disabled={rowBusy || (
                      scope.organization_id === (member.organization_id ?? '') &&
                      scope.organization_unit_id === (member.organization_unit_id ?? '') &&
                      scope.branch_id === (member.branch_id ?? '') &&
                      scope.department_id === (member.department_id ?? '')
                    )} onClick={() => void run(member.id, () => onReassign(member.id, { organization_id: scope.organization_id || null, organization_unit_id: scope.organization_unit_id || null, branch_id: scope.branch_id || null, department_id: scope.department_id || null }))} className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-[#D8E3E9] px-3 text-[11px] font-semibold text-[#17324D] disabled:opacity-40">
                      <RefreshCw className="h-3.5 w-3.5" /> Simpan assignment
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
