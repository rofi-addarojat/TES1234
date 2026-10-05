import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  InfrastructureItem, 
  TileLayerType, 
  GpsState,
  TrackPoint
} from '../types';
import { 
  createTiangIcon, 
  createFatIcon, 
  createUserGpsIcon 
} from '../utils/markerIcons';

export interface PanToRequest {
  coords: [number, number];
  zoom?: number;
  timestamp: number;
}

interface FTTHMapProps {
  items: InfrastructureItem[];
  activeLayer: TileLayerType;
  selectedItem: InfrastructureItem | null;
  onMarkerClick: (item: InfrastructureItem) => void;
  targetCoords: [number, number]; // Initial or current center
  onCoordsChange: (coords: [number, number]) => void;
  panToRequest: PanToRequest | null;
  gpsState: GpsState;
  categoryFilter: 'all' | 'tiang' | 'fat';
  onZoomChange: (zoom: number) => void;
  showCableLines: boolean;
  liveTrackPoints?: TrackPoint[];
  isLiveTrackingActive?: boolean;
  onUserDragMap?: () => void;
  clusterFilterMode?: 'active-only' | 'all';
  activeClusterId?: string;
}

export const FTTHMap: React.FC<FTTHMapProps> = ({
  items,
  activeLayer,
  selectedItem,
  onMarkerClick,
  targetCoords,
  onCoordsChange,
  panToRequest,
  gpsState,
  categoryFilter,
  onZoomChange,
  showCableLines,
  liveTrackPoints = [],
  isLiveTrackingActive = false,
  onUserDragMap,
  clusterFilterMode = 'active-only',
  activeClusterId = 'cls-bintaro',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const baseLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const cablesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const liveTrackLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userGpsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Stable references for user GPS marker and accuracy circle (in-place updates)
  const userGpsMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);

  // Stable callbacks refs to avoid re-triggering layer recreations on parent re-render
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  const onCoordsChangeRef = useRef(onCoordsChange);
  onCoordsChangeRef.current = onCoordsChange;

  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  const onUserDragMapRef = useRef(onUserDragMap);
  onUserDragMapRef.current = onUserDragMap;

  // 1. Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map with high zoom tolerance (up to zoom 22 without blank screen)
    const map = L.map(mapContainerRef.current, {
      center: targetCoords,
      zoom: 18,
      maxZoom: 22,
      minZoom: 3,
      zoomControl: false,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });

    // Custom Zoom Control at top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Metric Scale Control at bottom-left
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    // Dedicated layer groups
    const baseGroup = L.layerGroup().addTo(map);
    const cablesGroup = L.layerGroup().addTo(map);
    const liveTrackGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    const gpsGroup = L.layerGroup().addTo(map);

    baseLayerGroupRef.current = baseGroup;
    cablesLayerGroupRef.current = cablesGroup;
    liveTrackLayerGroupRef.current = liveTrackGroup;
    markersLayerGroupRef.current = markersGroup;
    userGpsLayerGroupRef.current = gpsGroup;

    // Throttled center update during drag & moveend
    let animFrameId: number | null = null;
    const emitCenter = () => {
      const center = map.getCenter();
      onCoordsChangeRef.current([center.lat, center.lng]);
    };

    map.on('move', () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(emitCenter);
    });

    map.on('moveend', () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      emitCenter();
    });

    map.on('dragstart', () => {
      if (onUserDragMapRef.current) {
        onUserDragMapRef.current();
      }
    });

    map.on('zoomend', () => {
      onZoomChangeRef.current(map.getZoom());
    });

    // Tap on map to instantly snap target crosshair and coordinates to that object without drifting
    map.on('click', (e: L.LeafletMouseEvent) => {
      onCoordsChangeRef.current([e.latlng.lat, e.latlng.lng]);
      map.setView(e.latlng, map.getZoom(), { animate: false });
    });

    // Invalidate size on container resize
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    mapInstanceRef.current = map;

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Tile Layers Switcher with maxNativeZoom (PREVENTS TILES DISAPPEARING ON ZOOM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const baseGroup = baseLayerGroupRef.current;
    if (!map || !baseGroup) return;

    baseGroup.clearLayers();

    if (activeLayer === 'satellite') {
      // Google Satellite Hybrid: Ultra high-resolution in Indonesia + Road overlays.
      const googleHybrid = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        {
          attribution: '&copy; Google Satellite Imagery & Roads',
          maxZoom: 22,
          maxNativeZoom: 20,
        }
      );
      baseGroup.addLayer(googleHybrid);
    } else if (activeLayer === 'hybrid') {
      // Esri World Imagery HD with maxNativeZoom: 18
      const esriSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
          maxZoom: 22,
          maxNativeZoom: 18,
        }
      );

      const esriLabels = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 22,
          maxNativeZoom: 18,
          opacity: 0.85,
        }
      );

      baseGroup.addLayer(esriSatellite);
      baseGroup.addLayer(esriLabels);
    } else {
      // Street Map: OpenStreetMap with maxNativeZoom: 19
      const osmStreet = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 22,
          maxNativeZoom: 19,
        }
      );
      baseGroup.addLayer(osmStreet);
    }
  }, [activeLayer]);

  // 3. Programmatic Pan / Fly To (handles Nudge, GPS Center, or Selection)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !panToRequest) return;

    const currentZoom = map.getZoom();

    if (panToRequest.zoom !== undefined && panToRequest.zoom !== currentZoom) {
      map.flyTo(panToRequest.coords, panToRequest.zoom, {
        duration: 0.5,
        easeLinearity: 0.25,
      });
    } else {
      map.panTo(panToRequest.coords, {
        animate: true,
        duration: 0.35,
      });
    }
  }, [panToRequest]);

  // 4. Render Infrastructure Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Filter by cluster folder
    const clusterFiltered = items.filter((item) => {
      if (clusterFilterMode === 'all') return true;
      return (
        item.clusterId === activeClusterId ||
        (!item.clusterId && activeClusterId === 'cls-bintaro')
      );
    });

    // 2. Filter by category (all, tiang, fat)
    const visibleItems = clusterFiltered.filter((item) => {
      if (categoryFilter === 'all') return true;
      return item.category === categoryFilter;
    });

    visibleItems.forEach((item) => {
      const icon = item.category === 'tiang' ? createTiangIcon(item) : createFatIcon(item);

      const marker = L.marker([item.lat, item.lng], {
        icon,
        title: `${item.id} - ${item.subType} (${item.clusterName || 'Cluster'})`,
        riseOnHover: true,
      });

      marker.on('click', () => {
        onMarkerClickRef.current(item);
      });

      markersGroup.addLayer(marker);
    });
  }, [items, categoryFilter, clusterFilterMode, activeClusterId]);

  // 5. Render Fiber Cables Route Lines
  useEffect(() => {
    const cablesGroup = cablesLayerGroupRef.current;
    if (!cablesGroup) return;

    cablesGroup.clearLayers();

    if (!showCableLines || items.length === 0) return;

    // Filter cables strictly within the current cluster to prevent wild inter-cluster lines
    const clusterFiltered = items.filter((item) => {
      if (clusterFilterMode === 'all') return true;
      return (
        item.clusterId === activeClusterId ||
        (!item.clusterId && activeClusterId === 'cls-bintaro')
      );
    });

    // Sequential line connecting all Tiangs in this cluster
    const tiangs = clusterFiltered.filter((i) => i.category === 'tiang');
    if (tiangs.length > 1) {
      const latlngs = tiangs.map((t) => [t.lat, t.lng] as [number, number]);
      const mainCable = L.polyline(latlngs, {
        color: '#06b6d4', // cyan-500
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 6',
      });
      cablesGroup.addLayer(mainCable);
    }

    // Drop connection lines from FAT to upstream Tiang
    const fats = clusterFiltered.filter((i) => i.category === 'fat' && i.connectedToId);
    fats.forEach((fat) => {
      const parent = clusterFiltered.find((it) => it.id === fat.connectedToId);
      if (parent) {
        const dropLine = L.polyline(
          [
            [fat.lat, fat.lng],
            [parent.lat, parent.lng],
          ],
          {
            color: '#3b82f6', // blue-500
            weight: 2.5,
            opacity: 0.9,
          }
        );
        cablesGroup.addLayer(dropLine);
      }
    });
  }, [items, showCableLines, clusterFilterMode, activeClusterId]);

  // 6. Render Live Tracking Survey Trail (Breadcrumbs Polyline)
  useEffect(() => {
    const trackGroup = liveTrackLayerGroupRef.current;
    if (!trackGroup) return;

    trackGroup.clearLayers();

    if (liveTrackPoints.length > 1) {
      const latlngs = liveTrackPoints.map((p) => [p.lat, p.lng] as [number, number]);

      // Glowing outline
      const outerGlow = L.polyline(latlngs, {
        color: '#059669',
        weight: 6,
        opacity: 0.4,
      });

      // Core line (emerald green)
      const coreTrack = L.polyline(latlngs, {
        color: '#10b981',
        weight: 3.5,
        opacity: 0.95,
      });

      trackGroup.addLayer(outerGlow);
      trackGroup.addLayer(coreTrack);
    }
  }, [liveTrackPoints]);

  // 7. User Live GPS Location with in-place updates (Heading & Live status)
  useEffect(() => {
    const gpsGroup = userGpsLayerGroupRef.current;
    if (!gpsGroup) return;

    if (gpsState.coords) {
      const { lat, lng } = gpsState.coords;
      const acc = gpsState.accuracy || 5;

      // Update or create accuracy circle
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setLatLng([lat, lng]);
        userAccuracyCircleRef.current.setRadius(acc);
      } else {
        const circle = L.circle([lat, lng], {
          radius: acc,
          color: isLiveTrackingActive ? '#10b981' : '#38bdf8',
          weight: 2,
          opacity: 0.7,
          fillColor: isLiveTrackingActive ? '#059669' : '#0284c7',
          fillOpacity: 0.15,
        });
        userAccuracyCircleRef.current = circle;
        gpsGroup.addLayer(circle);
      }

      // Update or create user marker with heading
      if (userGpsMarkerRef.current) {
        userGpsMarkerRef.current.setLatLng([lat, lng]);
        userGpsMarkerRef.current.setIcon(
          createUserGpsIcon(acc, gpsState.heading, isLiveTrackingActive)
        );
      } else {
        const marker = L.marker([lat, lng], {
          icon: createUserGpsIcon(acc, gpsState.heading, isLiveTrackingActive),
          zIndexOffset: 10000, // Always above all other markers
        });
        userGpsMarkerRef.current = marker;
        gpsGroup.addLayer(marker);
      }
    } else {
      // Clear if no coords
      if (userGpsMarkerRef.current) {
        gpsGroup.removeLayer(userGpsMarkerRef.current);
        userGpsMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        gpsGroup.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }
    }
  }, [gpsState.coords, gpsState.accuracy, gpsState.heading, isLiveTrackingActive]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};
