'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, X, Share } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from './usePWAInstall';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore service worker registration errors in restricted preview frames
      });
    }
  }, []);

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-[10px] border border-[#F59E0B]/40 bg-[#A96816] px-3.5 py-2 text-xs font-medium text-white shadow-md lg:bottom-5"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Mode Offline — Data tersimpan lokal dan siap disinkronkan.</span>
    </div>
  );
}

interface PWAInstallButtonProps {
  variant?: 'primary' | 'subtle' | 'card';
  className?: string;
}

export function PWAInstallButton({
  variant = 'subtle',
  className = '',
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'card' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#ADD8E6] bg-[#E6F4F9] px-4 py-3 text-left transition hover:border-[#87CEEB] hover:bg-[#DCEFF7] ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#0284C7] text-white">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#17324D]">
                Pasang Aplikasi di Perangkat
              </p>
              <p className="text-xs text-[#526675]">
                Ringan · Cepat · Akses Offline Siap Lapangan
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-[8px] bg-[#17324D] px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap">
            Install
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
            variant === 'primary'
              ? 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
              : 'border border-[#B8C9D3] bg-white text-[#17324D] hover:bg-[#E6F4F9]'
          } ${className}`}
        >
          <Smartphone className="h-3.5 w-3.5 shrink-0" />
          <span>Install App</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#172B3A]">
                  Install Agentzy ke Layar Utama
                </h3>
                <p className="mt-1 text-xs text-[#526675]">
                  {isIOS
                    ? 'Panduan pemasangan aplikasi di iPhone / iPad (Safari)'
                    : 'Panduan pemasangan aplikasi di Browser Desktop / Android'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#526675] hover:bg-[#EAF2F6]"
                aria-label="Tutup panduan install"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-sm text-[#172B3A]">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E6F4F9] text-xs font-bold text-[#17324D]">
                    1
                  </span>
                  <span>
                    Ketuk tombol <strong className="inline-flex items-center gap-1">Bagikan <Share className="h-3.5 w-3.5 inline" /></strong> di bilah Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E6F4F9] text-xs font-bold text-[#17324D]">
                    2
                  </span>
                  <span>
                    Gulir ke bawah dan pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-sm text-[#172B3A]">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E6F4F9] text-xs font-bold text-[#17324D]">
                    1
                  </span>
                  <span>
                    Klik ikon <strong>Install</strong> di bilah alamat browser (Chrome / Edge), atau buka menu browser.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E6F4F9] text-xs font-bold text-[#17324D]">
                    2
                  </span>
                  <span>
                    Pilih <strong>Install Agentzy</strong> / <strong>Tambahkan ke Layar Utama</strong> untuk akses cepat dan dukungan offline.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-[10px] bg-[#17324D] py-2.5 text-sm font-semibold text-white transition hover:bg-[#245477]"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
