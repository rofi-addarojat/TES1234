import { InfrastructureItem, TrackPoint } from '../types';

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export to KML (Keyhole Markup Language for Google Earth, AutoCAD, QGIS)
 */
export function exportToKML(items: InfrastructureItem[], projectName = 'FTTH_Survey_Export') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${projectName}_${timestamp}.kml`;

  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${projectName}</name>
    <description>FTTH Infrastructure Map Tagging Export - ${new Date().toLocaleString('id-ID')}</description>
    
    <!-- Tiang Style (Orange/Amber) -->
    <Style id="tiangStyle">
      <IconStyle>
        <color>ff1673f9</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0.9</scale>
        <color>ffffffff</color>
      </LabelStyle>
      <BalloonStyle>
        <text><![CDATA[
          <h3>$[name]</h3>
          <p><b>Kategori:</b> Tiang FTTH</p>
          <p><b>Tipe:</b> $[tiang_type]</p>
          <p><b>Teknisi:</b> $[technician]</p>
          <p><b>Waktu:</b> $[survey_time]</p>
          <p><b>Kondisi:</b> $[condition]</p>
          <p><b>Catatan:</b> $[notes]</p>
          $[photo_html]
        ]]></text>
      </BalloonStyle>
    </Style>

    <!-- FAT Style (Vivid Blue) -->
    <Style id="fatStyle">
      <IconStyle>
        <color>ffe66325</color>
        <scale>1.3</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/square.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0.9</scale>
        <color>ffffffff</color>
      </LabelStyle>
      <BalloonStyle>
        <text><![CDATA[
          <h3>$[name]</h3>
          <p><b>Kategori:</b> FAT (Fiber Access Terminal)</p>
          <p><b>Kode FAT:</b> $[fat_code]</p>
          <p><b>Kapasitas:</b> $[fat_capacity] Port</p>
          <p><b>Teknisi:</b> $[technician]</p>
          <p><b>Waktu:</b> $[survey_time]</p>
          <p><b>Kondisi:</b> $[condition]</p>
          <p><b>Catatan:</b> $[notes]</p>
          $[photo_html]
        ]]></text>
      </BalloonStyle>
    </Style>

    <Folder>
      <name>Titik Tiang FTTH</name>
      ${items
        .filter((it) => it.category === 'tiang')
        .map((it) => {
          const photoHtml = it.photoUrl
            ? `&lt;br/&gt;&lt;img src="${it.photoUrl}" width="280" style="border-radius:6px;"/&gt;`
            : '';
          return `
      <Placemark>
        <name>${escapeXml(it.id)} - ${escapeXml(it.subType)}</name>
        <description><![CDATA[
          <b>Tipe:</b> ${escapeXml(it.subType)}<br/>
          <b>Teknisi:</b> ${escapeXml(it.technicianName)}<br/>
          <b>Kondisi:</b> ${escapeXml(it.condition || '-')}<br/>
          <b>Catatan:</b> ${escapeXml(it.notes || '-')}<br/>
          <b>Waktu:</b> ${new Date(it.timestamp).toLocaleString('id-ID')}
          ${it.photoUrl ? `<br/><img src="${it.photoUrl}" width="280"/>` : ''}
        ]]></description>
        <styleUrl>#tiangStyle</styleUrl>
        <ExtendedData>
          <Data name="tiang_type"><value>${escapeXml(it.subType)}</value></Data>
          <Data name="technician"><value>${escapeXml(it.technicianName)}</value></Data>
          <Data name="survey_time"><value>${new Date(it.timestamp).toLocaleString('id-ID')}</value></Data>
          <Data name="condition"><value>${escapeXml(it.condition || '-')}</value></Data>
          <Data name="notes"><value>${escapeXml(it.notes || '-')}</value></Data>
          <Data name="photo_html"><value>${photoHtml}</value></Data>
        </ExtendedData>
        <Point>
          <coordinates>${it.lng.toFixed(6)},${it.lat.toFixed(6)},0</coordinates>
        </Point>
      </Placemark>`;
        })
        .join('\n')}
    </Folder>

    <Folder>
      <name>Titik FAT (Fiber Access Terminal)</name>
      ${items
        .filter((it) => it.category === 'fat')
        .map((it) => {
          const photoHtml = it.photoUrl
            ? `&lt;br/&gt;&lt;img src="${it.photoUrl}" width="280" style="border-radius:6px;"/&gt;`
            : '';
          return `
      <Placemark>
        <name>${escapeXml(it.id)} [${escapeXml(it.fatCode || it.subType)}]</name>
        <description><![CDATA[
          <b>Kode FAT:</b> ${escapeXml(it.subType)}<br/>
          <b>Kapasitas:</b> ${it.fatCapacity || 16} Port<br/>
          <b>Teknisi:</b> ${escapeXml(it.technicianName)}<br/>
          <b>Kondisi:</b> ${escapeXml(it.condition || '-')}<br/>
          <b>Catatan:</b> ${escapeXml(it.notes || '-')}<br/>
          <b>Waktu:</b> ${new Date(it.timestamp).toLocaleString('id-ID')}
          ${it.photoUrl ? `<br/><img src="${it.photoUrl}" width="280"/>` : ''}
        ]]></description>
        <styleUrl>#fatStyle</styleUrl>
        <ExtendedData>
          <Data name="fat_code"><value>${escapeXml(it.fatCode || it.subType)}</value></Data>
          <Data name="fat_capacity"><value>${it.fatCapacity || 16}</value></Data>
          <Data name="technician"><value>${escapeXml(it.technicianName)}</value></Data>
          <Data name="survey_time"><value>${new Date(it.timestamp).toLocaleString('id-ID')}</value></Data>
          <Data name="condition"><value>${escapeXml(it.condition || '-')}</value></Data>
          <Data name="notes"><value>${escapeXml(it.notes || '-')}</value></Data>
          <Data name="photo_html"><value>${photoHtml}</value></Data>
        </ExtendedData>
        <Point>
          <coordinates>${it.lng.toFixed(6)},${it.lat.toFixed(6)},0</coordinates>
        </Point>
      </Placemark>`;
        })
        .join('\n')}
    </Folder>

    <!-- Line route connection between sequential points -->
    ${
      items.length > 1
        ? `
    <Folder>
      <name>Jalur Rute Fiber (Trace Line)</name>
      <Placemark>
        <name>Trace Rute Fiber</name>
        <Style>
          <LineStyle>
            <color>ff00aaff</color>
            <width>3</width>
          </LineStyle>
        </Style>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>
            ${items.map((i) => `${i.lng.toFixed(6)},${i.lat.toFixed(6)},0`).join(' ')}
          </coordinates>
        </LineString>
      </Placemark>
    </Folder>`
        : ''
    }
  </Document>
</kml>`;

  downloadFile(kmlContent, filename, 'application/vnd.google-earth.kml+xml');
}

