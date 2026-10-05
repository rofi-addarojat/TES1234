import L from 'leaflet';
import { InfrastructureItem, TiangType } from '../types';

export function getTiangColor(subType: string): { bg: string; border: string; text: string; label: string } {
  switch (subType as TiangType) {
    case 'Ext Telkom':
      return { bg: '#ea580c', border: '#ffedd5', text: '#ffffff', label: 'TLK' };
    case 'Ext tiang listrik':
      return { bg: '#ca8a04', border: '#fef08a', text: '#ffffff', label: 'PLN' };
    case 'Ext.mti':
      return { bg: '#4f46e5', border: '#e0e7ff', text: '#ffffff', label: 'MTI' };
    case 'Ext emr':
      return { bg: '#9333ea', border: '#f3e8ff', text: '#ffffff', label: 'EMR' };
    case 'Tiang 7.2':
      return { bg: '#0d9488', border: '#ccfbf1', text: '#ffffff', label: '7.2' };
    case 'Tiang 7.3':
      return { bg: '#059669', border: '#d1fae5', text: '#ffffff', label: '7.3' };
    case 'Tiang 7.4':
      return { bg: '#0891b2', border: '#cffafe', text: '#ffffff', label: '7.4' };
    case 'Tiang 9.4':
      return { bg: '#0284c7', border: '#e0f2fe', text: '#ffffff', label: '9.4' };
    default:
      return { bg: '#475569', border: '#f1f5f9', text: '#ffffff', label: 'TG' };
  }
}

/**
 * Creates custom Leaflet DivIcon for Tiang
 * Anchor is exactly at bottom center [17, 42] without double translation!
 */
export function createTiangIcon(item: InfrastructureItem): L.DivIcon {
  const { bg, border, text, label } = getTiangColor(item.subType);

  const html = `
    <div class="custom-tiang-pin group" style="width: 34px; height: 42px; position: relative;">
      <div style="
        background: ${bg};
        border: 2.5px solid ${border};
        box-shadow: 0 4px 10px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.3);
        border-radius: 9999px 9999px 9999px 4px;
        transform: rotate(-45deg);
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 0;
        left: 1px;
      ">
        <span style="
          transform: rotate(45deg);
          color: ${text};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: -0.5px;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1;
        ">${label}</span>
      </div>
      <div style="
        position: absolute;
        bottom: 0px;
        left: 15px;
        width: 4px;
        height: 4px;
        background: #ffffff;
        border-radius: 9999px;
        box-shadow: 0 0 4px rgba(0,0,0,0.9);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'leaflet-div-tiang',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42],
  });
}

/**
 * Creates custom Leaflet DivIcon for FAT (Square Box with code)
 * Anchor is exactly at bottom center [19, 46] without double translation!
 */
export function createFatIcon(item: InfrastructureItem): L.DivIcon {
  const shortCode = item.fatCode || item.subType.replace(/^FAT\s*/i, '') || 'FAT';

  const html = `
    <div class="custom-fat-pin" style="width: 38px; height: 46px; position: relative;">
      <div style="
        background: #2563eb;
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 12px rgba(37,99,235,0.5), 0 2px 6px rgba(0,0,0,0.6);
        border-radius: 6px;
        width: 38px;
        height: 30px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 0;
        left: 0;
      ">
        <div style="
          background: #1d4ed8;
          width: 100%;
          text-align: center;
          font-size: 7px;
          font-weight: 900;
          color: #bfdbfe;
          letter-spacing: 0.5px;
          padding: 1px 0;
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
        ">FAT</div>
        <span style="
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1.1;
          letter-spacing: -0.5px;
        ">${shortCode}</span>
      </div>
      <!-- Pointer stem -->
      <div style="
        position: absolute;
        bottom: 6px;
        left: 15px;
        width: 8px;
        height: 8px;
        background: #2563eb;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        transform: rotate(45deg);
      "></div>
      <!-- Anchor dot -->
      <div style="
        position: absolute;
        bottom: 0px;
        left: 17px;
        width: 4px;
        height: 4px;
        background: #ffffff;
        border-radius: 9999px;
        box-shadow: 0 0 3px rgba(0,0,0,0.9);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'leaflet-div-fat',
    iconSize: [38, 46],
    iconAnchor: [19, 46],
    popupAnchor: [0, -46],
  });
}

