'use client';

import React, { useMemo, useState } from 'react';
import { Network, Plus, Pencil, Trash2, Building2, Users } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatNumberID } from '../../lib/admin-data';
import type {
  AdminTenantRecord,
  OrgUnitRecord,
  PlatformUserRecord,
  RbacRoleRecord,
} from '../../lib/admin-types';

export function OrganizationUsersView({
  tenants,
  orgUnits,
  users,
  onOpenOrgUnitModal,
  onDeleteOrgUnit,
  onOpenUserModal,
  roles,
  onReplaceMembershipRole,
  onActivateMembership,
  onSuspendMembership,
  onDeleteUser,
  onBack,
}: {
  tenants: AdminTenantRecord[];
  orgUnits: OrgUnitRecord[];
  users: PlatformUserRecord[];
  roles: RbacRoleRecord[];
  onReplaceMembershipRole: (membershipId: string, tenantId: string, roleKey: string) => Promise<void>;
  onActivateMembership: (membershipId: string, tenantId: string) => Promise<void>;
  onSuspendMembership: (membershipId: string, tenantId: string) => Promise<void>;
  onOpenOrgUnitModal: (unit?: OrgUnitRecord) => void;
  onDeleteOrgUnit: (id: string) => void;
  onOpenUserModal: (user?: PlatformUserRecord) => void;
  onDeleteUser?: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'organisasi' | 'pengguna'>('organisasi');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    tenants[0]?.id ?? ''
  );
  const tenantRoles = roles.filter((role) => role.scopeType === 'Tenant');

  const visibleUnits = useMemo(
    () => orgUnits.filter((u) => u.tenantId === selectedTenantId),
    [orgUnits, selectedTenantId]
  );

  const branches = visibleUnits.filter((u) => u.unitType === 'Cabang / Regional');
  const departments = visibleUnits.filter((u) => u.unitType === 'Departemen');

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Organisasi, Cabang, Departemen & Pengguna"
        subtitle="Kelola struktur hierarki tenant, cabang regional, departemen, dan akun pengguna platform."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() =>
              tab === 'organisasi' ? onOpenOrgUnitModal() : onOpenUserModal()
            }
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>
              {tab === 'organisasi' ? 'Tambah Unit / Departemen' : 'Tambah Pengguna'}
            </span>
          </button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSegmentedTabs
          tabs={[
            { id: 'organisasi', label: 'Organisasi & Cabang' },
            { id: 'pengguna', label: `Pengguna (${users.length})` },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        {tab === 'organisasi' && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#0284C7]" />
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="h-10 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] outline-none focus:border-[#0284C7]"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Tenant)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tab === 'organisasi' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Cabang / Regional */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-[#0284C7]" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Kantor Pusat &amp; Cabang Regional
                </h2>
              </div>
              <span className="font-mono-tabular text-xs text-[#526675]">
                {branches.length} unit
              </span>
            </div>
            <div className="mt-3 space-y-2.5">
              {branches.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#718391]">
                  Belum ada cabang terdaftar untuk tenant ini.
                </p>
              ) : (
                branches.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#17324D]">{u.name}</p>
                      <p className="text-[11px] text-[#526675]">
                        Induk: {u.parentName ?? '—'} · Kepala: {u.headName ?? 'Belum ditetapkan'} ·{' '}
                        <span className="font-mono-tabular">
                          {u.memberCount === null ? '—' : formatNumberID(u.memberCount)} anggota
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenOrgUnitModal(u)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] bg-white text-[#0284C7]"
                        aria-label={`Edit ${u.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteOrgUnit(u.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] bg-white text-[#B23A48]"
                        aria-label={`Hapus ${u.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Departemen */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0284C7]" />
                <h2 className="text-sm font-bold text-[#17324D]">Departemen</h2>
              </div>
              <span className="font-mono-tabular text-xs text-[#526675]">
                {departments.length} departemen
              </span>
            </div>
            <div className="mt-3 space-y-2.5">
              {departments.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#718391]">
                  Belum ada departemen terdaftar untuk tenant ini.
                </p>
              ) : (
                departments.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#17324D]">{u.name}</p>
                      <p className="text-[11px] text-[#526675]">
                        PIC: {u.headName ?? 'Belum ditetapkan'} ·{' '}
                        <span className="font-mono-tabular">
                          {u.memberCount === null ? '—' : formatNumberID(u.memberCount)} personel
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenOrgUnitModal(u)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] bg-white text-[#0284C7]"
                        aria-label={`Edit ${u.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteOrgUnit(u.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] bg-white text-[#B23A48]"
                        aria-label={`Hapus ${u.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#17324D]">{u.name}</p>
                    <p className="truncate text-[11px] text-[#718391]">{u.email}</p>
                  </div>
                  <AdminStatusText
                    tone={
                      u.status === 'Aktif'
                        ? 'success'
                        : u.status === 'Pending'
                          ? 'warning'
                          : 'danger'
                    }
                    label={u.status}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[#F5F8FA] px-3 py-2 text-[11px]">
                  <span className="font-semibold text-[#17324D]">
                    {u.roleName} · {u.tenantName}
                  </span>
                  <AdminStatusText
                    tone={u.mfaEnabled === true ? 'success' : 'warning'}
                    label={u.mfaEnabled === true ? 'MFA Aktif' : u.mfaEnabled === false ? 'Belum MFA' : 'Status MFA belum diverifikasi'}
                  />
                </div>
                <div className="space-y-2 border-t border-[#EAF2F6] pt-2.5">
                  <select value={u.roleKey} disabled={u.status === 'Dicabut'}
                    onChange={(event) => void onReplaceMembershipRole(u.id, u.tenantId, event.target.value)}
                    className="h-9 w-full rounded-lg border border-[#D8E3E9] bg-white px-2 text-xs text-[#17324D]">
                    {tenantRoles.map((role) => <option key={role.id} value={role.key}>{role.name}</option>)}
                  </select>
                  <div className="flex justify-end gap-1.5">
                    {u.status === 'Suspended' && <button type="button" onClick={() => void onActivateMembership(u.id, u.tenantId)} className="h-8 rounded-lg border border-[#B8C9D3] px-3 text-xs font-semibold text-[#247A55]">Aktifkan</button>}
                    {u.status === 'Aktif' && <button type="button" onClick={() => void onSuspendMembership(u.id, u.tenantId)} className="h-8 rounded-lg border border-[#B8C9D3] px-3 text-xs font-semibold text-[#A96816]">Tangguhkan</button>}
                    {u.status !== 'Dicabut' && onDeleteUser && <button type="button" onClick={() => onDeleteUser(u.id)} className="h-8 rounded-lg border border-[#E7C5C8] px-3 text-xs font-semibold text-[#B23A48]">Cabut</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Pengguna</th>
                    <th className="px-4 py-3 font-semibold">Tenant</th>
                    <th className="px-4 py-3 font-semibold">Role &amp; Departemen</th>
                    <th className="px-4 py-3 font-semibold">MFA</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#17324D]">{u.name}</p>
                        <p className="text-[11px] text-[#718391]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#172B3A]">
                        {u.tenantName}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#17324D]">{u.roleName}</p>
                        <p className="text-[11px] text-[#526675]">{u.department}</p>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={u.mfaEnabled === true ? 'success' : 'warning'}
                          label={u.mfaEnabled === true ? 'MFA Aktif' : u.mfaEnabled === false ? 'Belum MFA' : 'Status MFA belum diverifikasi'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={
                            u.status === 'Aktif'
                              ? 'success'
                              : u.status === 'Pending'
                                ? 'warning'
                                : 'danger'
                          }
                          label={u.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <select value={u.roleKey} disabled={u.status === 'Dicabut'}
                            onChange={(event) => void onReplaceMembershipRole(u.id, u.tenantId, event.target.value)}
                            className="h-8 max-w-[180px] rounded-lg border border-[#D8E3E9] bg-white px-2 text-[11px] text-[#17324D]">
                            {tenantRoles.map((role) => <option key={role.id} value={role.key}>{role.name}</option>)}
                          </select>
                          <div className="flex justify-end gap-1.5">
                            {u.status === 'Suspended' && <button type="button" onClick={() => void onActivateMembership(u.id, u.tenantId)} className="h-8 rounded-lg border border-[#B8C9D3] px-2.5 text-[11px] font-semibold text-[#247A55]">Aktifkan</button>}
                            {u.status === 'Aktif' && <button type="button" onClick={() => void onSuspendMembership(u.id, u.tenantId)} className="h-8 rounded-lg border border-[#B8C9D3] px-2.5 text-[11px] font-semibold text-[#A96816]">Tangguhkan</button>}
                            {u.status !== 'Dicabut' && onDeleteUser && <button type="button" onClick={() => onDeleteUser(u.id)} className="h-8 rounded-lg border border-[#E7C5C8] px-2.5 text-[11px] font-semibold text-[#B23A48]">Cabut</button>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
