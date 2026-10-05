/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  MapPin, 
  Crosshair, 
  Layers, 
  Cable, 
  Locate, 
  Compass,
  AlertCircle,
  Database,
  Radio as AntennaIcon,
  Box
} from 'lucide-react';
import { 
  InfrastructureItem, 
  TileLayerType, 
  ThemeMode, 
  GpsState,
  LiveTrackingState,
  TrackPoint,
  ClusterFolder
} from './types';
import { 
  getStoredItems, 
  saveItem, 
  deleteItemById, 
  saveAllItems, 
  clearAllItems,
  getSavedMapCenter,
  setSavedMapCenter,
  getStoredClusters,
  saveClusters,
  getActiveClusterId,
  setActiveClusterId
} from './utils/storage';
import { exportTrackToKML } from './utils/export';
import { Navbar } from './components/Navbar';
import { FTTHMap, PanToRequest } from './components/FTTHMap';
import { CrosshairOverlay } from './components/CrosshairOverlay';
import { TagModal } from './components/TagModal';
import { DetailModal } from './components/DetailModal';
import { DataListModal } from './components/DataListModal';
import { GpsDiagnosticModal } from './components/GpsDiagnosticModal';
import { ManualCoordModal } from './components/ManualCoordModal';
import { LiveTrackingBar } from './components/LiveTrackingBar';
import { ClusterModal } from './components/ClusterModal';
import { averageCoordinates, calculateDistance } from './utils/geo';
import { AntiDriftGpsFilter } from './utils/kalmanGps';

