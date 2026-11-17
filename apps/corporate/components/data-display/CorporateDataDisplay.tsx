'use client';

import React from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

export function CorporatePageHeader({
  title,
  subtitle,
  onBack,
  actions,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#D8E3E9] bg-white text-[#17324D] transition hover:bg-[#EAF2F6] lg:hidden"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-[#17324D] sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[#526675] sm:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function CorporateSegmentedTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: ReadonlyArray<{ id: T; label: string }>;
  activeTab: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex w-full sm:w-auto items-center gap-1 rounded-[10px] border border-[#D8E3E9] bg-[#EAF2F6] p-1"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 sm:flex-initial min-h-[38px] rounded-[8px] px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
              active
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatusIndicator({
  tone,
  label,
}: {
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  label: string;
}) {
  const styles = {
    success: 'text-[#247A55]',
    warning: 'text-[#A96816]',
    danger: 'text-[#B23A48]',
    info: 'text-[#2D6F91]',
    neutral: 'text-[#526675]',
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${styles}`}>
      <span>{label}</span>
    </span>
  );
}

export function DeltaText({ valuePct }: { valuePct: number }) {
  const positive = valuePct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono-tabular text-xs font-semibold ${
        positive ? 'text-[#247A55]' : 'text-[#B23A48]'
      }`}
    >
      {positive ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      <span>
        {positive ? '+' : ''}
        {valuePct}%
      </span>
    </span>
  );
}

export function ChartMetaFooter({
  unit,
  period,
  source,
  lastUpdated,
}: {
  unit: string;
  period: string;
  source: string;
  lastUpdated: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#EAF2F6] pt-3 text-[11px] text-[#718391]">
      <Info className="h-3.5 w-3.5 shrink-0 text-[#5F879E]" />
      <span>Unit: {unit}</span>
      <span aria-hidden="true">·</span>
      <span>Periode: {period}</span>
      <span aria-hidden="true">·</span>
      <span>Sumber: {source}</span>
      <span aria-hidden="true">·</span>
      <span>Diperbarui: {lastUpdated}</span>
    </div>
  );
}

export function ActivationTrendChart({
  data,
}: {
  data: Array<{ month: string; aktivasi: number; target: number; order: number }>;
}) {
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.aktivasi, d.target)),
    4000
  );
  const chartHeight = 160;
  const chartWidth = 420;
  const paddingX = 28;
  const stepX = (chartWidth - paddingX * 2) / Math.max(data.length - 1, 1);

  const linePoints = data
    .map((d, idx) => {
      const x = paddingX + idx * stepX;
      const y = chartHeight - (d.target / maxVal) * (chartHeight - 24);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-[#526675]">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-[#0284C7]" />
          <span>Aktivasi Pelanggan</span>
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="h-0.5 w-4 bg-[#17324D]" />
          <span>Target Bulanan</span>
        </span>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 28}`}
          className="h-52 w-full min-w-[320px]"
          role="img"
          aria-label="Grafik tren aktivasi pelanggan dibanding target"
        >
          {/* Horizontal guide lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight - ratio * (chartHeight - 24);
            const labelVal = Math.round((maxVal * ratio) / 1000);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX - 10}
                  x2={chartWidth - 10}
                  y1={y}
                  y2={y}
                  stroke="#EAF2F6"
                  strokeWidth="1"
                />
                <text
                  x="4"
                  y={y + 4}
                  fontSize="10"
                  fill="#718391"
                  className="font-mono-tabular"
                >
                  {labelVal}K
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, idx) => {
            const x = paddingX + idx * stepX;
            const barH = (d.aktivasi / maxVal) * (chartHeight - 24);
            const y = chartHeight - barH;
            return (
              <g key={d.month}>
                <rect
                  x={x - 13}
                  y={y}
                  width="26"
                  height={barH}
                  rx="4"
                  fill="#0284C7"
                  opacity="0.9"
                />
                <text
                  x={x}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#526675"
                  fontWeight="600"
                >
                  {d.month}
                </text>
              </g>
            );
          })}

          {/* Target Polyline */}
          <polyline
            fill="none"
            stroke="#17324D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />
          {data.map((d, idx) => {
            const x = paddingX + idx * stepX;
            const y = chartHeight - (d.target / maxVal) * (chartHeight - 24);
            return (
              <circle
                key={`pt-${d.month}`}
                cx={x}
                cy={y}
                r="4"
                fill="#FFFFFF"
                stroke="#17324D"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function AttendanceDonutRing({
  percentage,
  present,
  total,
}: {
  percentage: number;
  present: number;
  total: number;
}) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg viewBox="0 0 112 112" className="h-32 w-32 -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="#EAF2F6"
            strokeWidth="12"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="#247A55"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono-tabular text-xl font-bold text-[#17324D]">
            {percentage.toFixed(1).replace('.', ',')}%
          </span>
          <span className="font-mono-tabular text-[11px] text-[#526675]">
            {present.toLocaleString('id-ID')} / {total.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
}