/**
 * Export to CSV (with UTF-8 BOM so Excel opens properly)
 */
export function exportToCSV(items: InfrastructureItem[], projectName = 'FTTH_Data_Export') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${projectName}_${timestamp}.csv`;

  const headers = [
    'ID',
    'Kategori',
    'Tipe / Kode',
    'Kode FAT',
    'Kapasitas FAT (Port)',
    'Latitude',
    'Longitude',
    'Akurasi GPS (meter)',
    'Nama Teknisi',
    'Waktu Tagging',
    'Kondisi Fisik',
    'Catatan / Keterangan',
    'Terhubung ke Tiang ID',
    'Ada Foto',
  ];

  const rows = items.map((it) => [
    csvEscape(it.id),
    csvEscape(it.category.toUpperCase()),
    csvEscape(it.subType),
    csvEscape(it.fatCode || '-'),
    it.fatCapacity ? it.fatCapacity.toString() : '-',
    it.lat.toFixed(6),
    it.lng.toFixed(6),
    it.accuracy ? it.accuracy.toFixed(1) : '-',
    csvEscape(it.technicianName),
    csvEscape(new Date(it.timestamp).toLocaleString('id-ID')),
    csvEscape(it.condition || '-'),
    csvEscape(it.notes || '-'),
    csvEscape(it.connectedToId || '-'),
    it.photoUrl ? 'YA' : 'TIDAK',
  ]);

  // UTF-8 BOM (\uFEFF) ensures Excel renders Indonesian characters correctly
  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export to GeoJSON (FeatureCollection)
 */
export function exportToGeoJSON(items: InfrastructureItem[], projectName = 'FTTH_GeoJSON_Export') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${projectName}_${timestamp}.geojson`;

  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      title: projectName,
      generated: new Date().toISOString(),
      count: items.length,
      crs: 'EPSG:4326',
    },
    features: items.map((it) => ({
      type: 'Feature',
      id: it.id,
      geometry: {
        type: 'Point',
        coordinates: [Number(it.lng.toFixed(6)), Number(it.lat.toFixed(6))],
      },
      properties: {
        id: it.id,
        category: it.category,
        subType: it.subType,
        fatCode: it.fatCode || null,
        fatCapacity: it.fatCapacity || null,
        accuracyMeters: it.accuracy || null,
        technician: it.technicianName,
        timestamp: it.timestamp,
        condition: it.condition || null,
        notes: it.notes || null,
        connectedToId: it.connectedToId || null,
        hasPhoto: Boolean(it.photoUrl),
        photoUrl: it.photoUrl || null,
      },
    })),
  };

  downloadFile(
    JSON.stringify(geojson, null, 2),
    filename,
    'application/geo+json;charset=utf-8;'
  );
}

