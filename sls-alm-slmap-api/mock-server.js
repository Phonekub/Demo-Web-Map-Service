/**
 * Standalone Mock API Server for Demo Mode
 * Run with: node mock-server.js
 * No database required - serves hardcoded demo data
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: function (origin, cb) { cb(null, true); },
  credentials: true,
}));

// ====================== MOCK DATA ======================

const REGIONS = ['ภาคกลาง', 'ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคใต้'];
const DEPARTMENTS = ['ฝ่ายปฏิบัติการ', 'ฝ่ายการตลาด', 'ฝ่ายบริหาร', 'ฝ่ายพัฒนาธุรกิจ'];
const SEVEN_STORES = Array.from({ length: 100 }, (_, i) => {
  const id = i + 1;
  const uid = `POI-${String(id).padStart(3, '0')}`;
  const branchName = `Branch ${id}`;
  const branchCode = String(id).padStart(5, '0');
  const storeCode = branchCode;
  const name = `ร้านค้า ${branchName}`;
  const namt = name;
  const location = `Location ${id}`;
  const layerId = 1;
  const layerName = 'ร้านค้า';
  // สุ่มพิกัดในกรุงเทพฯ/ปริมณฑล (lat: 13.6–13.9, lng: 100.4–100.75)
  const latitude = +(13.6 + Math.random() * 0.3).toFixed(6);
  const longitude = +(100.4 + Math.random() * 0.35).toFixed(6);
  const geom = { type: 'Point', coordinates: [longitude, latitude] };
  const area = { id, coordinates: [], shape: 'Polygon' };
  const layer = { id: 1, symbol: 'seven' };
  const status = 'active';
  const grade = ['A', 'B', 'C'][i % 3];
  const saleAverage = 50000 + (i * 1000) % 70000;
  const sevenType = (i % 2) + 1;
  const sevenTypeName = sevenType === 1 ? 'Corporate' : 'Franchise';
  const zoneName = `Zone ${String.fromCharCode(65 + (i % 5))}`;
  const subZoneName = `Sub ${String.fromCharCode(65 + (i % 5))}${(i % 3) + 1}`;
  const provinceName = 'กรุงเทพมหานคร';
  const districtName = `เขต${id}`;
  const subDistrictName = `แขวง${id}`;
  // เพิ่ม field region (ภาค) และ department (ฝ่าย)
  const region = REGIONS[i % REGIONS.length];
  const department = DEPARTMENTS[i % DEPARTMENTS.length];
  return {
    id, uid, name, namt, branchName, branchCode, storeCode, location, layerId, layerName,
    geom, area, layer, status, grade, saleAverage, sevenType, sevenTypeName,
    zoneName, subZoneName, provinceName, districtName, subDistrictName, latitude, longitude,
    region, department
  };
});

const COMPETITOR_TYPES = [
  { type: 1, name: 'FamilyMart' },
  { type: 2, name: 'Lawson' },
  { type: 3, name: 'Mini Big C' },
  { type: 4, name: 'Lotus Express' },
];
const COMPETITOR_STORES = Array.from({ length: 40 }, (_, i) => {
  const id = 101 + i;
  const compType = COMPETITOR_TYPES[i % COMPETITOR_TYPES.length];
  const branchName = `${compType.name} Branch ${i + 1}`;
  const branchCode = `${compType.name.replace(/\s/g, '').toUpperCase().slice(0,2)}${String(i + 1).padStart(3, '0')}`;
  const storeCode = branchCode;
  const name = `${compType.name} ${branchName}`;
  const namt = name;
  const location = `Location ${i + 1}`;
  const layerId = 2;
  const layerName = 'Competitor';
  // สุ่มพิกัดในกรุงเทพฯ/ปริมณฑล (lat: 13.6–13.9, lng: 100.4–100.75)
  const latitude = +(13.6 + Math.random() * 0.3).toFixed(6);
  const longitude = +(100.4 + Math.random() * 0.35).toFixed(6);
  const geom = { type: 'Point', coordinates: [longitude, latitude] };
  const area = { id: 0, coordinates: [], shape: 'Polygon' };
  const layer = { id: 2, symbol: 'competitor' };
  const status = 'active';
  return {
    id, uid: `COMP-${String(i + 1).padStart(3, '0')}`,
    name, namt, branchName, branchCode, storeCode, location, layerId, layerName,
    geom, area, layer, status,
    competitorType: compType.type, competitorTypeName: compType.name,
    latitude, longitude,
  };
});

const MOCK_USER = {
  id: 1, employeeId: 'DEMO001', fullName: 'Demo User',
  departmentId: 'IT', levelId: 'ADMIN', roleId: 1, roleName: 'Administrator',
  zoneCodes: { ALM: ['ZA', 'ZB', 'ZC'] },
  permissions: ['VIEW_MAP', 'EDIT_POI', 'VIEW_TRADEAREA', 'EDIT_TRADEAREA', 'MAP'],
  storeCode: null,
};

const LAYERS = [
  { text: 'ร้านค้า', value: '1', spatialType: 'sevenEleven' },
  { text: 'คู่แข่ง (Competitor)', value: '2', spatialType: 'competitor' },
  { text: 'Trade Area', value: '3', spatialType: 'tradearea' },
];

const COMMON_CODES = {
  SEVEN_TYPE: [
    { text: 'Corporate', value: '1' },
    { text: 'Franchise', value: '2' },
  ],
  ALLMAP_NATION: [
    { text: 'Thailand', value: 'TH' },
  ],
  GRADE: [
    { text: 'A', value: 'A' },
    { text: 'B', value: 'B' },
    { text: 'C', value: 'C' },
  ],
  COMPETITOR_TYPE: [
    { text: 'FamilyMart', value: '1' },
    { text: 'Lawson', value: '2' },
    { text: 'Mini Big C', value: '3' },
    { text: 'Lotus Express', value: '4' },
  ],
  STATUS: [
    { text: 'Active', value: 'active' },
    { text: 'Inactive', value: 'inactive' },
  ],
  TRADEAREA_STATUS: [
    { text: 'Active', value: 'active' },
    { text: 'Pending', value: 'pending' },
    { text: 'Approved', value: 'approved' },
  ],
  TRADEAREA_APPROVAL_TYPE: [
    { text: 'Auto', value: 'auto' },
    { text: 'Manual', value: 'manual' },
  ],
  TRADEAREA_TYPE: [
    { text: 'Delivery Area', value: '1' },
    { text: 'Commercial Area', value: '2' },
    { text: 'Residential Area', value: '3' },
  ],
};

const PROVINCES = [
  { text: 'กรุงเทพมหานคร', value: '10' },
  { text: 'นนทบุรี', value: '12' },
  { text: 'ปทุมธานี', value: '13' },
  { text: 'สมุทรปราการ', value: '11' },
];

const DISTRICTS = {
  '10': [
    { text: 'พระนคร', value: '1001' },
    { text: 'ปทุมวัน', value: '1003' },
    { text: 'บางรัก', value: '1002' },
    { text: 'จตุจักร', value: '1009' },
    { text: 'วัฒนา', value: '1039' },
  ],
  '12': [{ text: 'เมืองนนทบุรี', value: '1201' }, { text: 'บางบัวทอง', value: '1204' }],
  '13': [{ text: 'เมืองปทุมธานี', value: '1301' }, { text: 'ลำลูกกา', value: '1305' }],
  '11': [{ text: 'เมืองสมุทรปราการ', value: '1101' }, { text: 'บางพลี', value: '1109' }],
};

const SUBDISTRICTS = {
  '1003': [
    { text: 'ปทุมวัน', value: '100301' },
    { text: 'วังใหม่', value: '100302' },
    { text: 'ลุมพินี', value: '100303' },
  ],
  '1002': [{ text: 'สีลม', value: '100201' }, { text: 'สุริยวงศ์', value: '100203' }],
  '1001': [{ text: 'พระบรมมหาราชวัง', value: '100101' }],
  '1009': [{ text: 'จตุจักร', value: '100901' }, { text: 'จันทรเกษม', value: '100905' }],
  '1039': [{ text: 'คลองเตยเหนือ', value: '103901' }, { text: 'คลองตันเหนือ', value: '103902' }],
};

const ZONES = [
  { zoneName: 'Zone A - กรุงเทพ เหนือ', zoneCode: 'ZA', orgId: 'ALM', text: 'Zone A - กรุงเทพ เหนือ', value: 'ZA' },
  { zoneName: 'Zone B - กรุงเทพ ใต้', zoneCode: 'ZB', orgId: 'ALM', text: 'Zone B - กรุงเทพ ใต้', value: 'ZB' },
  { zoneName: 'Zone C - ปริมณฑล', zoneCode: 'ZC', orgId: 'ALM', text: 'Zone C - ปริมณฑล', value: 'ZC' },
];

const ALL_POIS = [...SEVEN_STORES, ...COMPETITOR_STORES];

// ====================== TRADE AREA DATA ======================

// Helper to generate polygon around a point (creates approximate hexagon)
function generatePolygonAroundPoint(lng, lat, radiusKm = 0.6) {
  const R = 6371; // Earth's radius in km
  const d = radiusKm / R;
  const coords = [];
  for (let i = 0; i <= 6; i++) {
    const angle = (i % 6) * (Math.PI / 3);
    const newLat = lat + (d * Math.cos(angle)) * (180 / Math.PI);
    const newLng = lng + (d * Math.sin(angle)) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
    coords.push([parseFloat(newLng.toFixed(6)), parseFloat(newLat.toFixed(6))]);
  }
  return [coords]; // GeoJSON Polygon format: array of rings
}

const TRADE_AREAS = Array.from({ length: 10 }, (_, i) => {
  const store = SEVEN_STORES[i];
  const id = 1001 + i;
  return {
    id,
    poiId: store.id,
    refStoreCode: store.storeCode,
    storeCode: store.storeCode,
    storeName: store.name,
    zoneCode: store.zoneName,
    subzoneCode: store.subZoneName,
    status: 'active',
    effectiveDate: `2025-01-${String(i+1).padStart(2, '0')}`,
    shape: { type: 'Polygon', coordinates: generatePolygonAroundPoint(store.longitude, store.latitude, 0.4 + (i % 3) * 0.1) },
    areaColor: `RGB(${(i*30)%255},${(i*60)%255},${(i*90)%255})`,
    comment: `Delivery zone - ${store.name}`,
    warning: '',
    globalId: `TA-${String(id).padStart(3, '0')}`,
    createdAt: `2025-01-${String(i+1).padStart(2, '0')}`,
    createUser: 'ADMIN',
    updatedAt: `2025-01-${String(i+1).padStart(2, '0')}`,
    updateUser: 'ADMIN',
    refPointX: store.longitude,
    refPointY: store.latitude,
    wfId: 1,
    wfTransactionId: id,
    parentId: null,
    tradeareaTypeId: 1,
    tradeareaTypeName: 'delivery_area',
  };
});

// Helper: check if two polygons intersect (using point-in-polygon + edge crossing)
function polygonsIntersect(coordsA, coordsB) {
  const ringA = coordsA[0];
  const ringB = coordsB[0];
  // 1. Check if any vertex of A is inside B
  for (const pt of ringA) {
    if (pointInRing(pt, ringB)) return true;
  }
  // 2. Check if any vertex of B is inside A
  for (const pt of ringB) {
    if (pointInRing(pt, ringA)) return true;
  }
  // 3. Check if any edges cross
  for (let i = 0; i < ringA.length - 1; i++) {
    for (let j = 0; j < ringB.length - 1; j++) {
      if (edgesIntersect(ringA[i], ringA[i+1], ringB[j], ringB[j+1])) return true;
    }
  }
  return false;
}

// Ray casting point-in-polygon
function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Check if two line segments intersect
function edgesIntersect(a1, a2, b1, b2) {
  const ccw = (A, B, C) => (C[1]-A[1])*(B[0]-A[0]) > (B[1]-A[1])*(C[0]-A[0]);
  return ccw(a1,b1,b2) !== ccw(a2,b1,b2) && ccw(a1,a2,b1) !== ccw(a1,a2,b2);
}

function getBBox(ring) {
  const lngs = ring.map(c => c[0]);
  const lats = ring.map(c => c[1]);
  return {
    minLng: Math.min(...lngs), maxLng: Math.max(...lngs),
    minLat: Math.min(...lats), maxLat: Math.max(...lats),
  };
}

// Helper: check if point is within polygon bbox (for spatial query)
function isPointInBBox(point, ring) {
  const bbox = getBBox(ring);
  return point[0] >= bbox.minLng && point[0] <= bbox.maxLng &&
         point[1] >= bbox.minLat && point[1] <= bbox.maxLat;
}

// ====================== HELPER ======================

function isPointInPolygon(point, polygon) {
  // Simple bounding-box check for demo
  const [lng, lat] = point;
  const lngs = polygon.map(p => p[0]);
  const lats = polygon.map(p => p[1]);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

/** Transform store data to POIPoint format expected by frontend BaseMap */
function toPOIPoint(store) {
  const [lng, lat] = store.geom.coordinates;
  return {
    id: String(store.id),
    refStoreCode: store.storeCode || store.branchCode || '',
    zoneCode: store.zoneName || '',
    subzoneCode: store.subZoneName || '',
    status: store.status || 'active',
    effectiveDate: null,
    shape: null,
    storeName: store.name,
    areaColor: '',
    comment: '',
    warning: '',
    globalId: store.uid,
    createdAt: '2025-01-01',
    createUser: 'DEMO',
    updatedAt: '2025-01-01',
    updateUser: 'DEMO',
    refPointX: lng,
    refPointY: lat,
    coordinates: [lng, lat],
    symbol: store.layer?.symbol || 'seven',
    name: store.name,
    branchName: store.branchName,
    branchCode: store.branchCode,
    layerId: store.layerId,
    layerName: store.layerName,
    grade: store.grade,
    saleAverage: store.saleAverage,
    sevenType: store.sevenType,
    sevenTypeName: store.sevenTypeName,
    competitorType: store.competitorType,
    competitorTypeName: store.competitorTypeName,
    provinceName: store.provinceName,
    districtName: store.districtName,
    subDistrictName: store.subDistrictName,
  };
}

