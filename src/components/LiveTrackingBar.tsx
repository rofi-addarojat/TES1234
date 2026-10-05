import React from 'react';
import { 
  Play, 
  Square, 
  Navigation, 
  MapPin, 
  Trash2, 
  Download
} from 'lucide-react';
import { LiveTrackingState } from '../types';
import { formatDistance } from '../utils/geo';

interface LiveTrackingBarProps {
  trackingState: LiveTrackingState;
  onToggleTracking: () => void;
  onToggleFollowCam: () => void;
  onResetTrack: () => void;
  onExportTrackKml: () => void;
  onTagAtCurrentGps: () => void;
  gpsAccuracy: number | null;
}

export const LiveTrackingBar: React.FC<LiveTrackingBarProps> = ({
  trackingState,
  onToggleTracking,
  onToggleFollowCam,
  onResetTrack,
  onExportTrackKml,
  onTagAtCurrentGps,
  gpsAccuracy,
}) => {
  const { isActive, isFollowCam, points, totalDistanceMeters, currentSpeedKmh } = trackingState;

  return (
    <div className="w-full bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md p-2.5 sm:p-3 text-slate-100 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Top row: Status, Live metrics */}
      <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'} shrink-0`}></span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">
                {isActive ? 'Live Tracking' : 'Tracking Siaga'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">
                {points.length} Pts
              </span>
            </div>
          </div>
        </div>

        {/* Speed & Distance HUD */}
        <div className="flex items-center gap-2 sm:gap-3 text-right">
          <div>
            <span className="text-[8px] uppercase text-slate-400 font-semibold block leading-tight">Jarak</span>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-300">
              {formatDistance(totalDistanceMeters)}
            </span>
          </div>
          <div>
            <span className="text-[8px] uppercase text-slate-400 font-semibold block leading-tight">Speed</span>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-cyan-300">
              {currentSpeedKmh.toFixed(1)} km/h
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls Row */}
      <div className="flex items-center justify-between gap-1.5">
        {/* Start / Stop Tracking Button */}
        <button
          onClick={onToggleTracking}
          className={`flex-1 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md ${
            isActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Hentikan</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Mulai Track</span>
            </>
          )}
        </button>

        {/* Follow Cam Toggle */}
        <button
          onClick={onToggleFollowCam}
          className={`h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all active:scale-95 ${
            isFollowCam
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
          }`}
          title={isFollowCam ? 'Peta otomatis mengikuti Anda' : 'Peta bebas digeser'}
        >
          <Navigation className={`w-3.5 h-3.5 ${isFollowCam ? 'text-cyan-400 fill-cyan-400' : ''}`} />
          <span className="text-[11px] sm:text-xs">{isFollowCam ? 'Ikuti: ON' : 'Ikuti: OFF'}</span>
        </button>

        {/* Quick Tag at Live GPS */}
        <button
          onClick={onTagAtCurrentGps}
          className="h-9 px-2.5 sm:px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          title="Tag tiang di langkah kaki Anda sekarang"
        >
          <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="text-[11px] sm:text-xs">Tag Sini</span>
        </button>

        {/* Export Track Line */}
        {points.length > 1 && (
          <button
            onClick={onExportTrackKml}
            className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center border border-slate-700 active:scale-95"
            title="Unduh rute tracking ke format KML"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        )}

        {/* Reset Track Line */}
        {points.length > 0 && !isActive && (
          <button
            onClick={onResetTrack}
            className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center justify-center border border-slate-800 hover:border-rose-800 active:scale-95"
            title="Bersihkan jejak rute"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
