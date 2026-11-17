'use client';

import React, { useMemo, useState } from 'react';
import {
  Puzzle,
  Wrench,
  Search,
  Plus,
  CheckCircle2,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import type {
  SkillPackageItem,
  ToolIntegrationItem,
} from '../../lib/ai-workforce-types';

export function SkillsToolsView({
  skills,
  tools,
  onInstallSkill,
  onOpenAddSkill,
  onToggleToolPermission,
}: {
  skills: SkillPackageItem[];
  tools: ToolIntegrationItem[];
  onInstallSkill: (skillId: string) => void;
  onOpenAddSkill: () => void;
  onToggleToolPermission: (toolId: string) => void;
}) {
  const [mainTab, setMainTab] = useState<'skills' | 'tools'>('skills');
  const [skillFilter, setSkillFilter] = useState<'Semua' | 'Terpasang' | 'Tersedia'>('Semua');
  const [toolFilter, setToolFilter] = useState<'Tools' | 'Permission' | 'Approval'>('Tools');
  const [search, setSearch] = useState('');

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      if (skillFilter !== 'Semua' && s.status !== skillFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.publisher.toLowerCase().includes(q)
      );
    });
  }, [skills, skillFilter, search]);

  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      if (toolFilter === 'Approval' && !t.approvalRequired && t.permissionStatus !== 'Review') {
        return false;
      }
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.scopeSummary.toLowerCase().includes(q)
      );
    });
  }, [tools, toolFilter, search]);

  return (
    <div className="space-y-5">
      {/* Header + Main Switch (Screens 10 & 11) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Screens 10 &amp; 11 · Skills Registry &amp; Tools Permission
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Skills Registry &amp; Integrasi Tools
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Kelola paket kemampuan (skills) dan batasan izin tool eksternal AI Worker.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <div className="grid w-full grid-cols-2 gap-1 rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto">
            <button
              type="button"
              onClick={() => setMainTab('skills')}
              className={`inline-flex h-9 sm:h-8 items-center justify-center gap-1.5 rounded-[8px] px-3 text-xs font-semibold whitespace-nowrap ${
                mainTab === 'skills'
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#526675] hover:text-[#17324D]'
              }`}
            >
              <Puzzle className="h-3.5 w-3.5 shrink-0" />
              <span>Skills Registry</span>
            </button>
            <button
              type="button"
              onClick={() => setMainTab('tools')}
              className={`inline-flex h-9 sm:h-8 items-center justify-center gap-1.5 rounded-[8px] px-3 text-xs font-semibold whitespace-nowrap ${
                mainTab === 'tools'
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#526675] hover:text-[#17324D]'
              }`}
            >
              <Wrench className="h-3.5 w-3.5 shrink-0" />
              <span>Tools &amp; Izin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718391]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              mainTab === 'skills'
                ? 'Cari skill (mis. ISP Sales, Content Studio)...'
                : 'Cari tool atau integrasi...'
            }
            className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] pl-9 pr-3 text-xs text-[#172B3A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {mainTab === 'skills' ? (
            <>
              <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center">
                {(['Semua', 'Terpasang', 'Tersedia'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSkillFilter(f)}
                    className={`h-9 rounded-[9px] border px-2.5 sm:px-3 text-xs font-semibold whitespace-nowrap ${
                      skillFilter === f
                        ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                        : 'border-[#D8E3E9] bg-white text-[#526675]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onOpenAddSkill}
                className="inline-flex h-10 sm:h-9 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[9px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah / Import Skill</span>
              </button>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center">
              {(['Tools', 'Permission', 'Approval'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setToolFilter(f)}
                  className={`h-9 rounded-[9px] border px-2.5 sm:px-3.5 text-xs font-semibold whitespace-nowrap ${
                    toolFilter === f
                      ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                      : 'border-[#D8E3E9] bg-white text-[#526675]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screen 10: Skills Registry Cards */}
      {mainTab === 'skills' && (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                      <Puzzle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#17324D]">
                        {skill.name}
                      </h3>
                      <p className="font-mono-tabular text-[11px] text-[#526675]">
                        {skill.version} · {skill.publisher}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${
                      skill.status === 'Terpasang'
                        ? 'bg-[#247A55]/10 text-[#247A55]'
                        : 'bg-[#0284C7]/10 text-[#0284C7]'
                    }`}
                  >
                    {skill.status}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#526675]">
                  {skill.description}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF2F6] pt-3">
                <span className="text-[11px] text-[#718391]">
                  Risiko: <strong className="text-[#17324D]">{skill.risk}</strong> · Tools:{' '}
                  {skill.requiredTools.join(', ')}
                </span>
                {skill.status === 'Tersedia' ? (
                  <button
                    type="button"
                    onClick={() => onInstallSkill(skill.id)}
                    className="h-8 rounded-[8px] bg-[#0284C7] px-3 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
                  >
                    Pasang Skill
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#247A55]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Siap dipakai Worker</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screen 11: Tools Registry & Permissions */}
      {mainTab === 'tools' && (
        <div className="space-y-3">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#17324D]">
                      {tool.name}
                    </h3>
                    <span className="text-[11px] font-medium text-[#718391]">
                      · {tool.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#526675]">{tool.scopeSummary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#718391]">
                    <span className="inline-flex items-center gap-1">
                      {tool.approvalRequired ? (
                        <ShieldAlert className="h-3.5 w-3.5 text-[#A96816]" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-[#247A55]" />
                      )}
                      {tool.approvalRequired
                        ? 'Wajib Approval Manusia untuk aksi eksternal'
                        : 'Akses Internal Terbatas'}
                    </span>
                    <span>Dipakai: {tool.lastUsed}</span>
                  </div>
                </div>
              </div>

              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end shrink-0 border-t border-[#EAF2F6] pt-2.5 sm:border-t-0 sm:pt-0">
                <span
                  className={`rounded-[6px] px-2.5 py-1 text-xs font-semibold ${
                    tool.permissionStatus === 'Disetujui'
                      ? 'bg-[#247A55]/10 text-[#247A55]'
                      : tool.permissionStatus === 'Review'
                        ? 'bg-[#A96816]/10 text-[#A96816]'
                        : 'bg-[#B23A48]/10 text-[#B23A48]'
                  }`}
                >
                  {tool.permissionStatus}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleToolPermission(tool.id)}
                  className="h-9 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D] hover:border-[#0284C7] whitespace-nowrap"
                >
                  {tool.permissionStatus === 'Disetujui' ? 'Batasi Izin' : 'Setujui Izin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
