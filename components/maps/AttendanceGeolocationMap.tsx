'use client';

import React, { useEffect, useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import { MapPin, LocateFixed, ShieldCheck } from 'lucide-react';

interface LatLng {
  lat: number;
  lng: number;
}

function MapCameraSync({ lat, lng }: LatLng) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat, lng });
  }, [map, lat, lng]);

  return null;
}

interface AttendanceGeolocationMapProps {
  position: LatLng;
  hubPosition: LatLng;
  hubLabel: string;
  userLabel: string;
  accuracyMeters: number | null;
  distanceMeters: number;
  withinRadius: boolean;
}

export function AttendanceGeolocationMap({
  position,
  hubPosition,
  hubLabel,
  userLabel,
  accuracyMeters,
  distanceMeters,
  withinRadius,
}: AttendanceGeolocationMapProps) {
  const [apiKey, setApiKey] = useState<string>(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const w = window as unknown as { gm_authFailure?: () => void };
    const prevAuthFailure = w.gm_authFailure;
    w.gm_authFailure = () => {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      prevAuthFailure?.();
    };

    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);

    if (!apiKey) {
      fetch('/api/config/maps')
        .then((r) => r.json())
        .then((d: { apiKey?: string }) => {
          if (d.apiKey) setApiKey(d.apiKey);
        })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener('gmp-quota-exceeded', onQuota);
    };
  }, [apiKey]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`;

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA]">
      <div className="relative h-[200px] w-full bg-[#EAF2F6] sm:h-[220px]">
        {apiKey && !quotaExceeded ? (
          <APIProvider apiKey={apiKey} language="id" region="ID">
            <GoogleMap
              mapId="DEMO_MAP_ID"
              defaultCenter={position}
              defaultZoom={15}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="h-full w-full"
            >
              <MapCameraSync lat={position.lat} lng={position.lng} />
              <AdvancedMarker position={position} title={userLabel}>
                <Pin
                  background="#0284C7"
                  borderColor="#FFFFFF"
                  glyphColor="#FFFFFF"
                />
              </AdvancedMarker>
              <AdvancedMarker position={hubPosition} title={hubLabel}>
                <Pin
                  background="#17324D"
                  borderColor="#FFFFFF"
                  glyphColor="#87CEEB"
                />
              </AdvancedMarker>
            </GoogleMap>
          </APIProvider>
        ) : (
          <div className="relative flex h-full w-full flex-col justify-between p-4 bg-[radial-gradient(#B8C9D3_1px,transparent_1px)] [background-size:18px_18px] bg-[#F5F8FA]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#D8E3E9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#17324D]">
                <LocateFixed className="h-3.5 w-3.5 text-[#0284C7]" />
                <span>Titik Koordinat GPS Terdeteksi</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-[11px] font-semibold ${
                  withinRadius
                    ? 'bg-emerald-50 text-[#247A55] border border-[#247A55]/25'
                    : 'bg-amber-50 text-[#A96816] border border-[#A96816]/25'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {withinRadius
                    ? `Dalam Zona (${distanceMeters} m dari Hub)`
                    : `Area Lapangan (${(distanceMeters / 1000).toFixed(1)} km dari Hub)`}
                </span>
              </span>
            </div>

            <div className="mx-auto my-auto flex flex-col items-center justify-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#0284C7]/45 bg-[#0284C7]/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0284C7] text-white shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#526675]">
              <span className="font-mono-tabular font-semibold text-[#17324D]">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </span>
              {accuracyMeters !== null && (
                <span className="font-mono-tabular">
                  Akurasi: ±{Math.round(accuracyMeters)} m
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D8E3E9] bg-white px-3.5 py-2 text-[11px] text-[#526675]">
        <span className="truncate">
          Titik acuan: <strong className="text-[#17324D]">{hubLabel}</strong>
        </span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#0284C7] hover:underline"
        >
          Buka Titik di Google Maps
        </a>
      </div>
    </div>
  );
}
