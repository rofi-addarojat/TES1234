import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  Clock, 
  User, 
  Plus, 
  RotateCcw, 
  Check, 
  Upload, 
  AlertTriangle,
  Radio as AntennaIcon,
  Box,
  Folder,
  Trash2,
  Maximize2
} from 'lucide-react';
import { 
  InfrastructureCategory, 
  InfrastructureItem, 
  PhysicalCondition, 
  TiangType,
  ClusterFolder
} from '../types';
import { 
  getLastTechnicianName, 
  setLastTechnicianName, 
  getLastFatCode, 
  setLastFatCode,
  generateNextId 
} from '../utils/storage';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InfrastructureItem) => void;
  currentCoords: [number, number]; // [lat, lng]
  gpsAccuracy?: number | null;
  allItems: InfrastructureItem[];
  itemToEdit?: InfrastructureItem | null;
  clusters?: ClusterFolder[];
  activeClusterId?: string;
}

const TIANG_OPTIONS: TiangType[] = [
  'Ext.mti',
  'Ext Telkom',
  'Ext emr',
  'Ext tiang listrik',
  'Tiang 7.2',
  'Tiang 7.3',
  'Tiang 7.4',
  'Tiang 9.4',
  'Lainnya',
];

const FAT_PREFIXES = ['A', 'B', 'C', 'D', 'E', 'F'];
const FAT_CAPACITIES = [8, 16, 24];
const CONDITION_OPTIONS: PhysicalCondition[] = ['Bagus', 'Baru Pasang', 'Perlu Perbaikan', 'Kritis'];