// ====================== ROUTES ======================

const api = express.Router();

// --- Health Check ---
api.get('/health', (_req, res) => res.json({ status: 'ok', mode: 'mock' }));

// --- Auth ---
api.post('/auth/login', (_req, res) => {
  res.cookie('Authentication', 'mock-jwt-token', { httpOnly: true, maxAge: 86400000 });
  res.json({ redirectUrl: '/' });
});

api.post('/auth/logout', (_req, res) => {
  res.clearCookie('Authentication');
  res.json({ logoutUrl: '/' });
});

api.post('/oauth2callback', (_req, res) => {
  res.cookie('Authentication', 'mock-jwt-token', { httpOnly: true, maxAge: 86400000 });
  res.json({ success: true });
});

// --- Users ---
api.get('/users/me', (_req, res) => res.json({ data: MOCK_USER }));
api.get('/users', (_req, res) => res.json({ data: [MOCK_USER], total: 1 }));
api.get('/users/with-zones', (_req, res) => res.json({ data: [{ ...MOCK_USER, zones: ZONES }], total: 1 }));
api.get('/users/zones', (_req, res) => res.json({ data: ZONES.map(z => ({ text: z.zoneName, value: z.zoneCode })) }));
api.get('/users/sub-zones', (_req, res) => res.json({ data: [{ text: 'Sub Zone 1', value: 'SZ1' }] }));
api.get('/users/:userId', (req, res) => res.json({ data: MOCK_USER }));
api.put('/users/:userId', (req, res) => res.json({ data: MOCK_USER }));

