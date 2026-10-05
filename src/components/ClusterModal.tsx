import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Check, 
  Trash2, 
  Edit2, 
  X, 
  MapPin, 
  Download, 
  Eye, 
  Compass,
  FileSpreadsheet,
  Globe,
  Radio
} from 'lucide-react';
import { ClusterFolder, InfrastructureItem } from '../types';
import { exportToKML, exportToGeoJSON, exportToCSV } from '../utils/export';

interface ClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: ClusterFolder[];
  activeClusterId: string;
  onSelectCluster: (clusterId: string) => void;
  onCreateCluster: (cluster: Omit<ClusterFolder, 'id' | 'createdAt'>) => void;
  onUpdateCluster: (cluster: ClusterFolder) => void;
  onDeleteCluster: (clusterId: string) => void;
  items: InfrastructureItem[];
  onFlyToCluster: (clusterId: string) => void;
  clusterFilterMode: 'active-only' | 'all';
  onToggleClusterFilterMode: () => void;
}

const PRESET_COLORS = [
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#14b8a6', // teal
];

export const ClusterModal: React.FC<ClusterModalProps> = ({
  isOpen,
  onClose,
  clusters,
  activeClusterId,
  onSelectCluster,
  onCreateCluster,
  onUpdateCluster,
  onDeleteCluster,
  items,
  onFlyToCluster,
  clusterFilterMode,
  onToggleClusterFilterMode,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingClusterId, setEditingClusterId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setName('');
    setCode('');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setNotes('');
    setEditingClusterId(null);
    setIsCreating(true);
  };

  const handleStartEdit = (cls: ClusterFolder) => {
    setEditingClusterId(cls.id);
    setName(cls.name);
    setCode(cls.code || '');
    setColor(cls.color || PRESET_COLORS[0]);
    setNotes(cls.notes || '');
    setIsCreating(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClusterId) {
      const existing = clusters.find((c) => c.id === editingClusterId);
      if (existing) {
        onUpdateCluster({
          ...existing,
          name: name.trim(),
          code: code.trim().toUpperCase() || undefined,
          color,
          notes: notes.trim() || undefined,
        });
      }
    } else {
      onCreateCluster({
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        color,
        notes: notes.trim() || undefined,
      });
    }

    setIsCreating(false);
    setEditingClusterId(null);
  };

  const handleExportCluster = (cls: ClusterFolder, format: 'kml' | 'geojson' | 'csv') => {
    const clusterItems = items.filter(
      (it) => it.clusterId === cls.id || (!it.clusterId && cls.id === 'cls-bintaro')
    );
    if (clusterItems.length === 0) {
      alert(`Belum ada titik tiang/FAT di dalam cluster "${cls.name}".`);
      return;
    }
    const cleanName = cls.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (format === 'kml') exportToKML(clusterItems, `FTTH_${cleanName}`);
    else if (format === 'geojson') exportToGeoJSON(clusterItems, `FTTH_${cleanName}`);
    else exportToCSV(clusterItems, `FTTH_${cleanName}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Folder Cluster Tagging
              </h2>
              <p className="text-[10px] text-slate-400 leading-tight">
                Pisahkan titik survei per cluster agar data tidak bercampur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Mode Switcher (Active Only vs All Clusters on map) */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Tampilan Peta:</span>
          <button
            onClick={onToggleClusterFilterMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold active:scale-95 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {clusterFilterMode === 'active-only'
                ? 'Hanya Cluster Aktif'
                : 'Tampilkan Semua Cluster'}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* Create / Edit Form Drawer */}
          {isCreating ? (
            <form onSubmit={handleSaveForm} className="p-3.5 bg-slate-950 rounded-2xl border border-cyan-500/60 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4" />
                  <span>{editingClusterId ? 'Edit Nama Cluster' : 'Buat Folder Cluster Baru'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Batal
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                    Nama Cluster (contoh: Cluster Bintaro Indah Sektor 7)
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Cluster / Area..."
                    className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                      Kode Singkat (opsional, cth: BIN)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="BIN"
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                      Warna Penanda
                    </label>
                    <div className="flex items-center gap-1 h-9">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border transition-all ${
                            color === c ? 'border-white scale-110 shadow-md ring-2 ring-cyan-400/50' : 'border-transparent opacity-70'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                    Catatan / Lokasi
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Area target survei hari ini..."
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 active:scale-95"
                >
                  {editingClusterId ? 'Simpan Perubahan' : 'Buat Cluster'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={handleStartCreate}
              className="w-full h-11 rounded-xl bg-slate-950 border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Buat Folder Cluster Baru</span>
            </button>
          )}

          {/* List of Clusters */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Daftar Cluster Tersedia ({clusters.length})
            </span>

            {clusters.map((cls) => {
              const isActive = cls.id === activeClusterId;
              const clusterItems = items.filter(
                (it) => it.clusterId === cls.id || (!it.clusterId && cls.id === 'cls-bintaro')
              );
              const tiangCount = clusterItems.filter((i) => i.category === 'tiang').length;
              const fatCount = clusterItems.filter((i) => i.category === 'fat').length;

              return (
                <div
                  key={cls.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div 
                      onClick={() => onSelectCluster(cls.id)}
                      className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
                    >
                      <div
                        style={{ backgroundColor: cls.color || '#06b6d4' }}
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {cls.name}
                          </span>
                          {cls.code && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                              {cls.code}
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 shrink-0">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-amber-300 font-semibold">{tiangCount} Tiang</span>
                          <span>·</span>
                          <span className="text-blue-300 font-semibold">{fatCount} FAT</span>
                          {cls.notes && (
                            <>
                              <span>·</span>
                              <span className="truncate italic text-slate-500 max-w-[150px]">{cls.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Focus map on this cluster */}
                      {clusterItems.length > 0 && (
                        <button
                          onClick={() => {
                            onSelectCluster(cls.id);
                            onFlyToCluster(cls.id);
                            onClose();
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                          title="Fokus ke cluster ini di peta"
                        >
                          <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      )}

                      {/* Export Dropdown / Buttons */}
                      <button
                        onClick={() => handleExportCluster(cls, 'kml')}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 text-[10px] font-semibold border border-slate-700 hover:border-emerald-700 flex items-center gap-1"
                        title="Ekspor KML cluster ini"
                      >
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span>KML</span>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleStartEdit(cls)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
                        title="Edit Cluster"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      {clusters.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus folder cluster "${cls.name}"?`)) {
                              onDeleteCluster(cls.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700"
                          title="Hapus Cluster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
