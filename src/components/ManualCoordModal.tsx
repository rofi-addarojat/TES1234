import React, { useState } from 'react';
import { X, MapPin, Check, Navigation, AlertCircle } from 'lucide-react';

interface ManualCoordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoords: (coords: [number, number]) => void;
  currentCoords: [number, number];
}

export const ManualCoordModal: React.FC<ManualCoordModalProps> = ({
  isOpen,
  onClose,
  onApplyCoords,
  currentCoords,
}) => {
  const [inputVal, setInputVal] = useState(
    `${currentCoords[0].toFixed(6)}, ${currentCoords[1].toFixed(6)}`
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Try parsing: "-6.208851, 106.845624" or "-6.208851 106.845624"
    const cleaned = inputVal.replace(/[^\d.,\-+\s]/g, '').trim();
    const parts = cleaned.split(/[\s,]+/).filter(Boolean);

    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onApplyCoords([lat, lng]);
        onClose();
        return;
      }
    }

    setErrorMsg('Format koordinat tidak valid. Contoh: -6.208851, 106.845624');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        role="dialog"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-bold text-white">Masukkan Koordinat Manual</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-400">
            Tempel atau ketik koordinat Latitude & Longitude (misal dari Google Maps atau Work Order):
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Latitude, Longitude
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="-6.208851, 106.845624"
              className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/30"
            >
              <Check className="w-4 h-4" />
              <span>Arahkan Peta ke Titik</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