// --- Master Data ---
api.get('/master/layers', (_req, res) => res.json({ data: LAYERS }));

api.get('/master/common-codes', (req, res) => {
  const codeType = req.query.codeType;
  res.json({ data: COMMON_CODES[codeType] || [] });
});

api.get('/master/countries', (_req, res) => {
  res.json({ data: [{ text: 'Thailand', value: 'TH' }] });
});

api.get('/master/provinces', (_req, res) => res.json({ data: PROVINCES }));

api.get('/master/districts', (req, res) => {
  const provinceCode = req.query.provinceCode;
  res.json({ data: DISTRICTS[provinceCode] || DISTRICTS['10'] });
});

api.get('/master/sub-districts', (req, res) => {
  const districtCode = req.query.districtCode;
  res.json({ data: SUBDISTRICTS[districtCode] || [] });
});

api.get('/master/zones', (_req, res) => res.json({ data: ZONES }));
api.get('/master/roles', (_req, res) => res.json({ data: [{ text: 'Administrator', value: '1' }, { text: 'Viewer', value: '2' }] }));
api.get('/master/permissions', (_req, res) => res.json({ data: [{ text: 'VIEW_MAP', value: 'VIEW_MAP' }, { text: 'EDIT_POI', value: 'EDIT_POI' }] }));
api.get('/master/import-configs', (_req, res) => res.json({ data: [] }));
api.get('/master/import-configs/:id', (_req, res) => res.json({ data: [] }));
api.get('/master/import-configs/:id/fields', (_req, res) => res.json({ data: {} }));

