'use client';

import React, { useState } from 'react';
import {
  Building2,
  UserPlus,
  Users,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import { CORPORATE_ROLE_OPTIONS } from '../../lib/corporate-data';
import type { CorporateRoleKey, CorporateTenant, CorporateUserMember } from '../../lib/corporate-types';
import type { AgentzyOrganization, AgentzyOrganizationUnit, AgentzyBranch, AgentzyDepartment } from '@/apps/web/lib/api-client';

export function OrganizationUsersView({
  tenant,
  users,
  organizations,
  organizationUnits,
  branches,
  departments,
  canManageOrganization,
  onCreateOrganization,
  onOpenInviteModal,
  onReplaceMembershipRole,
  onReassignMembership,
  onActivateMembership,
  onSuspendMembership,
  onRevokeMembership,
  onBack,
}: {
  tenant: CorporateTenant;
  users: CorporateUserMember[];
  organizations: AgentzyOrganization[];
  organizationUnits: AgentzyOrganizationUnit[];
  branches: AgentzyBranch[];
  departments: AgentzyDepartment[];
  canManageOrganization: boolean;
  onCreateOrganization: (payload: { name: string; slug: string; organization_type: 'company' | 'division' | 'department' | 'branch' | 'team'; parent_id?: string | null }) => Promise<void>;
  onOpenInviteModal: () => void;
  onReplaceMembershipRole: (membershipId: string, roleKey: CorporateRoleKey) => Promise<void>;
  onReassignMembership: (membershipId: string, assignment: { organization_id: string | null; organization_unit_id: string | null; branch_id: string | null; department_id: string | null }) => Promise<void>;
  onActivateMembership: (membershipId: string) => Promise<void>;
  onSuspendMembership: (membershipId: string) => Promise<void>;
  onRevokeMembership: (membershipId: string) => Promise<void>;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'organisasi' | 'pengguna' | 'role'>('organisasi');
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'company' | 'division' | 'department' | 'branch' | 'team'>('department');
  const [orgParentId, setOrgParentId] = useState('');
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgSaving, setOrgSaving] = useState(false);
  const [savingMembershipId, setSavingMembershipId] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, { organization_id: string; organization_unit_id: string; branch_id: string; department_id: string }>>({});

  const runMembershipAction = async (membershipId: string, action: () => Promise<void>) => {
    setSavingMembershipId(membershipId);
    setMembershipError(null);
    try { await action(); }
    catch (error) { setMembershipError(error instanceof Error ? error.message : 'Perubahan membership gagal.'); }
    finally { setSavingMembershipId(null); }
  };

  const submitOrganization = async (event: React.FormEvent) => {
    event.preventDefault();
    const slug = orgName.trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setOrgSaving(true);
    setOrgError(null);
    try {
      await onCreateOrganization({ name: orgName.trim(), slug, organization_type: orgType, parent_id: orgParentId || null });
      setOrgName('');
      setOrgParentId('');
      setShowOrgForm(false);
    } catch (error) {
      setOrgError(error instanceof Error ? error.message : 'Gagal menyimpan unit organisasi.');
    } finally {
      setOrgSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Organisasi & Pengguna"
        subtitle="Struktur regional cabang, departemen operasional, serta pengelolaan akses RBAC"
        onBack={onBack}
        actions={
          <div className="flex flex-wrap gap-2">
            {canManageOrganization && (
              <button type="button" onClick={() => setShowOrgForm((value) => !value)}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#B8C9D3] bg-white px-4 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6] whitespace-nowrap">
                <Building2 className="h-4 w-4" /><span>Tambah Unit</span>
              </button>
            )}
            <button type="button" onClick={onOpenInviteModal}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap">
              <UserPlus className="h-4 w-4" /><span>Undang Pengguna Baru</span>
            </button>
          </div>
        }
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'organisasi', label: 'Organisasi' },
          { id: 'pengguna', label: 'Pengguna' },
          { id: 'role', label: 'Role' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'organisasi' && (
        <div className="space-y-4">
          {showOrgForm && canManageOrganization && (
            <form onSubmit={submitOrganization} className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
              <h2 className="text-sm font-bold text-[#17324D]">Tambah Unit Organisasi</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#526675]">Nama unit</span>
                  <input required value={orgName} onChange={(event) => setOrgName(event.target.value)}
                    className="h-10 w-full rounded-[9px] border border-[#D8E3E9] px-3 text-sm outline-none focus:border-[#0284C7]" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#526675]">Jenis unit</span>
                  <select value={orgType} onChange={(event) => setOrgType(event.target.value as typeof orgType)}
                    className="h-10 w-full rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-sm outline-none focus:border-[#0284C7]">
                    <option value="company">Perusahaan</option><option value="division">Divisi</option>
                    <option value="department">Departemen</option><option value="branch">Cabang</option><option value="team">Tim</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#526675]">Parent (opsional)</span>
                  <select value={orgParentId} onChange={(event) => setOrgParentId(event.target.value)}
                    className="h-10 w-full rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-sm outline-none focus:border-[#0284C7]">
                    <option value="">Tanpa parent</option>
                    {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
                  </select>
                </label>
              </div>
              {orgError && <p className="mt-3 text-xs font-medium text-[#B23A48]">{orgError}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowOrgForm(false)} className="h-9 rounded-[9px] border border-[#D8E3E9] px-3 text-xs font-semibold text-[#526675]">Batal</button>
                <button disabled={orgSaving} type="submit" className="h-9 rounded-[9px] bg-[#0284C7] px-4 text-xs font-semibold text-white disabled:opacity-60">{orgSaving ? 'Menyimpan…' : 'Simpan Unit'}</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-6">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-[#0284C7]" />
                <div><h2 className="text-base font-bold text-[#17324D]">{tenant.name}</h2><p className="text-xs text-[#718391]">Struktur organisasi terdaftar</p></div>
              </div>
              <div className="mt-4 space-y-2">
                {organizations.filter((organization) => !organization.parent_id).map((organization) => (
                  <div key={organization.id} className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3">
                    <p className="text-sm font-bold text-[#17324D]">{organization.name}</p>
                    <p className="text-xs text-[#526675]">{organization.organization_type} · {organization.slug}</p>
                    {organizations.filter((child) => child.parent_id === organization.id).map((child) => (
                      <div key={child.id} className="ml-4 mt-2 rounded-[8px] border-l-2 border-[#87CEEB] bg-white px-3 py-2">
                        <p className="text-xs font-semibold text-[#17324D]">{child.name}</p>
                        <p className="text-[11px] text-[#718391]">{child.organization_type}</p>
                      </div>
                    ))}
                  </div>
                ))}
                {organizations.length === 0 && <p className="rounded-[10px] border border-dashed border-[#B8C9D3] p-4 text-xs text-[#718391]">Belum ada unit organisasi. Tambahkan struktur pertama untuk tenant ini.</p>}
              </div>
            </div>

            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-6">
              <h2 className="text-base font-bold text-[#17324D]">Departemen & Unit</h2>
              <p className="mt-0.5 text-xs text-[#526675]">Daftar unit yang tersimpan pada Supabase melalui FastAPI.</p>
              <div className="mt-4 divide-y divide-[#EAF2F6]">
                {organizations.filter((organization) => organization.organization_type === 'department' || organization.organization_type === 'division').map((organization) => (
                  <div key={organization.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2.5"><Briefcase className="h-4 w-4 text-[#0284C7]" /><div><p className="text-sm font-bold text-[#17324D]">{organization.name}</p><p className="text-xs text-[#718391]">{organization.organization_type}</p></div></div>
                    <span className="text-[11px] text-[#718391]">{organization.status}</span>
                  </div>
                ))}
                {organizations.filter((organization) => organization.organization_type === 'department' || organization.organization_type === 'division').length === 0 && <p className="py-4 text-xs text-[#718391]">Belum ada divisi atau departemen.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'pengguna' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#17324D]">
              Daftar Pengguna Terdaftar ({users.length})
            </h2>
            <Users className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8E3E9] text-xs font-semibold text-[#526675]">
                  <th className="py-3 pr-4">Nama &amp; Email</th>
                  <th className="py-3 px-4">Role RBAC</th>
                  <th className="py-3 px-4">Cakupan Wilayah</th>
                  <th className="py-3 px-4">MFA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
                {membershipError && <tr><td colSpan={6} className="py-2 text-xs text-[#B23A48]">{membershipError}</td></tr>}
                {users.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-xs text-[#718391]">Belum ada membership pada tenant ini.</td></tr>}
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F5F8FA]">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-[#17324D]">{u.name}</p>
                      <p className="text-xs text-[#526675]">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-xs font-bold text-[#0284C7]">
                        {u.roleLabel}
                      </p>
                      <p className="text-[11px] text-[#718391]">{u.department || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#526675]">
                      {u.branchScope || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#247A55]">
                      {u.mfaEnabled === null ? 'Belum diketahui' : u.mfaEnabled ? 'Aktif' : 'Belum'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold">
                      <span className={u.status === 'Aktif' ? 'text-[#247A55]' : u.status === 'Dicabut' ? 'text-[#B23A48]' : 'text-[#A96816]'}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      {canManageOrganization && (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <select
                            aria-label={`Ganti role ${u.name}`}
                            value={u.roleKey ?? ''}
                            disabled={savingMembershipId === u.id || u.status === 'Dicabut'}
                            onChange={(event) => void runMembershipAction(u.id, () => onReplaceMembershipRole(u.id, event.target.value as CorporateRoleKey))}
                            className="h-8 max-w-[170px] rounded-lg border border-[#D8E3E9] bg-white px-2 text-[11px] text-[#17324D] disabled:opacity-50"
                          >
                            <option value="" disabled>Belum ada role</option>
                            {CORPORATE_ROLE_OPTIONS.map((role) => <option key={role.key} value={role.key}>{role.label}</option>)}
                          </select>
                          {u.status === 'Ditangguhkan' && (
                            <button type="button" disabled={savingMembershipId === u.id}
                              onClick={() => void runMembershipAction(u.id, () => onActivateMembership(u.id))}
                              className="h-8 rounded-lg border border-[#B8C9D3] px-2.5 text-[11px] font-semibold text-[#247A55] disabled:opacity-50">Aktifkan</button>
                          )}
                          {u.status === 'Aktif' && (
                            <button type="button" disabled={savingMembershipId === u.id}
                              onClick={() => void runMembershipAction(u.id, () => onSuspendMembership(u.id))}
                              className="h-8 rounded-lg border border-[#B8C9D3] px-2.5 text-[11px] font-semibold text-[#A96816] disabled:opacity-50">Tangguhkan</button>
                          )}
                          {u.status !== 'Dicabut' && (
                            <button type="button" disabled={savingMembershipId === u.id}
                              onClick={() => void runMembershipAction(u.id, () => onRevokeMembership(u.id))}
                              className="h-8 rounded-lg border border-[#E7C5C8] px-2.5 text-[11px] font-semibold text-[#B23A48] disabled:opacity-50">Cabut</button>
                          )}
                          {u.status !== 'Dicabut' && (
                            <button type="button" disabled={savingMembershipId === u.id}
                              onClick={() => {
                                setAssignmentDrafts((current) => ({
                                  ...current,
                                  [u.id]: current[u.id] ?? {
                                    organization_id: u.organizationId ?? '',
                                    organization_unit_id: u.organizationUnitId ?? '',
                                    branch_id: u.branchId ?? '',
                                    department_id: u.departmentId ?? '',
                                  },
                                }));
                                setEditingAssignmentId((current) => current === u.id ? null : u.id);
                              }}
                              className="h-8 rounded-lg border border-[#B8C9D3] px-2.5 text-[11px] font-semibold text-[#17324D] disabled:opacity-50">Pindah</button>
                          )}
                        </div>
                      )}
                      {editingAssignmentId === u.id && canManageOrganization && (() => {
                        const draft = assignmentDrafts[u.id] ?? {
                          organization_id: u.organizationId ?? '',
                          organization_unit_id: u.organizationUnitId ?? '',
                          branch_id: u.branchId ?? '',
                          department_id: u.departmentId ?? '',
                        };
                        const patch = (values: Partial<typeof draft>) => setAssignmentDrafts((current) => ({
                          ...current, [u.id]: { ...draft, ...values },
                        }));
                        return (
                          <div className="mt-3 grid w-full min-w-[260px] grid-cols-1 gap-2 text-left sm:grid-cols-2">
                            <label className="text-[10px] font-semibold text-[#526675]">Organisasi
                              <select value={draft.organization_id} onChange={(event) => patch({ organization_id: event.target.value, organization_unit_id: '', branch_id: '', department_id: '' })}
                                className="mt-1 h-8 w-full rounded-lg border border-[#D8E3E9] bg-white px-2 text-[11px]">
                                <option value="">Tanpa organisasi</option>
                                {organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                              </select>
                            </label>
                            <label className="text-[10px] font-semibold text-[#526675]">Organization Unit
                              <select value={draft.organization_unit_id} onChange={(event) => patch({ organization_unit_id: event.target.value, branch_id: '', department_id: '' })}
                                className="mt-1 h-8 w-full rounded-lg border border-[#D8E3E9] bg-white px-2 text-[11px]">
                                <option value="">Tanpa unit</option>
                                {organizationUnits.filter((item) => item.organization_id === draft.organization_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                              </select>
                            </label>
                            <label className="text-[10px] font-semibold text-[#526675]">Cabang
                              <select value={draft.branch_id} onChange={(event) => patch({ branch_id: event.target.value, department_id: '' })}
                                className="mt-1 h-8 w-full rounded-lg border border-[#D8E3E9] bg-white px-2 text-[11px]">
                                <option value="">Tanpa cabang</option>
                                {branches.filter((item) => item.organization_id === draft.organization_id && (!draft.organization_unit_id || item.organization_unit_id === draft.organization_unit_id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                              </select>
                            </label>
                            <label className="text-[10px] font-semibold text-[#526675]">Departemen
                              <select value={draft.department_id} onChange={(event) => patch({ department_id: event.target.value })}
                                className="mt-1 h-8 w-full rounded-lg border border-[#D8E3E9] bg-white px-2 text-[11px]">
                                <option value="">Tanpa departemen</option>
                                {departments.filter((item) => item.organization_id === draft.organization_id && item.branch_id === draft.branch_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                              </select>
                            </label>
                            <div className="flex justify-end gap-2 sm:col-span-2">
                              <button type="button" onClick={() => setEditingAssignmentId(null)} className="h-8 rounded-lg border border-[#D8E3E9] px-3 text-[11px] font-semibold text-[#526675]">Batal</button>
                              <button type="button" disabled={savingMembershipId === u.id}
                                onClick={() => void runMembershipAction(u.id, async () => {
                                  await onReassignMembership(u.id, {
                                    organization_id: draft.organization_id || null,
                                    organization_unit_id: draft.organization_unit_id || null,
                                    branch_id: draft.branch_id || null,
                                    department_id: draft.department_id || null,
                                  });
                                  setEditingAssignmentId(null);
                                })}
                                className="h-8 rounded-lg bg-[#0284C7] px-3 text-[11px] font-semibold text-white disabled:opacity-50">Simpan Penempatan</button>
                            </div>
                          </div>
                        );
                      })()}
                      {savingMembershipId === u.id && <span className="mt-1 block text-[10px] text-[#718391]">Menyimpan…</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'role' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0284C7]" />
            <h2 className="text-base font-bold text-[#17324D]">
              Katalog Role RBAC Corporate Portal
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {CORPORATE_ROLE_OPTIONS.map((r) => (
              <div
                key={r.key}
                className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4"
              >
                <p className="text-sm font-bold text-[#17324D]">{r.label}</p>
                <p className="font-mono-tabular text-[11px] text-[#0284C7]">
                  {r.key}
                </p>
                <p className="mt-1.5 text-xs text-[#526675]">
                  {r.permissionsSummary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
