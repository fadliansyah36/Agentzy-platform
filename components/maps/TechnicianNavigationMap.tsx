'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Navigation, MapPin, Clock, Route as RouteIcon, AlertTriangle } from 'lucide-react';

interface LatLng {
  lat: number;
  lng: number;
}

interface TechnicianNavigationMapProps {
  origin: LatLng;
  destination: LatLng;
  destinationLabel: string;
  destinationAddress: string;
  estimatedDistanceKm?: string;
  estimatedMinutes?: number;
}

function RoutePolylineLayer({
  origin,
  destination,
  onRouteSummary,
}: {
  origin: LatLng;
  destination: LatLng;
  onRouteSummary: (summary: { distanceKm: string; durationMin: number } | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const request = {
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    const RouteClass = (routesLib as unknown as {
      Route?: {
        computeRoutes: (req: typeof request) => Promise<{
          routes?: Array<{
            createPolylines: () => google.maps.Polyline[];
            viewport?: google.maps.LatLngBounds;
            distanceMeters?: number;
            durationMillis?: number;
          }>;
        }>;
      };
    }).Route;

    if (!RouteClass?.computeRoutes) return;

    let cancelled = false;

    RouteClass.computeRoutes(request)
      .then(({ routes }) => {
        if (cancelled || !routes || routes.length === 0) return;
        const primaryRoute = routes[0];
        const created = primaryRoute.createPolylines();
        created.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#0284C7',
            strokeWeight: 6,
            strokeOpacity: 0.92,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = created;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        const meters = primaryRoute.distanceMeters ?? 0;
        const millis = primaryRoute.durationMillis ?? 0;
        if (meters > 0) {
          onRouteSummary({
            distanceKm: (meters / 1000).toFixed(1),
            durationMin: Math.max(1, Math.round(millis / 60000)),
          });
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin, destination, onRouteSummary]);

  return null;
}

export function TechnicianNavigationMap({
  origin,
  destination,
  destinationLabel,
  destinationAddress,
  estimatedDistanceKm = '2,3',
  estimatedMinutes = 8,
}: TechnicianNavigationMapProps) {
  const [apiKey, setApiKey] = useState<string>(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [routeSummary, setRouteSummary] = useState<{
    distanceKm: string;
    durationMin: number;
  } | null>(null);
  const [keyLoaded, setKeyLoaded] = useState(
    () => Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
  );

  useEffect(() => {
    // Two-tier demo key quota detection (Case A)
    const w = window as unknown as { gm_authFailure?: () => void };
    const prevAuthFailure = w.gm_authFailure;
    w.gm_authFailure = () => {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      prevAuthFailure?.();
    };

    const origError = console.error;
    console.error = (...args: unknown[]) => {
      origError.apply(console, args);
      const msg = args.map((a) => String(a)).join(' ');
      if (
        msg.includes('OverQuotaMapError') ||
        msg.includes('QuotaExceededError')
      ) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    };

    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);

    if (!apiKey) {
      fetch('/api/config/maps')
        .then((r) => r.json())
        .then((d: { apiKey?: string }) => {
          if (d.apiKey) setApiKey(d.apiKey);
        })
        .catch(() => undefined)
        .finally(() => setKeyLoaded(true));
    }

    return () => {
      window.removeEventListener('gmp-quota-exceeded', onQuota);
      console.error = origError;
    };
  }, [apiKey]);

  const googleMapsExternalUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

  const displayDistance = routeSummary
    ? routeSummary.distanceKm.replace('.', ',')
    : estimatedDistanceKm;
  const displayMinutes = routeSummary
    ? routeSummary.durationMin
    : estimatedMinutes;

  return (
    <div className="space-y-3">
      {quotaExceeded && (
        <div className="sticky top-0 z-30 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Route Summary Banner (Screen 7 in Image 4) */}
      <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
            <RouteIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-bold text-[#172B3A] tabular-nums">
              <span>{displayDistance} km</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-[#0284C7]">
                <Clock className="h-3.5 w-3.5" />
                ± {displayMinutes} menit
              </span>
            </div>
            <p className="truncate text-xs text-[#526675]">
              {destinationAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Map Viewport */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-[#EAF2F6] sm:h-[340px]">
        {apiKey ? (
          <APIProvider apiKey={apiKey} language="id" region="ID">
            <GoogleMap
              mapId="DEMO_MAP_ID"
              defaultCenter={destination}
              defaultZoom={14}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="h-full w-full"
            >
              <AdvancedMarker position={origin} title="Posisi Teknisi">
                <Pin
                  background="#17324D"
                  borderColor="#FFFFFF"
                  glyphColor="#87CEEB"
                />
              </AdvancedMarker>
              <AdvancedMarker position={destination} title={destinationLabel}>
                <Pin
                  background="#0284C7"
                  borderColor="#FFFFFF"
                  glyphColor="#FFFFFF"
                />
              </AdvancedMarker>
              <RoutePolylineLayer
                origin={origin}
                destination={destination}
                onRouteSummary={setRouteSummary}
              />
            </GoogleMap>
          </APIProvider>
        ) : (
          <div className="relative flex h-full w-full flex-col justify-between p-5 bg-[radial-gradient(#B8C9D3_1px,transparent_1px)] [background-size:20px_20px] bg-[#F5F8FA]">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white px-3 py-1.5 text-xs font-semibold text-[#17324D] shadow-xs">
                <MapPin className="h-3.5 w-3.5 text-[#0284C7]" />
                <span>Rute Area Jakarta Selatan</span>
              </div>
              {keyLoaded && (
                <div className="inline-flex items-center gap-1.5 rounded-[10px] border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Pratinjau Peta Lokal</span>
                </div>
              )}
            </div>

            {/* Clean SVG Route Vector Illustration Fallback */}
            <svg
              viewBox="0 0 400 180"
              className="mx-auto my-auto h-40 w-full max-w-md"
              aria-label="Ilustrasi rute lokasi teknisi menuju pelanggan"
            >
              <path
                d="M 55 140 L 145 140 L 145 88 L 285 88 L 285 45 L 340 45"
                fill="none"
                stroke="#ADD8E6"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 55 140 L 145 140 L 145 88 L 285 88 L 285 45 L 340 45"
                fill="none"
                stroke="#0284C7"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="55" cy="140" r="10" fill="#17324D" stroke="#FFFFFF" strokeWidth="3" />
              <circle cx="340" cy="45" r="11" fill="#0284C7" stroke="#FFFFFF" strokeWidth="3" />
            </svg>

            <div className="flex items-center justify-between text-xs text-[#526675]">
              <span className="font-mono-tabular">
                Asal: {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
              </span>
              <span className="font-mono-tabular">
                Tujuan: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      <a
        href={googleMapsExternalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0369A1]"
      >
        <Navigation className="h-4 w-4" />
        <span>Buka di Google Maps</span>
      </a>
    </div>
  );
}