export const TagModal: React.FC<TagModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentCoords,
  gpsAccuracy,
  allItems,
  itemToEdit,
  clusters = [],
  activeClusterId = 'cls-bintaro',
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<string>(activeClusterId);
  const [category, setCategory] = useState<InfrastructureCategory>('tiang');
  const [customId, setCustomId] = useState('');
  const [technician, setTechnician] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [tiangType, setTiangType] = useState<TiangType>('Tiang 7.2');
  const [customTiangType, setCustomTiangType] = useState('');
  
  // FAT specifics
  const [fatPrefix, setFatPrefix] = useState('A');
  const [fatNumber, setFatNumber] = useState(1);
  const [fatCapacity, setFatCapacity] = useState(16);
  const [connectedTiangId, setConnectedTiangId] = useState<string>('');

  const [formLat, setFormLat] = useState<number>(currentCoords[0]);
  const [formLng, setFormLng] = useState<number>(currentCoords[1]);
  const [condition, setCondition] = useState<PhysicalCondition>('Bagus');
  const [notes, setNotes] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (itemToEdit) {
      setSelectedClusterId(itemToEdit.clusterId || activeClusterId);
      setFormLat(itemToEdit.lat);
      setFormLng(itemToEdit.lng);
      setCategory(itemToEdit.category);
      setCustomId(itemToEdit.id);
      setTechnician(itemToEdit.technicianName);
      setTimestamp(itemToEdit.timestamp);
      setCondition(itemToEdit.condition || 'Bagus');
      setNotes(itemToEdit.notes || '');
      setPhotoDataUrl(itemToEdit.photoUrl || null);
      setConnectedTiangId(itemToEdit.connectedToId || '');

      if (itemToEdit.category === 'tiang') {
        if (TIANG_OPTIONS.includes(itemToEdit.subType as TiangType)) {
          setTiangType(itemToEdit.subType as TiangType);
        } else {
          setTiangType('Lainnya');
          setCustomTiangType(itemToEdit.subType);
        }
      } else {
        // FAT parsing
        const rawCode = itemToEdit.fatCode || itemToEdit.subType.replace(/^FAT\s*/i, '');
        const match = rawCode.match(/^([A-Za-z]+)(\d+)$/);
        if (match) {
          setFatPrefix(match[1].toUpperCase());
          setFatNumber(parseInt(match[2], 10));
        }
        setFatCapacity(itemToEdit.fatCapacity || 16);
      }
    } else {
      // New item creation: LOCK the exact coordinates the user pinpointed right now!
      setSelectedClusterId(activeClusterId);
      setFormLat(currentCoords[0]);
      setFormLng(currentCoords[1]);

      const lastTech = getLastTechnicianName();
      setTechnician(lastTech);
      setTimestamp(new Date().toISOString());
      
      const newCat: InfrastructureCategory = 'tiang';
      setCategory(newCat);
      setCustomId(generateNextId(newCat, allItems));
      setTiangType('Tiang 7.2');
      setCustomTiangType('');
      setCondition('Bagus');
      setNotes('');
      setPhotoDataUrl(null);
      setConnectedTiangId('');

      // Load last FAT code
      const lastFat = getLastFatCode();
      const match = lastFat.match(/^([A-Za-z]+)(\d+)$/);
      if (match) {
        setFatPrefix(match[1].toUpperCase());
        setFatNumber(parseInt(match[2], 10) + 1); // Auto increment
      } else {
        setFatPrefix('A');
        setFatNumber(1);
      }
    }
  }, [isOpen, itemToEdit, allItems, activeClusterId]);

  // When category changes in "new" mode, update auto ID
  const handleCategoryChange = (newCat: InfrastructureCategory) => {
    setCategory(newCat);
    if (!itemToEdit) {
      setCustomId(generateNextId(newCat, allItems));
    }
  };

  // Quick increment FAT number e.g. A01 -> A02
  const handleIncrementFat = () => {
    setFatNumber((prev) => prev + 1);
  };

  const handleDecrementFat = () => {
    setFatNumber((prev) => Math.max(1, prev - 1));
  };

  // Format FAT code string e.g. "FAT A01"
  const formattedFatCode = `${fatPrefix}${fatNumber.toString().padStart(2, '0')}`;
  const fullFatString = `FAT ${formattedFatCode}`;

  // Image capture & compression handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 800px width/height for fast offline storage
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setPhotoDataUrl(dataUrl);
        }
        setIsCompressingPhoto(false);
      };
      img.onerror = () => setIsCompressingPhoto(false);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!technician.trim()) {
      alert('Silakan masukkan nama teknisi');
      return;
    }

    // Save technician name to local storage
    setLastTechnicianName(technician);

    let finalSubType = '';
    let finalFatCode: string | undefined = undefined;

    if (category === 'tiang') {
      finalSubType = tiangType === 'Lainnya' ? (customTiangType.trim() || 'Tiang Custom') : tiangType;
    } else {
      finalSubType = fullFatString;
      finalFatCode = formattedFatCode;
      setLastFatCode(formattedFatCode);
    }

    const matchedCluster = clusters.find((c) => c.id === selectedClusterId);

    const item: InfrastructureItem = {
      id: customId.trim() || (category === 'tiang' ? `TG-${Date.now().toString().slice(-4)}` : `FAT-${Date.now().toString().slice(-4)}`),
      category,
      subType: finalSubType,
      fatCode: finalFatCode,
      fatCapacity: category === 'fat' ? fatCapacity : undefined,
      lat: formLat,
      lng: formLng,
      accuracy: itemToEdit?.accuracy || (gpsAccuracy !== null && gpsAccuracy !== undefined ? gpsAccuracy : 2.5),
      technicianName: technician.trim(),
      timestamp: timestamp || new Date().toISOString(),
      condition,
      notes: notes.trim(),
      photoUrl: photoDataUrl || undefined,
      connectedToId: category === 'fat' && connectedTiangId ? connectedTiangId : undefined,
      clusterId: selectedClusterId,
      clusterName: matchedCluster ? matchedCluster.name : undefined,
    };

    onSave(item);
  };

  if (!isOpen) return null;

  const lat = formLat;
  const lng = formLng;
  const tiangList = allItems.filter((i) => i.category === 'tiang');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              category === 'tiang' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}>
              {category === 'tiang' ? <AntennaIcon className="w-4 h-4" /> : <Box className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white leading-tight">
                {itemToEdit ? 'Edit Titik Infrastruktur' : 'Tag Titik FTTH Baru'}
              </h2>
              <p className="text-xs font-mono text-cyan-400 tabular-nums">
                {lat.toFixed(6)}, {lng.toFixed(6)}
                {gpsAccuracy ? ` (±${gpsAccuracy.toFixed(1)}m)` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Cluster Folder Selection Field */}
          {clusters.length > 0 && (
            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Folder Cluster Tagging</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                  {clusters.find((c) => c.id === selectedClusterId)?.name || 'Pilih Cluster'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {clusters.map((cls) => {
                  const isSelected = cls.id === selectedClusterId;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClusterId(cls.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: cls.color || '#06b6d4' }}
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold truncate block">{cls.name}</span>
                        {cls.code && (
                          <span className="text-[9px] font-mono text-amber-300">{cls.code}</span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Coordinate Lock Verification Box */}
          <div className="p-3 bg-slate-950 rounded-xl border border-yellow-500/60 shadow-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-yellow-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Titik Tagging Terkunci (Roadside Pinpoint)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-extrabold border border-yellow-500/40">
                LOKASI VALID
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[9px] text-slate-400 font-semibold block mb-0.5">LATITUDE</label>
                <input
                  type="number"
                  step="any"
                  value={formLat}
                  onChange={(e) => setFormLat(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-bold focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 font-semibold block mb-0.5">LONGITUDE</label>
                <input
                  type="number"
                  step="any"
                  value={formLng}
                  onChange={(e) => setFormLng(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-bold focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Koordinat ini telah dikunci pada titik bidikan Anda dan tidak akan berubah.
            </p>
          </div>

          {/* 1. Category Switcher (Tiang vs FAT) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              1. Kategori Infrastruktur
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/90 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleCategoryChange('tiang')}
                className={`py-2.5 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  category === 'tiang'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AntennaIcon className="w-4 h-4" />
                <span>Tiang FTTH</span>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('fat')}
                className={`py-2.5 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  category === 'fat'
                    ? 'bg-blue-600 text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Box className="w-4 h-4" />
                <span>FAT (Terminal)</span>
              </button>
            </div>
          </div>

          {/* 2. ID & Technician Info (Two columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                ID Unik
              </label>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                required
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                placeholder="TG-1002"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Nama Teknisi
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  required
                  className="w-full h-11 pl-9 pr-3 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Nama Lengkap Teknisi"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* 3. Dynamic Category Selection */}
          {category === 'tiang' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Jenis Tiang
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIANG_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTiangType(opt)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      tiangType === opt
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {tiangType === 'Lainnya' && (
                <input
                  type="text"
                  value={customTiangType}
                  onChange={(e) => setCustomTiangType(e.target.value)}
                  className="mt-2 w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="Tuliskan spesifikasi jenis tiang..."
                />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* FAT Code Generator with Quick Increment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Kode FAT (Quick Selector & Auto +1)
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {fullFatString}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Alphabet prefix selection */}
                  <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
                    {FAT_PREFIXES.map((prefix) => (
                      <button
                        key={prefix}
                        type="button"
                        onClick={() => setFatPrefix(prefix)}
                        className={`w-8 h-9 text-xs font-bold rounded-md transition-colors ${
                          fatPrefix === prefix
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {prefix}
                      </button>
                    ))}
                  </div>

                  {/* Number display and +/- buttons */}
                  <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden h-10">
                    <button
                      type="button"
                      onClick={handleDecrementFat}
                      className="px-3 h-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-mono font-bold text-sm text-cyan-300">
                      {fatNumber.toString().padStart(2, '0')}
                    </div>
                    <button
                      type="button"
                      onClick={handleIncrementFat}
                      className="px-3 h-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
                      title="Tambah 1 nomor FAT otomatis (+1)"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              {/* FAT Capacity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kapasitas Port FAT
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FAT_CAPACITIES.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setFatCapacity(cap)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        fatCapacity === cap
                          ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cap} Port
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Parent Pole Association */}
              {tiangList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Terpasang di Tiang (Opsional)
                  </label>
                  <select
                    value={connectedTiangId}
                    onChange={(e) => setConnectedTiangId(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">-- Pilih Tiang Induk (Opsional) --</option>
                    {tiangList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} - {t.subType}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 4. Physical Condition */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Kondisi Fisik Lapangan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CONDITION_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(c)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    condition === c
                      ? c === 'Bagus' || c === 'Baru Pasang'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Camera Photo Capture (HTML5 Camera Input) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Dokumentasi Foto Fisik Lapangan
            </label>
            
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />

            {photoDataUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                <img
                  src={photoDataUrl}
                  alt="Dokumentasi Tiang / FAT"
                  className="w-full h-44 object-cover"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold border border-slate-600 flex items-center gap-1 backdrop-blur-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Ambil Ulang
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl(null)}
                    className="p-1.5 bg-rose-900/90 hover:bg-rose-800 text-rose-200 rounded-lg border border-rose-700 backdrop-blur-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl bg-slate-950/60 hover:bg-slate-950 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-bold">Kamera Lapangan</span>
                </button>
                <label className="h-20 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl bg-slate-950/60 hover:bg-slate-950 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-bold">Unggah Galeri</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            {isCompressingPhoto && (
              <p className="text-xs text-cyan-400 mt-1 animate-pulse">Mengoptimasi resolusi foto...</p>
            )}
          </div>

          {/* 6. Notes / Physical Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Catatan / Kondisi Lingkungan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 resize-none"
              placeholder="Contoh: Klem suspensi kendur, dekat pohon rindang, splitter 1:8 ok..."
            />
          </div>

          {/* Bottom Action Submit Button */}
          <div className="pt-2 sticky bottom-0 bg-slate-900 pb-1">
            <button
              type="submit"
              className={`w-full h-12 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                category === 'tiang'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>{itemToEdit ? 'PERBARUI TITIK INI' : 'SIMPAN TITIK KE PETA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
