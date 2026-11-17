'use client';

import React, { useState } from 'react';
import { Layers, Plus, CheckCircle2, XCircle, Sliders, FileSignature } from 'lucide-react';
import { formatNumberID } from '../../lib/admin-data';
import type { CooperationPolicyRecord } from '../../lib/admin-types';

const ENTITLEMENT_LABELS: Array<{
  key: keyof CooperationPolicyRecord['entitlements'];
  label: string;
}> = [
  { key: 'aiGateway', label: 'AI Gateway & Ledger Kredit' },
  { key: 'modelRouter', label: 'Smart Model Router & Fallback' },
  { key: 'memoryRag', label: 'Tenant-Scoped Memory & RAG' },
  { key: 'customWorkflow', label: 'Custom Workflow & Approval' },
  { key: 'breakGlassAudit', label: 'Break-Glass Dual Approval' },
  { key: 'dedicatedSso', label: 'Dedicated SSO / SAML & VPC' },
];

export function SubscriptionPlansView({
  policies,
  onOpenPolicyModal,
  onToggleEntitlement,
}: {
  policies: CooperationPolicyRecord[];
  onOpenPolicyModal: (policy?: CooperationPolicyRecord) => void;
  onToggleEntitlement: (
    policyId: string,
    key: keyof CooperationPolicyRecord['entitlements']
  ) => void;
}) {
  const [tab, setTab] = useState<'profiles' | 'entitlement' | 'limits'>('profiles');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">
            Profil Kontrak Kerjasama, Entitlement & Kuota
          </h1>
          <p className="mt-1 text-sm text-[#526675]">
            Tidak menggunakan paket langganan SaaS bulanan — seluruh hak modul & kuota tenant diatur
            berdasarkan perjanjian kontrak kerjasama dan saldo Top Up AI Credits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenPolicyModal()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1]"
        >
          <Plus className="h-3.5 w-3.5" /> Buat Profil Kontrak Baru
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:w-fit">
        {[
          { id: 'profiles', label: 'Profil Kerjasama' },
          { id: 'entitlement', label: 'Matrix Entitlement' },
          { id: 'limits', label: 'Kuota & SLA Kontrak' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`whitespace-nowrap rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id
                ? 'bg-[#17324D] text-white'
                : 'text-[#526675] hover:bg-[#F5F8FA] hover:text-[#172B3A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profiles' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-[#0284C7]" />
                      <h3 className="text-base font-bold text-[#172B3A]">{policy.name}</h3>
                    </div>
                    <p className="mt-1 text-xs text-[#526675]">{policy.contractScopeNote}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      policy.status === 'Aktif' ? 'text-[#247A55]' : 'text-[#526675]'
                    }`}
                  >
                    {policy.status}
                  </span>
                </div>

                <div className="mt-4 border-y border-[#D8E3E9] py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#526675]">
                    Alokasi Awal AI Credits (Per Kontrak)
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-[#172B3A] tabular-nums">
                    {formatNumberID(policy.includedAiCreditsMonthly)} Credits
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#526675]">
                    Nilai komersial mengikuti MSA & SOW korporat (Top Up terpisah)
                  </p>
                </div>

                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-[#526675]">Kapasitas Pengguna</dt>
                    <dd className="font-semibold text-[#172B3A]">{policy.maxUsers}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-[#526675]">Kuota AI Worker</dt>
                    <dd className="font-semibold text-[#172B3A]">{policy.maxAiWorkers}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-[#526675]">Workflow Aktif</dt>
                    <dd className="font-semibold text-[#172B3A]">{policy.maxWorkflows}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-[#526675]">Storage RAG</dt>
                    <dd className="font-semibold text-[#172B3A]">{policy.storageLimit}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-[#526675]">Rate Limit API</dt>
                    <dd className="font-semibold text-[#172B3A]">{policy.apiRateLimit}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-[#526675]">Jaminan SLA</dt>
                    <dd className="font-semibold text-[#247A55]">{policy.slaGuarantee}</dd>
                  </div>
                </dl>
              </div>

              <button
                type="button"
                onClick={() => onOpenPolicyModal(policy)}
                className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] text-xs font-semibold text-[#172B3A] hover:border-[#0284C7] hover:bg-[#E6F4F9]"
              >
                <Sliders className="h-3.5 w-3.5 text-[#0284C7]" />
                Edit Profil & Kuota Kontrak
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'entitlement' && (
        <div className="overflow-x-auto rounded-[14px] border border-[#D8E3E9] bg-white">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-b border-[#D8E3E9] bg-[#F5F8FA] text-[11px] font-semibold uppercase tracking-wider text-[#526675]">
              <tr>
                <th className="px-4 py-3">Kapabilitas / Modul Platform</th>
                {policies.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-center">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E3E9]">
              {ENTITLEMENT_LABELS.map((item) => (
                <tr key={item.key} className="hover:bg-[#F5F8FA]/60">
                  <td className="px-4 py-3 font-medium text-[#172B3A]">{item.label}</td>
                  {policies.map((p) => {
                    const enabled = p.entitlements[item.key];
                    return (
                      <td key={p.id} className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleEntitlement(p.id, item.key)}
                          className={`inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            enabled
                              ? 'border-[#247A55]/30 bg-[#E6F4F9]/50 text-[#247A55]'
                              : 'border-[#D8E3E9] bg-[#F5F8FA] text-[#526675]'
                          }`}
                        >
                          {enabled ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" /> Tidak Aktif
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'limits' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#0284C7]" />
            <h2 className="text-sm font-bold text-[#172B3A]">
              Enforcement Kuota & Kebijakan Kontrak Kerjasama
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#526675]">
            Tidak ada pembatasan fitur berbasis langganan bulanan. Seluruh limit kapasitas di bawah
            diterapkan otomatis sesuai nomor kontrak kerjasama & saldo Top Up AI Credits tiap tenant.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4"
              >
                <p className="text-sm font-bold text-[#172B3A]">{policy.name}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-[#526675]">
                  <li>• Kredit Awal: {formatNumberID(policy.includedAiCreditsMonthly)} Credits</li>
                  <li>• Maks User: {policy.maxUsers}</li>
                  <li>• Maks AI Worker: {policy.maxAiWorkers}</li>
                  <li>• Maks Workflow: {policy.maxWorkflows}</li>
                  <li>• Vector RAG: {policy.storageLimit}</li>
                  <li>• API Throttle: {policy.apiRateLimit}</li>
                  <li>• Target SLA: {policy.slaGuarantee}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
