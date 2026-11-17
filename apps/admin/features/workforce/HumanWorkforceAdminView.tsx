'use client';

import React, { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Sliders,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type { CorporateCompensationSchema } from '@/lib/corporate-compensation';
import { formatIDR } from '../../lib/admin-data';
import type { HumanStaffRecord } from '../../lib/admin-types';

export function HumanWorkforceAdminView({
  staffList,
  corporateSchemas = [],
  onOpenStaffModal,
  onDeleteStaff,
  onVerifyStaff,
  onShowToast,
  onBack,
}: {
  staffList: HumanStaffRecord[];
  corporateSchemas?: CorporateCompensationSchema[];
  onOpenStaffModal: (staff?: HumanStaffRecord) => void;
  onDeleteStaff?: (id: string) => void;
  onVerifyStaff: (staffId: string, approved: boolean) => void;
  onShowToast: (msg: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'staff' | 'verifikasi' | 'assignment'>('staff');
  const [query, setQuery] = useState('');

  // Assignment scoring weights (Blueprint §9.4)
  const [wSkill, setWSkill] = useState(35);
  const [wAvail, setWAvail] = useState(25);
  const [wDist, setWDist] = useState(20);
  const [wQual, setWQual] = useState(20);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staffList.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.workerCode.toLowerCase().includes(q) ||
        s.position.toLowerCase().includes(q)
    );
  }, [query, staffList]);

  const pendingVerification = staffList.filter(
    (s) => s.verificationStatus === 'Menunggu Verifikasi'
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Human Workforce Governance"
        subtitle="Kelola direktori tenaga kerja lintas tenant, verifikasi Workforce Passport, dan bobot Assignment Engine."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenStaffModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Staff</span>
          </button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSegmentedTabs
          tabs={[
            { id: 'staff', label: `Staff (${staffList.length})` },
            { id: 'verifikasi', label: `Verifikasi (${pendingVerification.length})` },
            { id: 'assignment', label: 'Assignment Engine' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        {tab === 'staff' && (
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari staff, ID, atau posisi..."
              className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-9 pr-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7]"
            />
          </div>
        )}
      </div>

      {tab === 'staff' && (
        <>
          {/* Mobile-first Staff Cards matching Screen 8 */}
          <div className="space-y-3 md:hidden">
            {filtered.map((s) => {
              const initials = s.name
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0] ?? '')
                .join('')
                .toUpperCase();
              return (
                <div
                  key={s.id}
                  className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#17324D] text-xs font-bold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#17324D]">
                          {s.name}
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          {s.position} · Grade {s.grade}
                        </p>
                      </div>
                    </div>
                    <AdminStatusText
                      tone={
                        s.lifecycleStatus === 'Aktif'
                          ? 'success'
                          : s.lifecycleStatus === 'Pending'
                            ? 'warning'
                            : 'danger'
                      }
                      label={s.lifecycleStatus}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] px-3 py-2 text-[11px]">
                    <span className="font-mono-tabular text-[#526675]">
                      {s.workerCode} · {s.region}
                    </span>
                    <span className="font-mono-tabular font-bold text-[#247A55]">
                      SLA {String(s.slaScore).replace('.', ',')}% · Beban {s.assignmentLoad}%
                    </span>
                  </div>
                  {(() => {
                    const matchedCorp = corporateSchemas.find(
                      (c) => c.id === s.placedCorporateSchemaId || c.tenantId === s.tenantId
                    );
                    if (!matchedCorp) return null;
                    const isTech = s.position === 'Teknisi';
                    const baseSalary = isTech
                      ? matchedCorp.technicianConfig.baseSalaryIdr
                      : matchedCorp.salesConfig.baseSalaryIdr;
                    return (
                      <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-2 text-[11px] text-[#526675]">
                        <span className="font-semibold text-[#17324D]">
                          {matchedCorp.contractNumber}
                        </span>{' '}
                        · Gapok {formatIDR(baseSalary)} ·{' '}
                        {isTech
                          ? 'Bonus Target H/M/B Aktif'
                          : `Split ${matchedCorp.salesConfig.affiliateSplitPct}/${matchedCorp.salesConfig.salesIncrementalSplitPct}`}
                      </div>
                    );
                  })()}
                  <div className="flex items-center justify-between gap-2 border-t border-[#EAF2F6] pt-2.5 text-xs">
                    <span className="truncate text-[11px] font-medium text-[#526675]">
                      {s.tenantName}
                    </span>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenStaffModal(s)}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#0284C7]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      {onDeleteStaff && (
                        <button
                          type="button"
                          onClick={() => onDeleteStaff(s.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48]"
                          aria-label={`Hapus ${s.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nama &amp; Passport ID</th>
                    <th className="px-4 py-3 font-semibold">Posisi &amp; Grade</th>
                    <th className="px-4 py-3 font-semibold">Tenant &amp; Wilayah</th>
                    <th className="px-4 py-3 font-semibold text-right">Beban Tugas</th>
                    <th className="px-4 py-3 font-semibold text-right">SLA</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#17324D]">{s.name}</p>
                        <p className="font-mono-tabular text-[11px] text-[#718391]">
                          {s.workerCode}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#172B3A]">{s.position}</p>
                        <p className="text-[11px] text-[#526675]">Grade {s.grade}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#172B3A]">{s.tenantName}</p>
                        <p className="text-[11px] text-[#526675]">{s.region}</p>
                        {(() => {
                          const matchedCorp = corporateSchemas.find(
                            (c) => c.id === s.placedCorporateSchemaId || c.tenantId === s.tenantId
                          );
                          if (!matchedCorp) return null;
                          const isTech = s.position === 'Teknisi';
                          const baseSalary = isTech
                            ? matchedCorp.technicianConfig.baseSalaryIdr
                            : matchedCorp.salesConfig.baseSalaryIdr;
                          return (
                            <p className="mt-0.5 font-mono-tabular text-[10px] text-[#0284C7]">
                              {matchedCorp.contractNumber} · Gapok {formatIDR(baseSalary)} ·{' '}
                              {isTech
                                ? 'Bonus Target H/M/B'
                                : `Split ${matchedCorp.salesConfig.affiliateSplitPct}/${matchedCorp.salesConfig.salesIncrementalSplitPct}`}
                            </p>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular text-[#17324D]">
                        {s.assignmentLoad}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#247A55]">
                        {String(s.slaScore).replace('.', ',')}%
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={
                            s.lifecycleStatus === 'Aktif'
                              ? 'success'
                              : s.lifecycleStatus === 'Pending'
                                ? 'warning'
                                : 'danger'
                          }
                          label={s.lifecycleStatus}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenStaffModal(s)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          {onDeleteStaff && (
                            <button
                              type="button"
                              onClick={() => onDeleteStaff(s.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48] hover:bg-[#B23A48]/10"
                              aria-label={`Hapus ${s.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {tab === 'verifikasi' && (
        <div className="space-y-3">
          {pendingVerification.length === 0 ? (
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-[#247A55]" />
              <p className="mt-2 text-sm font-bold text-[#17324D]">
                Antrean Verifikasi Kosong
              </p>
              <p className="mt-1 text-xs text-[#526675]">
                Seluruh Workforce Passport yang masuk telah diverifikasi.
              </p>
            </div>
          ) : (
            pendingVerification.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-bold text-[#17324D]">
                    {s.name} · {s.position}
                  </p>
                  <p className="mt-0.5 text-xs text-[#526675]">
                    {s.workerCode} · {s.tenantName} · Wilayah {s.region}
                  </p>
                  <p className="mt-1 text-[11px] text-[#A96816]">
                    Menunggu validasi dokumen KTP, klasifikasi kontrak &amp; sertifikasi
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onVerifyStaff(s.id, false)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#B23A48]/40 px-3 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Tolak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onVerifyStaff(s.id, true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-[#247A55] px-3.5 text-xs font-semibold text-white hover:bg-[#1D6344]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verifikasi &amp; Aktifkan</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'assignment' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex items-center gap-2 border-b border-[#EAF2F6] pb-3">
            <Sliders className="h-4 w-4 text-[#0284C7]" />
            <h2 className="text-sm font-bold text-[#17324D]">
              Bobot Weighted Scoring Assignment Engine (Versioned)
            </h2>
          </div>
          <p className="mt-2 text-xs text-[#526675]">
            Hard constraints (sertifikasi wajib, status kontrak, tenant, dan ketersediaan)
            selalu dievaluasi sebelum skor pembobotan diterapkan.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Skill & Sertifikasi (w_skill)', val: wSkill, set: setWSkill },
              { label: 'Ketersediaan Jadwal (w_avail)', val: wAvail, set: setWAvail },
              { label: 'Jarak Geospasial (w_distance)', val: wDist, set: setWDist },
              { label: 'Kualitas & SLA (w_quality)', val: wQual, set: setWQual },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[12px] border border-[#EAF2F6] bg-[#F5F8FA] p-4"
              >
                <p className="text-xs font-semibold text-[#17324D]">{item.label}</p>
                <p className="mt-1 font-mono-tabular text-xl font-bold text-[#0284C7]">
                  {item.val}%
                </p>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={item.val}
                  onChange={(e) => item.set(Number(e.target.value))}
                  className="mt-2 w-full accent-[#0284C7]"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-[#EAF2F6] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`font-mono-tabular text-xs font-semibold ${
                  wSkill + wAvail + wDist + wQual === 100
                    ? 'text-[#247A55]'
                    : 'text-[#A96816]'
                }`}
              >
                Total bobot: {wSkill + wAvail + wDist + wQual}% (Formula v2.4)
              </span>
              {wSkill + wAvail + wDist + wQual !== 100 && (
                <button
                  type="button"
                  onClick={() => {
                    setWSkill(35);
                    setWAvail(25);
                    setWDist(20);
                    setWQual(20);
                  }}
                  className="text-xs font-semibold text-[#0284C7] hover:underline"
                >
                  Normalisasi 100%
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                onShowToast('Konfigurasi bobot Assignment Engine disimpan & diaudit.')
              }
              className="h-10 w-full rounded-[9px] bg-[#17324D] px-4 text-xs font-semibold text-white hover:bg-[#245477] sm:h-9 sm:w-auto"
            >
              Simpan Bobot Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
