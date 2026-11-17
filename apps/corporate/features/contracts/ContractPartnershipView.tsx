'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileCheck2,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import type { CorporateTenant } from '../../lib/corporate-types';

export function ContractPartnershipView({
  tenant,
  onOpenDocumentModal,
  onBack,
}: {
  tenant: CorporateTenant;
  onOpenDocumentModal: (docKind: 'msa' | 'sow' | 'sla' | 'amendment') => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'kontrak' | 'sow' | 'sla'>('kontrak');

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Kontrak & Kerja Sama"
        subtitle="Dokumen kontrak induk, Statement of Work (SOW), SLA, dan batas entitlement layanan"
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenDocumentModal('amendment')}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#17324D] px-4 text-xs font-semibold text-white hover:bg-[#245477] whitespace-nowrap"
          >
            <span>Ajukan Perpanjangan / Amandemen</span>
          </button>
        }
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'kontrak', label: 'Kontrak' },
          { id: 'sow', label: 'SOW' },
          { id: 'sla', label: 'SLA' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'kontrak' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Kontrak Utama Card (Matches Screen 12) */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#0284C7]">Kontrak Utama</p>
                <h2 className="mt-1 text-lg font-bold text-[#17324D]">
                  PT {tenant.name} × Agentzy
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#247A55]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Aktif</span>
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[#526675]">
              <Calendar className="h-4 w-4 text-[#0284C7]" />
              <span>Periode: 1 Jan 2026 – 31 Des 2026</span>
            </div>

            <div className="mt-5 rounded-[12px] border border-[#247A55]/25 bg-[#F2FBF6] p-4">
              <p className="text-xs font-semibold text-[#526675]">
                Persetujuan &amp; Tanda Tangan
              </p>
              <p className="mt-1 text-sm font-bold text-[#247A55]">
                Ditandatangani (12 Des 2025)
              </p>
              <p className="mt-0.5 text-[11px] text-[#526675]">
                Versi Kontrak v2.0 · Penandatangan: Arif Budiman &amp; Manajemen Agentzy
              </p>
            </div>
          </div>

          {/* Document Links & Entitlements */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
            <h2 className="text-base font-bold text-[#17324D]">
              Dokumen Legal &amp; Entitlements Layanan
            </h2>
            <div className="mt-4 divide-y divide-[#EAF2F6]">
              <button
                type="button"
                onClick={() => onOpenDocumentModal('msa')}
                className="flex w-full items-center justify-between py-3.5 text-left hover:bg-[#F5F8FA] rounded-lg px-2"
              >
                <span className="inline-flex items-center gap-3 text-sm font-semibold text-[#17324D]">
                  <FileText className="h-4 w-4 text-[#0284C7]" />
                  <span>Master Agreement (PDF)</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#718391]" />
              </button>

              <button
                type="button"
                onClick={() => onOpenDocumentModal('sow')}
                className="flex w-full items-center justify-between py-3.5 text-left hover:bg-[#F5F8FA] rounded-lg px-2"
              >
                <span className="inline-flex items-center gap-3 text-sm font-semibold text-[#17324D]">
                  <FileCheck2 className="h-4 w-4 text-[#0284C7]" />
                  <span>Statement of Work (SOW)</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#718391]" />
              </button>

              <button
                type="button"
                onClick={() => onOpenDocumentModal('sla')}
                className="flex w-full items-center justify-between py-3.5 text-left hover:bg-[#F5F8FA] rounded-lg px-2"
              >
                <span className="inline-flex items-center gap-3 text-sm font-semibold text-[#17324D]">
                  <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
                  <span>SLA &amp; KPI</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#718391]" />
              </button>
            </div>

            <div className="mt-4 rounded-[12px] bg-[#F5F8FA] p-4">
              <p className="text-xs font-bold text-[#17324D]">
                Entitlements Layanan Aktif
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs text-[#526675]">
                <li>· 1.500 Human Workforce (Staff Sales, Affiliate, Teknisi)</li>
                <li>· 50 AI Workforce Slots dengan AI Gateway &amp; Memory Isolation</li>
                <li>· Akses API &amp; Analytics Real-Time (4 Regional)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'sow' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Ruang Lingkup Statement of Work (SOW-2026-ISP01)
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                title: 'Managed Staff Sales & Affiliate Operations',
                detail: 'Penyediaan & pengelolaan tim Staff Sales dan jaringan Affiliate Freelance dengan skema pembagian produktivitas inkremental 60/40.',
              },
              {
                title: 'Managed Field Technician Workforce',
                detail: 'Eksekusi instalasi FTTH/FWA, troubleshooting, foto bukti redaman optik, dan Quality Control sesuai SLA.',
              },
              {
                title: 'Managed AI Workforce & AI Gateway',
                detail: 'Pengoperasian AI Sales, AI Lead Qualification, AI Marketing, dan AI Technical Assistant dengan kontrol batas AI Credits.',
              },
              {
                title: 'Provider Integration & Reconciliation',
                detail: 'Sinkronisasi status order & aktivasi melalui kanal resmi terotorisasi beserta buku besar komisi deterministik.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4"
              >
                <p className="text-sm font-bold text-[#17324D]">{item.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-[#526675]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'sla' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Matriks SLA &amp; Target KPI Kontraktual
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8E3E9] text-xs font-semibold text-[#526675]">
                  <th className="py-3 pr-4">Metrik Layanan</th>
                  <th className="py-3 px-4 text-right">Target Kontrak</th>
                  <th className="py-3 px-4 text-right">Aktual Bulan Ini</th>
                  <th className="py-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
                <tr>
                  <td className="py-3.5 pr-4 font-semibold text-[#17324D]">
                    Penyelesaian Work Order FTTH (≤ 24 Jam)
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular">95,0%</td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#247A55]">
                    98,6%
                  </td>
                  <td className="py-3.5 pl-4 text-right text-xs font-bold text-[#247A55]">
                    Memenuhi
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-semibold text-[#17324D]">
                    First Time Fix Rate
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular">92,0%</td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#247A55]">
                    96,2%
                  </td>
                  <td className="py-3.5 pl-4 text-right text-xs font-bold text-[#247A55]">
                    Memenuhi
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-semibold text-[#17324D]">
                    Waktu Respon Awal AI Lead Qualification
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular">&lt; 30 dtk</td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#247A55]">
                    4,2 dtk
                  </td>
                  <td className="py-3.5 pl-4 text-right text-xs font-bold text-[#247A55]">
                    Memenuhi
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
