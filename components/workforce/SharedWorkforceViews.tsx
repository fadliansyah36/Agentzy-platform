'use client';

import React, { useEffect, useState } from 'react';
import {
  MapPin,
  CheckCircle2,
  Clock,
  GraduationCap,
  Award,
  Bell,
  FileText,
  HelpCircle,
  Search,
  ChevronRight,
  ShieldCheck,
  QrCode,
  Mail,
  Calendar,
  Video,
  RefreshCw,
  LogOut,
  X,
  Plus,
  LocateFixed,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  INITIAL_COURSES,
  INITIAL_CERTIFICATIONS,
  type WorkforceRoleMode,
} from '@/lib/agentzy-data';
import { PWAInstallButton } from '@/components/pwa/PWAControls';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { AttendanceGeolocationMap } from '@/components/maps/AttendanceGeolocationMap';
import type { GmailMessageSummary, CalendarEventSummary } from '@/lib/google-workspace';

interface GeoCoordinates {
  lat: number;
  lng: number;
}

interface AttendanceHistoryEntry {
  date: string;
  inTime: string;
  outTime: string;
  status: string;
  coordsLabel: string;
  accuracyLabel: string;
  areaLabel: string;
}

function calculateDistanceMeters(a: GeoCoordinates, b: GeoCoordinates): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return Math.round(2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

// --- 1. ABSENSI STAFF SALES & TEKNISI (Image 2 Screen 15 & Image 4 Screen 14) ---
export function AttendanceView({ roleMode }: { roleMode: WorkforceRoleMode }) {
  const isTech = roleMode === 'technician';
  const hubPosition: GeoCoordinates = isTech
    ? { lat: -6.265, lng: 106.812 }
    : { lat: -6.2615, lng: 106.8106 };
  const hubLabel = isTech
    ? 'Pos Operasional Teknisi Jakarta Selatan'
    : 'Hub Sales Agentzy Jakarta Selatan';
  const geofenceRadiusMeters = 5000;

  const [tab, setTab] = useState<'hari_ini' | 'riwayat' | 'rekap'>('hari_ini');
  const [checkedIn, setCheckedIn] = useState(isTech);
  const [checkInTime, setCheckInTime] = useState('08:00');
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [checkedOut, setCheckedOut] = useState(false);

  // Geolocation live detection state
  const [geoStatus, setGeoStatus] = useState<
    'detecting' | 'granted' | 'fallback' | 'denied' | 'unavailable'
  >(() =>
    typeof navigator !== 'undefined' && 'geolocation' in navigator
      ? 'detecting'
      : 'unavailable'
  );
  const [geoCoords, setGeoCoords] = useState<GeoCoordinates | null>(null);
  const [geoAccuracy, setGeoAccuracy] = useState<number | null>(null);
  const [geoAddress, setGeoAddress] = useState<string | null>(null);
  const [geoCapturedAt, setGeoCapturedAt] = useState<string | null>(null);
  const [geoErrorMsg, setGeoErrorMsg] = useState<string | null>(null);
  const [geoSource, setGeoSource] = useState<'gps' | 'demo_fallback' | null>(null);

  const [checkInStamp, setCheckInStamp] = useState<{
    time: string;
    coords: GeoCoordinates;
    accuracy: number | null;
    area: string;
    source: string;
  } | null>(() =>
    isTech
      ? {
          time: '08:00',
          coords: { lat: -6.265, lng: 106.812 },
          accuracy: 8,
          area: 'Pos Operasional Teknisi Jakarta Selatan',
          source: 'GPS Awal Shift',
        }
      : null
  );

  const [checkOutStamp, setCheckOutStamp] = useState<{
    time: string;
    coords: GeoCoordinates;
    accuracy: number | null;
    area: string;
  } | null>(null);

  const [historyEntries, setHistoryEntries] = useState<AttendanceHistoryEntry[]>([
    {
      date: 'Kemarin',
      inTime: '08:02',
      outTime: '17:08',
      status: 'Hadir Tepat Waktu',
      coordsLabel: isTech ? '-6.2651, 106.8122' : '-6.2616, 106.8108',
      accuracyLabel: '±9 m',
      areaLabel: 'Cilandak, Jakarta Selatan',
    },
    {
      date: '2 hari lalu',
      inTime: '07:55',
      outTime: '17:15',
      status: 'Hadir Tepat Waktu',
      coordsLabel: isTech ? '-6.2712, 106.8054' : '-6.2584, 106.8141',
      accuracyLabel: '±11 m',
      areaLabel: 'Kemang, Jakarta Selatan',
    },
    {
      date: '3 hari lalu',
      inTime: '08:00',
      outTime: '18:30',
      status: 'Hadir + Lembur',
      coordsLabel: isTech ? '-6.2640, 106.8190' : '-6.2621, 106.8099',
      accuracyLabel: '±7 m',
      areaLabel: 'Pasar Minggu, Jakarta Selatan',
    },
  ]);

  const [leaveModal, setLeaveModal] = useState<'Izin' | 'Cuti' | 'Lembur' | null>(
    null
  );
  const [leaveNote, setLeaveNote] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const resolveAddressForCoords = async (coords: GeoCoordinates) => {
    try {
      const res = await fetch(
        `/api/maps/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        address?: string | null;
        district?: string | null;
      };
      if (data.address || data.district) {
        setGeoAddress(data.district || data.address || null);
      }
    } catch {
      // Tetap tampilkan koordinat GPS apabila reverse geocoding tidak tersedia
    }
  };

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return;
    }

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const coords: GeoCoordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGeoCoords(coords);
        setGeoAccuracy(pos.coords.accuracy);
        setGeoStatus('granted');
        setGeoSource('gps');
        setGeoErrorMsg(null);
        setGeoCapturedAt(
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
        void resolveAddressForCoords(coords);
      },
      (err) => {
        if (cancelled) return;
        setGeoStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
        setGeoErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Izin akses lokasi perangkat ditolak. Aktifkan izin lokasi browser untuk mencatat absensi GPS.'
            : 'Sinyal GPS belum terdeteksi secara otomatis. Coba deteksi ulang atau gunakan titik pos demo.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDetectLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoStatus('unavailable');
      setGeoErrorMsg('Browser tidak mendukung Geolocation API.');
      return;
    }

    setGeoStatus('detecting');
    setGeoErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: GeoCoordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGeoCoords(coords);
        setGeoAccuracy(pos.coords.accuracy);
        setGeoStatus('granted');
        setGeoSource('gps');
        setGeoCapturedAt(
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
        void resolveAddressForCoords(coords);
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
        setGeoErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak pada browser Anda. Izinkan akses lokasi lalu klik Deteksi Ulang GPS.'
            : 'Gagal memperoleh koordinat GPS perangkat. Pastikan layanan lokasi aktif lalu coba lagi.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleUseDemoPoint = () => {
    const fallbackCoords: GeoCoordinates = {
      lat: hubPosition.lat + 0.0008,
      lng: hubPosition.lng - 0.0005,
    };
    setGeoCoords(fallbackCoords);
    setGeoAccuracy(12);
    setGeoStatus('fallback');
    setGeoSource('demo_fallback');
    setGeoAddress(hubLabel);
    setGeoErrorMsg(null);
    setGeoCapturedAt(
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  };

  const distanceMeters = geoCoords
    ? calculateDistanceMeters(geoCoords, hubPosition)
    : 0;
  const withinRadius = distanceMeters <= geofenceRadiusMeters;
  const hasVerifiedLocation = Boolean(geoCoords);

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleCheckIn = () => {
    if (!geoCoords) {
      handleDetectLocation();
      return;
    }
    const now = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const areaText = geoAddress || hubLabel;
    setCheckInTime(now);
    setCheckedIn(true);
    setCheckInStamp({
      time: now,
      coords: geoCoords,
      accuracy: geoAccuracy,
      area: areaText,
      source: geoSource === 'gps' ? 'GPS Perangkat' : 'Titik Pos Demo',
    });
    setHistoryEntries((prev) => {
      const filtered = prev.filter((item) => item.date !== 'Hari Ini');
      return [
        {
          date: 'Hari Ini',
          inTime: now,
          outTime: 'Aktif',
          status: withinRadius ? 'Check-in GPS Valid' : 'Tugas Lapangan (GPS)',
          coordsLabel: `${geoCoords.lat.toFixed(4)}, ${geoCoords.lng.toFixed(4)}`,
          accuracyLabel: geoAccuracy !== null ? `±${Math.round(geoAccuracy)} m` : 'Terverifikasi',
          areaLabel: areaText,
        },
        ...filtered,
      ];
    });
    setSubmittedNotice(
      `Absen masuk berhasil dicatat pada ${now} di koordinat ${geoCoords.lat.toFixed(
        5
      )}, ${geoCoords.lng.toFixed(5)}.`
    );
  };

  const handleCheckOut = () => {
    if (!geoCoords) {
      handleDetectLocation();
      return;
    }
    const now = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const areaText = geoAddress || hubLabel;
    setCheckOutTime(now);
    setCheckedOut(true);
    setCheckOutStamp({
      time: now,
      coords: geoCoords,
      accuracy: geoAccuracy,
      area: areaText,
    });
    setHistoryEntries((prev) => {
      const existingToday = prev.find((item) => item.date === 'Hari Ini');
      const nextToday: AttendanceHistoryEntry = {
        date: 'Hari Ini',
        inTime: existingToday?.inTime || checkInTime,
        outTime: now,
        status: 'Shift Selesai · GPS Terverifikasi',
        coordsLabel: `${geoCoords.lat.toFixed(4)}, ${geoCoords.lng.toFixed(4)}`,
        accuracyLabel: geoAccuracy !== null ? `±${Math.round(geoAccuracy)} m` : 'Terverifikasi',
        areaLabel: areaText,
      };
      return [nextToday, ...prev.filter((item) => item.date !== 'Hari Ini')];
    });
    setSubmittedNotice(
      `Check-out tercatat pada ${now} di koordinat ${geoCoords.lat.toFixed(
        5
      )}, ${geoCoords.lng.toFixed(5)}.`
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-[#17324D]">
          Absensi {isTech ? 'Teknisi' : 'Staff Sales'}
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#ADD8E6] bg-[#E6F4F9] px-2.5 py-1 text-[11px] font-bold text-[#17324D]">
          <LocateFixed className="h-3.5 w-3.5 text-[#0284C7]" />
          <span>Verifikasi Geolocation GPS</span>
        </span>
      </div>

      <div className="grid grid-cols-3 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {(
          [
            { id: 'hari_ini', label: 'Hari Ini' },
            { id: 'riwayat', label: 'Riwayat' },
            { id: 'rekap', label: 'Rekap' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-[8px] py-2 text-xs font-semibold transition ${
              tab === t.id
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {submittedNotice && (
        <div className="rounded-[10px] border border-[#247A55]/30 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-[#247A55]">
          {submittedNotice}
        </div>
      )}

      {tab === 'hari_ini' && (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-5 text-center sm:p-6">
            <div className="inline-flex items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-4 py-2 text-xs font-semibold text-[#17324D]">
              <Calendar className="h-4 w-4 text-[#0284C7]" />
              <span>{todayFormatted}</span>
            </div>

            <div className="mx-auto flex max-w-md flex-col items-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  checkedOut
                    ? 'bg-emerald-50 text-[#247A55]'
                    : checkedIn
                      ? 'bg-emerald-50 text-[#247A55]'
                      : geoStatus === 'detecting'
                        ? 'bg-[#E6F4F9] text-[#0284C7]'
                        : hasVerifiedLocation
                          ? 'bg-[#E6F4F9] text-[#0284C7]'
                          : 'bg-amber-50 text-[#A96816]'
                }`}
              >
                {geoStatus === 'detecting' ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : checkedIn ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : (
                  <MapPin className="h-8 w-8" />
                )}
              </div>
              <h2 className="mt-3 text-lg font-bold text-[#17324D]">
                {checkedOut
                  ? `Shift Selesai · Check-out (${checkOutTime || '-'})`
                  : checkedIn
                    ? `Sudah Check-in (${checkInTime})`
                    : 'Belum Absen Masuk'}
              </h2>
              <p className="mt-1 text-xs text-[#526675]">
                {geoStatus === 'detecting'
                  ? 'Mendeteksi koordinat geolocation perangkat Anda...'
                  : hasVerifiedLocation && geoCoords
                    ? `${geoAddress || hubLabel} · Akurasi ±${
                        geoAccuracy !== null ? Math.round(geoAccuracy) : 10
                      } m`
                    : 'Menunggu izin & deteksi lokasi GPS perangkat'}
              </p>
            </div>

            {/* Panel Deteksi Geolocation Real-Time */}
            <div className="mx-auto max-w-xl rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 text-left space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <LocateFixed className="h-4 w-4 text-[#0284C7]" />
                  <span className="text-xs font-bold text-[#17324D]">
                    Status Geolocation {isTech ? 'Teknisi' : 'Staff Sales'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      geoStatus === 'granted'
                        ? 'bg-emerald-100 text-[#247A55]'
                        : geoStatus === 'fallback'
                          ? 'bg-[#E6F4F9] text-[#0284C7]'
                          : geoStatus === 'detecting'
                            ? 'bg-[#E6F4F9] text-[#0284C7]'
                            : 'bg-amber-100 text-[#A96816]'
                    }`}
                  >
                    {geoStatus === 'granted'
                      ? 'GPS Perangkat Aktif'
                      : geoStatus === 'fallback'
                        ? 'Titik Pos Demo'
                        : geoStatus === 'detecting'
                          ? 'Mendeteksi...'
                          : 'Perlu Akses Lokasi'}
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={geoStatus === 'detecting'}
                    className="inline-flex items-center gap-1 rounded-[8px] border border-[#B8C9D3] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#17324D] hover:bg-[#EAF2F6] disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${
                        geoStatus === 'detecting' ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Deteksi Ulang GPS</span>
                  </button>
                </div>
              </div>

              {geoErrorMsg && (
                <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#A96816]" />
                    <p>{geoErrorMsg}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      className="rounded-[8px] bg-[#0284C7] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0369A1]"
                    >
                      Coba Deteksi Ulang
                    </button>
                    <button
                      type="button"
                      onClick={handleUseDemoPoint}
                      className="rounded-[8px] border border-[#B8C9D3] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
                    >
                      Gunakan Titik Pos Demo
                    </button>
                  </div>
                </div>
              )}

              {geoCoords && (
                <>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-[10px] border border-[#D8E3E9] bg-white p-2.5">
                      <p className="text-[10px] font-semibold text-[#526675]">
                        Koordinat (Lat, Lng)
                      </p>
                      <p className="mt-0.5 font-mono-tabular text-xs font-bold text-[#17324D]">
                        {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
                      </p>
                    </div>
                    <div className="rounded-[10px] border border-[#D8E3E9] bg-white p-2.5">
                      <p className="text-[10px] font-semibold text-[#526675]">
                        Akurasi &amp; Waktu
                      </p>
                      <p className="mt-0.5 font-mono-tabular text-xs font-bold text-[#0284C7]">
                        ±{geoAccuracy !== null ? Math.round(geoAccuracy) : 10} m ·{' '}
                        {geoCapturedAt || 'Baru saja'}
                      </p>
                    </div>
                    <div className="rounded-[10px] border border-[#D8E3E9] bg-white p-2.5">
                      <p className="text-[10px] font-semibold text-[#526675]">
                        Radius Hub Operasional
                      </p>
                      <p
                        className={`mt-0.5 font-mono-tabular text-xs font-bold ${
                          withinRadius ? 'text-[#247A55]' : 'text-[#A96816]'
                        }`}
                      >
                        {withinRadius
                          ? `Dalam Zona (${distanceMeters} m)`
                          : `Lapangan (${(distanceMeters / 1000).toFixed(1)} km)`}
                      </p>
                    </div>
                  </div>

                  <AttendanceGeolocationMap
                    position={geoCoords}
                    hubPosition={hubPosition}
                    hubLabel={hubLabel}
                    userLabel={
                      isTech ? 'Posisi Teknisi Saat Ini' : 'Posisi Staff Sales Saat Ini'
                    }
                    accuracyMeters={geoAccuracy}
                    distanceMeters={distanceMeters}
                    withinRadius={withinRadius}
                  />
                </>
              )}
            </div>

            {/* Stamp Hasil Check-in / Check-out */}
            {(checkInStamp || checkOutStamp) && (
              <div className="mx-auto max-w-xl grid grid-cols-1 gap-2 sm:grid-cols-2 text-left">
                {checkInStamp && (
                  <div className="rounded-[10px] border border-[#247A55]/25 bg-emerald-50/70 p-3 text-xs">
                    <p className="font-bold text-[#247A55]">
                      Bukti Lokasi Check-in · {checkInStamp.time}
                    </p>
                    <p className="mt-0.5 font-mono-tabular text-[11px] text-[#17324D]">
                      {checkInStamp.coords.lat.toFixed(5)},{' '}
                      {checkInStamp.coords.lng.toFixed(5)} (
                      {checkInStamp.accuracy !== null
                        ? `±${Math.round(checkInStamp.accuracy)} m`
                        : 'Terverifikasi'}
                      )
                    </p>
                    <p className="truncate text-[11px] text-[#526675]">
                      {checkInStamp.area} · {checkInStamp.source}
                    </p>
                  </div>
                )}
                {checkOutStamp && (
                  <div className="rounded-[10px] border border-[#0284C7]/25 bg-[#E6F4F9] p-3 text-xs">
                    <p className="font-bold text-[#0284C7]">
                      Bukti Lokasi Check-out · {checkOutStamp.time}
                    </p>
                    <p className="mt-0.5 font-mono-tabular text-[11px] text-[#17324D]">
                      {checkOutStamp.coords.lat.toFixed(5)},{' '}
                      {checkOutStamp.coords.lng.toFixed(5)} (
                      {checkOutStamp.accuracy !== null
                        ? `±${Math.round(checkOutStamp.accuracy)} m`
                        : 'Terverifikasi'}
                      )
                    </p>
                    <p className="truncate text-[11px] text-[#526675]">
                      {checkOutStamp.area}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mx-auto max-w-md space-y-3">
              {!checkedIn ? (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={geoStatus === 'detecting'}
                  className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1] disabled:opacity-50"
                >
                  {geoStatus === 'detecting'
                    ? 'Mendeteksi Lokasi GPS...'
                    : hasVerifiedLocation
                      ? 'Absen Masuk dengan Geolocation'
                      : 'Aktifkan GPS untuk Absen Masuk'}
                </button>
              ) : !checkedOut ? (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={geoStatus === 'detecting'}
                  className="h-11 w-full rounded-[10px] bg-[#17324D] text-sm font-semibold text-white hover:bg-[#245477] disabled:opacity-50"
                >
                  {geoStatus === 'detecting'
                    ? 'Mendeteksi Lokasi GPS...'
                    : hasVerifiedLocation
                      ? 'Check-out dengan Geolocation'
                      : 'Deteksi GPS untuk Check-out'}
                </button>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                {(['Izin', 'Cuti', 'Lembur'] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setLeaveModal(act)}
                    className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] py-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'riwayat' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 divide-y divide-[#EAF2F6] text-sm">
          {historyEntries.map((r) => (
            <div key={r.date} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-bold text-[#17324D]">{r.date}</p>
                <p className="font-mono-tabular text-xs text-[#526675]">
                  Masuk {r.inTime} · Keluar {r.outTime}
                </p>
                <p className="mt-0.5 font-mono-tabular text-[11px] text-[#718391]">
                  GPS: {r.coordsLabel} ({r.accuracyLabel}) · {r.areaLabel}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#247A55]">
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'rekap' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
            <p className="font-mono-tabular text-2xl font-bold text-[#247A55]">
              {checkedIn ? 21 : 20}
            </p>
            <p className="text-xs text-[#526675]">Hari Hadir</p>
          </div>
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
            <p className="font-mono-tabular text-2xl font-bold text-[#0284C7]">
              1
            </p>
            <p className="text-xs text-[#526675]">Izin / Cuti</p>
          </div>
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
            <p className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              6 jam
            </p>
            <p className="text-xs text-[#526675]">Lembur</p>
          </div>
        </div>
      )}

      {leaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmittedNotice(`Pengajuan ${leaveModal} berhasil dikirim ke supervisor.`);
              setLeaveNote('');
              setLeaveModal(null);
            }}
            className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl"
          >
            <h3 className="text-base font-bold text-[#17324D]">
              Form Pengajuan {leaveModal}
            </h3>
            <textarea
              rows={3}
              required
              placeholder={`Tuliskan alasan dan durasi ${leaveModal.toLowerCase()}...`}
              value={leaveNote}
              onChange={(e) => setLeaveNote(e.target.value)}
              className="mt-3 w-full rounded-[10px] border border-[#B8C9D3] p-3 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeaveModal(null)}
                className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
              >
                Kirim Pengajuan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// --- 2. PERFORMA & KPI (Image 2/3 Screen 15/16 & Image 4 Screen 15) ---
export function PerformanceKPIView({ roleMode }: { roleMode: WorkforceRoleMode }) {
  const [period, setPeriod] = useState<'Bulan Ini' | 'Kuartal Ini' | '6 Bulan'>(
    'Bulan Ini'
  );
  const isTech = roleMode === 'technician';
  const isAffiliate = roleMode === 'affiliate';

  const series = [
    { label: 'Jan', target: 18, actual: 14 },
    { label: 'Feb', target: 20, actual: 17 },
    { label: 'Mar', target: 22, actual: 20 },
    { label: 'Apr', target: 24, actual: 22 },
    { label: 'Mei', target: 26, actual: 24 },
    { label: 'Jun', target: 30, actual: 28 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#17324D]">Performa &amp; KPI</h1>
        <select
          value={period}
          onChange={(e) =>
            setPeriod(
              e.target.value as 'Bulan Ini' | 'Kuartal Ini' | '6 Bulan'
            )
          }
          className="h-10 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D]"
        >
          <option>Bulan Ini</option>
          <option>Kuartal Ini</option>
          <option>6 Bulan</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(isTech
          ? [
              { label: 'WO Diselesaikan', val: '42', delta: '+18%' },
              { label: 'Tingkat SLA', val: '98%', delta: '+2%' },
              { label: 'First Time Fix', val: '96%', delta: '+3%' },
            ]
          : isAffiliate
            ? [
                { label: 'Order Teraktivasi', val: '8', delta: '+24%' },
                { label: 'Tingkat Konversi', val: '36%', delta: '+8%' },
                { label: 'Prospek Valid', val: '22', delta: '+15%' },
              ]
            : [
                { label: 'Pencapaian Target', val: '80%', delta: '+10%' },
                { label: 'Produktivitas', val: '118%', delta: '+18%' },
                { label: 'Konversi Lead', val: '32%', delta: '+6%' },
              ]
        ).map((m) => (
          <div
            key={m.label}
            className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"
          >
            <p className="text-xs text-[#526675]">{m.label}</p>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
                {m.val}
              </span>
              <span className="font-mono-tabular text-xs font-semibold text-[#247A55]">
                {m.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#17324D]">
              {isTech
                ? 'Tren Penyelesaian Work Order'
                : isAffiliate
                  ? 'Tren Prospek & Aktivasi Affiliate'
                  : 'Tren Penjualan (Target vs Aktual)'}
            </h2>
            <p className="text-[11px] text-[#718391]">
              Periode: {period} · Unit: {isTech ? 'Work Order' : isAffiliate ? 'Order Aktivasi' : 'SA / Aktivasi'} · Sumber: Operational Telemetry · Diperbarui hari ini
            </p>
          </div>
        </div>

        <svg viewBox="0 0 380 160" className="mt-4 h-48 w-full">
          {series.map((d, idx) => {
            const x = 35 + idx * 56;
            const h = (d.actual / 32) * 115;
            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={130 - h}
                  width="26"
                  height={h}
                  rx="4"
                  fill="#0284C7"
                />
                <text
                  x={x + 13}
                  y="148"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#526675"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
          <polyline
            fill="none"
            stroke="#17324D"
            strokeWidth="2"
            strokeDasharray="4 3"
            points={series
              .map((d, idx) => `${48 + idx * 56},${130 - (d.target / 32) * 115}`)
              .join(' ')}
          />
        </svg>
      </div>
    </div>
  );
}

// --- 3. PELATIHAN & SERTIFIKASI (Image 2/3 Screen 17 & Image 4 Screen 19) ---
export function TrainingCertView({ roleMode }: { roleMode: WorkforceRoleMode }) {
  const [tab, setTab] = useState<'pelatihan' | 'sertifikasi' | 'saya'>('pelatihan');
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  const visibleCourses = courses.filter((c) => {
    if (c.roleScope === 'all') return true;
    if (roleMode === 'technician') return c.roleScope === 'technician';
    if (roleMode === 'affiliate') {
      return c.roleScope === 'affiliate' || c.roleScope === 'sales_and_affiliate';
    }
    return c.roleScope === 'sales' || c.roleScope === 'sales_and_affiliate';
  });
  const roleCerts = INITIAL_CERTIFICATIONS.filter((cert) =>
    cert.roleScope.includes(roleMode)
  );
  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#17324D]">
        Pelatihan &amp; Sertifikasi
      </h1>

      <div className="grid grid-cols-3 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {(
          [
            { id: 'pelatihan', label: 'Pelatihan' },
            { id: 'sertifikasi', label: 'Sertifikasi' },
            { id: 'saya', label: 'Saya' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-[8px] py-2 text-xs font-semibold transition ${
              tab === t.id
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pelatihan' && (
        <div className="space-y-3">
          {visibleCourses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCourseId(c.id)}
              className="flex w-full items-center justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left hover:border-[#87CEEB]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#17324D]">{c.title}</p>
                  <p className="text-xs text-[#526675]">
                    {c.format} · {c.durationMinutes} menit ·{' '}
                    <span className="font-semibold text-[#0284C7]">
                      {c.status} ({c.progressPct}%)
                    </span>
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#718391]" />
            </button>
          ))}
        </div>
      )}

      {tab === 'sertifikasi' && (
        <div className="space-y-3">
          {roleCerts.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-[#247A55]" />
                <div>
                  <p className="text-sm font-bold text-[#17324D]">{cert.title}</p>
                  <p className="text-xs text-[#526675]">
                    {cert.issuer} · Berlaku s/d {cert.validUntil}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#247A55]">
                {cert.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'saya' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#17324D]">
            Modul yang Telah Diselesaikan
          </h2>
          {visibleCourses
            .filter((c) => c.progressPct === 100)
            .map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] p-3 text-xs"
              >
                <span className="font-semibold text-[#17324D]">{c.title}</span>
                <span className="font-bold text-[#247A55]">100% Lulus</span>
              </div>
            ))}
        </div>
      )}

      {activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-[#17324D]">
                {activeCourse.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveCourseId(null)}
                className="rounded-lg p-1 text-[#526675]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-[#0284C7] font-semibold">
              {activeCourse.format} · {activeCourse.durationMinutes} menit
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#526675]">
              {activeCourse.description}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveCourseId(null)}
                className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setCourses((prev) =>
                    prev.map((c) =>
                      c.id === activeCourse.id
                        ? { ...c, status: 'Selesai', progressPct: 100 }
                        : c
                    )
                  );
                  setActiveCourseId(null);
                }}
                className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
              >
                Selesaikan Modul
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 4. NOTIFIKASI (Image 2/3 Screen 6) ---
export function NotificationsView({
  roleMode,
  onNavigate,
}: {
  roleMode: WorkforceRoleMode;
  onNavigate: (tab: string) => void;
}) {
  const [filter, setFilter] = useState<'Semua' | 'Penugasan' | 'Komisi' | 'Sistem'>(
    'Semua'
  );
  const [readIds, setReadIds] = useState<string[]>(['N-3', 'N-4', 'NT-3', 'NA-3']);

  const baseItems =
    roleMode === 'technician'
      ? [
          {
            id: 'NT-1',
            category: 'Penugasan' as const,
            title: 'Work Order Baru #WO-872341',
            desc: 'Instalasi Baru FTTH · Jl. Melati No. 12 · Prioritas Tinggi',
            targetTab: 'workorders',
          },
          {
            id: 'NT-2',
            category: 'Komisi' as const,
            title: 'Insentif SLA Ditambahkan',
            desc: 'Rp 150.000 (WO-872300 Selesai Tepat Waktu) · 2 jam lalu',
            targetTab: 'commission',
          },
          {
            id: 'NT-3',
            category: 'Sistem' as const,
            title: 'Modul SOP Instalasi Diperbarui',
            desc: 'Panduan konfigurasi ONT & standar K3 tersedia · Kemarin',
            targetTab: 'training',
          },
        ]
      : roleMode === 'affiliate'
        ? [
            {
              id: 'NA-1',
              category: 'Penugasan' as const,
              title: 'Prospek Lolos Cek Cakupan',
              desc: 'Prospek Nadia Kusuma siap dijadwalkan instalasi · 15 menit lalu',
              targetTab: 'leads',
            },
            {
              id: 'NA-2',
              category: 'Komisi' as const,
              title: 'Komisi 60% Ditambahkan',
              desc: 'Rp 240.000 (Aktivasi #ORD-78452) · 2 jam lalu',
              targetTab: 'commission',
            },
            {
              id: 'NA-3',
              category: 'Sistem' as const,
              title: 'Pelatihan Produk ISP Tersedia',
              desc: 'Promo paket FTTH terbaru telah dipublikasikan · Kemarin',
              targetTab: 'training',
            },
          ]
        : [
            {
              id: 'N-1',
              category: 'Penugasan' as const,
              title: 'Penugasan Baru',
              desc: 'Follow Up & Closing Lead ISP · 3 lead · 5 menit lalu',
              targetTab: 'tasks',
            },
            {
              id: 'N-2',
              category: 'Komisi' as const,
              title: 'Komisi Ditambahkan',
              desc: 'Rp 350.000 (Order #ORD-78452) · 2 jam lalu',
              targetTab: 'commission',
            },
            {
              id: 'N-3',
              category: 'Penugasan' as const,
              title: 'Affiliate Baru Bergabung',
              desc: 'Siti Nabila mendaftar melalui kode referral Anda · 3 jam lalu',
              targetTab: 'team',
            },
            {
              id: 'N-4',
              category: 'Sistem' as const,
              title: 'Pelatihan Tersedia',
              desc: 'Training Produk ISP Terbaru telah dipublikasikan · Kemarin',
              targetTab: 'training',
            },
          ];

  const items = baseItems.map((item) => ({
    ...item,
    unread: !readIds.includes(item.id),
  }));

  const visible = items.filter((i) => filter === 'Semua' || i.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#17324D]">Notifikasi</h1>
        <button
          type="button"
          onClick={() => setReadIds(baseItems.map((i) => i.id))}
          className="text-xs font-semibold text-[#0284C7] hover:underline"
        >
          Tandai semua dibaca
        </button>
      </div>

      <div className="grid grid-cols-4 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {(['Semua', 'Penugasan', 'Komisi', 'Sistem'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-[8px] py-2 text-xs font-semibold transition ${
              filter === t
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {visible.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => {
              setReadIds((prev) => (prev.includes(n.id) ? prev : [...prev, n.id]));
              onNavigate(n.targetTab);
            }}
            className={`flex w-full items-start justify-between gap-3 rounded-[14px] border p-4 text-left transition ${
              n.unread
                ? 'border-[#87CEEB] bg-[#E6F4F9]/50'
                : 'border-[#D8E3E9] bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0284C7] border border-[#D8E3E9]">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#17324D]">{n.title}</p>
                <p className="mt-0.5 text-xs text-[#526675]">{n.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#718391]" />
          </button>
        ))}
      </div>
    </div>
  );
}

// --- 5. PROFIL, WORKFORCE PASSPORT, KOMPETENSI & KONTRAK (Screens 18-20) ---
export function ProfilePassportView({
  roleMode,
  userName,
  sponsorInfo,
}: {
  roleMode: WorkforceRoleMode;
  userName?: string;
  sponsorInfo?: { name: string; code: string };
}) {
  const [tab, setTab] = useState<'profil' | 'kompetensi' | 'kontrak' | 'dokumen'>('profil');
  const [showPassport, setShowPassport] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showContractPdf, setShowContractPdf] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; number: string; desc: string } | null>(null);
  const [certs, setCerts] = useState(
    INITIAL_CERTIFICATIONS.filter((c) => c.roleScope.includes(roleMode))
  );
  const [newCertTitle, setNewCertTitle] = useState('');

  const isTech = roleMode === 'technician';
  const isAffiliate = roleMode === 'affiliate';
  const [profileName, setProfileName] = useState(
    userName || (isTech ? 'Budi Santoso' : roleMode === 'affiliate' ? 'Siti Nabila' : 'Raka Pratama')
  );
  const [profilePhone, setProfilePhone] = useState('0812 3456 7890');
  const [profileArea, setProfileArea] = useState('Jakarta Selatan');

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#17324D]">Profil Saya</h1>

      {/* Profile Header Card (Screen 18) */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#17324D] text-lg font-bold text-white">
          {profileName
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')}
        </div>
        <h2 className="mt-3 text-lg font-bold text-[#17324D]">{profileName}</h2>
        <p className="font-mono-tabular text-xs text-[#526675]">
          {isTech
            ? 'Teknisi FTTH · ID: TK-000128'
            : roleMode === 'affiliate'
              ? 'Affiliate Freelance · ID: AF-000312'
              : 'Sales Agentzy · ID: WF-000128'}
        </p>

        <button
          type="button"
          onClick={() => setShowPassport(true)}
          className="mt-3 inline-flex items-center gap-2 rounded-[10px] border border-[#87CEEB] bg-[#E6F4F9] px-4 py-2 text-xs font-bold text-[#17324D] hover:bg-[#DCEFF7]"
        >
          <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
          <span>Workforce Passport Terverifikasi</span>
        </button>
      </div>

      {/* Tabs: Profil | Kompetensi | Kontrak | Dokumen */}
      <div className="grid grid-cols-4 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {(
          [
            { id: 'profil', label: 'Profil' },
            { id: 'kompetensi', label: 'Kompetensi' },
            { id: 'kontrak', label: 'Kontrak' },
            { id: 'dokumen', label: 'Dokumen' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-[8px] py-2 text-xs font-semibold transition ${
              tab === t.id
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profil' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3 text-sm">
          <h3 className="font-bold text-[#17324D]">Data Pribadi</h3>
          <div className="divide-y divide-[#EAF2F6] text-xs sm:text-sm">
            <div className="flex justify-between py-2.5">
              <span className="text-[#526675]">Nama Lengkap</span>
              <span className="font-semibold text-[#172B3A]">{profileName}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#526675]">Nomor HP</span>
              <span className="font-mono-tabular font-semibold text-[#172B3A]">
                {profilePhone}
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#526675]">Email</span>
              <span className="font-semibold text-[#172B3A]">
                {isTech ? 'budi.santoso@agentzy.id' : 'raka@agentzy.id'}
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#526675]">Area Kerja</span>
              <span className="font-semibold text-[#172B3A]">{profileArea}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#526675]">Klasifikasi Hubungan</span>
              <span className="font-semibold text-[#172B3A]">
                {isTech
                  ? 'Teknisi Lapangan (Outsourced)'
                  : roleMode === 'affiliate'
                    ? 'Mitra Independen (Affiliate)'
                    : 'Sales Agentzy (Sales Resmi)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowEditProfile(true)}
            className="mt-3 h-10 w-full rounded-[10px] bg-[#0284C7] text-xs font-semibold text-white hover:bg-[#0369A1]"
          >
            Edit Profil
          </button>
        </div>
      )}

      {tab === 'kompetensi' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">Keahlian Utama</h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {(isTech
                ? ['Instalasi FTTH', 'Splicing Fiber', 'Konfigurasi ONT', 'K3 Lapangan']
                : isAffiliate
                  ? ['Akuisisi Prospek ISP', 'Konsultasi Paket FTTH/FWA', 'Follow-up Pelanggan', 'Kepatuhan Kode Etik']
                  : ['Sales ISP', 'Closing', 'Manajemen Tim Affiliate', 'Digital Sales']
              ).map((sk) => (
                <span
                  key={sk}
                  className="rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-1.5 text-xs font-semibold text-[#17324D]"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#17324D]">Sertifikasi</h3>
            <div className="mt-2.5 space-y-2.5">
              {certs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-[10px] border border-[#D8E3E9] p-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#17324D]">{c.title}</p>
                    <p className="text-[11px] text-[#526675]">
                      Berlaku s/d {c.validUntil}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-[#247A55]" />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCert(true)}
            className="h-10 w-full rounded-[10px] bg-[#0284C7] text-xs font-semibold text-white"
          >
            + Tambah Sertifikasi
          </button>
        </div>
      )}

      {tab === 'kontrak' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
          <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] p-4">
            <p className="text-xs font-semibold text-[#245477]">Kontrak Aktif</p>
            <h3 className="mt-1 text-base font-bold text-[#17324D]">
              {isTech
                ? 'Teknisi FTTH — Project Jakarta'
                : isAffiliate
                  ? 'Perjanjian Kemitraan Affiliate Freelance'
                  : 'Sales Resmi – Sales Agentzy Pro'}
            </h3>
            <p className="mt-1 text-xs text-[#526675]">
              Periode: 1 Jan 2025 – 31 Des 2025 · Status: <strong className="text-[#247A55]">Aktif</strong>
            </p>
          </div>

          <dl className="divide-y divide-[#EAF2F6] text-xs sm:text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-[#526675]">Perusahaan Partner</dt>
              <dd className="font-semibold text-[#172B3A]">Mitra ISP Provider Terotorisasi</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#526675]">Skema Komisi</dt>
              <dd className="font-semibold text-[#172B3A]">
                {isTech
                  ? 'Per Work Order + Insentif SLA'
                  : isAffiliate
                    ? 'Bagi Hasil Inkremental 60%'
                    : 'Combined Tier (Sales Agentzy Pro)'}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#526675]">Wilayah Penugasan</dt>
              <dd className="font-semibold text-[#172B3A]">{profileArea}</dd>
            </div>
            {isAffiliate && (
              <div className="flex justify-between py-2.5">
                <dt className="text-[#526675]">Staff Sales Sponsor</dt>
                <dd className="font-semibold text-[#0284C7]">
                  {sponsorInfo?.name || 'Raka Pratama'} ·{' '}
                  <span className="font-mono-tabular">
                    {sponsorInfo?.code || 'AGT-RAKA-2026'}
                  </span>
                </dd>
              </div>
            )}
          </dl>

          <button
            type="button"
            onClick={() => setShowContractPdf(true)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#0284C7] bg-white text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
          >
            <FileText className="h-4 w-4" />
            <span>Lihat Dokumen Kontrak (PDF)</span>
          </button>
        </div>
      )}

      {tab === 'dokumen' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#17324D]">Dokumen Saya &amp; Verifikasi KYC</h3>
          <div className="space-y-2.5">
            {[
              {
                title: 'KTP & Verifikasi Identitas KYC',
                number: '3174••••••••0021 · Terverifikasi',
                desc: 'Identitas resmi tervalidasi untuk Workforce Passport dan pencairan komisi.',
              },
              {
                title: isTech
                  ? 'Surat Tugas Teknisi Lapangan'
                  : isAffiliate
                    ? 'Perjanjian Kemitraan Affiliate'
                    : 'Surat Penugasan Sales Agentzy',
                number: isTech ? 'ST-TK/2025/00128' : isAffiliate ? 'PK-AF/2025/00312' : 'ST-SL/2025/00128',
                desc: `Penugasan resmi wilayah ${profileArea} untuk proyek kemitraan Mitra ISP Provider.`,
              },
              {
                title: 'NPWP & Rekening Pencairan Terverifikasi',
                number: 'BCA · 8840192831',
                desc: 'Rekening resmi atas nama pemegang Workforce Passport untuk batch payout.',
              },
            ].map((doc) => (
              <button
                key={doc.title}
                type="button"
                onClick={() => setPreviewDoc(doc)}
                className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#D8E3E9] p-3.5 text-left hover:border-[#0284C7] hover:bg-[#F5F8FA]"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-[#0284C7]" />
                  <div>
                    <p className="text-xs font-bold text-[#17324D]">{doc.title}</p>
                    <p className="font-mono-tabular text-[11px] text-[#526675]">{doc.number}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#718391]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-2.5">
              <h3 className="text-sm font-bold text-[#17324D]">{previewDoc.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-1 text-[#526675]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="font-mono-tabular text-xs font-semibold text-[#0284C7]">{previewDoc.number}</p>
            <p className="text-xs leading-relaxed text-[#526675]">{previewDoc.desc}</p>
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="w-full rounded-[10px] bg-[#17324D] py-2 text-xs font-semibold text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Workforce Passport Digital Modal */}
      {showPassport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[16px] border border-[#D8E3E9] bg-white p-6 shadow-xl text-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0284C7]">
                AGENTZY WORKFORCE PASSPORT
              </span>
              <button
                type="button"
                onClick={() => setShowPassport(false)}
                className="rounded-lg p-1 text-[#526675]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 rounded-[14px] border border-[#D8E3E9] bg-[#17324D] p-5 text-white">
              <QrCode className="mx-auto h-24 w-24 text-[#87CEEB]" />
              <p className="mt-3 text-base font-bold">{profileName}</p>
              <p className="font-mono-tabular text-xs text-[#ADD8E6]">
                {isTech ? 'TK-000128' : 'WF-000128'} · Terverifikasi KYC
              </p>
            </div>
            <p className="mt-3 text-xs text-[#526675]">
              Tunjukkan paspor digital ini saat check-in area operasional atau
              kunjungan pelanggan.
            </p>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowEditProfile(false);
            }}
            className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl space-y-3"
          >
            <h3 className="text-base font-bold text-[#17324D]">Edit Profil</h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Nomor HP
              </label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Area Kerja
              </label>
              <input
                type="text"
                value={profileArea}
                onChange={(e) => setProfileArea(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Certification Modal */}
      {showAddCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCertTitle.trim()) return;
              setCerts((prev) => [
                ...prev,
                {
                  id: `CRT-${Date.now()}`,
                  title: newCertTitle.trim(),
                  validUntil: '31 Des 2027',
                  issuer: 'Agentzy Workforce Academy',
                  status: 'Aktif',
                  roleScope: [roleMode],
                },
              ]);
              setNewCertTitle('');
              setShowAddCert(false);
            }}
            className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl space-y-3"
          >
            <h3 className="text-base font-bold text-[#17324D]">
              Tambah Sertifikasi
            </h3>
            <input
              type="text"
              required
              placeholder="Contoh: Sertifikasi Fiber Optic Lanjut"
              value={newCertTitle}
              onChange={(e) => setNewCertTitle(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCert(false)}
                className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
              >
                Tambahkan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contract Document Preview Modal */}
      {showContractPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <h3 className="text-base font-bold text-[#17324D]">
                Dokumen Perjanjian Kerja &amp; SOW
              </h3>
              <button
                type="button"
                onClick={() => setShowContractPdf(false)}
                className="rounded-lg p-1 text-[#526675]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 max-h-64 overflow-y-auto rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 text-xs leading-relaxed text-[#526675] space-y-2">
              <p className="font-bold text-[#17324D]">
                PERJANJIAN KEMITRAAN &amp; PENUGASAN WORKFORCE AGENTZY
              </p>
              <p>
                Pihak Pertama: Agentzy Managed Operations Indonesia. Pihak Kedua:{' '}
                <strong>{profileName}</strong>.
              </p>
              <p>
                Ruang lingkup mencakup pelaksanaan penugasan sesuai SOP resmi
                provider ISP partner, kepatuhan K3, perlindungan data pelanggan
                (UU PDP), serta perhitungan komisi berdasarkan event produktivitas
                tervalidasi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowContractPdf(false)}
              className="mt-4 w-full rounded-[10px] bg-[#17324D] py-2.5 text-sm font-semibold text-white"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 6. GOOGLE WORKSPACE HUB (Gmail, Google Calendar, Google Meet) ---
export function WorkspaceCenterView() {
  const {
    user,
    isConnected,
    isSigningIn,
    connectWorkspace,
    disconnectWorkspace,
    fetchInbox,
    fetchCalendar,
    openSendEmailModal,
    openScheduleMeetingModal,
    instantMeetRoom,
  } = useWorkspace();

  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [meetCreatedUrl, setMeetCreatedUrl] = useState<string | null>(null);

  const loadWorkspaceData = async () => {
    setLoadingData(true);
    setErrorMsg(null);
    try {
      const [inbox, cal] = await Promise.all([fetchInbox(), fetchCalendar()]);
      setMessages(inbox);
      setEvents(cal);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal memuat data Google Workspace.'
      );
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#17324D]">
            Google Workspace Hub
          </h1>
          <p className="text-xs text-[#526675]">
            Integrasi Gmail, Google Calendar, dan Google Meet dengan izin pengguna.
          </p>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadWorkspaceData}
              disabled={loadingData}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#B8C9D3] bg-white px-3 py-2 text-xs font-semibold text-[#17324D]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              <span>Sinkronkan</span>
            </button>
            <button
              type="button"
              onClick={disconnectWorkspace}
              className="rounded-[10px] border border-[#D8E3E9] bg-white px-3 py-2 text-xs font-semibold text-[#B23A48]"
            >
              Putuskan
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={connectWorkspace}
            disabled={isSigningIn}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1]"
          >
            <span>
              {isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}
            </span>
          </button>
        )}
      </div>

      {user && (
        <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] px-4 py-3 text-xs text-[#17324D]">
          Terhubung sebagai <strong>{user.email}</strong>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-xs text-[#B23A48]">
          {errorMsg}
        </div>
      )}

      {/* Quick Workspace Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() =>
            openSendEmailModal({
              to: '',
              subject: 'Tindak Lanjut Layanan Agentzy ISP',
              body: 'Halo,\n\nBerikut informasi tindak lanjut terkait penawaran paket ISP dari Agentzy.\n\nTerima kasih.',
              contextLabel: 'Kirim email baru via Gmail.',
            })
          }
          className="flex items-center gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left hover:border-[#0284C7]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#17324D]">Tulis Gmail</p>
            <p className="text-xs text-[#526675]">Kirim email tindak lanjut</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            const start = new Date(Date.now() + 86400000);
            start.setHours(10, 0, 0, 0);
            const end = new Date(start.getTime() + 45 * 60000);
            openScheduleMeetingModal({
              summary: 'Koordinasi Tim Workforce Agentzy',
              description: 'Agenda briefing & evaluasi pencapaian SA.',
              startIso: start.toISOString(),
              endIso: end.toISOString(),
              includeMeet: true,
            });
          }}
          className="flex items-center gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left hover:border-[#0284C7]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#17324D]">Buat Jadwal</p>
            <p className="text-xs text-[#526675]">Simpan ke Google Calendar</p>
          </div>
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              setErrorMsg(null);
              const res = await instantMeetRoom();
              setMeetCreatedUrl(res.meetingUri);
            } catch (err) {
              setErrorMsg(
                err instanceof Error ? err.message : 'Gagal membuat ruang Google Meet.'
              );
            }
          }}
          className="flex items-center gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left hover:border-[#0284C7]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#17324D]">Ruang Google Meet</p>
            <p className="text-xs text-[#526675]">Buat link rapat instan</p>
          </div>
        </button>
      </div>

      {meetCreatedUrl && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#247A55]/30 bg-emerald-50 p-4 text-xs">
          <div>
            <p className="font-bold text-[#247A55]">Ruang Google Meet Siap</p>
            <p className="font-mono-tabular text-[#17324D]">{meetCreatedUrl}</p>
          </div>
          <a
            href={meetCreatedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[8px] bg-[#247A55] px-3 py-2 font-semibold text-white"
          >
            Buka Google Meet
          </a>
        </div>
      )}

      {/* Live Gmail & Calendar Lists */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#17324D]">Kotak Masuk Gmail</h2>
            {isConnected && (
              <button
                type="button"
                onClick={loadWorkspaceData}
                className="text-xs font-semibold text-[#0284C7] hover:underline"
              >
                Muat Email
              </button>
            )}
          </div>
          {messages.length === 0 ? (
            <p className="mt-4 text-xs text-[#526675]">
              {isConnected
                ? 'Klik "Sinkronkan" atau "Muat Email" untuk mengambil pesan Gmail terbaru Anda.'
                : 'Hubungkan akun Google Anda untuk membaca dan mengirim email melalui Gmail.'}
            </p>
          ) : (
            <div className="mt-3 divide-y divide-[#EAF2F6] text-xs">
              {messages.map((m) => (
                <div key={m.id} className="py-2.5">
                  <p className="font-bold text-[#17324D] truncate">{m.subject}</p>
                  <p className="text-[#526675] truncate">{m.from}</p>
                  <p className="mt-0.5 text-[#718391] line-clamp-1">{m.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-sm font-bold text-[#17324D]">
            Agenda Google Calendar
          </h2>
          {events.length === 0 ? (
            <p className="mt-4 text-xs text-[#526675]">
              {isConnected
                ? 'Belum ada agenda mendatang atau klik "Sinkronkan" untuk memuat jadwal Google Calendar.'
                : 'Hubungkan akun Google Anda untuk menyinkronkan jadwal kunjungan & rapat Meet.'}
            </p>
          ) : (
            <div className="mt-3 divide-y divide-[#EAF2F6] text-xs">
              {events.map((ev) => (
                <div key={ev.id} className="py-2.5">
                  <p className="font-bold text-[#17324D]">{ev.summary}</p>
                  <p className="font-mono-tabular text-[#526675]">
                    {ev.start ? new Date(ev.start).toLocaleString('id-ID') : ''}
                  </p>
                  {ev.meetLink && (
                    <a
                      href={ev.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block font-semibold text-[#0284C7] hover:underline"
                    >
                      Gabung Google Meet
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 7. BANTUAN & FAQ (Image 2 Screen 21 / Image 3 Screen 20) ---
export function HelpFAQView({ roleMode }: { roleMode: WorkforceRoleMode }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  const allFaqs = [
    {
      cat: 'Affiliate',
      roles: ['sales'] as WorkforceRoleMode[],
      q: 'Bagaimana cara merekrut affiliate baru?',
      a: 'Buka menu Tim Affiliate atau Rekrut Affiliate, lalu bagikan link referral Anda atau daftarkan calon affiliate secara manual untuk diverifikasi.',
    },
    {
      cat: 'Lead & Prospek',
      roles: ['affiliate'] as WorkforceRoleMode[],
      q: 'Bagaimana cara menginput prospek pelanggan dan memantau aktivasi?',
      a: 'Buka menu Lead & Penjualan lalu tekan Tambah Lead. Setiap progres pengecekan cakupan hingga instalasi dapat dipantau langsung di Detail Lead.',
    },
    {
      cat: 'Komisi & Penghasilan',
      roles: ['sales', 'affiliate', 'technician'] as WorkforceRoleMode[],
      q: 'Kapan komisi bulanan dibayarkan?',
      a: 'Komisi dihitung setelah order atau work order tervalidasi selesai dan disetujui Finance setiap awal bulan.',
    },
    {
      cat: 'Komisi & Penghasilan',
      roles: ['sales', 'affiliate'] as WorkforceRoleMode[],
      q: 'Bagaimana skema bagi hasil produktivitas 60/40?',
      a: 'Untuk prospek yang diajukan oleh Affiliate, porsi produktivitas inkremental dibagi 60% untuk Affiliate dan 40% untuk Sales Agentzy pembina.',
    },
    {
      cat: 'Tugas & Penugasan',
      roles: ['sales'] as WorkforceRoleMode[],
      q: 'Bagaimana syarat naik dari Tier Pro ke Sales Agentzy Elite?',
      a: 'Buka halaman Tier & Target Sales untuk melihat progres pencapaian SA gabungan (minimal 30 SA), keaktifan jaringan Affiliate, serta SLA tindak lanjut ≥ 95%.',
    },
    {
      cat: 'Pelatihan',
      roles: ['sales', 'affiliate', 'technician'] as WorkforceRoleMode[],
      q: 'Apakah pelatihan dan sertifikasi wajib sebelum penugasan?',
      a: 'Ya, kepatuhan pelatihan dan sertifikasi aktif menjadi syarat penugasan agar standar layanan pelanggan tetap terjaga.',
    },
    {
      cat: 'Teknis Aplikasi',
      roles: ['technician'] as WorkforceRoleMode[],
      q: 'Bagaimana cara kerja mode offline pada teknisi lapangan?',
      a: 'Saat sinyal terputus, checklist SOP, bukti foto, dan tanda tangan tersimpan di antrean lokal dan otomatis disinkronkan saat koneksi kembali.',
    },
  ];

  const categories =
    roleMode === 'technician'
      ? ['FAQ Umum', 'Komisi & Penghasilan', 'Pelatihan', 'Teknis Aplikasi']
      : roleMode === 'affiliate'
        ? ['FAQ Umum', 'Lead & Prospek', 'Komisi & Penghasilan', 'Pelatihan']
        : [
            'FAQ Umum',
            'Tugas & Penugasan',
            'Komisi & Penghasilan',
            'Affiliate',
            'Pelatihan',
          ];

  const faqs = allFaqs.filter(
    (f) =>
      f.roles.includes(roleMode) &&
      (selectedCategory === 'Semua' ||
        selectedCategory === 'FAQ Umum' ||
        f.cat === selectedCategory) &&
      f.q.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#17324D]">Bantuan &amp; FAQ</h1>
        <button
          type="button"
          onClick={() => {
            setTicketSent(false);
            setShowTicketModal(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Hubungi Support / Dispute</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718391]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari pertanyaan..."
          className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-4 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(active ? 'Semua' : cat)}
              className={`flex items-center gap-2 rounded-[12px] border p-3.5 text-left text-xs font-semibold transition ${
                active
                  ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                  : 'border-[#D8E3E9] bg-white text-[#17324D] hover:border-[#0284C7]'
              }`}
            >
              <HelpCircle className="h-4 w-4 shrink-0 text-[#0284C7]" />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {faqs.map((f) => (
          <div
            key={f.q}
            className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"
          >
            <p className="text-sm font-bold text-[#17324D]">{f.q}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#526675]">
              {f.a}
            </p>
          </div>
        ))}
      </div>

      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
            {ticketSent ? (
              <div className="text-center space-y-3">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[#247A55]" />
                <h3 className="text-base font-bold text-[#17324D]">
                  Tiket Support Terkirim
                </h3>
                <p className="text-xs text-[#526675]">
                  Tim operasional Agentzy akan menindaklanjuti laporan Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="w-full rounded-[10px] bg-[#17324D] py-2.5 text-sm font-semibold text-white"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setTicketSent(true);
                }}
                className="space-y-3"
              >
                <h3 className="text-base font-bold text-[#17324D]">
                  Kirim Tiket Bantuan / Dispute Komisi
                </h3>
                <input
                  type="text"
                  required
                  placeholder="Judul kendala atau ID Order / WO"
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                />
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan detail kendala Anda..."
                  className="w-full rounded-[10px] border border-[#B8C9D3] p-3 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTicketModal(false)}
                    className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Kirim Tiket
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 8. PENGATURAN & MODE OFFLINE (Image 3 Screen 21 & Image 4 Screen 21) ---
export function SettingsView({
  offlineSyncEnabled,
  onToggleOfflineSync,
  offlineQueue,
  onFlushQueue,
  onLogout,
}: {
  offlineSyncEnabled: boolean;
  onToggleOfflineSync: () => void;
  offlineQueue: string[];
  onFlushQueue: () => void;
  onLogout: () => void;
}) {
  const [activeSettingModal, setActiveSettingModal] = useState<
    'akun' | 'notifikasi' | 'preferensi' | 'keamanan' | 'tentang' | null
  >(null);
  const [notifAssignment, setNotifAssignment] = useState(true);
  const [notifCommission, setNotifCommission] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(true);
  const [appLanguage, setAppLanguage] = useState('Bahasa Indonesia');
  const [passwordSaved, setPasswordSaved] = useState(false);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#17324D]">Pengaturan</h1>

      <PWAInstallButton variant="card" />

      <div className="rounded-[14px] border border-[#D8E3E9] bg-white divide-y divide-[#EAF2F6]">
        <button
          type="button"
          onClick={() => {
            setPasswordSaved(false);
            setActiveSettingModal('akun');
          }}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-[#F5F8FA]"
        >
          <div>
            <p className="text-sm font-bold text-[#17324D]">Akun</p>
            <p className="text-xs text-[#526675]">Ubah profil, kata sandi, dan verifikasi akun</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#718391]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingModal('notifikasi')}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-[#F5F8FA]"
        >
          <div>
            <p className="text-sm font-bold text-[#17324D]">Notifikasi</p>
            <p className="text-xs text-[#526675]">Atur jenis &amp; frekuensi notifikasi tugas/komisi</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#718391]" />
        </button>

        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-bold text-[#17324D]">
              Mode Offline (Sinkronisasi Otomatis)
            </p>
            <p className="text-xs text-[#526675]">
              Simpan data work order dan bukti lapangan saat jaringan tidak stabil.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={offlineSyncEnabled}
            onClick={onToggleOfflineSync}
            className={`relative h-6 w-11 rounded-full transition ${
              offlineSyncEnabled ? 'bg-[#0284C7]' : 'bg-[#D8E3E9]'
            }`}
          >
            <span
              className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition ${
                offlineSyncEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#17324D]">
              Antrean Sinkronisasi Lokal ({offlineQueue.length})
            </p>
            {offlineQueue.length > 0 && (
              <button
                type="button"
                onClick={onFlushQueue}
                className="inline-flex items-center gap-1 rounded-[8px] bg-[#E6F4F9] px-3 py-1 text-xs font-semibold text-[#0284C7]"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Sinkronkan Sekarang</span>
              </button>
            )}
          </div>
          {offlineQueue.length === 0 ? (
            <p className="text-xs text-[#526675]">
              Semua catatan aktivitas dan work order telah tersinkronisasi.
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-[#526675]">
              {offlineQueue.map((item, idx) => (
                <li key={`${item}-${idx}`}>· {item}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => setActiveSettingModal('preferensi')}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-[#F5F8FA]"
        >
          <div>
            <p className="text-sm font-bold text-[#17324D]">Preferensi Aplikasi</p>
            <p className="text-xs text-[#526675]">Bahasa ({appLanguage}) &amp; tampilan</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#718391]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingModal('keamanan')}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-[#F5F8FA]"
        >
          <div>
            <p className="text-sm font-bold text-[#17324D]">Keamanan</p>
            <p className="text-xs text-[#526675]">PIN Aplikasi, Biometrik, dan Autentikasi 2FA</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#718391]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingModal('tentang')}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-[#F5F8FA]"
        >
          <div>
            <p className="text-sm font-bold text-[#17324D]">Tentang Agentzy</p>
            <p className="text-xs text-[#526675]">Versi Aplikasi v2.0, S&amp;K, Kebijakan Privasi</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#718391]" />
        </button>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#B23A48]/40 bg-white text-sm font-semibold text-[#B23A48] hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        <span>Keluar dari Akun</span>
      </button>

      {/* Settings Modals */}
      {activeSettingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <h3 className="text-base font-bold text-[#17324D]">
                {activeSettingModal === 'akun'
                  ? 'Pengaturan Akun & Sandi'
                  : activeSettingModal === 'notifikasi'
                    ? 'Preferensi Notifikasi'
                    : activeSettingModal === 'preferensi'
                      ? 'Preferensi Bahasa'
                      : activeSettingModal === 'keamanan'
                        ? 'Keamanan Perangkat & 2FA'
                        : 'Tentang Agentzy'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveSettingModal(null)}
                className="rounded-lg p-1 text-[#526675]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeSettingModal === 'akun' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPasswordSaved(true);
                }}
                className="space-y-3"
              >
                {passwordSaved ? (
                  <p className="rounded-[10px] bg-emerald-50 p-3 text-xs font-semibold text-[#247A55]">
                    Kata sandi akun berhasil diperbarui.
                  </p>
                ) : (
                  <>
                    <input
                      type="password"
                      required
                      placeholder="Kata sandi saat ini"
                      className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                    />
                    <input
                      type="password"
                      required
                      placeholder="Kata sandi baru"
                      className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-[10px] bg-[#0284C7] py-2.5 text-xs font-semibold text-white"
                    >
                      Perbarui Kata Sandi
                    </button>
                  </>
                )}
              </form>
            )}

            {activeSettingModal === 'notifikasi' && (
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between">
                  <span className="font-semibold text-[#17324D]">Penugasan &amp; Work Order</span>
                  <input
                    type="checkbox"
                    checked={notifAssignment}
                    onChange={(e) => setNotifAssignment(e.target.checked)}
                    className="h-4 w-4 accent-[#0284C7]"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="font-semibold text-[#17324D]">Komisi &amp; Pencairan</span>
                  <input
                    type="checkbox"
                    checked={notifCommission}
                    onChange={(e) => setNotifCommission(e.target.checked)}
                    className="h-4 w-4 accent-[#0284C7]"
                  />
                </label>
              </div>
            )}

            {activeSettingModal === 'preferensi' && (
              <div className="space-y-2 text-xs">
                {['Bahasa Indonesia', 'English (International)'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setAppLanguage(lang)}
                    className={`flex w-full items-center justify-between rounded-[10px] border p-3 font-semibold ${
                      appLanguage === lang
                        ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                        : 'border-[#D8E3E9] text-[#17324D]'
                    }`}
                  >
                    <span>{lang}</span>
                    {appLanguage === lang && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}

            {activeSettingModal === 'keamanan' && (
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between">
                  <span className="font-semibold text-[#17324D]">PIN Aplikasi (6 Digit)</span>
                  <input
                    type="checkbox"
                    checked={pinEnabled}
                    onChange={(e) => setPinEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#0284C7]"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="font-semibold text-[#17324D]">Login Biometrik Perangkat</span>
                  <input
                    type="checkbox"
                    checked={biometricEnabled}
                    onChange={(e) => setBiometricEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#0284C7]"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="font-semibold text-[#17324D]">Autentikasi Dua Faktor (2FA)</span>
                  <input
                    type="checkbox"
                    checked={twoFaEnabled}
                    onChange={(e) => setTwoFaEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#0284C7]"
                  />
                </label>
              </div>
            )}

            {activeSettingModal === 'tentang' && (
              <div className="space-y-2 text-xs leading-relaxed text-[#526675]">
                <p className="font-bold text-[#17324D]">Agentzy Human Workforce Portal v2.0</p>
                <p>
                  Platform manajemen operasional tenaga kerja lapangan dan kolaborasi agen AI dengan dukungan kepatuhan UU PDP dan audit trail penuh.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveSettingModal(null)}
              className="w-full rounded-[10px] bg-[#17324D] py-2.5 text-xs font-semibold text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