// --- Locations (Search & Spatial) ---
api.get('/locations', (req, res) => {
  const type = req.query.type;
  let results = ALL_POIS;

  if (type === 'sevenEleven') {
    results = SEVEN_STORES;
  } else if (type === 'competitor') {
    results = COMPETITOR_STORES;
  } else if (type === 'tradearea') {
    results = []; // No trade areas in mock
  }

  // Filter by text search if provided
  const search = req.query.search || req.query.name || req.query.branchName;
  if (search) {
    const s = String(search).toLowerCase();
    results = results.filter(p =>
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.branchName && p.branchName.toLowerCase().includes(s)) ||
      (p.branchCode && p.branchCode.toLowerCase().includes(s))
    );
  }

  res.json({ data: { search: results, poi: results }, total: results.length });
});

api.get('/locations/coordinate-info', (req, res) => {
  const lat = parseFloat(req.query.latitude);
  const lng = parseFloat(req.query.longitude);
  res.json({
    data: {
      province: 'กรุงเทพมหานคร',
      district: 'ปทุมวัน',
      subDistrict: 'ปทุมวัน',
      zone: 'Zone A',
      subzone: 'Sub A1',
      latitude: lat,
      longitude: lng,
      zoneAuthorized: true,
    },
  });
});

api.get('/locations/nearby-seven', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.long);
  const distance = parseFloat(req.query.distance) || 1;
  const nearby = SEVEN_STORES.map(s => ({
    ...s,
    distance: Math.sqrt(Math.pow((s.latitude - lat) * 111, 2) + Math.pow((s.longitude - lng) * 111 * Math.cos(lat * Math.PI / 180), 2)),
  })).filter(s => s.distance <= distance).sort((a, b) => a.distance - b.distance);
  res.json({ data: nearby });
});

api.get('/locations/nearby-competitor', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.long);
  const distance = parseFloat(req.query.distance) || 1;
  const nearby = COMPETITOR_STORES.map(s => ({
    ...s,
    distance: Math.sqrt(Math.pow((s.latitude - lat) * 111, 2) + Math.pow((s.longitude - lng) * 111 * Math.cos(lat * Math.PI / 180), 2)),
  })).filter(s => s.distance <= distance).sort((a, b) => a.distance - b.distance);
  res.json({ data: nearby });
});

api.get('/locations/nearby-entertainment-area', (_req, res) => {
  res.json({ data: [] });
});