/**
 * Creates custom Leaflet DivIcon for Current Target (Draggable Precision Pin)
 * Anchor is exactly at bottom center [22, 54] without double translation!
 */
export function createTargetPinIcon(): L.DivIcon {
  const html = `
    <div style="position: relative; width: 44px; height: 54px; pointer-events: auto;">
      <!-- Glowing base aura -->
      <div class="gps-pulse-circle" style="
        position: absolute;
        bottom: -6px;
        left: 8px;
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        background: rgba(234, 179, 8, 0.4);
        pointer-events: none;
      "></div>
      
      <!-- Precision Crosshair Marker -->
      <div style="
        position: absolute;
        top: 0;
        left: 2px;
        width: 40px;
        height: 40px;
        background: #eab308;
        border: 3px solid #000000;
        border-radius: 9999px 9999px 9999px 4px;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 16px rgba(0,0,0,0.7);
      ">
        <svg style="transform: rotate(45deg); width: 22px; height: 22px; color: #000000;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <line x1="12" y1="3" x2="12" y2="7"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
          <line x1="3" y1="12" x2="7" y2="12"/>
          <line x1="17" y1="12" x2="21" y2="12"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
      </div>

      <!-- Point anchor -->
      <div style="
        position: absolute;
        bottom: 0px;
        left: 20px;
        width: 4px;
        height: 4px;
        background: #000000;
        border: 1px solid #ffffff;
        border-radius: 9999px;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'leaflet-div-target-pin',
    iconSize: [44, 54],
    iconAnchor: [22, 54],
  });
}

/**
 * Creates custom Leaflet DivIcon for User Live GPS location with heading compass and tracking halo
 * Anchor is exactly at center [18, 18] without double translation!
 */
export function createUserGpsIcon(
  accuracyMeters?: number,
  heading?: number | null,
  isLiveTracking = false
): L.DivIcon {
  const headingStyle =
    heading !== null && heading !== undefined
      ? `transform: rotate(${heading}deg);`
      : 'display: none;';

  const ringColor = isLiveTracking ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.35)';
  const coreBg = isLiveTracking ? '#059669' : '#0284c7';

  const html = `
    <div style="position: relative; width: 36px; height: 36px; pointer-events: none;">
      <!-- Heading Direction Cone (when moving) -->
      <div style="
        position: absolute;
        top: -10px;
        left: 4px;
        width: 28px;
        height: 28px;
        transform-origin: center 28px;
        ${headingStyle}
        pointer-events: none;
      ">
        <svg viewBox="0 0 24 24" fill="none" style="width: 100%; height: 100%;">
          <polygon points="12,2 4,20 12,15 20,20" fill="${isLiveTracking ? '#10b981' : '#38bdf8'}" opacity="0.9" />
        </svg>
      </div>

      <!-- Pulsing Aura -->
      <div class="gps-pulse-circle" style="
        position: absolute;
        top: 2px;
        left: 2px;
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        background: ${ringColor};
      "></div>

      <!-- Core Dot -->
      <div style="
        position: absolute;
        top: 6px;
        left: 6px;
        width: 24px;
        height: 24px;
        background: ${coreBg};
        border: 3px solid #ffffff;
        border-radius: 9999px;
        box-shadow: 0 0 12px ${isLiveTracking ? 'rgba(16, 185, 129, 0.9)' : 'rgba(2, 132, 199, 0.9)'}, 0 2px 5px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 7px; height: 7px; background: #ffffff; border-radius: 9999px;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'leaflet-div-user-gps',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}
