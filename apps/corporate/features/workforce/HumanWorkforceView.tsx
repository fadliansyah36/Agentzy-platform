'use client';

import React, { useState } from 'react';
import { MapPin, CheckCircle2, Clock, Briefcase, Network, Wrench } from 'lucide-react';
import {
  AttendanceDonutRing,
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import {
  REGIONAL_COVERAGE_STATS,
  WORKFORCE_ROLE_BREAKDOWN,
  formatNumberID,
} from '../../lib/corporate-data';
import type { HumanWorkforceRole } from '../../lib/corporate-types';

type WorkforceRoleFilter = 'Semua' | HumanWorkforceRole;

const ATTENDANCE_LOGS: Array<{
  name: string;
  roleType: HumanWorkforceRole;
  roleDetail: string;
  area: string;
  time: string;
  status: string;
}> = [
  {
    name: 'Andi Saputra',
    roleType: 'Staff Sales',
    roleDetail: 'Staff Sales (Grade Elite)',
    area: 'Jakarta Selatan',
    time: '07:58 WIB',
    status: 'Check-In Geolokasi Valid',
  },
  {
    name: 'Raka Pratama',
    roleType: 'Staff Sales',
    roleDetail: 'Staff Sales (Grade Pro)',
    area: 'Kemang, Jakarta Selatan',
    time: '08:02 WIB',
    status: 'Check-In Geolokasi Valid',
  },
  {
    name: 'Rendra Wijaya',
    roleType: 'Affiliate',
    roleDetail: 'Affiliate Freelance (Sponsor: Andi Saputra)',
    area: 'Jakarta Selatan',
    time: '08:15 WIB',
    status: 'Aktif Submit Prospek',
  },
  {
    name: 'Budi Santoso',
    roleType: 'Teknisi',
    roleDetail: 'Teknisi FTTH Instalasi',
    area: 'Cilandak, Jakarta Selatan',
    time: '07:54 WIB',
    status: 'Check-In Geolokasi Valid',
  },
  {
    name: 'Fajar Nugroho',
    roleType: 'Teknisi',
    roleDetail: 'Teknisi FTTH & QC',
    area: 'Dago, Bandung',
    time: '08:11 WIB',
    status: 'Check-In Geolokasi Valid',
  },
  {
    name: 'Rizky Ramadhan',
    roleType: 'Teknisi',
    roleDetail: 'Teknisi Troubleshooting',
    area: 'Kemang, Jakarta Selatan',
    time: '08:26 WIB',
    status: 'Dalam Perjalanan ke WO',
  },
];

const ASSIGNMENT_ITEMS: Array<{
  task: string;
  roleType: HumanWorkforceRole;
  assigned: string;
  score: string;
  status: string;
}> = [
  {
    task: 'Instalasi Klaster Kemang (14 WO)',
    roleType: 'Teknisi',
    assigned: '8 Teknisi FTTH Tersertifikasi',
    score: 'Skor Kecocokan 0,94',
    status: 'Berjalan',
  },
  {
    task: 'Kampanye Akuisisi FTTH Depok',
    roleType: 'Staff Sales',
    assigned: '12 Staff Sales (Pro & Elite)',
    score: 'Skor Kecocokan 0,91',
    status: 'Berjalan',
  },
  {
    task: 'Program Referral Klaster Perumahan Bekasi',
    roleType: 'Affiliate',
    assigned: '26 Affiliate Terverifikasi (Binaan 4 Staff Sales)',
    score: 'Skor Kecocokan 0,88',
    status: 'Berjalan',
  },
  {
    task: 'Pemeliharaan Berkala Node Surabaya',
    roleType: 'Teknisi',
    assigned: '6 Teknisi Maintenance',
    score: 'Skor Kecocokan 0,93',
    status: 'Terjadwal',
  },
];

export function HumanWorkforceView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'overview' | 'absensi' | 'penugasan'>('overview');
  const [roleFilter, setRoleFilter] = useState<WorkforceRoleFilter>('Semua');

  const filteredAttendance =
    roleFilter === 'Semua'
      ? ATTENDANCE_LOGS
      : ATTENDANCE_LOGS.filter((row) => row.roleType === roleFilter);

  const filteredAssignments =
    roleFilter === 'Semua'
      ? ASSIGNMENT_ITEMS
      : ASSIGNMENT_ITEMS.filter((item) => item.roleType === roleFilter);

  const selectedRoleSummary =
    roleFilter === 'Semua'
      ? { total: 1240, active: 1196, inactive: 44, attendancePct: 96.5, present: 1152 }
      : (() => {
          const found = WORKFORCE_ROLE_BREAKDOWN.find((r) => r.role === roleFilter)!;
          return {
            total: found.total,
            active: found.active,
            inactive: found.inactive,
            attendancePct: found.attendancePct,
            present: Math.round((found.active * found.attendancePct) / 100),
          };
        })();

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Human Workforce"
        subtitle="Pemisahan jabatan Staff Sales, Affiliate Freelance, dan Teknisi Lapangan per wilayah"
        onBack={onBack}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CorporateSegmentedTabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'absensi', label: 'Absensi' },
            { id: 'penugasan', label: 'Penugasan' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        {/* Role Segmentation Filter */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter Jabatan Workforce">
          {(['Semua', 'Staff Sales', 'Affiliate', 'Teknisi'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`h-8 rounded-[8px] border px-3 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                roleFilter === r
                  ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                  : 'border-[#D8E3E9] bg-white text-[#526675] hover:bg-[#F5F8FA]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Top 3 Aggregate Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
              <p className="text-xs font-medium text-[#526675]">
                {roleFilter === 'Semua' ? 'Total Human Workforce' : `Total ${roleFilter}`}
              </p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
                {formatNumberID(selectedRoleSummary.total)}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
              <p className="text-xs font-medium text-[#526675]">Aktif</p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#247A55]">
                {formatNumberID(selectedRoleSummary.active)}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
              <p className="text-xs font-medium text-[#526675]">Tidak Aktif</p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#B23A48]">
                {formatNumberID(selectedRoleSummary.inactive)}
              </p>
            </div>
          </div>

          {/* 3-Role Breakdown Cards: Staff Sales, Affiliate, Teknisi */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {WORKFORCE_ROLE_BREAKDOWN.map((item) => {
              const Icon =
                item.role === 'Staff Sales'
                  ? Briefcase
                  : item.role === 'Affiliate'
                    ? Network
                    : Wrench;
              const isSelected = roleFilter === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() =>
                    setRoleFilter((prev) => (prev === item.role ? 'Semua' : item.role))
                  }
                  className={`rounded-[14px] border bg-white p-4 text-left transition ${
                    isSelected
                      ? 'border-[#0284C7] ring-2 ring-[#87CEEB]/50'
                      : 'border-[#D8E3E9] hover:border-[#87CEEB]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#17324D]">{item.role}</span>
                    <Icon className="h-4 w-4 text-[#0284C7]" />
                  </div>
                  <p className="mt-2 font-mono-tabular text-2xl font-bold text-[#17324D]">
                    {formatNumberID(item.total)}
                  </p>
                  <p className="mt-1 font-mono-tabular text-xs text-[#526675]">
                    Aktif {item.active} · Nonaktif {item.inactive}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#718391]">
                    {item.scope}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Kehadiran Hari Ini */}
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
              <h2 className="text-center text-base font-bold text-[#17324D]">
                Kehadiran &amp; Aktivitas ({roleFilter})
              </h2>
              <AttendanceDonutRing
                percentage={selectedRoleSummary.attendancePct}
                present={selectedRoleSummary.present}
                total={selectedRoleSummary.active}
              />
              <div className="mt-4 divide-y divide-[#EAF2F6] border-t border-[#EAF2F6] pt-2 text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[#526675]">Penugasan Aktif</span>
                  <span className="font-mono-tabular font-bold text-[#17324D]">
                    3.420
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[#526675]">Tersedia / Idle</span>
                  <span className="font-mono-tabular font-bold text-[#17324D]">
                    176
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[#526675]">Dalam Pelatihan</span>
                  <span className="font-mono-tabular font-bold text-[#17324D]">
                    42
                  </span>
                </div>
              </div>
            </div>

            {/* Sebaran Wilayah */}
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
              <h2 className="text-base font-bold text-[#17324D]">
                Sebaran Wilayah per Jabatan
              </h2>
              <p className="mt-0.5 text-xs text-[#526675]">
                Distribusi Staff Sales, Affiliate Freelance, dan Teknisi Lapangan per regional
              </p>

              <div className="mt-5 space-y-4">
                {REGIONAL_COVERAGE_STATS.map((reg) => {
                  const countForRole =
                    roleFilter === 'Semua'
                      ? reg.staffCount
                      : roleFilter === 'Staff Sales'
                        ? reg.staffSalesCount
                        : roleFilter === 'Affiliate'
                          ? reg.affiliateCount
                          : reg.technicianCount;
                  const barPct =
                    roleFilter === 'Semua'
                      ? reg.workforcePct * 2.2
                      : Math.round((countForRole / selectedRoleSummary.total) * 100 * 2.2);

                  return (
                    <div key={reg.region}>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-semibold text-[#17324D]">
                          {reg.region}
                        </span>
                        <span className="font-mono-tabular text-xs font-semibold text-[#526675]">
                          {roleFilter === 'Semua'
                            ? `${reg.staffSalesCount} Staff Sales · ${reg.affiliateCount} Affiliate · ${reg.technicianCount} Teknisi`
                            : `${formatNumberID(countForRole)} ${roleFilter}`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
                        <div
                          className="h-full rounded-full bg-[#0284C7]"
                          style={{ width: `${Math.min(barPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'absensi' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Log Check-In &amp; Aktivitas Workforce Hari Ini ({roleFilter})
          </h2>
          <p className="mt-0.5 text-xs text-[#526675]">
            Staff Sales &amp; Teknisi Lapangan divalidasi via check-in geolokasi; Affiliate Freelance dipantau dari aktivitas submit order tervalidasi
          </p>
          <div className="mt-4 divide-y divide-[#EAF2F6]">
            {filteredAttendance.map((row) => (
              <div
                key={row.name}
                className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-[#17324D]">{row.name}</p>
                  <p className="text-xs text-[#526675]">
                    {row.roleDetail} · <MapPin className="inline h-3 w-3 text-[#0284C7]" /> {row.area}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono-tabular text-[#526675]">
                    <Clock className="mr-1 inline h-3.5 w-3.5" />
                    {row.time}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#247A55]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'penugasan' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Antrean Assignment Engine ({roleFilter})
          </h2>
          <p className="mt-0.5 text-xs text-[#526675]">
            Penugasan mempertimbangkan jabatan (Staff Sales / Affiliate / Teknisi), sertifikasi wajib, jarak, dan beban kerja aktif
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredAssignments.map((item) => (
              <div
                key={item.task}
                className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#17324D]">{item.task}</p>
                  <span className="text-xs font-semibold text-[#0284C7]">
                    {item.roleType} · {item.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#526675]">{item.assigned}</p>
                <p className="mt-2 font-mono-tabular text-[11px] text-[#718391]">
                  {item.score}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