api.get('/locations/:id/competitors', (req, res) => {
  res.json({ data: COMPETITOR_STORES, total: COMPETITOR_STORES.length });
});

api.get('/locations/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const poi = ALL_POIS.find(p => p.id === id);
  if (poi) {
    res.json({ data: { ...poi, layerProperties: ['TRADE_AREA', 'IMAGES'], layerId: poi.layerId || 1 } });
  } else {
    res.status(404).json({ message: 'POI not found' });
  }
});

api.post('/locations/spatial', (req, res) => {
  const { spatialType, coordinates, layerIds } = req.body;
  let results = [];

  if (spatialType === 'sevenEleven' || (layerIds && layerIds.includes('1'))) {
    const filtered = coordinates
      ? SEVEN_STORES.filter(s => isPointInPolygon(s.geom.coordinates, coordinates))
      : SEVEN_STORES;
    results = [...results, ...filtered.map(toPOIPoint)];
  }

  if (spatialType === 'competitor' || (layerIds && layerIds.includes('2'))) {
    const filtered = coordinates
      ? COMPETITOR_STORES.filter(s => isPointInPolygon(s.geom.coordinates, coordinates))
      : COMPETITOR_STORES;
    results = [...results, ...filtered.map(toPOIPoint)];
  }

  if (spatialType === 'tradearea' || (layerIds && layerIds.includes('3'))) {
    // Return ALL trade areas (including newly created ones) as polygons
    const tradeAreaResults = TRADE_AREAS
      .filter(ta => {
        if (!coordinates) return true;
        return isPointInPolygon([ta.refPointX, ta.refPointY], coordinates);
      })
      .map(ta => ({
        id: String(ta.id),
        storeName: ta.storeName,
        coordinates: ta.shape.coordinates,
        shape: ta.shape,
        areaColor: ta.areaColor,
        status: ta.status,
        zoneCode: ta.zoneCode,
        refPointX: ta.refPointX,
        refPointY: ta.refPointY,
        type: ta.shape.type || 'Polygon',
        symbol: 'tradearea',
        name: ta.storeName,
        layerId: '3',
        layerName: 'Trade Area',
      }));
    results = [...results, ...tradeAreaResults];
  }

  if (spatialType === 'backupProfile') {
    res.json({ data: { layers: [] }, total: 0 });
    return;
  }

  res.json({ data: { search: results, poi: results }, total: results.length });
});

api.post('/locations/area', (_req, res) => res.json({ success: true }));

api.post('/locations/poi', (req, res) => {
  const newId = ALL_POIS.length + 1;
  res.json({ data: { id: newId, ...req.body }, message: 'POI created' });
});

api.put('/locations/poi/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const poi = ALL_POIS.find(p => p.id === id);
  res.json({ data: { ...poi, ...req.body }, message: 'POI updated' });
});

api.post('/locations', (req, res) => {
  res.json({ id: ALL_POIS.length + 1, ...req.body });
});

api.put('/locations/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const poi = ALL_POIS.find(p => p.id === id);
  res.json({ ...poi, ...req.body });
});

// --- Potentials ---
api.get('/potentials/pending-approval', (_req, res) => res.json({ data: [] }));

api.get('/potentials/poi/:poiId', (req, res) => {
  const id = parseInt(req.params.poiId);
  const poi = ALL_POIS.find(p => p.id === id);
  if (!poi) return res.json({ data: { poi: null, potentialStore: null, sevenEleven: null, vendingMachine: null } });

  res.json({ data: {
    poi,
    potentialStore: {
      id: poi.id,
      uid: poi.uid,
      poiId: poi.id,
      storeName: poi.name || poi.branchName,
      storeCode: poi.storeCode || poi.branchCode,
      location: poi.location,
      latitude: poi.latitude,
      longitude: poi.longitude,
      zoneName: poi.zoneName,
      subZoneName: poi.subZoneName,
      provinceName: poi.provinceName,
      districtName: poi.districtName,
      subDistrictName: poi.subDistrictName,
      grade: poi.grade,
      status: poi.status,
    },
    sevenEleven: {
      id: poi.id,
      potentialStoreId: poi.id,
      storecode: poi.storeCode || poi.branchCode,
      storename: poi.name || poi.branchName,
      saleAverage: poi.saleAverage,
      sevenType: poi.sevenType,
      sevenTypeName: poi.sevenTypeName,
    },
    vendingMachine: null,
  }});
});

api.get('/potentials/:poiId/status', (_req, res) => {
  res.json({ data: null });
});

api.get('/potentials/:poiId/detail', (req, res) => {
  const id = parseInt(req.params.poiId);
  const poi = ALL_POIS.find(p => p.id === id);
  res.json(poi ? { ...poi, potential: null } : null);
});

api.get('/potentials/images/:poiId', (_req, res) => res.json({ data: [] }));
api.post('/potentials/images/:poiId', (_req, res) => res.json({ status: 'success' }));
api.post('/potentials/images/:imageId/delete', (_req, res) => res.json({ status: 'success' }));
api.post('/potentials/:poiId/approve', (_req, res) => res.json({ status: 'success', message: 'Approved' }));
api.post('/potentials/send-approve', (_req, res) => res.json({ success: true, message: 'Sent' }));

