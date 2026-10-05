import React, { useState } from 'react';
import { 
  Crosshair, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  LocateFixed, 
  Copy, 
  Check, 
  Compass,
  Satellite,
  Move
} from 'lucide-react';
import { GpsState } from '../types';
import { calculateDistance, formatDistance } from '../utils/geo';

interface CrosshairOverlayProps {
  currentCoords: [number, number]; // [lat, lng]
  gpsState: GpsState;
  onNudge: (deltaLat: number, deltaLng: number) => void;
  onCenterGps: () => void;
  showCrosshair: boolean;
  onToggleCrosshair: () => void;
  zoomLevel: number;
  onOpenGpsDiagnostic: () => void;
}

export const CrosshairOverlay: React.FC<CrosshairOverlayProps> = ({
  currentCoords,
  gpsState,
  onNudge,
  onCenterGps,
  showCrosshair,
  onToggleCrosshair,
  zoomLevel,
  onOpenGpsDiagnostic,
}) => {
  const [copied, setCopied] = useState(false);
  const [nudgeStep, setNudgeStep] = useState<number>(0.00001); // ~1 meter
  const [isNudgeExpanded, setIsNudgeExpanded] = useState(false);

  const [lat, lng] = currentCoords;

  const handleCopyCoords = () => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Distance from technician's real GPS position to the target crosshair point
  const distanceToGps = gpsState.coords
    ? calculateDistance(gpsState.coords.lat, gpsState.coords.lng, lat, lng)
    : null;

  return (
    <>
      {/* 1. Tactical Center Crosshair (anti-drift visual targeting) */}
      {showCrosshair && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Outer reticle circle */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-yellow-400/90 shadow-[0_0_12px_rgba(234,179,8,0.5)] flex items-center justify-center">
              {/* Inner target circle */}
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-yellow-300 bg-yellow-400/25 flex items-center justify-center">
                {/* Center micro dot */}
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-sm"></div>
              </div>
            </div>

            {/* Crosshair Hairlines */}
            <div className="absolute top-0 -translate-y-full w-[1.5px] h-5 sm:h-6 bg-gradient-to-t from-yellow-400 to-transparent"></div>
            <div className="absolute bottom-0 translate-y-full w-[1.5px] h-5 sm:h-6 bg-gradient-to-b from-yellow-400 to-transparent"></div>
            <div className="absolute left-0 -translate-x-full h-[1.5px] w-5 sm:w-6 bg-gradient-to-l from-yellow-400 to-transparent"></div>
            <div className="absolute right-0 translate-x-full h-[1.5px] w-5 sm:w-6 bg-gradient-to-r from-yellow-400 to-transparent"></div>

            {/* Label below crosshair */}
            <div className="absolute top-8 sm:top-9 px-1.5 sm:px-2 py-0.5 rounded bg-slate-950/90 border border-yellow-400/60 text-[8px] sm:text-[9px] font-mono text-yellow-300 tracking-wider uppercase font-bold whitespace-nowrap shadow-lg">
              BIDIK TIANG / FAT
            </div>
          </div>
        </div>
      )}

      {/* 2. Top-Center Coordinates HUD Bar */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[94vw]">
        <div className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-950/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-[11px] sm:text-xs font-mono text-slate-200">
          <button
            onClick={onToggleCrosshair}
            className={`p-1 rounded-full transition-colors ${
              showCrosshair
                ? 'text-yellow-400 bg-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title={showCrosshair ? 'Sembunyikan Crosshair' : 'Tampilkan Crosshair'}
          >
            <Crosshair className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          
          <div className="flex items-center gap-1 sm:gap-1.5 tabular-nums">
            <span className="text-cyan-400 font-medium text-[10px] sm:text-xs">LAT:</span>
            <span className="text-white font-bold">{lat.toFixed(6)}</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400 font-medium text-[10px] sm:text-xs">LNG:</span>
            <span className="text-white font-bold">{lng.toFixed(6)}</span>
          </div>

          <button
            onClick={handleCopyCoords}
            className="p-1 rounded-full text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            title="Salin Koordinat"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          </button>

          {/* Distance from GPS live badge */}
          {distanceToGps !== null && (
            <span 
              className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-yellow-950/80 text-yellow-300 border border-yellow-700/60 hidden md:inline-block"
              title="Jarak GPS ke titik bidik"
            >
              Jarak: {formatDistance(distanceToGps)}
            </span>
          )}

          {/* GPS Diagnostic & Calibration button */}
          <button
            onClick={onOpenGpsDiagnostic}
            className="p-1 rounded-full text-cyan-400 hover:text-white hover:bg-cyan-950 transition-colors border border-cyan-800/60"
            title="Status & Kalibrasi GPS"
          >
            <Satellite className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Floating Micro-Nudge Pad & GPS Re-Center Controls (Right Side) */}
      <div className="fixed right-2.5 bottom-36 sm:bottom-32 z-20 flex flex-col items-end gap-1.5 pointer-events-auto select-none">
        {/* Toggle Nudge Pad Button (Mobile Collapsible) */}
        <button
          onClick={() => setIsNudgeExpanded(!isNudgeExpanded)}
          className={`h-9 px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 shadow-lg transition-all active:scale-95 ${
            isNudgeExpanded
              ? 'bg-yellow-500 text-slate-950 border-yellow-400'
              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white'
          }`}
          title="Buka / tutup kontrol pergeseran centimeter"
        >
          <Move className="w-3.5 h-3.5" />
          <span>Nudge</span>
        </button>

        {/* GPS Re-center button */}
        <button
          onClick={onCenterGps}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900/90 border border-slate-700 text-cyan-400 hover:text-white hover:bg-cyan-600 transition-all shadow-xl flex items-center justify-center active:scale-90"
          title="Kunci ke Posisi GPS Saya"
        >
          <LocateFixed className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Nudge D-Pad (Expanded on mobile toggle or desktop) */}
        {isNudgeExpanded && (
          <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between w-full px-1 mb-1 gap-2">
              <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                GESER
              </span>
              <button
                onClick={() => setNudgeStep(nudgeStep === 0.00001 ? 0.000002 : 0.00001)}
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-yellow-300 border border-slate-700 hover:bg-slate-700"
                title="Ganti resolusi geser"
              >
                {nudgeStep === 0.00001 ? '1m' : '20cm'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1">
              <div></div>
              <button
                onClick={() => onNudge(nudgeStep, 0)}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-cyan-600 active:bg-cyan-700 text-white flex items-center justify-center transition-all border border-slate-700 active:scale-90"
                title="Utara"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div></div>

              <button
                onClick={() => onNudge(0, -nudgeStep)}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-cyan-600 active:bg-cyan-700 text-white flex items-center justify-center transition-all border border-slate-700 active:scale-90"
                title="Barat"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
              </div>

              <button
                onClick={() => onNudge(0, nudgeStep)}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-cyan-600 active:bg-cyan-700 text-white flex items-center justify-center transition-all border border-slate-700 active:scale-90"
                title="Timur"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div></div>
              <button
                onClick={() => onNudge(-nudgeStep, 0)}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-cyan-600 active:bg-cyan-700 text-white flex items-center justify-center transition-all border border-slate-700 active:scale-90"
                title="Selatan"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <div></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
