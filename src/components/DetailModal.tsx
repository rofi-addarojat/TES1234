import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  User, 
  Navigation, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Radio as AntennaIcon,
  Box,
  Share2,
  Folder
} from 'lucide-react';
import { InfrastructureItem } from '../types';

interface DetailModalProps {
  item: InfrastructureItem | null;
  onClose: () => void;
  onEdit: (item: InfrastructureItem) => void;
  onDelete: (id: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${item.lat.toFixed(6)}, ${item.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGoogleMapsNav = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;
    window.open(url, '_blank');
  };

  const getConditionColor = (cond?: string) => {
    switch (cond) {
      case 'Bagus':
      case 'Baru Pasang':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Perlu Perbaikan':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Kritis':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              item.category === 'tiang'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}>
              {item.category === 'tiang' ? <AntennaIcon className="w-5 h-5" /> : <Box className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-cyan-400">{item.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getConditionColor(item.condition)}`}>
                  {item.condition || 'Bagus'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {item.subType}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Photo if available */}
          {item.photoUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
              <img
                src={item.photoUrl}
                alt={item.id}
                className="w-full max-h-56 object-cover"
              />
            </div>
          )}

          {/* Coordinates Box */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Koordinat Presisi Lapangan
              </span>
              <div className="text-sm font-mono font-bold text-cyan-300">
                {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
              </div>
              {item.accuracy && (
                <div className="text-[11px] text-slate-400">
                  Radius Akurasi GPS: ±{item.accuracy.toFixed(1)} meter
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1 border border-slate-700"
                title="Salin Koordinat"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>

              <button
                onClick={openGoogleMapsNav}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1 shadow-sm"
                title="Buka Arah Navigasi di Google Maps"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Rute</span>
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Folder Cluster</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1.5 mt-0.5">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                {item.clusterName || 'Cluster Bintaro Jaya'}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Teknisi Lapangan</span>
              <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                {item.technicianName}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Waktu Tagging</span>
              <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {new Date(item.timestamp).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {item.category === 'fat' && (
              <>
                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kapasitas Port</span>
                  <span className="text-white font-bold text-sm mt-0.5">
                    {item.fatCapacity || 16} Port
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Induk Tiang</span>
                  <span className="text-white font-semibold text-xs mt-0.5">
                    {item.connectedToId || 'Independent / Belum Diisi'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                Catatan Kondisi / Keterangan:
              </span>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Delete Confirmation prompt */}
          {confirmDelete && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-center justify-between">
              <span>Yakin ingin menghapus titik {item.id}?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Hapus
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <Edit3 className="w-4 h-4 text-cyan-400" />
            <span>Edit Data</span>
          </button>

          {!confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="h-11 px-4 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800 hover:text-rose-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