// --- Trade Area ---
api.get('/tradearea/types', (_req, res) => {
  res.json({ data: [
    { id: 1, name: 'delivery_area' },
    { id: 2, name: 'store_hub' },
  ]});
});

api.get('/tradearea/store/:storeId', (req, res) => {
  const storeId = req.params.storeId;
  const type = req.query.type || '';
  // Map type names to tradeareaTypeName
  const typeMap = { delivery_area: 'delivery_area', store_hub: 'store_hub' };
  const typeName = typeMap[type] || type;
  
  let areas = TRADE_AREAS.filter(ta => ta.storeCode === storeId);
  if (typeName) {
    areas = areas.filter(ta => ta.tradeareaTypeName === typeName);
  }
  res.json({ data: areas, total: areas.length });
});

api.get('/tradearea/pending-approval', (_req, res) => res.json({ data: [] }));

api.get('/tradearea/:tradeareaId/poi', (req, res) => {
  const taId = parseInt(req.params.tradeareaId);
  const ta = TRADE_AREAS.find(t => t.id === taId);
  if (ta) {
    const poi = ALL_POIS.find(p => p.id === ta.poiId);
    res.json({ data: {
      tradeareaId: ta.id,
      poiId: ta.poiId,
      storeCode: ta.storeCode,
      storeName: ta.storeName,
      poiGeom: poi ? { type: 'Point', coordinates: [poi.longitude || poi.geom.coordinates[0], poi.latitude || poi.geom.coordinates[1]] } : null,
      areaGeom: ta.shape,
    }});
  } else {
    res.json({ data: null });
  }
});

api.get('/tradeArea/poi/:poiId', (req, res) => {
  const poiId = parseInt(req.params.poiId);
  const ta = TRADE_AREAS.find(t => t.poiId === poiId && t.tradeareaTypeName === 'delivery_area');
  if (ta) {
    res.json({ data: ta });
  } else {
    res.json({ data: null });
  }
});

api.get('/tradeArea/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const ta = TRADE_AREAS.find(t => t.id === id);
  res.json({ data: ta || null });
});

api.post('/tradearea', (req, res) => {
  const newId = Math.max(...TRADE_AREAS.map(t => t.id)) + 1;
  const poiId = req.body.poiId;
  const store = ALL_POIS.find(p => p.id === poiId);
  const storeCode = store ? (store.storeCode || store.branchCode) : '';
  const newArea = {
    id: newId,
    ...req.body,
    storeCode,
    refStoreCode: storeCode,
    storeName: store ? store.name : '',
    zoneCode: store ? store.zoneName : '',
    subzoneCode: store ? store.subZoneName : '',
    tradeareaTypeName: req.body.type || 'delivery_area',
    tradeareaTypeId: req.body.type === 'store_hub' ? 2 : 1,
    status: (req.body.status || 'draft').toLowerCase(),
    wfId: 1,
    wfTransactionId: newId,
    parentId: null,
    globalId: `TA-NEW-${newId}`,
    refPointX: store ? store.geom.coordinates[0] : 0,
    refPointY: store ? store.geom.coordinates[1] : 0,
    createdAt: new Date().toISOString(),
    createUser: 'DEMO',
    updatedAt: new Date().toISOString(),
    updateUser: 'DEMO',
  };
  TRADE_AREAS.push(newArea);
  res.json({ message: 'Created', data: newArea });
});

api.post('/tradearea/:parentId/child', (req, res) => {
  const parentId = parseInt(req.params.parentId);
  const newId = Math.max(...TRADE_AREAS.map(t => t.id)) + 1;
  const poiId = req.body.poiId;
  const store = ALL_POIS.find(p => p.id === poiId);
  const storeCode = store ? (store.storeCode || store.branchCode) : '';
  const newArea = {
    id: newId,
    parentId,
    ...req.body,
    storeCode,
    refStoreCode: storeCode,
    storeName: store ? store.name : '',
    tradeareaTypeName: req.body.type || 'delivery_area',
    tradeareaTypeId: req.body.type === 'store_hub' ? 2 : 1,
    status: (req.body.status || 'draft').toLowerCase(),
    wfId: 1,
    wfTransactionId: newId,
    globalId: `TA-NEW-${newId}`,
    refPointX: store ? store.geom.coordinates[0] : 0,
    refPointY: store ? store.geom.coordinates[1] : 0,
    createdAt: new Date().toISOString(),
    createUser: 'DEMO',
    updatedAt: new Date().toISOString(),
    updateUser: 'DEMO',
  };
  TRADE_AREAS.push(newArea);
  res.json({ message: 'Created', data: newArea });
});

