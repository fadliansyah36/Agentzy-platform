'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  FileWarning,
  ArrowRight,
  CheckCheck,
} from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import type {
  CorporateAlertItem,
  CorporateSectionId,
} from '../../lib/corporate-types';

export function NotificationsAlertsView({
  alerts,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  onBack,
}: {
  alerts: CorporateAlertItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (section: CorporateSectionId) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'semua' | 'operasional' | 'keuangan'>('semua');

  const filtered = alerts.filter((a) => {
    if (tab === 'operasional') return a.category === 'Operasional' || a.category === 'Kontrak';
    if (tab === 'keuangan') return a.category === 'Keuangan';
    return true;
  });

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Notifikasi & Peringatan"
        subtitle="Peringatan SLA real-time, ambang budget AI Credits, dan jatuh tempo kontrak"
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3.5 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6] whitespace-nowrap"
          >
            <CheckCheck className="h-4 w-4 text-[#0284C7]" />
            <span>Tandai Semua Dibaca</span>
          </button>
        }
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'semua', label: 'Semua' },
          { id: 'operasional', label: 'Operasional' },
          { id: 'keuangan', label: 'Keuangan' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      <div className="space-y-3">
        {filtered.map((alert) => {
          const Icon =
            alert.severity === 'danger'
              ? AlertTriangle
              : alert.severity === 'warning'
                ? alert.category === 'Keuangan'
                  ? Coins
                  : FileWarning
                : CheckCircle2;

          const iconColor =
            alert.severity === 'danger'
              ? 'text-[#B23A48] bg-[#B23A48]/10'
              : alert.severity === 'warning'
                ? 'text-[#A96816] bg-[#A96816]/10'
                : 'text-[#247A55] bg-[#247A55]/10';

          return (
            <div
              key={alert.id}
              className={`flex flex-col gap-3 rounded-[14px] border p-4 sm:flex-row sm:items-center sm:justify-between ${
                alert.read
                  ? 'border-[#D8E3E9] bg-white'
                  : 'border-[#87CEEB] bg-[#F8FCFE]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${iconColor}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#17324D]">
                      {alert.title}
                    </h3>
                    {!alert.read && (
                      <span className="text-[11px] font-bold text-[#0284C7]">
                        · Baru
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#526675]">
                    {alert.description}
                  </p>
                  <p className="mt-1 text-[11px] text-[#718391]">
                    {alert.category} · {alert.timeAgo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!alert.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(alert.id)}
                    className="rounded-[8px] border border-[#D8E3E9] bg-white px-3 py-1.5 text-xs font-semibold text-[#526675] hover:text-[#17324D] whitespace-nowrap"
                  >
                    Tandai Dibaca
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onMarkRead(alert.id);
                    onNavigate(alert.targetSection);
                  }}
                  className="inline-flex items-center gap-1 rounded-[8px] bg-[#17324D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#245477] whitespace-nowrap"
                >
                  <span>Buka Modul</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