/**
 * Parse GeoJSON or JSON and extract InfrastructureItem[]
 */
export function parseImportedData(rawText: string): InfrastructureItem[] {
  const parsed = JSON.parse(rawText);
  const items: InfrastructureItem[] = [];

  if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
    for (const feat of parsed.features) {
      if (feat.geometry && feat.geometry.type === 'Point' && Array.isArray(feat.geometry.coordinates)) {
        const [lng, lat] = feat.geometry.coordinates;
        const p = feat.properties || {};
        const category = p.category === 'fat' ? 'fat' : 'tiang';
        items.push({
          id: p.id || feat.id || `${category === 'fat' ? 'FAT' : 'TG'}-${Date.now().toString().slice(-4)}`,
          category,
          subType: p.subType || (category === 'fat' ? 'FAT A01' : 'Tiang 7.2'),
          fatCode: p.fatCode || (category === 'fat' ? 'A01' : undefined),
          fatCapacity: p.fatCapacity || undefined,
          lat: Number(lat),
          lng: Number(lng),
          accuracy: p.accuracyMeters || p.accuracy || 3.0,
          technicianName: p.technician || 'Teknisi Import',
          timestamp: p.timestamp || new Date().toISOString(),
          condition: p.condition || 'Bagus',
          notes: p.notes || '',
          connectedToId: p.connectedToId || undefined,
          photoUrl: p.photoUrl || undefined,
        });
      }
    }
  } else if (Array.isArray(parsed)) {
    for (const p of parsed) {
      if (typeof p.lat === 'number' && typeof p.lng === 'number') {
        items.push(p as InfrastructureItem);
      }
    }
  }

  return items;
}

// Helpers
function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function csvEscape(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Export Recorded Live Track Line to KML
 */
export function exportTrackToKML(points: TrackPoint[], name = 'FTTH_Live_Track_Path') {
  if (points.length === 0) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}_${timestamp}.kml`;

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(name)}</name>
    <description>FTTH Live GPS Walk/Drive Survey Track - ${new Date().toLocaleString('id-ID')}</description>
    <Style id="trackStyle">
      <LineStyle>
        <color>ff10b981</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>Jalur Survei FTTH Live</name>
      <styleUrl>#trackStyle</styleUrl>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>clampToGround</altitudeMode>
        <coordinates>
          ${points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)},${p.altitude || 0}`).join('\n          ')}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

  downloadFile(kml, filename, 'application/vnd.google-earth.kml+xml');
}

/**
 * Export Recorded Live Track Line to GeoJSON LineString
 */
export function exportTrackToGeoJSON(points: TrackPoint[], name = 'FTTH_Live_Track_Path') {
  if (points.length === 0) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}_${timestamp}.geojson`;

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name,
          recordedAt: new Date().toISOString(),
          pointCount: points.length,
        },
        geometry: {
          type: 'LineString',
          coordinates: points.map((p) => [Number(p.lng.toFixed(6)), Number(p.lat.toFixed(6))]),
        },
      },
    ],
  };

  downloadFile(JSON.stringify(geojson, null, 2), filename, 'application/geo+json;charset=utf-8;');
}