api.put('/tradearea/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = TRADE_AREAS.findIndex(t => t.id === id);
  if (idx >= 0) {
    TRADE_AREAS[idx] = { ...TRADE_AREAS[idx], ...req.body, updatedAt: new Date().toISOString(), updateUser: 'DEMO' };
    res.json({ success: true, data: TRADE_AREAS[idx] });
  } else {
    res.json({ success: true });
  }
});

api.post('/tradearea/:id/submit-approval', (_req, res) => res.json({ success: true }));

api.post('/tradearea/:tradeareaId/approve', (_req, res) => res.json({ success: true }));

api.post('/tradearea/check-overlap', (req, res) => {
  const { shape, excludeId, tradeareaTypeName } = req.body;
  if (!shape || !shape.coordinates) {
    return res.json({ hasOverlap: false, overlappingAreas: [] });
  }

  // Find trade areas that overlap with the given shape
  const overlapping = TRADE_AREAS.filter(ta => {
    // Skip self
    if (excludeId && ta.id === excludeId) return false;
    // Filter by type if specified
    if (tradeareaTypeName && ta.tradeareaTypeName !== tradeareaTypeName) return false;
    // Only active areas
    if (ta.status !== 'active') return false;
    // Check intersection
    return polygonsIntersect(shape.coordinates, ta.shape.coordinates);
  });

  res.json({
    hasOverlap: overlapping.length > 0,
    overlappingAreas: overlapping.map(ta => ({
      id: ta.id, poiId: ta.poiId, refStoreCode: ta.refStoreCode,
      storeCode: ta.storeCode, storeName: ta.storeName,
      zoneCode: ta.zoneCode, subzoneCode: ta.subzoneCode,
      status: ta.status, shape: ta.shape, areaColor: ta.areaColor,
      tradeareaTypeId: ta.tradeareaTypeId,
    })),
  });
});

api.delete('/tradearea/:tradeareaId', (req, res) => {
  const id = parseInt(req.params.tradeareaId);
  const idx = TRADE_AREAS.findIndex(t => t.id === id);
  if (idx >= 0) {
    TRADE_AREAS.splice(idx, 1);
  }
  res.json({ success: true });
});

// --- Workflow ---
api.get('/workflow/:refId/:wfId/current-step', (req, res) => {
  const refId = parseInt(req.params.refId);
  const ta = TRADE_AREAS.find(t => t.id === refId);
  if (ta) {
    const isDraft = ta.status === 'draft';
    const isActive = ta.status === 'active';
    const actions = [];
    if (isDraft) {
      actions.push(
        { actionCode: 'SAVE', actionName: 'Save', requireRemark: false },
        { actionCode: 'SEND_APPROVE', actionName: 'Send for Approval', requireRemark: false },
        { actionCode: 'DELETE', actionName: 'Delete', requireRemark: false },
      );
    }
    if (isActive) {
      actions.push(
        { actionCode: 'EDIT', actionName: 'Edit', requireRemark: false },
        { actionCode: 'DELETE', actionName: 'Delete', requireRemark: true },
      );
    }
    res.json({ success: true, data: {
      wfTransactionId: ta.wfTransactionId,
      wfStep: { wfStepId: 101, wfStepName: isDraft ? 'Draft' : 'Active' },
      wfStatus: { wfStatusId: isDraft ? 1 : 4, wfStatusName: ta.status, wfComplete: isActive ? 'Y' : 'W' },
      canAction: true,
      availableActions: actions,
    }});
  } else {
    res.json({ success: true, data: null });
  }
});
api.get('/workflow/statuses', (_req, res) => res.json({ data: [
  { id: 1, name: 'Draft' }, { id: 2, name: 'Pending' }, { id: 3, name: 'Approved' }, { id: 4, name: 'Active' },
] }));
api.get('/workflow/steps', (_req, res) => res.json({ data: [] }));
api.get('/workflow/transaction/:wfTransactionId', (_req, res) => res.json({ data: null }));
api.get('/workflow/:tradeAreaId/history', (req, res) => {
  const taId = parseInt(req.params.tradeAreaId);
  const ta = TRADE_AREAS.find(t => t.id === taId);
  if (ta) {
    res.json({ data: [
      { id: 1, action: 'Created', actionDate: ta.createdAt, actionBy: ta.createUser, remark: 'Initial creation' },
      { id: 2, action: 'Approved', actionDate: ta.updatedAt, actionBy: 'ADMIN', remark: 'Auto-approved for demo' },
    ]});
  } else {
    res.json({ data: [] });
  }
});
api.put('/workflow/step-owner', (_req, res) => res.json({ success: true }));

