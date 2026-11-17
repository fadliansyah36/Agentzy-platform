'use client';

import React, { useState } from 'react';
import {
  MapPin,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
  DeltaText,
} from '../../components/data-display/CorporateDataDisplay';
import type { CorporateWorkOrder } from '../../lib/corporate-types';

export function TechnicalOperationsView({
  workOrders,
  onOpenMapModal,
  onOpenEvidenceModal,
  onBack,
}: {
  workOrders: CorporateWorkOrder[];
  onOpenMapModal: (workOrderId?: string) => void;
  onOpenEvidenceModal: (workOrderId: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'wo' | 'instalasi' | 'sla'>('wo');

  const filteredWOs =
    tab === 'sla'
      ? workOrders.filter(
          (w) => w.status === 'Perlu Perhatian SLA' || w.status === 'QC Pending'
        )
      : tab === 'instalasi'
        ? workOrders.filter((w) => w.type === 'Instalasi Baru' || w.evidenceReady)
        : workOrders;

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Technical Operations"
        subtitle="Pemantauan Work Order teknisi lapangan, kepatuhan SLA, dan inspeksi QC"
        onBack={onBack}
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'wo', label: 'Work Order' },
          { id: 'instalasi', label: 'Instalasi' },
          { id: 'sla', label: 'SLA' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {/* Top 3 Stat Cards (Matches Screen 7) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
          <p className="text-xs font-medium text-[#526675]">Total WO</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
            1.420
          </p>
        </div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
          <p className="text-xs font-medium text-[#526675]">Proses</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#0284C7]">
            326
          </p>
        </div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
          <p className="text-xs font-medium text-[#526675]">Selesai</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#247A55]">
            1.032
          </p>
        </div>
      </div>

      {/* SLA Penyelesaian & Peta Sebaran Pekerjaan */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#526675]">
                SLA Penyelesaian
              </p>
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <span className="font-mono-tabular text-3xl font-bold text-[#17324D]">
                  98,6%
                </span>
                <DeltaText valuePct={0.8} />
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#A96816]/25 text-xs font-bold text-[#A96816]">
              SLA
            </div>
          </div>

          <div className="mt-5 space-y-2.5 border-t border-[#EAF2F6] pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#526675]">Rata-rata Durasi Instalasi FTTH</span>
              <span className="font-mono-tabular font-bold text-[#17324D]">1 jam 38 mnt</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#526675]">First Time Fix Rate</span>
              <span className="font-mono-tabular font-bold text-[#247A55]">96,2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#526675]">WO Butuh Eskalasi SLA</span>
              <span className="font-mono-tabular font-bold text-[#B23A48]">12 WO</span>
            </div>
          </div>
        </div>

        {/* Map Preview Card + Full Map Modal Trigger */}
        <div className="flex flex-col justify-between overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white lg:col-span-7">
          <div className="relative h-48 w-full bg-[radial-gradient(#B8C9D3_1px,transparent_1px)] [background-size:18px_18px] bg-[#EAF2F6] p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-[8px] border border-[#D8E3E9] bg-white px-2.5 py-1 text-xs font-semibold text-[#17324D]">
                Sebaran Lokasi Teknisi &amp; Work Order
              </span>
              <span className="font-mono-tabular text-[11px] font-semibold text-[#526675]">
                4 Regional Aktif
              </span>
            </div>

            {/* Clean Regional Cluster Pins */}
            <svg viewBox="0 0 420 120" className="mt-2 h-28 w-full" aria-hidden="true">
              <path
                d="M 40 70 Q 140 20 220 65 T 380 50"
                fill="none"
                stroke="#87CEEB"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              {[
                { x: 95, y: 54, label: 'Jaksel (142)' },
                { x: 185, y: 42, label: 'Bekasi (84)' },
                { x: 265, y: 74, label: 'Bandung (62)' },
                { x: 350, y: 46, label: 'Surabaya (38)' },
              ].map((pin) => (
                <g key={pin.label}>
                  <circle cx={pin.x} cy={pin.y} r="7" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2.5" />
                  <text
                    x={pin.x}
                    y={pin.y + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#17324D"
                    fontWeight="600"
                  >
                    {pin.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <button
            type="button"
            onClick={() => onOpenMapModal()}
            className="flex items-center justify-between border-t border-[#D8E3E9] bg-white px-5 py-3.5 text-sm font-bold text-[#17324D] transition hover:bg-[#E6F4F9]"
          >
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#0284C7]" />
              <span>Peta Sebaran Pekerjaan</span>
            </span>
            <ChevronRight className="h-4 w-4 text-[#0284C7]" />
          </button>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <h2 className="text-base font-bold text-[#17324D]">
          Daftar Work Order ({tab === 'sla' ? 'Prioritas SLA & QC' : tab === 'instalasi' ? 'Instalasi & Bukti' : 'Terbaru'})
        </h2>
        <div className="mt-4 divide-y divide-[#EAF2F6]">
          {filteredWOs.map((wo) => (
            <div
              key={wo.id}
              className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono-tabular font-bold text-[#0284C7]">
                    {wo.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#17324D]">{wo.type}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#526675]">{wo.packageName}</span>
                </div>
                <p className="mt-1 text-sm font-bold text-[#172B3A]">
                  {wo.customerName}
                </p>
                <p className="text-xs text-[#526675]">
                  {wo.address} · Teknisi: {wo.technicianName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    wo.status === 'Selesai'
                      ? 'text-[#247A55]'
                      : wo.status === 'Perlu Perhatian SLA'
                        ? 'text-[#B23A48]'
                        : 'text-[#A96816]'
                  }`}
                >
                  {wo.status === 'Selesai' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : wo.status === 'Perlu Perhatian SLA' ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span>{wo.slaRemaining}</span>
                </span>

                <button
                  type="button"
                  onClick={() => onOpenMapModal(wo.id)}
                  className="rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-1.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9] whitespace-nowrap"
                >
                  Lihat Peta
                </button>

                {wo.evidenceReady && (
                  <button
                    type="button"
                    onClick={() => onOpenEvidenceModal(wo.id)}
                    className="inline-flex items-center gap-1 rounded-[8px] bg-[#17324D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#245477] whitespace-nowrap"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>Bukti &amp; QC</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
