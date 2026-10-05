import React from 'react';
import { 
  X, 
  Navigation, 
  HelpCircle, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  RotateCw, 
  Crosshair,
  Satellite,
  Info
} from 'lucide-react';
import { GpsState } from '../types';
import { calculateDistance, formatDistance } from '../utils/geo';

interface GpsDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  gpsState: GpsState;
  targetCoords: [number, number];
  onCalibrateGps: () => void;
  isCalibrating: boolean;
  sampleCount: number;
  onCenterGps: () => void;
}

export const GpsDiagnosticModal: React.FC<GpsDiagnosticModalProps> = ({
  isOpen,
  onClose,
  gpsState,
  targetCoords,
  onCalibrateGps,
  isCalibrating,
  sampleCount,
  onCenterGps,
}) => {
  if (!isOpen) return null;

  const currentAcc = gpsState.accuracy;
  const hasCoords = Boolean(gpsState.coords);
  
  const distanceToTarget = gpsState.coords
    ? calculateDistance(
        gpsState.coords.lat,
        gpsState.coords.lng,
        targetCoords[0],
        targetCoords[1]
      )
    : null;

  const getQualityBadge = () => {
    if (!hasCoords) {
      return {
        label: 'GPS Belum Terkunci',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        desc: 'Perangkat sedang mencari sinyal satelit...',
      };
    }
    if (!currentAcc || currentAcc > 25) {
      return {
        label: 'Akurasi Rendah (>25m)',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        desc: 'Kemungkinan menggunakan estimasi jaringan seluler/Wi-Fi, bukan satelit GNSS langsung.',
      };
    }
    if (currentAcc > 10) {
      return {
        label: 'Akurasi Sedang (10-25m)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        desc: 'Sinyal satelit terdeteksi, namun ada sedikit halangan pohon/gedung tinggi.',
      };
    }
    if (currentAcc > 4) {
      return {
        label: 'Akurasi Baik (4-10m)',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        desc: 'Standar akurasi tinggi GPS smartphone di area terbuka.',
      };
    }
    return {
      label: 'Akurasi Sangat Presisi (<4m)',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      desc: 'Sinyal satelit GNSS terkunci sempurna dengan deviasi minimal.',
    };
  };

  const quality = getQualityBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Satellite className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Diagnostik & Kalibrasi GPS
              </h3>
              <p className="text-xs text-slate-400">
                Solusi Presisi Titik Tiang & FAT FTTH
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Real-time Status Card */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Status Penerimaan Sinyal
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${quality.color}`}>
                {quality.label}
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">{quality.desc}</p>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
              <div>
                <span className="text-slate-500 block">Radius Akurasi GPS:</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {currentAcc ? `±${currentAcc.toFixed(1)} meter` : 'Belum Terdeteksi'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Jarak ke Titik Bidik:</span>
                <span className="font-mono font-bold text-yellow-300 text-sm">
                  {distanceToTarget !== null ? formatDistance(distanceToTarget) : '-'}
                </span>
              </div>
            </div>

            {gpsState.coords && (
              <div className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                Posisi GPS Saya: {gpsState.coords.lat.toFixed(6)}, {gpsState.coords.lng.toFixed(6)}
              </div>
            )}
          </div>

          {/* Action: Multi-Sample Averaging Calibration Button */}
          <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-950 rounded-xl border border-cyan-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                  <RotateCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
                  Kalibrasi Multi-Sample (Averaging)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Mengambil 5 sampel satelit berturut-turut untuk menyaring jitter (anti-drift).
                </p>
              </div>
            </div>

            <button
              onClick={onCalibrateGps}
              disabled={isCalibrating}
              className="w-full h-10 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isCalibrating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Mengumpulkan Sampel ({sampleCount}/5)...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Mulai Kalibrasi GPS (5 Sampel)</span>
                </>
              )}
            </button>
          </div>

          {/* Explanation: Kenapa GPS HP tidak bisa 100% pas di tiang? */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Kenapa GPS HP Melompat atau Tidak Tepat di Tiang?</span>
            </h4>
            <div className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <p>
                <strong>1. Sifat Fisik GPS HP:</strong> Sensor GPS di smartphone sipil memiliki toleransi alami <strong>3 hingga 10 meter</strong> akibat refraksi atmosfer dan pantulan gedung (multipath). Jika dibuka di laptop/PC tanpa chip GPS, lokasi menggunakan IP internet yang bisa meleset ratusan meter.
              </p>
              <p>
                <strong>2. Ukuran Tiang FTTH Hanya 20 cm:</strong> Tidak ada GPS smartphone di dunia yang bisa menjamin akurasi 20 cm tanpa alat RTK Geodetik bernilai puluhan juta.
              </p>
              <p>
                <strong>3. Standar Industri FTTH (Solusi Anti-Drift):</strong>
                <br />
                Gunakan GPS hanya sebagai <em>panduan mendekati lokasi</em>. Selanjutnya, <strong>geser peta/crosshair atau tap langsung pada fisik tiang / bayangan tiang di Citra Satelit Google HD</strong> untuk akurasi presisi centimeter!
              </p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
            <span className="font-bold text-slate-300 block">Tips Agar GPS HP Maksimal:</span>
            <ul className="list-disc list-inside space-y-1">
              <li>Pastikan fitur <strong>"Akurasi Lokasi Google"</strong> aktif di pengaturan HP.</li>
              <li>Berdiri di luar ruangan dengan pandangan langit bebas tanpa halangan kanopi/atap beton.</li>
              <li>Tap langsung pada peta di mana tiang berdiri untuk mengunci titik seketika.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onCenterGps();
              onClose();
            }}
            className="flex-1 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
          >
            <Crosshair className="w-3.5 h-3.5 text-yellow-400" />
            <span>Kunci Map ke Posisi Saya</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 h-10 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