// --- Seven Profile ---
api.get('/seven-profile/poi/:poiId', (req, res) => {
  const poiId = parseInt(req.params.poiId);
  const store = ALL_POIS.find(p => p.id === poiId);
  if (!store) return res.json({ data: null });

  res.json({ data: {
    storecode: store.storeCode || store.branchCode || '',
    storename: store.name || store.branchName || '',
    locationT: store.location || '',
    tradeArea: store.zoneName || '',
    branchType: store.sevenTypeName || 'Corporate',
    sevenType: store.sevenTypeName || 'Corporate',
    contractStartDate: '2020-01-01',
    contractEndDate: '2030-12-31',
    storeWidth: '4.5',
    storeLength: '12.0',
    saleArea: '38.5',
    stockArea: '15.0',
    storeArea: '54.0',
    storeBuildingType: 'อาคารพาณิชย์',
    roomAmount: '2',
    storeParking: '3',
    storeParkingMotocycle: '8',
    openDate: '2020-01-15',
    closeDate: null,
    officeHours: '24 ชั่วโมง',
    renovateStartDate: null,
    renovateEndDate: null,
    tempcloseStartDate: null,
    tempcloseEndDate: null,
    saleAverage: String(store.saleAverage || 75000),
    customerAverage: '850',
    salePricePerson: String(((store.saleAverage || 75000) / 850).toFixed(2)),
    opentypeAmount: '1',
    vaultAmount: '1',
    shelf: '12',
    posAmount: '2',
    canSaleCigarette: 'Y',
    canSaleAlcohol: 'Y',
  }});
});

// --- Backup Profile ---
api.get('/backupprofile/:poiId', (_req, res) => res.json(null));
api.put('/backupprofile/:uid', (req, res) => res.json(req.body));
api.post('/backupprofile', (req, res) => res.json(req.body));
api.get('/backupprofile/getBlankForm/:subcode', (_req, res) => res.json({ data: { fields: [] } }));

// --- Dynamic Form ---
api.get('/dynamicform/getForm/:obj/:key', (_req, res) => res.json({ data: { fields: [] } }));
api.post('/dynamicform', (req, res) => res.json(req.body));
api.put('/dynamicform/:formId', (req, res) => res.json(req.body));

// --- Rental ---
api.get('/rental/getLocation', (_req, res) => res.json({ data: null }));
api.post('/rental/generate-link', (req, res) => {
  res.json({ data: { url: 'https://demo.example.com/rental', ...req.body } });
});

// --- Quotas ---
api.get('/quotas/rounds', (_req, res) => res.json({ data: [] }));
api.get('/quotas', (_req, res) => res.json({ data: [], total: 0 }));
api.get('/quotas/check-history/:poiId', (_req, res) => res.json({ success: true, isUsed: false }));
api.get('/quotas/items/:id/history', (_req, res) => res.json({ history: [] }));
api.get('/quotas/:id/history', (_req, res) => res.json({ data: [] }));
api.post('/quotas/approve', (_req, res) => res.json([]));
api.post('/quotas/reject', (_req, res) => res.json([]));

// --- Roles ---
api.get('/role/getalldepartment', (_req, res) => res.json({ data: [{ id: 1, name: 'IT' }] }));
api.get('/role/getalllevels', (_req, res) => res.json({ data: [{ id: 1, name: 'Admin' }] }));
api.get('/role/getallzones', (_req, res) => res.json({ data: ZONES }));
api.get('/role/getallpermissiongroups', (_req, res) => res.json({ data: [] }));
api.get('/role/getrolepermissions/:roleId', (_req, res) => res.json({ data: {} }));
api.put('/role/updaterolepermissions', (_req, res) => res.json({ success: true }));
api.get('/role/search', (_req, res) => res.json({ data: [] }));
api.post('/role/create', (_req, res) => res.json({ success: true }));

// --- Import ---
api.get('/import/store-plan-standard', (_req, res) => res.json([]));
api.get('/import/announce', (_req, res) => res.json([]));
api.get('/import/knowledge', (_req, res) => res.json([]));
api.get('/import/knowledge/role/:roleId', (_req, res) => res.json([]));
api.get('/import/:id/download', (_req, res) => res.json({ url: '' }));
api.post('/import/upload/:importId', (_req, res) => res.json({ success: true }));
api.post('/import/announce', (_req, res) => res.json({ success: true }));
api.post('/import/store-plan-standard', (_req, res) => res.json({ success: true }));
api.post('/import/knowledge', (_req, res) => res.json({ success: true }));
api.put('/import/store-plan-standard/:file_id/can-load', (_req, res) => res.json({ success: true }));
api.put('/import/store-plan-standard/:file_id/delete', (_req, res) => res.json({ success: true }));
api.put('/import/announce/:announceId/is-show', (_req, res) => res.json({ success: true }));
api.put('/import/announce/:file_id/delete', (_req, res) => res.json({ success: true }));
api.put('/import/knowledge/:file_id/delete', (_req, res) => res.json({ success: true }));

// --- Catch-all for unhandled API routes ---
api.all('/{*path}', (req, res) => {
  console.warn(`[MOCK] Unhandled: ${req.method} ${req.path}`);
  res.json({ data: null, message: 'Mock endpoint - no data' });
});

// Mount API routes
app.use('/api', api);

// Root health check
app.get('/', (_req, res) => res.json({ status: 'Mock API running', mode: 'demo' }));

// Start server
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`   Base URL: http://localhost:${PORT}/api`);
  console.log(`   Mode: DEMO (no database required)\n`);
});
