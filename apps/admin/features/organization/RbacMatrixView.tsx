'use client';

import React, { useState } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
} from '../../components/data-display/AdminDataDisplay';
import type { RbacRoleRecord } from '../../lib/admin-types';
import type { AgentzyPermissionDefinition } from '@/apps/web/lib/api-client';

export function RbacMatrixView({
  roles,
  permissionRegistry,
  onOpenRoleModal,
  onDeleteRole,
  onCyclePermission,
  onBack,
}: {
  roles: RbacRoleRecord[];
  permissionRegistry: AgentzyPermissionDefinition[];
  onOpenRoleModal: (role?: RbacRoleRecord) => void;
  onDeleteRole?: (id: string) => void;
  onCyclePermission: (roleId: string, resourceKey: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'role' | 'matrix'>('role');
  const resourceRows = Array.from(new Set(
    permissionRegistry.map((permission) => permission.resource ?? permission.domain)
  )).map((key) => ({
    key,
    label: permissionRegistry.find((permission) =>
      (permission.resource ?? permission.domain) === key
    )?.domain ?? key,
  }));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="RBAC, Role & Access Matrix"
        subtitle="Kelola definisi role sistem & kustom serta matriks hak akses fine-grained (F / C/U / A / R / S)."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenRoleModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Role</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'role', label: `Daftar Role (${roles.length})` },
          { id: 'matrix', label: 'Matrix Akses Interaktif' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'role' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <div
              key={r.id}
              className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#17324D]">{r.name}</h3>
                      <p className="font-mono-tabular text-[11px] text-[#718391]">
                        {r.key} · {r.scopeType}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#526675]">
                  {r.description}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#EAF2F6] pt-3 text-xs">
                <span className="font-mono-tabular text-[#526675]">
                  {r.userCount} pengguna · {r.isSystemRole ? 'System Role' : 'Kustom'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenRoleModal(r)}
                    className="inline-flex items-center gap-1 font-semibold text-[#0284C7] hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  {!r.isSystemRole && onDeleteRole && (
                    <button
                      type="button"
                      onClick={() => onDeleteRole(r.id)}
                      className="inline-flex items-center gap-1 font-semibold text-[#B23A48] hover:underline"
                      aria-label={`Hapus ${r.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#526675]">
            <span>
              Ketuk izin untuk mengubah akses: <strong>F</strong> (Full),{' '}
              <strong>C/U</strong> (Create/Update), <strong>A</strong> (Approve),{' '}
              <strong>R</strong> (Read), <strong>S</strong> (Scoped), <strong>---</strong> (No Access).
            </span>
          </div>

          {resourceRows.length === 0 ? (
            <div className="rounded-xl border border-[#D8E3E9] bg-[#F5F8FA] p-4 text-sm text-[#526675]">
              Permission registry belum tersedia. Matrix tidak menggunakan definisi statis.
            </div>
          ) : null}

          {/* Mobile-first Role Cards */}
          <div className="space-y-3 md:hidden">
            {resourceRows.map((res) => (
              <div
                key={res.key}
                className="rounded-[12px] border border-[#EAF2F6] bg-[#F5F8FA] p-3.5 space-y-2.5"
              >
                <div>
                  <p className="text-xs font-bold text-[#17324D]">{res.label}</p>
                  <p className="font-mono-tabular text-[11px] text-[#718391]">
                    {res.key}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => {
                    const val = r.permissions[res.key] ?? '---';
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onCyclePermission(r.id, res.key)}
                        className="flex min-h-[42px] items-center justify-between gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-2.5 py-1.5 text-left"
                      >
                        <span className="truncate text-[11px] font-medium text-[#172B3A]">
                          {r.name}
                        </span>
                        <span
                          className={`font-mono-tabular shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                            val === 'F'
                              ? 'bg-[#17324D] text-white'
                              : val === '---'
                                ? 'bg-[#F5F8FA] text-[#718391]'
                                : 'bg-[#E6F4F9] text-[#0284C7]'
                          }`}
                        >
                          {val}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Matrix Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Domain / Resource</th>
                  {roles.map((r) => (
                    <th key={r.id} className="px-3 py-3 text-center font-semibold">
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
                {resourceRows.map((res) => (
                  <tr key={res.key} className="hover:bg-[#F8FBFD]">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#17324D]">{res.label}</p>
                      <p className="font-mono-tabular text-[11px] text-[#718391]">
                        {res.key}
                      </p>
                    </td>
                    {roles.map((r) => {
                      const val = r.permissions[res.key] ?? '---';
                      return (
                        <td key={r.id} className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => onCyclePermission(r.id, res.key)}
                            className={`font-mono-tabular inline-flex h-8 min-w-[44px] items-center justify-center rounded-lg border px-2 text-xs font-bold transition ${
                              val === 'F'
                                ? 'border-[#17324D] bg-[#17324D] text-white'
                                : val === '---'
                                  ? 'border-[#D8E3E9] bg-[#F5F8FA] text-[#718391]'
                                  : 'border-[#87CEEB] bg-[#E6F4F9] text-[#0284C7]'
                            }`}
                          >
                            {val}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
