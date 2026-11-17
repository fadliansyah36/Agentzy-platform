'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Wand2 } from 'lucide-react';
import type { AutonomyLevel } from '../../lib/ai-workforce-types';

const STEPS = [
  { id: 1, label: 'Profil' },
  { id: 2, label: 'Model' },
  { id: 3, label: 'Skill' },
  { id: 4, label: 'Memory' },
  { id: 5, label: 'Selesai' },
];

export function AIWorkerStudioView({
  onCancel,
  onCreateWorker,
}: {
  onCancel: () => void;
  onCreateWorker: (payload: {
    name: string;
    department: string;
    jobType: 'Collaborative (Human + AI)' | 'Supervised Autonomous';
    autonomyLevel: AutonomyLevel;
    model: string;
    skills: string[];
    memoryScopes: string[];
    mission: string;
  }) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Operations Coordinator');
  const [department, setDepartment] = useState('Operasional');
  const [jobType, setJobType] = useState<
    'Collaborative (Human + AI)' | 'Supervised Autonomous'
  >('Collaborative (Human + AI)');
  const [template, setTemplate] = useState('Koordinator Operasional ISP');
  const [model, setModel] = useState('Gemini 4 Hydrogen');
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('L2');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'ISP Sales & Product v1.2.0',
    'Lead Scoring & Qualification v1.1.0',
  ]);
  const [selectedMemories, setSelectedMemories] = useState<string[]>([
    'Working Memory',
    'Semantic Memory',
    'Organizational Memory',
  ]);
  const [mission, setMission] = useState(
    'Membantu koordinasi tim atau pemasaran Staff Sales berbasis data dan otomasi jadwal yang disetujui supervisor.'
  );

  const toggleItem = (
    list: string[],
    setter: (v: string[]) => void,
    item: string
  ) => {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-[#D8E3E9] bg-white text-[#17324D]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs font-semibold text-[#0284C7]">
              AI Worker Studio · Wizard 5 Tahap
            </p>
            <h1 className="text-xl font-bold text-[#17324D]">
              Buat AI Worker Baru
            </h1>
          </div>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 rounded-[14px] border border-[#D8E3E9] bg-white p-2 sm:p-3">
        {STEPS.map((s) => {
          const active = s.id === step;
          const done = s.id < step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex flex-col items-center rounded-[10px] py-2 px-0.5 text-center transition ${
                active
                  ? 'bg-[#E6F4F9] text-[#17324D]'
                  : done
                    ? 'text-[#247A55]'
                    : 'text-[#718391]'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full font-mono-tabular text-xs font-bold ${
                  active
                    ? 'bg-[#0284C7] text-white'
                    : done
                      ? 'bg-[#247A55] text-white'
                      : 'bg-[#EAF2F6] text-[#526675]'
                }`}
              >
                {s.id}
              </span>
              <span className="mt-1 text-[10px] sm:text-[11px] font-semibold truncate w-full">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Wizard Card */}
      <div className="rounded-[16px] border border-[#D8E3E9] bg-white p-4 sm:p-6 space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#17324D]">
              1. Profil &amp; Kontrak Peran AI Worker
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Nama AI Worker
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Departemen
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-xs"
                >
                  <option>Operasional</option>
                  <option>Sales &amp; Acquisition</option>
                  <option>Sales &amp; Affiliate</option>
                  <option>Customer Support</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Tipe Kolaborasi
                </label>
                <select
                  value={jobType}
                  onChange={(e) =>
                    setJobType(
                      e.target.value as
                        | 'Collaborative (Human + AI)'
                        | 'Supervised Autonomous'
                    )
                  }
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-xs"
                >
                  <option value="Collaborative (Human + AI)">
                    Human + AI (Recommended)
                  </option>
                  <option value="Supervised Autonomous">
                    Supervised Autonomous
                  </option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Template Awal
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-xs"
                >
                  <option>Koordinator Operasional ISP</option>
                  <option>AI Sales &amp; Content Assistant</option>
                  <option>AI Lead Qualification</option>
                  <option>AI Teknisi Troubleshooting</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Misi Utama AI Worker
              </label>
              <textarea
                rows={3}
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="w-full rounded-[10px] border border-[#B8C9D3] p-3 text-xs"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#17324D]">
              2. Pilih Kebijakan Model &amp; Level Otonomi
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {['Gemini 4 Hydrogen', 'GPT-5.1', 'Claude 4.5'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  className={`rounded-[12px] border p-4 text-left ${
                    model === m
                      ? 'border-[#0284C7] bg-[#E6F4F9]'
                      : 'border-[#D8E3E9] bg-[#F5F8FA]'
                  }`}
                >
                  <p className="text-xs font-bold text-[#17324D]">{m}</p>
                  <p className="mt-1 text-[11px] text-[#526675]">
                    Allowlisted · Tenant Ready
                  </p>
                </button>
              ))}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-[#17324D]">
                Level Otonomi (L0–L4)
              </p>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {(['L0', 'L1', 'L2', 'L3', 'L4'] as const).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setAutonomyLevel(lv)}
                    className={`h-11 sm:h-10 rounded-[9px] border font-mono-tabular text-xs font-bold ${
                      autonomyLevel === lv
                        ? 'border-[#0284C7] bg-[#0284C7] text-white'
                        : 'border-[#D8E3E9] bg-white text-[#17324D]'
                    }`}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#17324D]">
              3. Pasang Skills dari Skills Registry
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                'ISP Sales & Product v1.2.0',
                'Lead Scoring & Qualification v1.1.0',
                'Affiliate Program v2.0.0',
                'Work Order & SLA v1.3.0',
                'Creative Content Studio v2.0.0',
              ].map((sk) => {
                const active = selectedSkills.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() =>
                      toggleItem(selectedSkills, setSelectedSkills, sk)
                    }
                    className={`flex items-center justify-between rounded-[11px] border p-3.5 text-left text-xs font-semibold ${
                      active
                        ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                        : 'border-[#D8E3E9] bg-white text-[#526675]'
                    }`}
                  >
                    <span>{sk}</span>
                    {active && <CheckCircle2 className="h-4 w-4 text-[#0284C7]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#17324D]">
              4. Konfigurasi Scope Memori &amp; Pengetahuan
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                'Working Memory',
                'Conversation Memory',
                'Semantic Memory',
                'Procedural Memory',
                'Organizational Memory',
              ].map((mem) => {
                const active = selectedMemories.includes(mem);
                return (
                  <button
                    key={mem}
                    type="button"
                    onClick={() =>
                      toggleItem(selectedMemories, setSelectedMemories, mem)
                    }
                    className={`flex items-center justify-between rounded-[11px] border p-3.5 text-left text-xs font-semibold ${
                      active
                        ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                        : 'border-[#D8E3E9] bg-white text-[#526675]'
                    }`}
                  >
                    <span>{mem}</span>
                    {active && <CheckCircle2 className="h-4 w-4 text-[#0284C7]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#247A55]">
              <Wand2 className="h-5 w-5" />
              <h2 className="text-base font-bold text-[#17324D]">
                5. Ringkasan &amp; Publikasikan AI Worker
              </h2>
            </div>
            <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 text-xs space-y-1.5 text-[#172B3A]">
              <p>
                <strong>Nama:</strong> {name} ({department})
              </p>
              <p>
                <strong>Tipe &amp; Otonomi:</strong> {jobType} · {autonomyLevel}
              </p>
              <p>
                <strong>Model Utama:</strong> {model}
              </p>
              <p>
                <strong>Skills ({selectedSkills.length}):</strong>{' '}
                {selectedSkills.join(', ')}
              </p>
              <p>
                <strong>Memory ({selectedMemories.length}):</strong>{' '}
                {selectedMemories.join(', ')}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2.5 border-t border-[#EAF2F6] pt-4">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : onCancel())}
            className="h-11 sm:h-10 flex-1 sm:flex-none rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
          >
            {step > 1 ? 'Sebelumnya' : 'Batal'}
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex h-11 sm:h-10 flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white hover:bg-[#0369A1]"
            >
              <span>Lanjut</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                onCreateWorker({
                  name,
                  department,
                  jobType,
                  autonomyLevel,
                  model,
                  skills: selectedSkills,
                  memoryScopes: selectedMemories,
                  mission,
                })
              }
              className="inline-flex h-11 sm:h-10 flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-[10px] bg-[#247A55] px-5 text-xs font-semibold text-white hover:bg-[#1D6345]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Publikasikan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
