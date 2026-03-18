import React, { useEffect, useRef, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Point, Polygon, Circle as CircleGeom } from 'ol/geom';
import 'ol/ol.css';
import XYZ from 'ol/source/XYZ';
import type BaseLayer from 'ol/layer/Base';
import './BaseMap.scss';
import { Feature } from 'ol';
import { Fill, Stroke, Style, Circle, Icon } from 'ol/style';
import { Modify, Draw, Snap } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import type { GeometryFunction } from 'ol/interaction/Draw';
import type { FeatureLike } from 'ol/Feature';
import {
  getMarkerIconPath,
  getMarkerIconScale,
  getMarkerIconAnchor,
} from '../../utils/iconMapper';

/**
 * Check if two line segments (a1-a2) and (b1-b2) properly intersect
 * (crossing each other, not just touching at endpoints).
 */
function segmentsIntersect(
  a1: number[], a2: number[], b1: number[], b2: number[]
): boolean {
  const d1x = a2[0] - a1[0], d1y = a2[1] - a1[1];
  const d2x = b2[0] - b1[0], d2y = b2[1] - b1[1];
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return false;
  const t = ((b1[0] - a1[0]) * d2y - (b1[1] - a1[1]) * d2x) / denom;
  const u = ((b1[0] - a1[0]) * d1y - (b1[1] - a1[1]) * d1x) / denom;
  // Strictly between 0 and 1 (not touching at endpoints)
  return t > 1e-10 && t < 1 - 1e-10 && u > 1e-10 && u < 1 - 1e-10;
}

/**
 * Check if a polygon ring has any self-intersecting edges.
 */
