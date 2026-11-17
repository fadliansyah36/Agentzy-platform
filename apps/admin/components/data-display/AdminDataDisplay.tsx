'use client';

import React from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Info,
} from 'lucide-react';

export function AdminPageHeader({
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
            aria-label="Kembali ke Global Overview"
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
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

export function AdminSegmentedTabs<T extends string>({
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
      className="inline-flex w-full sm:w-auto items-center gap-1 rounded-[10px] border border-[#D8E3E9] bg-[#EAF2F6] p-1 overflow-x-auto"
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

export function AdminStatusText({
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
    info: 'text-[#0284C7]',
    neutral: 'text-[#526675]',
  }[tone];

  const Icon = {
    success: CheckCircle2,
    warning: Clock,
    danger: XCircle,
    info: Info,
    neutral: AlertTriangle,
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${styles}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export function AdminDeltaText({ valuePct }: { valuePct: number }) {
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

export function FinanceRevenueLineChart({
  data,
}: {
  data: Array<{ month: string; pendapatanM: number; terbayarM: number }>;
}) {
  const maxVal = 5;
  const chartHeight = 140;
  const chartWidth = 380;
  const padX = 28;
  const stepX = (chartWidth - padX * 2) / Math.max(data.length - 1, 1);

  const revenuePoints = data
    .map((d, i) => {
      const x = padX + i * stepX;
      const y = chartHeight - (d.pendapatanM / maxVal) * (chartHeight - 20);
      return `${x},${y}`;
    })
    .join(' ');

  const settledPoints = data
    .map((d, i) => {
      const x = padX + i * stepX;
      const y = chartHeight - (d.terbayarM / maxVal) * (chartHeight - 20);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-[#526675]">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="h-0.5 w-4 bg-[#0284C7]" />
          <span>Pendapatan Platform (Rp M)</span>
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="h-0.5 w-4 bg-[#247A55]" />
          <span>Terbayar / Rekonsiliasi (Rp M)</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 24}`}
          className="h-44 w-full min-w-[300px]"
          role="img"
          aria-label="Grafik pendapatan dan penyelesaian pembayaran bulanan"
        >
          {[1, 2, 3, 4, 5].map((val) => {
            const y = chartHeight - (val / maxVal) * (chartHeight - 20);
            return (
              <g key={val}>
                <line
                  x1={padX - 6}
                  x2={chartWidth - 10}
                  y1={y}
                  y2={y}
                  stroke="#EAF2F6"
                  strokeWidth="1"
                />
                <text
                  x="2"
                  y={y + 3}
                  fontSize="10"
                  fill="#718391"
                  className="font-mono-tabular"
                >
                  {val}M
                </text>
              </g>
            );
          })}
          <polyline
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={revenuePoints}
          />
          <polyline
            fill="none"
            stroke="#247A55"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={settledPoints}
          />
          {data.map((d, i) => {
            const x = padX + i * stepX;
            const yRev = chartHeight - (d.pendapatanM / maxVal) * (chartHeight - 20);
            return (
              <g key={d.month}>
                <circle
                  cx={x}
                  cy={yRev}
                  r="4"
                  fill="#FFFFFF"
                  stroke="#0284C7"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={chartHeight + 16}
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
        </svg>
      </div>
    </div>
  );
}

export function TopTenantsPerformanceChart({
  data,
}: {
  data: Array<{ month: string; ispNusantara: number; globalNet: number; citraNet: number }>;
}) {
  const minVal = 93;
  const maxVal = 100;
  const chartHeight = 140;
  const chartWidth = 380;
  const padX = 32;
  const stepX = (chartWidth - padX * 2) / Math.max(data.length - 1, 1);

  const mapY = (v: number) =>
    chartHeight - ((v - minVal) / (maxVal - minVal)) * (chartHeight - 24);

  const line1 = data.map((d, i) => `${padX + i * stepX},${mapY(d.ispNusantara)}`).join(' ');
  const line2 = data.map((d, i) => `${padX + i * stepX},${mapY(d.globalNet)}`).join(' ');
  const line3 = data.map((d, i) => `${padX + i * stepX},${mapY(d.citraNet)}`).join(' ');

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-[#526675]">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="h-2 w-2 rounded-xs bg-[#0284C7]" />
          <span>ISP Nusantara</span>
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="h-2 w-2 rounded-xs bg-[#247A55]" />
          <span>GlobalNet ISP</span>
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="h-2 w-2 rounded-xs bg-[#786A9C]" />
          <span>CitraNet</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 24}`}
          className="h-44 w-full min-w-[300px]"
          role="img"
          aria-label="Grafik kinerja operasional 3 tenant teratas"
        >
          {[94, 96, 98, 100].map((val) => {
            const y = mapY(val);
            return (
              <g key={val}>
                <line
                  x1={padX - 6}
                  x2={chartWidth - 10}
                  y1={y}
                  y2={y}
                  stroke="#EAF2F6"
                  strokeWidth="1"
                />
                <text
                  x="2"
                  y={y + 3}
                  fontSize="10"
                  fill="#718391"
                  className="font-mono-tabular"
                >
                  {val}%
                </text>
              </g>
            );
          })}
          <polyline fill="none" stroke="#0284C7" strokeWidth="2.5" points={line1} />
          <polyline fill="none" stroke="#247A55" strokeWidth="2" points={line2} />
          <polyline fill="none" stroke="#786A9C" strokeWidth="2" points={line3} />
          {data.map((d, i) => {
            const x = padX + i * stepX;
            return (
              <text
                key={d.month}
                x={x}
                y={chartHeight + 16}
                textAnchor="middle"
                fontSize="11"
                fill="#526675"
                fontWeight="600"
              >
                {d.month}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
