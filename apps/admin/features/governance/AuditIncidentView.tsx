'use client';

import React, { useMemo, useState } from 'react';
import {
  FileClock,
  AlertTriangle,
  Search,
  Download,
  Plus,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type { AuditLogRecord, IncidentRecord } from '../../lib/admin-types';

export function AuditIncidentView({
  auditLogs,
  incidents,
  onOpenAuditDetail,
  onExportAudit,
  onOpenCreateIncident,
  onResolveIncident,
  onNotify,
  onBack,
}: {
  auditLogs: AuditLogRecord[];
  incidents: IncidentRecord[];
  onOpenAuditDetail: (logId: string) => void;
  onExportAudit: () => void;
  onOpenCreateIncident: () => void;
  onResolveIncident: (id: string) => void;
  onNotify: (msg: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'audit' | 'insiden'>('audit');
  const [query, setQuery] = useState('');

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return auditLogs;
    return auditLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.targetResource.toLowerCase().includes(q) ||
        l.tenantScope.toLowerCase().includes(q)
    );
  }, [auditLogs, query]);

  const handleExportAudit = () => {
    void onExportAudit()
      .then(() => onNotify('Audit export berhasil diunduh dari FastAPI.'))
      .catch((error) => onNotify(error instanceof Error ? error.message : 'Audit export gagal.'));
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Data Log & Insiden (Audit Log & Incident)"
        subtitle="Catatan audit append-only seluruh aksi sensitif platform dan pelacakan insiden operasional serta mitigasi SRE."
        onBack={onBack}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportAudit}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3.5 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6] whitespace-nowrap"
            >
              <Download className="h-4 w-4 text-[#0284C7]" />
              <span>Export Log</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateIncident}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Catat Insiden</span>
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSegmentedTabs
          tabs={[
            { id: 'audit', label: `Audit Log (${auditLogs.length})` },
            { id: 'insiden', label: `Insiden (${incidents.length})` },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        {tab === 'audit' && (
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter aksi, aktor email, atau tenant..."
              className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-9 pr-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7]"
            />
          </div>
        )}
      </div>

      {tab === 'audit' && (
        <div className="space-y-2.5">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-2 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF2F6] text-[#17324D]">
                  <FileClock className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#17324D]">
                      {log.action}
                    </span>
                    <AdminStatusText
                      tone={
                        log.result === 'Sukses' || log.result === 'Disetujui'
                          ? 'success'
                          : 'danger'
                      }
                      label={log.result}
                    />
                  </div>
                  <p className="text-xs text-[#526675]">
                    oleh <strong className="text-[#172B3A]">{log.actorEmail}</strong> ·{' '}
                    {log.targetResource} · {log.tenantScope}
                  </p>
                  <p className="mt-0.5 font-mono-tabular text-[11px] text-[#718391]">
                    {log.timestamp}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuditDetail(log.id)}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Lihat Diff</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'insiden' && (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#A96816]/10 text-[#A96816]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#17324D]">{inc.title}</h3>
                    <AdminStatusText
                      tone={
                        inc.status === 'Terselesaikan'
                          ? 'success'
                          : inc.severity === 'Kritis' || inc.severity === 'Tinggi'
                            ? 'danger'
                            : 'warning'
                      }
                      label={`${inc.status} · ${inc.severity}`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[#526675]">
                    Domain: {inc.domain} · Owner: {inc.owner} · Dilaporkan: {inc.reportedAt}
                  </p>
                </div>
              </div>

              {inc.status !== 'Terselesaikan' && (
                <button
                  type="button"
                  onClick={() => onResolveIncident(inc.id)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#247A55] px-3.5 text-xs font-semibold text-white hover:bg-[#1E6647]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selesaikan</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
