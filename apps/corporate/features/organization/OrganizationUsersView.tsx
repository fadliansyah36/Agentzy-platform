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
import type {
  CorporateTenant,
  CorporateUserMember,
} from '../../lib/corporate-types';

export function OrganizationUsersView({
  tenant,
  users,
  onOpenInviteModal,
  onBack,
}: {
  tenant: CorporateTenant;
  users: CorporateUserMember[];
  onOpenInviteModal: () => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'organisasi' | 'pengguna' | 'role'>('organisasi');

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Organisasi & Pengguna"
        subtitle="Struktur regional cabang, departemen operasional, serta pengelolaan akses RBAC"
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            <span>Undang Pengguna Baru</span>
          </button>
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
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Org Hierarchy Tree (Matches Screen 16) */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-6">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-[#0284C7]" />
              <h2 className="text-base font-bold text-[#17324D]">
                {tenant.name} (Pusat)
              </h2>
            </div>

            <div className="mt-4 ml-3 space-y-2.5 border-l border-[#B8C9D3] pl-5">
              {[
                { name: 'Regional Jabodetabek', staff: '397 workforce · 148 cabang/ODP' },
                { name: 'Regional Jawa Barat', staff: '223 workforce · 82 cabang/ODP' },
                { name: 'Regional Jawa Tengah', staff: '198 workforce · 64 cabang/ODP' },
                { name: 'Regional Jawa Timur', staff: '422 workforce · 110 cabang/ODP' },
              ].map((branch) => (
                <div
                  key={branch.name}
                  className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3"
                >
                  <p className="text-sm font-bold text-[#17324D]">{branch.name}</p>
                  <p className="text-xs text-[#526675]">{branch.staff}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Departemen */}
          <div className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-6">
            <div>
              <h2 className="text-base font-bold text-[#17324D]">Departemen</h2>
              <p className="mt-0.5 text-xs text-[#526675]">
                Pembagian unit kerja yang terhubung dengan budget AI Credits dan peran RBAC
              </p>

              <div className="mt-4 divide-y divide-[#EAF2F6]">
                {[
                  { name: 'Sales & Marketing', lead: 'Dimas Pratama', members: '680 orang · 3 AI Worker' },
                  { name: 'Operasional Teknis', lead: 'Hendra Wijaya', members: '520 teknisi · 2 AI Worker' },
                  { name: 'AI Operations', lead: 'Arif Budiman', members: '14 supervisor · AI Gateway' },
                  { name: 'Keuangan', lead: 'Dewi Anggraini', members: '16 staf · Rekonsiliasi & Payout' },
                  { name: 'HR & People', lead: 'Rina Puspitasari', members: '10 staf · Workforce Passport' },
                ].map((dept) => (
                  <div
                    key={dept.name}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="h-4 w-4 text-[#0284C7]" />
                      <div>
                        <p className="text-sm font-bold text-[#17324D]">{dept.name}</p>
                        <p className="text-xs text-[#526675]">Lead: {dept.lead}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-[#718391]">
                      {dept.members}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenInviteModal}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
            >
              <UserPlus className="h-4 w-4" />
              <span>Undang Pengguna Baru</span>
            </button>
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
                  <th className="py-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
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
                      <p className="text-[11px] text-[#718391]">{u.department}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#526675]">
                      {u.branchScope}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#247A55]">
                      {u.mfaEnabled ? 'Aktif' : 'Belum'}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-xs font-bold">
                      <span
                        className={
                          u.status === 'Aktif' ? 'text-[#247A55]' : 'text-[#A96816]'
                        }
                      >
                        {u.status}
                      </span>
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
