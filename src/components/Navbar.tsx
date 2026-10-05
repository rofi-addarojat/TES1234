import React, { useState } from 'react';
import { 
  Radio, 
  Layers, 
  Sun, 
  Moon, 
  SunMedium, 
  Database, 
  MapPin, 
  Navigation, 
  Lock, 
  Unlock,
  Footprints,
  Menu,
  X,
  Crosshair,
  Folder
} from 'lucide-react';
import { GpsState, ThemeMode, TileLayerType } from '../types';

interface NavbarProps {
  gpsState: GpsState;
  activeLayer: TileLayerType;
  onLayerChange: (layer: TileLayerType) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  totalPoints: number;
  tiangCount: number;
  fatCount: number;
  onOpenDataList: () => void;
  categoryFilter: 'all' | 'tiang' | 'fat';
  onCategoryFilterChange: (filter: 'all' | 'tiang' | 'fat') => void;
  isGpsLocked: boolean;
  onToggleGpsLock: () => void;
  onTriggerGps: () => void;
  onOpenManualCoords: () => void;
  isLiveTrackingActive: boolean;
  onToggleLiveTracking: () => void;
  activeClusterName: string;
  onOpenClusterModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  gpsState,
  activeLayer,
  onLayerChange,
  themeMode,
  onThemeChange,
  totalPoints,
  tiangCount,
  fatCount,
  onOpenDataList,
  categoryFilter,
  onCategoryFilterChange,
  isGpsLocked,
  onToggleGpsLock,
  onTriggerGps,
  onOpenManualCoords,
  isLiveTrackingActive,
  onToggleLiveTracking,
  activeClusterName,
  onOpenClusterModal,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // GPS accuracy status badge
  const getGpsStatusDisplay = () => {
    if (isGpsLocked) {
      return {
        text: 'Terkunci',
        fullText: 'GPS Terkunci (Anti-Mental)',
        color: 'text-amber-400 bg-amber-500/20 border-amber-500/50',
        dot: 'bg-amber-400',
      };
    }
    if (gpsState.status === 'locating') {
      return {
        text: 'Mencari...',
        fullText: 'Mencari Satelit...',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        dot: 'bg-amber-400 animate-ping',
      };
    }
    if (gpsState.coords && gpsState.accuracy !== null) {
      const acc = gpsState.accuracy;
      if (acc <= 5) {
        return {
          text: `±${acc.toFixed(1)}m`,
          fullText: `Presisi: ±${acc.toFixed(1)}m`,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      } else if (acc <= 15) {
        return {
          text: `±${acc.toFixed(0)}m`,
          fullText: `Sedang: ±${acc.toFixed(0)}m`,
          color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
          dot: 'bg-yellow-400',
        };
      } else {
        return {
          text: `±${acc.toFixed(0)}m`,
          fullText: `Lemah: ±${acc.toFixed(0)}m`,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          dot: 'bg-rose-400',
        };
      }
    }
    if (gpsState.status === 'denied') {
      return {
        text: 'Ditolak',
        fullText: 'GPS Ditolak',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        dot: 'bg-rose-400',
      };
    }
    return {
      text: 'Siap',
      fullText: 'GPS Siap',
      color: 'text-slate-400 bg-slate-800/80 border-slate-700/60',
      dot: 'bg-slate-400',
    };
  };

  const gpsDisplay = getGpsStatusDisplay();

  const toggleTheme = () => {
    if (themeMode === 'dark') onThemeChange('outdoor');
    else if (themeMode === 'outdoor') onThemeChange('light');
    else onThemeChange('dark');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 bg-slate-900/95 text-slate-100 backdrop-blur-md border-b border-slate-800 px-2 sm:px-4 py-2 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Brand & Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20 border border-cyan-400/30">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1 leading-none">
                FTTH Map
                <span className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-normal">
                  Field Pro
                </span>
              </h1>
            </div>
          </div>

          {/* Active Cluster Folder Switcher */}
          <button
            onClick={onOpenClusterModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800/95 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs font-semibold active:scale-95 transition-all max-w-[110px] xs:max-w-[140px] sm:max-w-[200px]"
            title="Kelola Folder Cluster Tagging"
          >
            <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate text-[11px] sm:text-xs font-bold text-cyan-300">
              {activeClusterName}
            </span>
          </button>

          {/* Core Mobile Actions (GPS Status, Live Track, Freeze) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* GPS Accuracy Pill Button */}
            <button
              onClick={onTriggerGps}
              title="Perbarui posisi GPS"
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-mono transition-all active:scale-95 ${gpsDisplay.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${gpsDisplay.dot} shrink-0`}></span>
              <span className="font-semibold text-[11px] sm:text-xs">
                <span className="hidden sm:inline">{gpsDisplay.fullText}</span>
                <span className="sm:hidden">{gpsDisplay.text}</span>
              </span>
            </button>

            {/* Live Tracking Mode Toggle Button */}
            <button
              onClick={onToggleLiveTracking}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                isLiveTrackingActive
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isLiveTrackingActive ? 'Live Tracking Aktif' : 'Mulai Live Tracking'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiveTrackingActive ? 'bg-white animate-ping' : 'bg-slate-500'
                }`}
              ></span>
              <Footprints className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-[11px] sm:text-xs">
                {isLiveTrackingActive ? 'Track ON' : 'Live Track'}
              </span>
            </button>

            {/* GPS Freeze / Lock Toggle */}
            <button
              onClick={onToggleGpsLock}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                isGpsLocked
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={isGpsLocked ? 'GPS Dibekukan (Anti-Mental)' : 'Kunci GPS'}
            >
              {isGpsLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isGpsLocked ? 'Terkunci' : 'Kunci'}</span>
            </button>

            {/* Desktop Category Filters */}
            <div className="hidden lg:flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80">
              <button
                onClick={() => onCategoryFilterChange('all')}
                className={`px-2 py-1 text-xs font-medium rounded-md ${
                  categoryFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Semua ({totalPoints})
              </button>
              <button
                onClick={() => onCategoryFilterChange('tiang')}
                className={`px-2 py-1 text-xs font-medium rounded-md ${
                  categoryFilter === 'tiang'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Tiang ({tiangCount})
              </button>
              <button
                onClick={() => onCategoryFilterChange('fat')}
                className={`px-2 py-1 text-xs font-medium rounded-md ${
                  categoryFilter === 'fat'
                    ? 'bg-blue-500 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                FAT ({fatCount})
              </button>
            </div>
          </div>

          {/* Right Side: Layers, Data, and Mobile Menu Toggle */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Tile Layer Switcher */}
            <button
              onClick={() => {
                if (activeLayer === 'satellite') onLayerChange('hybrid');
                else if (activeLayer === 'hybrid') onLayerChange('streets');
                else onLayerChange('satellite');
              }}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                activeLayer === 'satellite'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Ganti Jenis Peta"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Data & Export Drawer */}
            <button
              onClick={onOpenDataList}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all active:scale-95 border border-cyan-400/40"
              title="Data Tersimpan"
            >
              <Database className="w-4 h-4" />
              <span className="w-4 h-4 rounded-full bg-slate-950/60 text-cyan-300 text-[10px] font-mono flex items-center justify-center font-bold">
                {totalPoints}
              </span>
            </button>

            {/* Mobile Overflow Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 sm:hidden"
              title="Menu Lainnya"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Desktop Theme toggle */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              title="Mode Layar"
            >
              {themeMode === 'outdoor' ? (
                <SunMedium className="w-4 h-4 text-yellow-300" />
              ) : themeMode === 'light' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="sm:hidden pt-2.5 pb-2 px-1 border-t border-slate-800 mt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  onCategoryFilterChange('all');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex-1 py-1 text-[11px] font-bold rounded ${
                  categoryFilter === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Semua ({totalPoints})
              </button>
              <button
                onClick={() => {
                  onCategoryFilterChange('tiang');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex-1 py-1 text-[11px] font-bold rounded ${
                  categoryFilter === 'tiang' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Tiang ({tiangCount})
              </button>
              <button
                onClick={() => {
                  onCategoryFilterChange('fat');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex-1 py-1 text-[11px] font-bold rounded ${
                  categoryFilter === 'fat' ? 'bg-blue-500 text-white' : 'text-slate-400'
                }`}
              >
                FAT ({fatCount})
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenManualCoords();
                  setIsMobileMenuOpen(false);
                }}
                className="h-9 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                <span>Ketik Koordinat</span>
              </button>
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                className="h-9 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <SunMedium className="w-3.5 h-3.5 text-yellow-400" />
                <span>Mode: {themeMode.toUpperCase()}</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
