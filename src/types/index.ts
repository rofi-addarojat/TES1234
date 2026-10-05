export type InfrastructureCategory = 'tiang' | 'fat';

export type TiangType =
  | 'Ext.mti'
  | 'Ext Telkom'
  | 'Ext emr'
  | 'Ext tiang listrik'
  | 'Tiang 7.2'
  | 'Tiang 7.3'
  | 'Tiang 7.4'
  | 'Tiang 9.4'
  | 'Lainnya';

export type PhysicalCondition = 'Bagus' | 'Perlu Perbaikan' | 'Kritis' | 'Baru Pasang';

export interface ClusterFolder {
  id: string;
  name: string;
  code?: string;
  color?: string; // Hex color for cluster visual distinction
  createdAt: string;
  notes?: string;
}

export interface InfrastructureItem {
  id: string; // e.g. "TG-1001", "FAT-2001"
  category: InfrastructureCategory;
  subType: string; // Tiang type or FAT code (e.g. "Tiang 7.2" or "FAT A01")
  fatCode?: string; // e.g. "A01", "B02"
  fatCapacity?: number; // 8, 16, 24
  lat: number;
  lng: number;
  accuracy?: number; // GPS accuracy radius in meters at tagging time
  technicianName: string;
  timestamp: string; // ISO string
  photoUrl?: string; // base64 data URI
  condition?: PhysicalCondition;
  notes?: string;
  connectedToId?: string; // upstream pole ID
  clusterId?: string; // Cluster / Folder ID
  clusterName?: string; // Display Cluster name
}

export type TileLayerType = 'satellite' | 'streets' | 'hybrid';

export type ThemeMode = 'dark' | 'light' | 'outdoor';

export interface GpsState {
  coords: { lat: number; lng: number } | null;
  accuracy: number | null; // meters
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  isTracking: boolean;
  status: 'idle' | 'locating' | 'locked' | 'denied' | 'error';
  errorMessage?: string;
  lastUpdated?: number;
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
}

export interface TrackPoint {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
}

export interface LiveTrackingState {
  isActive: boolean;
  isFollowCam: boolean;
  points: TrackPoint[];
  totalDistanceMeters: number;
  currentSpeedKmh: number;
  startTime: number | null;
  minAccuracyFilter: number; // meters (e.g. 15m)
}