export default function App() {
  // 1. Data state
  const [items, setItems] = useState<InfrastructureItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InfrastructureItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<InfrastructureItem | null>(null);

  // 1b. Cluster / Folder state
  const [clusters, setClusters] = useState<ClusterFolder[]>([]);
  const [activeClusterId, setActiveClusterIdState] = useState<string>('cls-bintaro');
  const [isClusterModalOpen, setIsClusterModalOpen] = useState(false);
  const [clusterFilterMode, setClusterFilterMode] = useState<'active-only' | 'all'>('active-only');

  // 2. Modals state
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDataListOpen, setIsDataListOpen] = useState(false);
  const [isGpsDiagnosticOpen, setIsGpsDiagnosticOpen] = useState(false);
  const [isManualCoordOpen, setIsManualCoordOpen] = useState(false);
  const [isCalibratingGps, setIsCalibratingGps] = useState(false);
  const [calibrationSampleCount, setCalibrationSampleCount] = useState(0);

  // 3. Live Tracking State (High Precision Walking & Route Trail)
  const [liveTracking, setLiveTracking] = useState<LiveTrackingState>({
    isActive: false,
    isFollowCam: true,
    points: [],
    totalDistanceMeters: 0,
    currentSpeedKmh: 0,
    startTime: null,
    minAccuracyFilter: 18,
  });

  const liveTrackingRef = useRef(liveTracking);
  liveTrackingRef.current = liveTracking;

  // 4. Map & Navigation state
  // Default coordinate: Jakarta Pusat / Kuningan FTTH area or saved center
  const initialCenter = getSavedMapCenter() || [-6.209180, 106.845910];
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(initialCenter);
  const [panToRequest, setPanToRequest] = useState<PanToRequest | null>(null);
  const [activeLayer, setActiveLayer] = useState<TileLayerType>('satellite');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tiang' | 'fat'>('all');
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [showCableLines, setShowCableLines] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(18);
  const [isPinLockedToCenter, setIsPinLockedToCenter] = useState(true);
  const [isGpsLocked, setIsGpsLocked] = useState(false); // GPS freeze toggle

  // 4. GPS Geolocation State (Anti-Drift HTML5 high-accuracy)
  const [gpsState, setGpsState] = useState<GpsState>({
    coords: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    isTracking: false,
    status: 'idle',
  });

  const watchIdRef = useRef<number | null>(null);
  const gpsFilterRef = useRef(new AntiDriftGpsFilter());
  const hasInitialLocatedRef = useRef(false);
  const isGpsLockedRef = useRef(isGpsLocked);
  isGpsLockedRef.current = isGpsLocked;

  // Load stored items and clusters on mount
  useEffect(() => {
    getStoredItems().then((loaded) => {
      setItems(loaded);
    });
    getStoredClusters().then((clsList) => {
      setClusters(clsList);
      const activeId = getActiveClusterId();
      setActiveClusterIdState(activeId);
    });
  }, []);

  // HTML5 High-Accuracy Geolocation Handler (Anti-Drift)
  const triggerGpsLocate = useCallback((autoCenter = false) => {
    if (!navigator.geolocation) {
      setGpsState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: 'Geolocation tidak didukung browser ini.',
      }));
      return;
    }

    setGpsState((prev) => ({ ...prev, status: 'locating' }));

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 3000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
        const filtered = gpsFilterRef.current.process(latitude, longitude, accuracy, speed, heading);

        setGpsState({
          coords: { lat: filtered.lat, lng: filtered.lng },
          accuracy: filtered.accuracy,
          altitude,
          heading: filtered.heading,
          speed: filtered.speed,
          isTracking: true,
          status: 'locked',
          lastUpdated: Date.now(),
        });

        if (autoCenter) {
          setCurrentCoords([filtered.lat, filtered.lng]);
          setSavedMapCenter([filtered.lat, filtered.lng]);
          setPanToRequest({
            coords: [filtered.lat, filtered.lng],
            zoom: 19,
            timestamp: Date.now(),
          });
        }
      },
      (error) => {
        console.warn('GPS error:', error.message);
        setGpsState((prev) => ({
          ...prev,
          status: error.code === 1 ? 'denied' : 'error',
          errorMessage: error.message,
        }));
      },
      geoOptions
    );
  }, []);

  // Auto-locate GPS on initial app load once
  useEffect(() => {
    if (!hasInitialLocatedRef.current) {
      hasInitialLocatedRef.current = true;
      triggerGpsLocate(true);
    }
  }, [triggerGpsLocate]);

  // Multi-Sample GPS Averaging Calibration (Anti-drift filter)
  const handleCalibrateGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung pada browser ini.');
      return;
    }

    setIsCalibratingGps(true);
    setCalibrationSampleCount(0);
    const collectedSamples: Array<{ lat: number; lng: number; accuracy?: number }> = [];

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          collectedSamples.push({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setCalibrationSampleCount(collectedSamples.length);

          if (collectedSamples.length >= 5) {
            clearInterval(intervalId);
            const averaged = averageCoordinates(collectedSamples);
            gpsFilterRef.current.reset();
            const smoothed = gpsFilterRef.current.process(averaged.lat, averaged.lng, averaged.accuracy);

            setGpsState((prev) => ({
              ...prev,
              coords: { lat: smoothed.lat, lng: smoothed.lng },
              accuracy: smoothed.accuracy,
              status: 'locked',
              lastUpdated: Date.now(),
            }));
            setCurrentCoords([smoothed.lat, smoothed.lng]);
            setPanToRequest({
              coords: [smoothed.lat, smoothed.lng],
              zoom: 20,
              timestamp: Date.now(),
            });
            setIsCalibratingGps(false);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }, 600);

    // Timeout safety
    setTimeout(() => {
      clearInterval(intervalId);
      setIsCalibratingGps(false);
    }, 8000);
  };

  // Continuous watchPosition with Anti-Drift Kalman filter and Live Tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 1000,
    };

    try {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const isTracking = liveTrackingRef.current.isActive;

          // If GPS is locked by technician, only pause if NOT in live tracking mode
          if (isGpsLockedRef.current && !isTracking) return;

          const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
          const filtered = gpsFilterRef.current.process(latitude, longitude, accuracy, speed, heading, isTracking);

          setGpsState((prev) => ({
            ...prev,
            coords: { lat: filtered.lat, lng: filtered.lng },
            accuracy: filtered.accuracy,
            altitude,
            heading: filtered.heading,
            speed: filtered.speed,
            isTracking: true,
            status: 'locked',
            lastUpdated: Date.now(),
          }));

          // Live Tracking Trail Recording (High Accuracy Gate)
          if (isTracking) {
            const state = liveTrackingRef.current;
            // Practical mobile GNSS survey tolerance (up to 35m)
            if (filtered.accuracy <= 35) {
              const now = Date.now();
              const points = state.points;
              const lastPt = points.length > 0 ? points[points.length - 1] : null;
              const dist = lastPt
                ? calculateDistance(lastPt.lat, lastPt.lng, filtered.lat, filtered.lng)
                : 999;

              // Only append if moved at least 1.5 meters from previous track point (human walking step)
              if (!lastPt || dist >= 1.5) {
                const newPoint: TrackPoint = {
                  lat: filtered.lat,
                  lng: filtered.lng,
                  accuracy: filtered.accuracy,
                  timestamp: now,
                  speed: filtered.speed,
                  heading: filtered.heading,
                  altitude: altitude || null,
                };

                const addedDist = lastPt ? dist : 0;
                let calculatedSpeedKmh = 0;
                if (filtered.speed !== null && filtered.speed !== undefined && filtered.speed > 0) {
                  calculatedSpeedKmh = filtered.speed * 3.6;
                } else if (lastPt && dist > 0) {
                  const timeDeltaSec = (now - lastPt.timestamp) / 1000;
                  if (timeDeltaSec > 0 && timeDeltaSec < 60) {
                    calculatedSpeedKmh = (dist / timeDeltaSec) * 3.6;
                  }
                }

                setLiveTracking((prev) => ({
                  ...prev,
                  points: [...prev.points, newPoint],
                  totalDistanceMeters: prev.totalDistanceMeters + addedDist,
                  currentSpeedKmh: Math.min(calculatedSpeedKmh, 80),
                }));

                // Follow Cam: smoothly pan to user walking position
                if (state.isFollowCam) {
                  setPanToRequest({
                    coords: [filtered.lat, filtered.lng],
                    timestamp: Date.now(),
                  });
                }
              }
            }
          }
        },
        (error) => {
          console.warn('WatchPosition notice:', error.message);
        },
        geoOptions
      );
      watchIdRef.current = id;
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Live Tracking Handlers
  const handleToggleLiveTracking = () => {
    setLiveTracking((prev) => {
      const willBeActive = !prev.isActive;
      if (willBeActive) {
        // Unlock GPS if was locked, and focus to user position
        setIsGpsLocked(false);
        if (gpsState.coords) {
          setPanToRequest({
            coords: [gpsState.coords.lat, gpsState.coords.lng],
            zoom: 19,
            timestamp: Date.now(),
          });
        }
        return {
          ...prev,
          isActive: true,
          isFollowCam: true,
          startTime: prev.startTime || Date.now(),
        };
      } else {
        return {
          ...prev,
          isActive: false,
          currentSpeedKmh: 0,
        };
      }
    });
  };

  const handleToggleFollowCam = () => {
    setLiveTracking((prev) => ({ ...prev, isFollowCam: !prev.isFollowCam }));
  };

  const handleResetTrack = () => {
    setLiveTracking((prev) => ({
      ...prev,
      points: [],
      totalDistanceMeters: 0,
      currentSpeedKmh: 0,
      startTime: null,
    }));
  };

  const handleExportTrackKml = () => {
    if (liveTracking.points.length > 0) {
      exportTrackToKML(liveTracking.points);
    }
  };

  const handleTagAtCurrentGps = () => {
    if (gpsState.coords) {
      setCurrentCoords([gpsState.coords.lat, gpsState.coords.lng]);
    }
    setItemToEdit(null);
    setIsTagModalOpen(true);
  };

  // Re-center map to user GPS
  const handleCenterGps = () => {
    if (gpsState.coords) {
      const target: [number, number] = [gpsState.coords.lat, gpsState.coords.lng];
      setCurrentCoords(target);
      setPanToRequest({
        coords: target,
        zoom: 19,
        timestamp: Date.now(),
      });
    } else {
      triggerGpsLocate(true);
    }
  };

  // Nudge map center coordinates by small delta (Anti-drift micro-adjustment)
  const handleNudge = (deltaLat: number, deltaLng: number) => {
    setCurrentCoords(([prevLat, prevLng]) => {
      const newLat = prevLat + deltaLat;
      const newLng = prevLng + deltaLng;
      setPanToRequest({
        coords: [newLat, newLng],
        timestamp: Date.now(),
      });
      return [newLat, newLng];
    });
  };

  // Save new or edited item
  const handleSaveItem = async (item: InfrastructureItem) => {
    await saveItem(item);
    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = item;
        return copy;
      }
      return [...prev, item];
    });
    setIsTagModalOpen(false);
    setItemToEdit(null);
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    await deleteItemById(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };

  // Bulk import items
  const handleImportItems = async (imported: InfrastructureItem[]) => {
    const activeCls = clusters.find((c) => c.id === activeClusterId);
    const normalized = imported.map((it) => ({
      ...it,
      clusterId: it.clusterId || activeClusterId,
      clusterName: it.clusterName || activeCls?.name || 'Cluster Bintaro Jaya',
    }));

    const mergedMap = new Map<string, InfrastructureItem>();
    items.forEach((it) => mergedMap.set(it.id, it));
    normalized.forEach((it) => mergedMap.set(it.id, it));
    const mergedList = Array.from(mergedMap.values());
    await saveAllItems(mergedList);
    setItems(mergedList);
    if (normalized.length > 0) {
      setCurrentCoords([normalized[0].lat, normalized[0].lng]);
    }
  };

  // Cluster Management Handlers
  const handleSelectCluster = (clusterId: string) => {
    setActiveClusterId(clusterId);
    setActiveClusterIdState(clusterId);
    handleFlyToCluster(clusterId);
  };

  const handleCreateCluster = async (newClsData: Omit<ClusterFolder, 'id' | 'createdAt'>) => {
    const id = `cls-${Date.now().toString().slice(-6)}`;
    const newCluster: ClusterFolder = {
      ...newClsData,
      id,
      createdAt: new Date().toISOString(),
    };
    const updated = [...clusters, newCluster];
    await saveClusters(updated);
    setClusters(updated);
    setActiveClusterId(id);
    setActiveClusterIdState(id);
  };

  const handleUpdateCluster = async (updatedCluster: ClusterFolder) => {
    const updated = clusters.map((c) => (c.id === updatedCluster.id ? updatedCluster : c));
    await saveClusters(updated);
    setClusters(updated);
    // Also update clusterName on items that belong to this cluster
    const updatedItems = items.map((it) =>
      it.clusterId === updatedCluster.id ? { ...it, clusterName: updatedCluster.name } : it
    );
    await saveAllItems(updatedItems);
    setItems(updatedItems);
  };

  const handleDeleteCluster = async (clusterId: string) => {
    const updated = clusters.filter((c) => c.id !== clusterId);
    await saveClusters(updated);
    setClusters(updated);
    if (activeClusterId === clusterId) {
      const fallbackId = updated[0]?.id || 'cls-bintaro';
      setActiveClusterId(fallbackId);
      setActiveClusterIdState(fallbackId);
    }
  };

  const handleFlyToCluster = (clusterId: string) => {
    const clusterItems = items.filter(
      (it) => it.clusterId === clusterId || (!it.clusterId && clusterId === 'cls-bintaro')
    );
    if (clusterItems.length > 0) {
      const avg = averageCoordinates(clusterItems);
      const targetCoords: [number, number] = [avg.lat, avg.lng];
      setPanToRequest({
        coords: targetCoords,
        zoom: 18,
        timestamp: Date.now(),
      });
      setCurrentCoords(targetCoords);
    }
  };

  const activeCluster = clusters.find((c) => c.id === activeClusterId) || clusters[0];

  // Clear all items
  const handleClearAll = async () => {
    await clearAllItems();
    setItems([]);
  };

  // Reset to default seed
  const handleResetSeed = async () => {
    localStorage.removeItem('ftth_infrastructure_items_v1');
    const fresh = await getStoredItems();
    setItems(fresh);
  };

  // Open Tag modal for brand new point
  const handleOpenTagNew = () => {
    setItemToEdit(null);
    setIsTagModalOpen(true);
  };

  // Open Tag modal to edit existing
  const handleEditItem = (item: InfrastructureItem) => {
    setItemToEdit(item);
    setIsDetailModalOpen(false);
    setIsTagModalOpen(true);
  };

  // Open detail popup on marker click
  const handleMarkerClick = (item: InfrastructureItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  // Calculations for UI
  const tiangCount = items.filter((i) => i.category === 'tiang').length;
  const fatCount = items.filter((i) => i.category === 'fat').length;

  return (
    <div className={`relative w-screen h-screen overflow-hidden flex flex-col ${
      themeMode === 'outdoor' 
        ? 'outdoor-sunlight-mode bg-black text-yellow-300' 
        : themeMode === 'light' 
        ? 'bg-slate-100 text-slate-900' 
        : 'bg-slate-900 text-slate-100'
    }`}>
      {/* 1. Header Navigation Bar (One-row, 3-zone contract) */}
      <Navbar
        gpsState={gpsState}
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        totalPoints={items.length}
        tiangCount={tiangCount}
        fatCount={fatCount}
        onOpenDataList={() => setIsDataListOpen(true)}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        isGpsLocked={isGpsLocked}
        onToggleGpsLock={() => setIsGpsLocked((prev) => !prev)}
        onTriggerGps={() => triggerGpsLocate(true)}
        onOpenManualCoords={() => setIsManualCoordOpen(true)}
        isLiveTrackingActive={liveTracking.isActive}
        onToggleLiveTracking={handleToggleLiveTracking}
        activeClusterName={activeCluster?.name || 'Cluster Bintaro Jaya'}
        onOpenClusterModal={() => setIsClusterModalOpen(true)}
      />

      {/* 2. Interactive Leaflet Map Canvas */}
      <div className="flex-1 relative w-full h-full">
        <FTTHMap
          items={items}
          activeLayer={activeLayer}
          selectedItem={selectedItem}
          onMarkerClick={handleMarkerClick}
          targetCoords={currentCoords}
          onCoordsChange={setCurrentCoords}
          panToRequest={panToRequest}
          gpsState={gpsState}
          categoryFilter={categoryFilter}
          onZoomChange={setZoomLevel}
          showCableLines={showCableLines}
          liveTrackPoints={liveTracking.points}
          isLiveTrackingActive={liveTracking.isActive}
          onUserDragMap={() => {
            if (liveTracking.isFollowCam) {
              setLiveTracking((prev) => ({ ...prev, isFollowCam: false }));
            }
          }}
          clusterFilterMode={clusterFilterMode}
          activeClusterId={activeClusterId}
        />

        {/* 3. Tactical Center Crosshair & Micro-Nudge Overlay (Anti-drift) */}
        <CrosshairOverlay
          currentCoords={currentCoords}
          gpsState={gpsState}
          onNudge={handleNudge}
          onCenterGps={handleCenterGps}
          showCrosshair={showCrosshair}
          onToggleCrosshair={() => setShowCrosshair((prev) => !prev)}
          zoomLevel={zoomLevel}
          onOpenGpsDiagnostic={() => setIsGpsDiagnosticOpen(true)}
        />

        {/* 4. Unified Bottom Controls Dock (Thumb Reach Zone - Zero Mobile Overlap) */}
        <div className="fixed bottom-2.5 sm:bottom-4 left-0 right-0 z-20 px-2 sm:px-6 pointer-events-none select-none">
          <div className="max-w-md mx-auto flex flex-col gap-1.5 sm:gap-2 pointer-events-auto">
            {/* Live Tracking Floating Status Bar (Docked seamlessly) */}
            {(liveTracking.isActive || liveTracking.points.length > 0) && (
              <LiveTrackingBar
                trackingState={liveTracking}
                onToggleTracking={handleToggleLiveTracking}
                onToggleFollowCam={handleToggleFollowCam}
                onResetTrack={handleResetTrack}
                onExportTrackKml={handleExportTrackKml}
                onTagAtCurrentGps={handleTagAtCurrentGps}
                gpsAccuracy={gpsState.accuracy}
              />
            )}

            {/* Quick Helper Floating Bar (Cable trace & Quick Category summary) */}
            <div className="flex items-center justify-between gap-2 px-3 py-1 sm:py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-xl text-[11px] sm:text-xs">
              <button
                onClick={() => setShowCableLines((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full transition-colors ${
                  showCableLines
                    ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-800 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilkan / sembunyikan garis rute kabel fiber"
              >
                <Cable className="w-3.5 h-3.5" />
                <span>Rute: {showCableLines ? 'ON' : 'OFF'}</span>
              </button>

              <div className="flex items-center gap-2 text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <span className="font-mono font-bold text-xs">{tiangCount}</span>
                  <span className="text-[10px] text-slate-400">Tiang</span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>
                  <span className="font-mono font-bold text-xs">{fatCount}</span>
                  <span className="text-[10px] text-slate-400">FAT</span>
                </span>
              </div>
            </div>

            {/* Primary Big Action Button: TAG TITIK INI */}
            <button
              onClick={handleOpenTagNew}
              className="w-full h-12 sm:h-14 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-2.5 shadow-2xl shadow-amber-500/30 active:scale-[0.98] transition-all border-2 border-yellow-300/60 touch-hitbox"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
              <span className="tracking-wide uppercase font-black text-xs sm:text-sm">
                TAG TITIK INI
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold bg-slate-950/20 px-1.5 sm:px-2 py-0.5 rounded-md text-slate-900 border border-slate-950/20 tabular-nums">
                {currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Tagging Form Modal (Pop-up / Bottom Sheet) */}
      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => {
          setIsTagModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
        currentCoords={currentCoords}
        gpsAccuracy={gpsState.accuracy}
        allItems={items}
        itemToEdit={itemToEdit}
        clusters={clusters}
        activeClusterId={activeClusterId}
      />

      {/* 6. Marker Detail Popup Modal */}
      <DetailModal
        item={selectedItem}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedItem(null);
        }}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />

      {/* 7. Data List & Multi-Format Export Drawer Modal */}
      <DataListModal
        isOpen={isDataListOpen}
        onClose={() => setIsDataListOpen(false)}
        items={items}
        onSelectItem={(item) => {
          setSelectedItem(item);
          setCurrentCoords([item.lat, item.lng]);
          setPanToRequest({
            coords: [item.lat, item.lng],
            zoom: 19,
            timestamp: Date.now(),
          });
          setIsDetailModalOpen(true);
        }}
        onImportItems={handleImportItems}
        onClearAll={handleClearAll}
        onResetSeed={handleResetSeed}
        clusters={clusters}
      />

      {/* 8. Cluster / Folder Management Modal */}
      <ClusterModal
        isOpen={isClusterModalOpen}
        onClose={() => setIsClusterModalOpen(false)}
        clusters={clusters}
        activeClusterId={activeClusterId}
        onSelectCluster={handleSelectCluster}
        onCreateCluster={handleCreateCluster}
        onUpdateCluster={handleUpdateCluster}
        onDeleteCluster={handleDeleteCluster}
        items={items}
        onFlyToCluster={handleFlyToCluster}
        clusterFilterMode={clusterFilterMode}
        onToggleClusterFilterMode={() =>
          setClusterFilterMode((prev) => (prev === 'active-only' ? 'all' : 'active-only'))
        }
      />

      {/* 9. GPS Diagnostic & Multi-Sample Calibration Modal */}
      <GpsDiagnosticModal
        isOpen={isGpsDiagnosticOpen}
        onClose={() => setIsGpsDiagnosticOpen(false)}
        gpsState={gpsState}
        targetCoords={currentCoords}
        onCalibrateGps={handleCalibrateGps}
        isCalibrating={isCalibratingGps}
        sampleCount={calibrationSampleCount}
        onCenterGps={handleCenterGps}
      />

      {/* 9. Manual Coordinate Input Modal */}
      <ManualCoordModal
        isOpen={isManualCoordOpen}
        onClose={() => setIsManualCoordOpen(false)}
        currentCoords={currentCoords}
        onApplyCoords={(coords) => {
          setCurrentCoords(coords);
          setPanToRequest({
            coords,
            zoom: 19,
            timestamp: Date.now(),
          });
        }}
      />
    </div>
  );
}
