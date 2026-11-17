'use client';

import React, { useState } from 'react';
import { PlugZap, Plus, Pencil, Trash2, Activity } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type {
  IntegrationConnectorRecord,
  WebhookLogRecord,
} from '../../lib/admin-types';

export function IntegrationsWebhooksView({
  integrations,
  webhookLogs,
  onOpenModal,
  onDelete,
  onTestPing,
  onBack,
}: {
  integrations: IntegrationConnectorRecord[];
  webhookLogs: WebhookLogRecord[];
  onOpenModal: (connector?: IntegrationConnectorRecord) => void;
  onDelete?: (id: string) => void;
  onTestPing: (connectorName: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'integrasi' | 'webhook' | 'log'>('integrasi');

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Integrasi & Webhook Health"
        subtitle="Status konektor platform (CRM, Google Workspace, Maps/Geospatial, Midtrans), manajemen endpoint webhook, dan log pengiriman idempoten."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Integrasi</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'integrasi', label: `Integrasi (${integrations.length})` },
          { id: 'webhook', label: 'Webhook Endpoints' },
          { id: 'log', label: `Log (${webhookLogs.length})` },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'integrasi' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {integrations.map((conn) => (
            <div
              key={conn.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                    <PlugZap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17324D]">{conn.name}</h3>
                    <p className="text-[11px] text-[#526675]">
                      {conn.category} · {conn.authMethod}
                    </p>
                  </div>
                </div>
                <AdminStatusText
                  tone={
                    conn.healthStatus === 'Terhubung'
                      ? 'success'
                      : conn.healthStatus === 'Degraded'
                        ? 'warning'
                        : 'danger'
                  }
                  label={conn.healthStatus}
                />
              </div>

              <div className="rounded-[10px] bg-[#F5F8FA] px-3.5 py-2.5 text-xs text-[#526675]">
                <p className="truncate font-mono-tabular text-[11px] text-[#172B3A]">
                  {conn.endpointUrl}
                </p>
                <p className="mt-1">
                  Sync: {conn.lastSyncAt} · Sukses Webhook:{' '}
                  <span className="font-mono-tabular font-bold text-[#247A55]">
                    {String(conn.webhookSuccessPct).replace('.', ',')}%
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-[#EAF2F6] pt-3">
                <button
                  type="button"
                  onClick={() => onTestPing(conn.name)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6]"
                >
                  <Activity className="h-3.5 w-3.5 text-[#247A55]" />
                  <span>Test Ping</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal(conn)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(conn.id)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                    aria-label={`Hapus ${conn.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'webhook' && (
        <div className="space-y-3">
          {/* Mobile Webhook Cards */}
          <div className="space-y-2.5 md:hidden">
            {integrations.map((conn) => (
              <div
                key={conn.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-[#17324D]">{conn.name}</p>
                  <span className="font-mono-tabular text-xs font-bold text-[#247A55]">
                    {String(conn.webhookSuccessPct).replace('.', ',')}%
                  </span>
                </div>
                <p className="truncate font-mono-tabular text-[11px] text-[#526675]">
                  {conn.endpointUrl}
                </p>
                <p className="text-xs text-[#172B3A]">Verifikasi: {conn.authMethod}</p>
              </div>
            ))}
          </div>

          {/* Desktop Webhook Table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Konektor</th>
                    <th className="px-4 py-3 font-semibold">Endpoint Target</th>
                    <th className="px-4 py-3 font-semibold">Skema Verifikasi</th>
                    <th className="px-4 py-3 font-semibold text-right">Uptime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {integrations.map((conn) => (
                    <tr key={conn.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3 font-bold text-[#17324D]">{conn.name}</td>
                      <td className="px-4 py-3 font-mono-tabular text-[11px] text-[#526675]">
                        {conn.endpointUrl}
                      </td>
                      <td className="px-4 py-3 text-[#172B3A]">{conn.authMethod}</td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-bold text-[#247A55]">
                        {String(conn.webhookSuccessPct).replace('.', ',')}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="space-y-3">
          {/* Mobile Log Cards */}
          <div className="space-y-2.5 md:hidden">
            {webhookLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">{log.connectorName}</p>
                    <p className="font-mono-tabular text-[11px] text-[#0284C7]">
                      {log.eventType}
                    </p>
                  </div>
                  <span className="font-mono-tabular text-xs font-bold text-[#247A55]">
                    HTTP {log.httpStatus}
                  </span>
                </div>
                <p className="truncate font-mono-tabular text-[11px] text-[#526675]">
                  Key: {log.idempotencyKey}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#718391]">
                  <span className="font-mono-tabular">{log.latencyMs} ms</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Log Table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Konektor &amp; Event</th>
                    <th className="px-4 py-3 font-semibold">Idempotency Key</th>
                    <th className="px-4 py-3 font-semibold text-right">HTTP</th>
                    <th className="px-4 py-3 font-semibold text-right">Latensi</th>
                    <th className="px-4 py-3 font-semibold text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {webhookLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#17324D]">{log.connectorName}</p>
                        <p className="font-mono-tabular text-[11px] text-[#0284C7]">
                          {log.eventType}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono-tabular text-[11px] text-[#526675]">
                        {log.idempotencyKey}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-bold text-[#247A55]">
                        {log.httpStatus}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular text-[#17324D]">
                        {log.latencyMs} ms
                      </td>
                      <td className="px-4 py-3 text-right text-[#718391]">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