function isSelfIntersecting(ring: number[][]): boolean {
  const n = ring.length;
  // Need at least a triangle (3 vertices + closing = 4 entries)
  if (n < 4) return false;
  const edgeCount = n - 1; // last point equals first
  for (let i = 0; i < edgeCount; i++) {
    for (let j = i + 2; j < edgeCount; j++) {
      // Skip adjacent edges (they share a vertex)
      if (i === 0 && j === edgeCount - 1) continue;
      if (segmentsIntersect(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Fix a self-intersecting polygon by sorting vertices by angle from centroid.
 * Returns a new ring (closed) that forms a simple polygon.
 */
function fixSelfIntersectingRing(ring: number[][]): number[][] {
  // Remove closing point if present
  const pts = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring.slice(0, -1)
    : ring.slice();
  if (pts.length < 3) return ring;
  // Compute centroid
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  // Sort by angle from centroid
  pts.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  // Close the ring
  pts.push([...pts[0]]);
  return pts;
}

/**
 * Clip a polygon ring to a circle using Sutherland-Hodgman style algorithm.
 * All coordinates are in map projection (EPSG:3857).
 */
function clipRingToCircle(
  ring: number[][],
  centerProj: number[],
  radiusProj: number
): number[][] {
  const N = 64; // subdivide the circle into 64 clip edges
  let output = ring.slice();

  for (let i = 0; i < N; i++) {
    if (output.length === 0) return [];
    const a1 = (i / N) * 2 * Math.PI;
    const a2 = ((i + 1) / N) * 2 * Math.PI;
    // The clip edge is the chord from p1 to p2 on the circle.
    // "Inside" = the side that contains the circle center.
    const p1 = [centerProj[0] + radiusProj * Math.cos(a1), centerProj[1] + radiusProj * Math.sin(a1)];
    const p2 = [centerProj[0] + radiusProj * Math.cos(a2), centerProj[1] + radiusProj * Math.sin(a2)];

    const input = output;
    output = [];

    for (let j = 0; j < input.length; j++) {
      const curr = input[j];
      const prev = input[(j + input.length - 1) % input.length];
      const currInside = isInsideEdge(curr, p1, p2, centerProj);
      const prevInside = isInsideEdge(prev, p1, p2, centerProj);

      if (currInside) {
        if (!prevInside) {
          const ix = lineIntersect(prev, curr, p1, p2);
          if (ix) output.push(ix);
        }
        output.push(curr);
      } else if (prevInside) {
        const ix = lineIntersect(prev, curr, p1, p2);
        if (ix) output.push(ix);
      }
    }
  }
  // Close the ring
  if (output.length > 0 && (output[0][0] !== output[output.length - 1][0] || output[0][1] !== output[output.length - 1][1])) {
    output.push([...output[0]]);
  }
  return output;
}

/** Check if point is on the "inside" side of edge p1→p2 (center side). */
function isInsideEdge(pt: number[], p1: number[], p2: number[], center: number[]): boolean {
  return cross(p1, p2, pt) >= 0 === cross(p1, p2, center) >= 0;
}

/** 2D cross product of vectors (p1→p2) and (p1→p3). */
function cross(p1: number[], p2: number[], p3: number[]): number {
  return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
}

/** Intersection point of segments (a1-a2) and (b1-b2), or null. */
function lineIntersect(a1: number[], a2: number[], b1: number[], b2: number[]): number[] | null {
  const d = (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);
  if (Math.abs(d) < 1e-10) return null;
  const ua = ((b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0])) / d;
  return [a1[0] + ua * (a2[0] - a1[0]), a1[1] + ua * (a2[1] - a1[1])];
}

/**
 * Clip a Polygon geometry so it stays within a radius circle.
 * Replaces the old vertex-only clamping with proper polygon intersection.
 */
function clipPolygonToRadius(
  geometry: Polygon,
  center: number[],
  maxRadiusMeters: number
): void {
  const centerProj = fromLonLat(center);
  // Convert radius metres → projection units
  const refProj = fromLonLat([center[0] + 1, center[1]]);
  const oneDegreeInProj = Math.abs(refProj[0] - centerProj[0]);
  const oneDegreeInMeters = 111320 * Math.cos((center[1] * Math.PI) / 180);
  const metersToProj = oneDegreeInProj / oneDegreeInMeters;
  const radiusProj = maxRadiusMeters * metersToProj;

  const rings = geometry.getCoordinates();
  const clippedRings = rings
    .map(ring => clipRingToCircle(ring, centerProj, radiusProj))
    .filter(ring => ring.length >= 4); // valid ring needs ≥ 3 points + closing
  if (clippedRings.length > 0) {
    geometry.setCoordinates(clippedRings);
  }
}

// Helper function to create ellipse geometry
const createEllipse = (): GeometryFunction => {
  return function (coordinates, geometry) {
    const center = coordinates[0] as number[];
    const last = coordinates[coordinates.length - 1] as number[];

    // Calculate semi-major and semi-minor axes
    const dx = last[0] - center[0];
    const dy = last[1] - center[1];
    const radiusX = Math.abs(dx);
    const radiusY = Math.abs(dy);

    // Create ellipse points using parametric equation
    const numPoints = 64;
    const ellipseCoords: number[][] = [];

    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const x = center[0] + radiusX * Math.cos(angle);
      const y = center[1] + radiusY * Math.sin(angle);
      ellipseCoords.push([x, y]);
    }

    // Create or update polygon geometry
    if (!geometry) {
      geometry = new Polygon([ellipseCoords]);
    } else {
      (geometry as Polygon).setCoordinates([ellipseCoords]);
    }

    return geometry;
  };
};

// Interface for point data
export interface PointData {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  properties?: Record<string, unknown>;
}

// Interface for polygon data
export interface PolygonData {
  id: string;
  coordinates: number[][][]; // polygon coordinates array
  properties?: Record<string, unknown>;
}

// Interface for point layer
export interface PointLayer {
  id: string;
  name: string;
  data: PointData[];
  style?: {
    radius?: number;
    fill?: string;
    stroke?: {
      color: string;
      width: number;
    };
    iconScale?: number; // Scale for icon markers
  };
  visible?: boolean;
  symbol?: string; // Icon symbol name from API (e.g., 'potential', 'seven-eleven')
}

// Interface for polygon layer
export interface PolygonLayer {
  id: string;
  name: string;
  data: PolygonData[];
  style?: {
    fill?: string | CanvasPattern | CanvasGradient;
    stroke?: {
      color: string;
      width: number;
    };
  };
  visible?: boolean;
  editable?: boolean; // New property for making polygon editable
}

// Interface for coordinate point used in area editing
export interface CoordinatePoint {
  lat: number;
  lng: number;
}

// Interface for area edit event
export interface AreaEditEvent {
  polygonId: string;
  locationId: string;
  coordinates: CoordinatePoint[];
}

// Interface for point layer manager
export interface PointLayerManager {
  addOrUpdatePointLayer: (layer: PointLayer) => void;
  removePointLayer: (layerId: string) => void;
  clearAllPointLayers: () => void;
}

// Interface for point hover event
export interface PointHoverEvent {
  pointId: string;
  coordinates: [number, number];
  properties?: Record<string, unknown>;
  pixel: [number, number];
}

// Interface for point click event
export interface PointClickEvent {
  pointId: string;
  coordinates: [number, number];
  properties?: Record<string, unknown>;
  pixel: [number, number];
}

// Interface for polygon click event
export interface PolygonClickEvent {
  polygonId: string;
  locationId: string;
  coordinates: number[][][];
  properties?: Record<string, unknown>;
  pixel: [number, number];
}

interface BaseMapProps {
  /** Map container className */
  className?: string;
  /** Initial center coordinates [longitude, latitude] */
  center?: [number, number];
  /** Initial zoom level */
  zoom?: number;
  /** Map height */
  height?: string;
  /** Map width */
  width?: string;
  /** Point layers to display */
  pointLayers?: PointLayer[];
  /** Polygon layers to display */
  polygonLayers?: PolygonLayer[];
  /** Additional base layers (for compatibility) */
  layers?: BaseLayer[];
  /** Callback when map is initialized */
  onMapInit?: (map: Map) => void;
  /** Callback when layers are updated */
  onLayersUpdate?: (layerCount: number) => void;
  /** Show/hide map controls */
  showControls?: boolean;
  /** Callback when area is edited */
  onAreaEdit?: (event: AreaEditEvent) => void;
  /** Enable/disable polygon editing */
  isEditing?: boolean;

  editingAreaId?: string | null;
  /** Callback when polygon is modified */
  onPolygonModify?: (polygonId: string, coordinates: CoordinatePoint[]) => void;
  /** change fitpadding */
  fitPadding?: [number, number, number, number];
  /** Callback when point is hovered */
  onPointHover?: (event: PointHoverEvent | null) => void;
  /** Enable point hover effect */
  enablePointHover?: boolean;
  /** Callback when point is clicked */
  onPointClick?: (event: PointClickEvent) => void;
  /** Callback when polygon is clicked */
  onPolygonClick?: (event: PolygonClickEvent) => void;
  /** Enable visual selection feedback */
  enableSelection?: boolean;

  disableAutoFit?: boolean;
  /** Drawing mode for user interaction */
  drawMode?: 'circle' | 'polygon' | 'rectangle' | 'ellipse' | null;
  /** Callback when drawing is completed */
  onDrawComplete?: (coordinates: CoordinatePoint[]) => void;
  /** Callback when drawing error occurs (e.g. self-intersecting polygon) */
  onDrawError?: (message: string) => void;
  clearAllObjectOnMap?: boolean;
  /** Callback when shapes are cleared */
  onClearComplete?: () => void;

  isCreatingArea?: boolean;
  /** Callback when map view changes (move/zoom) */
  onMapMove?: (bounds: {
    topLeft: [number, number];
    topRight: [number, number];
    bottomLeft: [number, number];
    bottomRight: [number, number];
  }) => void;

  //added by Phone
  /** Callback when map is clicked */
  onMapClick?: (coordinates: { latitude: number; longitude: number }) => void;

  /** จุด mark พิเศษ (marker pin) */
  markPoints?: PointData[];

  /** จุด mark สำหรับ backup profile (สีเขียว) */
  backupMarkPoints?: PointData[];

  /** Flag to indicate if measuring tool is active */
  isMeasuring?: boolean;
  //end added by Phone
  radiusArea?: {
    coordinates: number[];
    radius: number[];
  } | null;

  /** Map type: street, terrain, hybrid or outdoors */
  mapType?: 'street' | 'terrain' | 'hybrid' | 'outdoors';
}

export const BaseMap: React.FC<BaseMapProps> = ({
  className = '',
  center = [100.5018, 13.7563], // Default to Bangkok, Thailand
  zoom = 2,
  height = '400px',
  width = '100%',
  pointLayers = [],
  polygonLayers = [],
  layers = [],
  onMapInit,
  onLayersUpdate,
  showControls: _showControls = true,
  onAreaEdit: _onAreaEdit,
  isEditing = false,
  editingAreaId = null,
  onPolygonModify,
  fitPadding: _fitPadding,
  onPointHover,
  enablePointHover = true,
  onPointClick,
  onPolygonClick: _onPolygonClick,
  enableSelection: _enableSelection = true,
  disableAutoFit: _disableAutoFit,
  drawMode = null,
  clearAllObjectOnMap = false,
  onDrawComplete,
  onClearComplete,
  isCreatingArea = false,
  onMapMove,

  onMapClick,
  markPoints = [],
  backupMarkPoints = [],
  isMeasuring = false,
  radiusArea = null,
  mapType = 'street',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const baseLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const hybridLabelsLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const pointLayersRef = useRef<globalThis.Map<string, VectorLayer<VectorSource>>>(
    new globalThis.Map()
  );
  const polygonLayersRef = useRef<globalThis.Map<string, VectorLayer<VectorSource>>>(
    new globalThis.Map()
  );
  const modifyInteractionRef = useRef<Modify | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const drawLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);
  const hoveredFeatureRef = useRef<Feature | null>(null);
  const circleLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  // const { removeLayerId, setRemoveLayerId } = useMapRemove();

  const createCircleStyle = useCallback((styleConfig?: PointLayer['style']): Style => {
    return new Style({
      image: new Circle({
        radius: styleConfig?.radius || 6,
        fill: new Fill({
          color: styleConfig?.fill || 'red',
        }),
        stroke: styleConfig?.stroke
          ? new Stroke({
              color: styleConfig.stroke.color,
              width: styleConfig.stroke.width,
            })
          : new Stroke({
              color: 'white',
              width: 2,
            }),
      }),
    });
  }, []);

  const createPointStyleFunction = useCallback(
    (feature: FeatureLike, style?: PointLayer['style']) => {
      const circleStyle = createCircleStyle(style);

      const symbol = feature.get('properties')?.symbol as string | undefined;
      // Force icon for seven-eleven
      if (symbol === 'seven') {
        const iconPath = getMarkerIconPath(symbol);
        const iconScale = style?.iconScale || getMarkerIconScale(symbol);
        const iconAnchor = getMarkerIconAnchor();
        try {
          const icon = new Icon({
            src: iconPath,
            scale: iconScale,
            anchor: iconAnchor,
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
          });
          return new Style({ image: icon });
        } catch {
          return circleStyle;
        }
      }
      // Fallback: circle for other cases
      if (!symbol) {
        return circleStyle;
      }
      const iconPath = getMarkerIconPath(symbol);
      const iconScale = style?.iconScale || getMarkerIconScale(symbol);
      const iconAnchor = getMarkerIconAnchor();
      try {
        const icon = new Icon({
          src: iconPath,
          scale: iconScale,
          anchor: iconAnchor,
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
        });
        return new Style({ image: icon });
      } catch {
        return circleStyle;
      }
    },
    [createCircleStyle]
  );

  // Function to create style from polygon layer config
  const createPolygonStyle = useCallback((styleConfig?: PolygonLayer['style']) => {
    const defaultFillColor = styleConfig?.fill || 'rgba(255, 0, 0, 0.3)';
    const defaultStrokeColor = styleConfig?.stroke?.color || 'red';
    const strokeWidth = styleConfig?.stroke?.width || 2;

    // Return a function that takes a feature and returns a style
    return (feature: FeatureLike) => {
      let fillColor = defaultFillColor;
      let strokeColor = defaultStrokeColor;

      // Check if the feature has an areaColor property
      const areaColor = feature.get('areaColor');
      if (areaColor) {
        // Parse RGB format: "RGB(18,219,229)" to rgba
        const rgbMatch = areaColor.match(/RGB\((\d+),\s*(\d+),\s*(\d+)\)/i);
        if (rgbMatch) {
          const r = rgbMatch[1];
          const g = rgbMatch[2];
          const b = rgbMatch[3];
          fillColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
          strokeColor = `rgb(${r}, ${g}, ${b})`;
        }

        if (styleConfig?.stroke) {
          strokeColor = styleConfig.stroke.color;
        }

        if (styleConfig?.fill) {
          fillColor = styleConfig.fill;
        }
      }

      return new Style({
        fill: new Fill({
          color: fillColor,
        }),
        stroke: new Stroke({
          color: strokeColor,
          width: strokeWidth,
        }),
      });
    };
  }, []);

  // Function to create features from point data
  const createPointFeatures = useCallback((points: PointData[]): Feature[] => {
    return points.map(point => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(point.coordinates)),
        properties: point.properties,
        id: point.id,
      });
      return feature;
    });
  }, []);

  // Function to create features from polygon data
  const createPolygonFeatures = useCallback((polygons: PolygonData[]): Feature[] => {
    return polygons.map(polygon => {
      // Transform coordinates to map projection
      const transformedCoords = polygon.coordinates.map(ring => {
        return ring.map(coord => {
          const transformed = fromLonLat([coord[0], coord[1]]);
          return transformed;
        });
      });

      const feature = new Feature({
        geometry: new Polygon(transformedCoords),
      });

      // Set properties properly
      feature.setProperties({
        ...polygon.properties,
        id: polygon.id,
        locationId:
          polygon.properties?.locationId || polygon.properties?.id || polygon.id,
      });

      return feature;
    });
  }, []);

  // Function to add or update point layer
  const addOrUpdatePointLayer = useCallback(
    (layer: PointLayer) => {
      if (!mapInstanceRef.current) return;

      const map = mapInstanceRef.current;
      const features = createPointFeatures(layer.data);

      // Check if layer already exists
      const existingLayer = pointLayersRef.current.get(layer.id);

      if (existingLayer) {
        // Update existing layer
        const source = existingLayer.getSource();
        if (source) {
          source.clear();
          source.addFeatures(features);
        }
        // existingLayer.setStyle(styleFunction);
        existingLayer.setVisible(layer.visible !== false);
      } else {
        // Create new layer
        const source = new VectorSource({
          features: features,
        });

        const vectorLayer = new VectorLayer({
          source: source,
          style: feature => createPointStyleFunction(feature, layer.style),
          visible: layer.visible !== false,
          zIndex: 1,
        });

        map.addLayer(vectorLayer);
        pointLayersRef.current.set(layer.id, vectorLayer);
      }
    },
    [createPointFeatures, createPointStyleFunction]
  );

  // Function to add or update polygon layer
  const addOrUpdatePolygonLayer = useCallback(
    (layer: PolygonLayer) => {
      if (!mapInstanceRef.current) return;

      const map = mapInstanceRef.current;
      const features = createPolygonFeatures(layer.data);
      const style = createPolygonStyle(layer.style);

      // Check if layer already exists
      const existingLayer = polygonLayersRef.current.get(layer.id);

      if (existingLayer) {
        // Update existing layer
        const source = existingLayer.getSource();
        if (source) {
          source.clear();
          source.addFeatures(features);
        }
        existingLayer.setStyle(style);
        // Always keep visible during editing
        existingLayer.setVisible(true);
      } else {
        // Create new layer
        const source = new VectorSource({
          features: features,
        });

        const vectorLayer = new VectorLayer({
          source: source,
          style: style,
          visible: layer.visible !== false,
          zIndex: 0, // Make sure polygon layer is on top
        });

        map.addLayer(vectorLayer);
        polygonLayersRef.current.set(layer.id, vectorLayer);

        // Auto-fit view to show all polygon features
        // if (!disableAutoFit && features.length > 0) {
        //   setTimeout(() => {
        //     const extent = source.getExtent();
        //     if (extent && extent.every(val => isFinite(val))) {
        //       map.getView().fit(extent, {
        //         padding: fitPadding || [50, 50, 50, 50],
        //         maxZoom: 16,
        //         duration: 600,
        //       });
        //     }
        //   }, 100);
        // }
      }
    },
    [createPolygonFeatures, createPolygonStyle]
  );

  // Function to remove point layer
  const removePointLayer = useCallback((layerId: string) => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const layer = pointLayersRef.current.get(layerId);

    if (layer) {
      map.removeLayer(layer);
      pointLayersRef.current.delete(layerId);
    }
  }, []);

  // Function to clear all point layers
  const clearAllPointLayers = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    pointLayersRef.current.forEach((layer: VectorLayer<VectorSource>) => {
      map.removeLayer(layer);
    });
    pointLayersRef.current.clear();
  }, []);

  // Initialize map (only once)
  useEffect(() => {
    if (!mapRef.current) return;

    // Create the base map layer
    const baseMapLayer = new TileLayer({
      source: new XYZ({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      }),
    });

    baseLayerRef.current = baseMapLayer;

    const map = new Map({
      target: mapRef.current,
      layers: [baseMapLayer],
      view: new View({
        center: fromLonLat(center || initialCenterRef.current), // Use initial center
        zoom: zoom || initialZoomRef.current, // Use initial zoom
        maxZoom: 18,
      }),
    });

    mapInstanceRef.current = map;

    const layersRef = pointLayersRef.current;

    // Cleanup function
    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
      layersRef.clear();
    };
  }, []); // Only initialize once

  // Handle map type changes
  useEffect(() => {
    if (!baseLayerRef.current || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Determine base tile URL
    let tileUrl: string;

    switch (mapType) {
      case 'terrain':
        tileUrl =
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
        break;
      case 'hybrid':
        tileUrl =
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        break;
      case 'outdoors':
        tileUrl =
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
        break;
      case 'street':
      default:
        tileUrl =
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    }

    // Update base layer source
    const newSource = new XYZ({
      url: tileUrl,
    });
    baseLayerRef.current.setSource(newSource);

    // Handle hybrid labels layer
    if (mapType === 'hybrid') {
      // Add or update labels layer for hybrid mode
      if (!hybridLabelsLayerRef.current) {
        const labelsLayer = new TileLayer({
          source: new XYZ({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          }),
          zIndex: 50, // Above terrain but below POI layers
        });

        labelsLayer.set('layerId', 'hybrid-labels');
        map.addLayer(labelsLayer);
        hybridLabelsLayerRef.current = labelsLayer;
      } else {
        // Make sure it's visible
        hybridLabelsLayerRef.current.setVisible(true);
      }
    } else {
      // Remove labels layer if not in hybrid mode
      if (hybridLabelsLayerRef.current) {
        map.removeLayer(hybridLabelsLayerRef.current);
        hybridLabelsLayerRef.current = null;
      }
    }
  }, [mapType]);

  // Handle onMapInit callback and expose layer management
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Expose layer management functions through map instance
    if (onMapInit) {
      onMapInit(map);
    }

    // Always expose point layer management methods
    (map as Map & { pointLayerManager: PointLayerManager }).pointLayerManager = {
      addOrUpdatePointLayer,
      removePointLayer,
      clearAllPointLayers,
    };
  }, [onMapInit, addOrUpdatePointLayer, removePointLayer, clearAllPointLayers]);

  // Handle map move events
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapMove) return;

    const map = mapInstanceRef.current;
    const view = map.getView();

    const handleMoveEnd = () => {
      const extent = view.calculateExtent(map.getSize());
      const [minX, minY, maxX, maxY] = extent;

      // Convert to lon/lat (4 corners for polygon boundary)
      const bottomLeft = toLonLat([minX, minY]);
      const topLeft = toLonLat([minX, maxY]);
      const topRight = toLonLat([maxX, maxY]);
      const bottomRight = toLonLat([maxX, minY]);

      onMapMove({
        topLeft: topLeft as [number, number],
        topRight: topRight as [number, number],
        bottomLeft: bottomLeft as [number, number],
        bottomRight: bottomRight as [number, number],
      });
    };

    // Trigger initial bounds
    handleMoveEnd();

    // Listen to moveend event
    map.on('moveend', handleMoveEnd);

    return () => {
      map.un('moveend', handleMoveEnd);
    };
  }, [onMapMove]);

  // Handle map click events — detect point features before firing generic map click
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!onMapClick && !onPointClick) return;

    const map = mapInstanceRef.current;

    const handleClick = (event: any) => {
      // Safeguard: Don't trigger clicks while drawing, editing, or measuring
      if (drawMode || isEditing || isCreatingArea || isMeasuring) {
        return;
      }

      // Check if a point feature was clicked
      if (onPointClick) {
        let clickedPointFeature: Feature | null = null;

        map.forEachFeatureAtPixel(event.pixel, (feature: any) => {
          if (
            !clickedPointFeature &&
            feature instanceof Feature &&
            feature.getGeometry()?.getType() === 'Point'
          ) {
            clickedPointFeature = feature as Feature;
          }
        });

        if (clickedPointFeature) {
          const geometry = (clickedPointFeature as Feature).getGeometry() as Point;
          const coords = toLonLat(geometry.getCoordinates());
          onPointClick({
            pointId: (clickedPointFeature as Feature).get('id') || '',
            coordinates: [coords[0], coords[1]] as [number, number],
            properties: (clickedPointFeature as Feature).get('properties'),
            pixel: event.pixel as [number, number],
          });
          return; // Don't fire onMapClick when a feature is clicked
        }
      }

      // No point feature clicked — fire normal map click
      if (onMapClick) {
        const clickedCoord = map.getCoordinateFromPixel(event.pixel);
        const lonLat = toLonLat(clickedCoord);
        onMapClick({
          latitude: lonLat[1],
          longitude: lonLat[0],
        });
      }
    };

    map.on('click', handleClick);

    return () => {
      map.un('click', handleClick);
    };
  }, [onMapClick, onPointClick, drawMode, isEditing, isCreatingArea, isMeasuring]);
  //end added by Phone

  // Handle additional base layers
  useEffect(() => {
    if (!mapInstanceRef.current || !layers.length) return;

    const map = mapInstanceRef.current;

    // Add additional base layers
    layers.forEach(layer => {
      map.addLayer(layer);
    });

    // Cleanup - remove layers when they change
    // return () => {
    //   layers.forEach(layer => {
    //     try {
    //       map.removeLayer(layer);
    //     } catch {
    //       // Layer might already be removed
    //     }
    //   });
    // };
  }, [layers]);

  // Handle point layers changes
  useEffect(() => {
    if (!mapInstanceRef.current || !pointLayers) return;

    // Get current point layer IDs
    const currentLayerIds = new Set(pointLayersRef.current.keys());
    const newLayerIds = new Set(pointLayers.map(layer => layer.id));

    // Remove layers that are no longer in pointLayers
    currentLayerIds.forEach(layerId => {
      if (!newLayerIds.has(layerId)) {
        removePointLayer(layerId);
      }
    });

    // Add or update layers
    pointLayers.forEach(layer => {
      addOrUpdatePointLayer(layer);
    });

    // Notify parent component about layer updates
    if (onLayersUpdate) {
      onLayersUpdate(pointLayers.length + polygonLayers.length + layers.length);
    }
  }, [
    pointLayers,
    onLayersUpdate,
    addOrUpdatePointLayer,
    removePointLayer,
    polygonLayers.length,
    layers.length,
    isEditing,
  ]);

  // Handle polygon layers changes
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonLayers) return;
    // Get current polygon layer IDs
    const currentLayerIds = new Set(polygonLayersRef.current.keys());
    const newLayerIds = new Set(polygonLayers.map(layer => layer.id));

    // During editing mode, preserve existing layers and don't remove them

    // Remove layers that are no longer in polygonLayers (only when not editing)
    currentLayerIds.forEach(layerId => {
      if (!newLayerIds.has(layerId)) {
        const layer = polygonLayersRef.current.get(layerId);
        if (layer && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(layer);
          polygonLayersRef.current.delete(layerId);
        }
      }
    });

    // Add or update layers
    polygonLayers.forEach(layer => {
      addOrUpdatePolygonLayer(layer);
    });

    // Force visibility check for all polygon layers during editing
    // if (isEditing) {
    //   polygonLayersRef.current.forEach(layer => {
    //     if (!layer.getVisible()) {
    //       layer.setVisible(true);
    //     }
    //   });
    // }
  }, [polygonLayers, addOrUpdatePolygonLayer]);

  // Handle editing mode changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!editingAreaId) return;

    const map = mapInstanceRef.current;

    // helper to remove current modify interaction
    const cleanupModify = () => {
      if (modifyInteractionRef.current) {
        try {
          map.removeInteraction(modifyInteractionRef.current);
        } catch {
          // ignore
        }
        modifyInteractionRef.current = null;
      }
    };

    if (!isEditing) {
      cleanupModify();
      return;
    }

    if (isEditing) {
      // Use setTimeout to ensure polygon layers are fully created
      const setupModifyInteraction = () => {
        // Remove existing modify interaction first
        if (modifyInteractionRef.current) {
          map.removeInteraction(modifyInteractionRef.current);
          modifyInteractionRef.current = null;
        }

        // Find the polygon layer to edit
        const polygonLayer = polygonLayersRef.current.get(editingAreaId || '');
        if (polygonLayer) {
          const source = polygonLayer.getSource();
          if (source && source.getFeatures().length > 0) {
            const modifyInteraction = new Modify({
              source: source,
            });

            // Handle modify end event
            modifyInteraction.on('modifyend', event => {
              const feature = event.features.getArray()[0];
              if (feature) {
                const geometry = feature.getGeometry();
                if (geometry instanceof Polygon) {
                  let coordinates = geometry.getCoordinates()[0];
                  // If self-intersecting, trigger error callback and abort
                  // if (isSelfIntersecting(coordinates)) {
                  //   if (typeof onDrawError === 'function') {
                  //     onDrawError('พื้นที่มีเส้นตัดกัน กรุณาแก้ไขให้เป็นรูปแบบปกติ');
                  //   }
                  //   return;
                  // }
                  const latLngCoordinates: CoordinatePoint[] = coordinates.map(
                    coord => {
                      const [lng, lat] = toLonLat(coord);
                      return { lat, lng };
                    }
                  );
                  const polygonId =
                    feature.get('id') || feature.get('locationId') || 'unknown';
                  if (onPolygonModify) {
                    onPolygonModify(polygonId, latLngCoordinates);
                  }
                }
              }
            });

            map.addInteraction(modifyInteraction);
            modifyInteractionRef.current = modifyInteraction;

            // Keep existing layers visible during editing
            polygonLayersRef.current.forEach(layer => {
              layer.setVisible(true);
            });
            pointLayersRef.current.forEach(layer => {
              layer.setVisible(true);
            });
          } else {
            setTimeout(setupModifyInteraction, 200);
          }
        } else {
          setTimeout(setupModifyInteraction, 200);
        }
      };

      setupModifyInteraction();
    } else {
      // Remove modify interaction
      if (modifyInteractionRef.current) {
        map.removeInteraction(modifyInteractionRef.current);
        modifyInteractionRef.current = null;
      }
    }
  }, [isEditing, editingAreaId, onPolygonModify]);

  // Handle editing mode changes with radius limit validation
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (editingAreaId === null) {
      return;
    }

    if (isEditing) {
      // Use setTimeout to ensure polygon layers are fully created
      const setupModifyInteraction = () => {
        // Remove existing modify interaction first
        if (modifyInteractionRef.current) {
          map.removeInteraction(modifyInteractionRef.current);
          modifyInteractionRef.current = null;
        }

        // Find the polygon layer to edit
        const polygonLayer = polygonLayersRef.current.get(editingAreaId || '');
        if (polygonLayer) {
          const source = polygonLayer.getSource();
          if (source && source.getFeatures().length > 0) {
            const maxRadius = radiusArea ? Math.max(...radiusArea.radius) : null;

            const modifyInteraction = new Modify({
              source: source,
            });

            // Handle modify end event with radius clamping + validation
            modifyInteraction.on('modifyend', event => {
              const feature = event.features.getArray()[0];
              if (!feature) return;

              const geometry = feature.getGeometry();
              if (!(geometry instanceof Polygon)) return;

              // ไม่ตัด polygon ให้วาดเกินได้
              // Additional logic can be added here if needed
              // Ensure the geometry is valid before proceeding

              // Fix self-intersecting polygon
              let coordinates = geometry.getCoordinates()[0];
              if (isSelfIntersecting(coordinates)) {
                coordinates = fixSelfIntersectingRing(coordinates);
                geometry.setCoordinates([coordinates]);
              }

              if (onPolygonModify) {
                const latLngCoordinates: CoordinatePoint[] = coordinates.map(
                  coord => {
                    const [lng, lat] = toLonLat(coord);
                    return { lat, lng };
                  }
                );
                const polygonId =
                  feature.get('id') || feature.get('locationId') || 'unknown';
                onPolygonModify(polygonId, latLngCoordinates);
              }
            });

            map.addInteraction(modifyInteraction);
            modifyInteractionRef.current = modifyInteraction;

            // Keep existing layers visible during editing
            polygonLayersRef.current.forEach(layer => {
              layer.setVisible(true);
            });
            pointLayersRef.current.forEach(layer => {
              layer.setVisible(true);
            });
          } else {
            setTimeout(setupModifyInteraction, 200);
          }
        } else {
          setTimeout(setupModifyInteraction, 200);
        }
      };

      setupModifyInteraction();
    } else {
      // Remove modify interaction
      if (modifyInteractionRef.current) {
        map.removeInteraction(modifyInteractionRef.current);
        modifyInteractionRef.current = null;
      }
    }
  }, [isEditing, editingAreaId, onPolygonModify, radiusArea]);

  // Handle radius area circles
  useEffect(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    const map = mapInstanceRef.current;

    // Remove existing circle layer
    if (circleLayerRef.current) {
      try {
        map.removeLayer(circleLayerRef.current);
      } catch {
        // ignore if already removed
      }
      circleLayerRef.current = null;
    }

    // Only show circles during editing with radius area
    if (!(isCreatingArea || isEditing) || !radiusArea) {
      return;
    }

    const { coordinates, radius } = radiusArea;
    if (!coordinates || coordinates.length < 2 || !radius || radius.length === 0) {
      return;
    }
    const [centerLng, centerLat] = coordinates;

    // Helper: create circle coordinates inline
    const buildCircle = (cLng: number, cLat: number, rMeters: number, n: number = 64): number[][] => {
      const rDeg = rMeters / 111000;
      const cosLat = Math.cos((cLat * Math.PI) / 180);
      const pts: number[][] = [];
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * 2 * Math.PI;
        const lng = cLng + (rDeg * Math.cos(a)) / cosLat;
        const lat = cLat + rDeg * Math.sin(a);
        pts.push(fromLonLat([lng, lat]));
      }
      return pts;
    };

    // Create circle layer — zIndex ABOVE draw layer (100) so it's always visible
    const circleSource = new VectorSource();
    const circleLayer = new VectorLayer({
      source: circleSource,
      zIndex: 150,
    });

    circleLayer.set('layerId', 'edit-radius-circles');
    circleLayerRef.current = circleLayer;
    map.addLayer(circleLayer);

    // Create circles for each radius
    radius.forEach((radiusMeters, index) => {
      const circleCoordinates = buildCircle(centerLng, centerLat, radiusMeters, 64);

      const circleFeature = new Feature({
        geometry: new Polygon([circleCoordinates]),
        radius: radiusMeters,
        index: index,
      });

      circleFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: 'rgba(40, 40, 40, 0.8)',
            width: 2,
            lineDash: [10, 8],
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 0, 0.03)',
          }),
        })
      );

      circleSource.addFeature(circleFeature);
    });

    // Cleanup when this effect re-runs or unmounts
    return () => {
      if (circleLayerRef.current) {
        try {
          map.removeLayer(circleLayerRef.current);
        } catch {
          // ignore
        }
        circleLayerRef.current = null;
      }
    };
  }, [isCreatingArea, isEditing, radiusArea]);

  // Update zoom when prop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const view = mapInstanceRef.current.getView();

    // 💥 FIX — delay to allow center animation to apply first
    setTimeout(() => {
      view.animate({
        zoom,
        duration: 500,
      });
    }, 180);
  }, [zoom]);

  // Function to create hover style for points
  const createPointHoverStyle = useCallback(
    (styleConfig?: PointLayer['style'], symbol?: string): Style => {
      // Use Icon marker with increased scale if symbol is provided
      if (symbol) {
        try {
          const iconPath = getMarkerIconPath(symbol);
          const baseScale = styleConfig?.iconScale || getMarkerIconScale(symbol);
          const hoverScale = baseScale * 1.3; // Increase size on hover
          const iconAnchor = getMarkerIconAnchor();

          return new Style({
            image: new Icon({
              src: iconPath,
              scale: hoverScale,
              anchor: iconAnchor,
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
            }),
          });
        } catch {
          // Fallback to circle on error
        }
      }

      // Fallback to Circle style
      return new Style({
        image: new Circle({
          radius: (styleConfig?.radius || 6) * 1.5, // Increase size on hover
          fill: new Fill({
            color: styleConfig?.fill || 'red',
          }),
          stroke: new Stroke({
            color: 'white',
            width: 3,
          }),
        }),
      });
    },
    []
  );

  // Function to create selected style for points
  // const createPointSelectedStyle = useCallback(
  //   (styleConfig?: PointLayer['style']): Style => {
  //     return new Style({
  //       image: new Circle({
  //         radius: (styleConfig?.radius || 6) * 1.8, // Larger than hover
  //         fill: new Fill({
  //           color: styleConfig?.fill || 'red',
  //         }),
  //         stroke: new Stroke({
  //           color: '#00ff00', // Green stroke for selection
  //           width: 4,
  //         }),
  //       }),
  //     });
  //   },
  //   []
  // );

  // Function to create selected style for polygons
  // const createPolygonSelectedStyle = useCallback(
  //   (styleConfig?: PolygonLayer['style']): Style => {
  //     return new Style({
  //       fill: new Fill({
  //         color: 'rgba(0, 255, 0, 0.3)', // Green fill for selection
  //       }),
  //       stroke: new Stroke({
  //         color: '#00ff00',
  //         width: 4,
  //       }),
  //     });
  //   },
  //   []
  // );

  // Handle point hover
  useEffect(() => {
    if (!mapInstanceRef.current || !enablePointHover) return;

    const map = mapInstanceRef.current;

    const handlePointerMove = (evt: any) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      let foundFeature = false;

      map.forEachFeatureAtPixel(pixel, feature => {
        const featureId = feature.get('id');
        let isPointFeature = false;

        pointLayersRef.current.forEach(layer => {
          const source = layer.getSource();
          if (source && source.getFeatures().includes(feature as Feature)) {
            isPointFeature = true;
          }
        });

        if (isPointFeature) {
          foundFeature = true;

          // Reset previous hovered feature style
          if (hoveredFeatureRef.current && hoveredFeatureRef.current !== feature) {
            hoveredFeatureRef.current.setStyle(undefined);
          }

          // Set hover style for current feature
          if (hoveredFeatureRef.current !== feature) {
            hoveredFeatureRef.current = feature as Feature;

            // Find the layer this feature belongs to
            let layerStyle: PointLayer['style'] | undefined;
            let layerSymbol: string | undefined;
            pointLayers.forEach(layer => {
              if (layer.data.some(point => point.id === featureId)) {
                layerStyle = layer.style;
                layerSymbol = layer.symbol;
              }
            });

            (feature as Feature).setStyle(createPointHoverStyle(layerStyle, layerSymbol));
          }

          // Trigger hover callback
          if (onPointHover) {
            const geometry = feature.getGeometry();
            if (geometry instanceof Point) {
              const coordinates = toLonLat(geometry.getCoordinates());
              onPointHover({
                pointId: featureId,
                coordinates: coordinates as [number, number],
                properties: feature.get('properties'),
                pixel: pixel as [number, number],
              });
            }
          }

          // Change cursor to pointer
          map.getTargetElement().style.cursor = 'pointer';
          return true;
        }
      });

      // Reset if no feature found
      if (!foundFeature) {
        if (hoveredFeatureRef.current) {
          hoveredFeatureRef.current.setStyle(undefined);
          hoveredFeatureRef.current = null;
        }
        map.getTargetElement().style.cursor = '';
        if (onPointHover) {
          onPointHover(null);
        }
      }
    };

    map.on('pointermove', handlePointerMove);

    return () => {
      map.un('pointermove', handlePointerMove);
      if (hoveredFeatureRef.current) {
        hoveredFeatureRef.current.setStyle(undefined);
        hoveredFeatureRef.current = null;
      }
    };
  }, [enablePointHover, onPointHover, createPointHoverStyle, pointLayers]);

  // Handle drawing interaction
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clean up existing draw interaction and layer
    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    if (drawLayerRef.current) {
      map.removeLayer(drawLayerRef.current);
      drawLayerRef.current = null;
    }

    // If drawMode is null, just cleanup (but keep persistent layer)
    if (!drawMode) return;

    // Create a vector layer for drawing (temporary)
    const drawSource = new VectorSource();
    const drawLayer = new VectorLayer({
      source: drawSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#3b82f6',
          width: 2,
        }),
        image: new Circle({
          radius: 7,
          fill: new Fill({
            color: '#3b82f6',
          }),
        }),
      }),
      zIndex: 99, // Higher than drawn shapes layer
    });

    // Mark this layer so we can find/clear previous draw layers/features
    drawLayer.set('layerId', 'draw-layer');
    map.addLayer(drawLayer);
    drawLayerRef.current = drawLayer;

    // Determine OpenLayers draw type and geometry function
    let drawType: 'Circle' | 'Polygon' = 'Polygon';
    let geometryFunction: GeometryFunction | undefined;
    let isCircleMode = false;

    switch (drawMode) {
      case 'circle':
        drawType = 'Circle';
        isCircleMode = true;
        break;
      case 'rectangle':
        drawType = 'Circle';
        geometryFunction = createBox();
        break;
      case 'ellipse':
        drawType = 'Circle';
        geometryFunction = createEllipse();
        break;
      case 'polygon':
        drawType = 'Polygon';
        break;
      default:
        drawType = 'Polygon';
    }

    const draw = new Draw({
      source: drawSource,
      type: drawType,
      geometryFunction,
    });

    if (drawMode !== null) {
      map.addInteraction(draw);
      drawInteractionRef.current = draw;
    } else {
      map.removeInteraction(draw);
    }

    draw.on('drawstart', () => {
      // Clear any existing features in any previous draw layer immediately
      try {
        map.getLayers().forEach(layer => {
          try {
            // Skip clearing the current draw layer we just created (don't clear the new layer)
            if (layer === drawLayerRef.current) return;

            if (layer.get && layer.get('layerId') === 'draw-layer') {
              const src = (layer as VectorLayer<VectorSource>).getSource?.();
              if (src && typeof src.clear === 'function') {
                src.clear();
              }
            }
          } catch (e) {
            console.log('Error clearing draw layer:', e);
            // ignore per-layer errors
          }
        });
      } catch {
        // ignore
      }
    });

    draw.on('drawend', event => {
      const geometry = event.feature.getGeometry();
      if (!geometry) return;

      let coordinates: CoordinatePoint[] = [];

      // Extract coordinates based on geometry type
      if (geometry.getType() === 'Circle' || isCircleMode) {
        // For circle, get the center and radius, then create points around it
        const circle = geometry as CircleGeom;
        const center = circle.getCenter();

        // Create approximate polygon from circle (32 points)
        const radius = circle.getRadius();

        // Create approximate polygon from circle (32 points)
        const numPoints = 32;
        coordinates = Array.from({ length: numPoints }, (_, i) => {
          const angle = (i / numPoints) * 2 * Math.PI;
          const dx = radius * Math.cos(angle);
          const dy = radius * Math.sin(angle);
          const point = toLonLat([center[0] + dx, center[1] + dy]);
          return { lng: point[0], lat: point[1] };
        });
      } else if (geometry.getType() === 'Polygon') {
        const polygon = geometry as Polygon;
        let coords = polygon.getCoordinates()[0]; // Get outer ring

        // Fix self-intersecting polygon (bowtie / crossed edges)
        if (isSelfIntersecting(coords)) {
          coords = fixSelfIntersectingRing(coords);
          polygon.setCoordinates([coords]);
        }

        coordinates = coords.map(coord => {
          const [lng, lat] = toLonLat(coord);
          return { lng, lat };
        });
      }

      // Call the callback with coordinates
      if (onDrawComplete && coordinates.length > 0) {
        onDrawComplete(coordinates);
      }
    });
  }, [drawMode, onDrawComplete]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!clearAllObjectOnMap) return;

    // Remove draw interaction if exists
    const map = mapInstanceRef.current;

    // Remove draw interaction if exists
    if (drawInteractionRef.current) {
      try {
        map.removeInteraction(drawInteractionRef.current);
      } catch {
        // ignore if already removed
      }
      drawInteractionRef.current = null;
    }

    // Remove ALL layers from the map except the base layer (first layer)
    // This ensures all drawn shapes are removed, regardless of which layer they're in
    const layers = map.getLayers().getArray(); // All layers except base layer
    const layersToRemove = layers.slice(1); // All layers except base layer

    layersToRemove.forEach(layer => {
      try {
        map.removeLayer(layer);
      } catch {
        // Clean up refs
        // ignore if already removed
      }
    });

    // Notify parent that clearing is complete
    // Clean up refs
    drawLayerRef.current = null;

    // Notify parent that clearing is complete
    if (onClearComplete) {
      onClearComplete();
    }
  }, [clearAllObjectOnMap, onClearComplete]);

  // Update center when prop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const view = mapInstanceRef.current.getView();

    setTimeout(() => {
      view.animate({
        center: fromLonLat(center),
        duration: 1500,
      });
    }, 150);
  }, [center]);

  // --- MARK POINT LAYER ---
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Remove old mark layer if exists
    const map = mapInstanceRef.current;
    const layerId = 'mark-point-layer';
    const oldLayer = pointLayersRef.current.get(layerId);
    if (oldLayer) {
      map.removeLayer(oldLayer);
      pointLayersRef.current.delete(layerId);
    }
    if (markPoints && markPoints.length > 0) {
      const features = markPoints.map(point => {
        const feature = new Feature({
          geometry: new Point(fromLonLat(point.coordinates)),
          properties: point.properties,
          id: point.id,
        });
        return feature;
      });
      const style = new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: 'rgba(43, 0, 255, 0.8)' }),
          stroke: new Stroke({ color: 'white', width: 3 }),
        }),
      });
      const source = new VectorSource({ features });
      const vectorLayer = new VectorLayer({
        source,
        style,
        visible: true,
        zIndex: 9999,
      });
      map.addLayer(vectorLayer);
      pointLayersRef.current.set(layerId, vectorLayer);
    }
  }, [markPoints]);

  // --- BACKUP MARK POINT LAYER ---
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const layerId = 'backup-mark-point-layer';
    const oldLayer = pointLayersRef.current.get(layerId);
    if (oldLayer) {
      map.removeLayer(oldLayer);
      pointLayersRef.current.delete(layerId);
    }
    if (backupMarkPoints && backupMarkPoints.length > 0) {
      const normalStyle = new Style({
        image: new Circle({
          radius: 9,
          fill: new Fill({ color: 'rgba(34, 197, 94, 0.9)' }),
          stroke: new Stroke({ color: 'white', width: 3 }),
        }),
      });
      const hoverStyle = new Style({
        image: new Circle({
          radius: 11,
          fill: new Fill({ color: 'rgba(21, 128, 61, 0.95)' }),
          stroke: new Stroke({ color: 'white', width: 3 }),
        }),
      });
      const features = backupMarkPoints.map(point => {
        const feature = new Feature({
          geometry: new Point(fromLonLat(point.coordinates)),
          properties: point.properties,
          id: point.id,
        });
        feature.set('_hoverStyle', hoverStyle);
        feature.set('_normalStyle', normalStyle);
        feature.setStyle(normalStyle);
        return feature;
      });
      const source = new VectorSource({ features });
      const vectorLayer = new VectorLayer({
        source,
        zIndex: 10000,
        visible: true,
      });
      // Pointer-move hover handler for backup markers
      const handleBackupHover = (evt: any) => {
        const pixel = map.getEventPixel(evt.originalEvent);
        let onBackup = false;
        map.forEachFeatureAtPixel(pixel, f => {
          if (source.getFeatures().includes(f as Feature<any>)) {
            onBackup = true;
            (f as Feature).setStyle(hoverStyle);
            map.getTargetElement().style.cursor = 'pointer';
            return true;
          }
        });
        if (!onBackup) {
          features.forEach(f => f.setStyle(normalStyle));
        }
      };
      map.on('pointermove', handleBackupHover);
      (vectorLayer as any)._hoverCleanup = () => map.un('pointermove', handleBackupHover);
      map.addLayer(vectorLayer);
      pointLayersRef.current.set(layerId, vectorLayer);
    }
    return () => {
      const layer = pointLayersRef.current.get(layerId);
      if (layer) {
        (layer as any)._hoverCleanup?.();
        map.removeLayer(layer);
        pointLayersRef.current.delete(layerId);
      }
    };
  }, [backupMarkPoints]);
  //end add by Phone

  useEffect(() => {
    if (
      !mapInstanceRef.current // Only setup when isCreatingArea is true
    )
      return;
    const map = mapInstanceRef.current;

    // Only setup when isCreatingArea is true
    if (!isCreatingArea) {
      // Clean up draw interaction when not creating
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
      if (drawLayerRef.current) {
        map.removeLayer(drawLayerRef.current); // Remove existing draw interaction

        drawLayerRef.current = null;
      }
      return;
    }

    // Remove existing draw interaction
    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    // Remove existing draw layer
    if (drawLayerRef.current) {
      map.removeLayer(drawLayerRef.current);
      drawLayerRef.current = null;
    }

    if (modifyInteractionRef.current) {
      map.removeInteraction(modifyInteractionRef.current);
      modifyInteractionRef.current = null;
    }

    // Create vector source for drawing
    const drawSource = new VectorSource();

    // Create vector layer for drawn features
    const drawVector = new VectorLayer({
      source: drawSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(90, 90, 90, 0.3)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 1)',
          width: 2,
          lineDash: [8, 6],
          lineDashOffset: 0,
        }),
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: 'rgba(143, 143, 143, 1)',
          }),
        }),
      }),
      zIndex: 100,
      // Collect all polygon features from existing layers for snapping
    });

    map.addLayer(drawVector);
    drawLayerRef.current = drawVector;

    // Collect all polygon features from existing layers for snapping
    const allPolygonFeatures: Feature[] = [];

    map.getLayers().forEach(layer => {
      if (layer instanceof VectorLayer && layer !== drawVector) {
        const source = layer.getSource();
        if (source instanceof VectorSource) {
          const polygonFeatures = source.getFeatures().filter(feature => {
            const geometry = feature.getGeometry();
            return geometry instanceof Polygon;
          }); // Create source for snapping to existing polygons

          allPolygonFeatures.push(...polygonFeatures);
        }
      }
    });

    // Create source for snapping to existing polygons// Create draw interaction with polygon type

    const snapSource = new VectorSource({
      features: allPolygonFeatures,
    });

    // Create draw interaction with polygon type
    const drawInteraction = new Draw({
      source: drawSource,
      type: 'Polygon',
      trace: true, // Enable tracing along existing polygons
      traceSource: snapSource, // Source to trace from
      style: new Style({
        fill: new Fill({
          color: 'rgba(90, 90, 90, 0.25)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 1)',
          width: 2,
          lineDash: [8, 6],
          lineDashOffset: 0,
        }),
        image: new Circle({
          radius: 7,
          fill: new Fill({
            color: 'rgba(143, 143, 143, 1)',
          }),
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      }),
    });

    const modifyInteraction = new Modify({
      source: drawSource,
    });

    modifyInteraction.on('modifyend', event => {
      const feature = event.features.getArray()[0];
      if (!feature) {
        return;
      }

      const geometry = feature.getGeometry();
      if (!(geometry instanceof Polygon)) {
        return;
      }

      // Clip polygon to radius if radiusArea is set
      if (radiusArea && radiusArea.radius.length > 0) {
        const maxRadius = Math.max(...radiusArea.radius);
        clipPolygonToRadius(geometry, radiusArea.coordinates, maxRadius);
      }

      const coords = geometry.getCoordinates()[0];
      const latLngCoordinates: CoordinatePoint[] = coords.map(coord => {
        const [lng, lat] = toLonLat(coord);
        return { lng, lat };
      });

      if (onDrawComplete && latLngCoordinates.length > 0) {
        onDrawComplete(
          latLngCoordinates.map(p => ({ lat: p.lat, lng: p.lng })) // deep copy
        );
      }
    });

    // Handle drawing start
    drawInteraction.on('drawstart', () => {
      console.log('Drawing started');
    });

    // Handle drawing end
    drawInteraction.on('drawend', event => {
      const geometry = event.feature.getGeometry();
      if (!geometry || !(geometry instanceof Polygon)) return;

      // ไม่ตัด polygon ให้วาดเกินได้
      // Additional logic can be added here if needed
      // Ensure the geometry is valid before proceeding

      const coordinates = (geometry as Polygon).getCoordinates()[0];
      const latLngCoordinates: CoordinatePoint[] = coordinates.map(coord => {
        const [lng, lat] = toLonLat(coord);
        return { lng, lat };
      });

      // Call the callback with coordinates
      if (onDrawComplete && latLngCoordinates.length > 0) {
        onDrawComplete(latLngCoordinates);
      }

      setTimeout(() => {
        if (drawInteractionRef.current) {
          map.removeInteraction(drawInteractionRef.current);
          drawInteractionRef.current = null;
        }
      }, 1000);
    });

    // Add draw interaction to map
    map.addInteraction(drawInteraction);
    map.addInteraction(modifyInteraction);
    drawInteractionRef.current = drawInteraction;
    modifyInteractionRef.current = modifyInteraction;

    // Add snap interaction for better snapping
    const snap = new Snap({
      source: snapSource,
      pixelTolerance: 10,
    });
    map.addInteraction(snap);

    // Cleanup function
    return () => {
      try {
        if (map && drawInteraction) {
          map.removeInteraction(drawInteraction);
        }
        if (map && snap) {
          map.removeInteraction(snap);
        }
      } catch (error) {
        console.error('Error cleaning up draw interaction:', error);
      }
    };
  }, [isCreatingArea, onDrawComplete]);

  return (
    <div className="basemap-container" style={{ position: 'relative', height, width }}>
      <div
        ref={mapRef}
        className={`ol-map ${className}`}
        style={{
          height,
          width,
        }}
      />
    </div>
  );
};

export default BaseMap;
