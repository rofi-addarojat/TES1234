import React, { useState, useRef } from 'react';
import { 
  X, 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  MapPin, 
  FileSpreadsheet, 
  Globe, 
  Layers, 
  ChevronRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Box,
  Radio as AntennaIcon,
  Folder
} from 'lucide-react';
import { InfrastructureItem, ClusterFolder } from '../types';
import { exportToKML, exportToCSV, exportToGeoJSON, parseImportedData } from '../utils/export';

interface DataListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InfrastructureItem[];
  onSelectItem: (item: InfrastructureItem) => void;
  onImportItems: (newItems: InfrastructureItem[]) => void;
  onClearAll: () => void;
  onResetSeed: () => void;
  clusters?: ClusterFolder[];
}

export const DataListModal: React.FC<DataListModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onImportItems,
  onClearAll,
  onResetSeed,
  clusters = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'tiang' | 'fat'>('all');
  const [filterCluster, setFilterCluster] = useState<string>('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterCluster !== 'all') {
      const match = item.clusterId === filterCluster || (!item.clusterId && filterCluster === 'cls-bintaro');
      if (!match) return false;
    }
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.subType.toLowerCase().includes(q) ||
      item.technicianName.toLowerCase().includes(q) ||
      (item.clusterName && item.clusterName.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  // Summary counts
  const totalCount = items.length;
  const tiangCount = items.filter((i) => i.category === 'tiang').length;
  const fatCount = items.filter((i) => i.category === 'fat').length;

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseImportedData(text);
        if (parsed.length > 0) {
          onImportItems(parsed);
          setImportNotice(`Berhasil mengimpor ${parsed.length} titik infrastruktur!`);
          setTimeout(() => setImportNotice(null), 3000);
        } else {
          alert('Format GeoJSON / JSON tidak valid atau kosong.');
        }
      } catch (err) {
        alert('Gagal membaca file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden text-slate-100"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Manajemen Data Lapangan</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                {totalCount} Titik
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Offline-First Storage & Export Multi-Format
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        {importNotice && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-800 text-xs text-emerald-200 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{importNotice}</span>
          </div>
        )}

        {/* Counter Summary Cards */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tagging</span>
              <span className="text-xl font-mono font-extrabold text-cyan-400">{totalCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Total Tiang</span>
              <span className="text-xl font-mono font-extrabold text-amber-300">{tiangCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-center">
              <span className="text-[10px] uppercase font-bold text-blue-400 block">Total FAT</span>
              <span className="text-xl font-mono font-extrabold text-blue-300">{fatCount}</span>
            </div>
          </div>
        </div>

        {/* Export & Import Action Toolbar */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ekspor Hasil Survei
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                accept=".geojson,.json"
                ref={fileInputRef}
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1"
                title="Impor file GeoJSON survei sebelumnya"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Impor GeoJSON</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* KML Export */}
            <button
              onClick={() => exportToKML(filteredItems)}
              disabled={filteredItems.length === 0}
              className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-700/20 disabled:opacity-50"
              title="Buka langsung di Google Earth atau AutoCAD"
            >
              <Globe className="w-4 h-4" />
              <span>Ekspor KML ({filteredItems.length})</span>
            </button>

            {/* CSV / Excel Export */}
            <button
              onClick={() => exportToCSV(filteredItems)}
              disabled={filteredItems.length === 0}
              className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 disabled:opacity-50"
              title="Unduh tabel Excel / Spreadsheet lengkap dengan UTF-8 BOM"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor CSV ({filteredItems.length})</span>
            </button>

            {/* GeoJSON Export */}
            <button
              onClick={() => exportToGeoJSON(filteredItems)}
              disabled={filteredItems.length === 0}
              className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-700/20 disabled:opacity-50"
              title="Format GeoJSON standar untuk QGIS & Web GIS"
            >
              <Layers className="w-4 h-4" />
              <span>Ekspor GeoJSON</span>
            </button>
          </div>
        </div>

        {/* Cluster Filter Pill Bar */}
        {clusters.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Folder className="w-3 h-3 text-cyan-400" />
              Cluster:
            </span>
            <button
              onClick={() => setFilterCluster('all')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                filterCluster === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Semua ({items.length})
            </button>
            {clusters.map((c) => {
              const cCount = items.filter(
                (it) => it.clusterId === c.id || (!it.clusterId && c.id === 'cls-bintaro')
              ).length;
              const isSelected = filterCluster === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setFilterCluster(c.id)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span
                    style={{ backgroundColor: c.color || '#06b6d4' }}
                    className="w-2 h-2 rounded-full shrink-0"
                  />
                  <span>{c.name}</span>
                  <span className="text-[9px] font-mono opacity-80">({cCount})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID, jenis, FAT, teknisi..."
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                filterCategory === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterCategory('tiang')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                filterCategory === 'tiang' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Tiang
            </button>
            <button
              onClick={() => setFilterCategory('fat')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                filterCategory === 'fat' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              FAT
            </button>
          </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Tidak ada data ditemukan</p>
              <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau filter kategori.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className="p-3.5 hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail / Icon */}
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.id}
                      className="w-11 h-11 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border ${
                      item.category === 'tiang'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {item.category === 'tiang' ? <AntennaIcon className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {item.id}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">
                        {item.subType}
                      </span>
                      {item.fatCapacity && (
                        <span className="text-[10px] font-mono px-1 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {item.fatCapacity}P
                        </span>
                      )}
                      {item.clusterName && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                          {item.clusterName}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 tabular-nums">
                      <span>{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</span>
                      <span>·</span>
                      <span>{item.technicianName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    {new Date(item.timestamp).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-cyan-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Danger & Reset Area */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-rose-300 font-semibold">Hapus semua {items.length} titik?</span>
              <button
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                }}
                className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded hover:bg-rose-500"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded hover:text-white"
              >
                Batal
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmClear(true)}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={onResetSeed}
                className="text-slate-400 hover:text-white flex items-center gap-1"
                title="Muat ulang rute contoh FTTH"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Contoh Data</span>
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
