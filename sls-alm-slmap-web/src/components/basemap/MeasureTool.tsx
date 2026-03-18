import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type OlMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import { unByKey } from 'ol/Observable';
import { LineString, Polygon } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import type { EventsKey } from 'ol/events';

/* ─── Unit definitions ─── */
type LengthUnit = 'mi' | 'km' | 'ft' | 'usft' | 'm' | 'yd' | 'nmi';
type AreaUnit = 'acre' | 'sqmi' | 'km2' | 'hectare' | 'sqyd' | 'sqft' | 'squsft' | 'm2';
type MeasureType = 'length' | 'area';

const LENGTH_UNITS: LengthUnit[] = ['mi', 'km', 'ft', 'usft', 'm', 'yd', 'nmi'];
const AREA_UNITS: AreaUnit[] = [
  'acre',
  'sqmi',
  'km2',
  'hectare',
  'sqyd',
  'sqft',
  'squsft',
  'm2',
];

/* ─── Formatters ─── */
function formatNumber(num: number, decimals: number): string {
  const [intPart, decPart] = num.toFixed(decimals).split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

function formatLength(line: LineString, unit: LengthUnit, t: any): string {
  const metres = getLength(line);
  switch (unit) {
    case 'mi':
      return `${formatNumber(metres / 1609.344, 2)} ${t('unit_mi')}`;
    case 'km':
      return `${formatNumber(metres / 1000, 2)} ${t('unit_km')}`;
    case 'ft':
      return `${formatNumber(metres * 3.28084, 2)} ${t('unit_ft')}`;
    case 'usft':
      return `${formatNumber(metres * 3.280833333, 2)} ${t('unit_usft')}`;
    case 'yd':
      return `${formatNumber(metres * 1.09361, 2)} ${t('unit_yd')}`;
    case 'nmi':
      return `${formatNumber(metres / 1852, 2)} ${t('unit_nmi')}`;
    default:
      return `${formatNumber(metres, 2)} ${t('unit_m')}`;
  }
}

function formatArea(polygon: Polygon, unit: AreaUnit, t: any): string {
  const sqMetres = getArea(polygon);
  switch (unit) {
    case 'acre':
      return `${formatNumber(sqMetres / 4046.8564, 2)} ${t('unit_acre')}`;
    case 'sqmi':
      return `${formatNumber(sqMetres / 2589988.11, 2)} ${t('unit_sqmi')}`;
    case 'km2':
      return `${formatNumber(sqMetres / 1_000_000, 2)} ${t('unit_sqkm')}`;
    case 'hectare':
      return `${formatNumber(sqMetres / 10000, 2)} ${t('unit_hectare')}`;
    case 'sqyd':
      return `${formatNumber(sqMetres / 0.836127, 2)} ${t('unit_sqyd')}`;
    case 'sqft':
      return `${formatNumber(sqMetres / 0.092903, 2)} ${t('unit_sqft')}`;
    case 'squsft':
      return `${formatNumber(sqMetres / 0.0929034, 2)} ${t('unit_squsft')}`;
    case 'm2':
    default:
      return `${formatNumber(sqMetres, 2)} ${t('unit_sqm')}`;
  }
}

/* ─── Draw / tooltip styles ─── */
const drawStyle = new Style({
  fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
  stroke: new Stroke({ color: '#3b82f6', lineDash: [8, 8], width: 2.5 }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({ color: 'rgba(59, 130, 246, 0.2)', width: 2 }),
    fill: new Fill({ color: '#ffffff' }),
  }),
});

const vectorStyle = new Style({
  fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
  stroke: new Stroke({ color: '#3b82f6', width: 2.5 }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({ color: '#ffffff', width: 1.5 }),
    fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
  }),
});

/* ─── UI Icons ─── */
const RulerIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21L21 3L21 21L3 21Z" />
    <line x1="7" y1="21" x2="7" y2="17" />
    <line x1="11" y1="21" x2="11" y2="19" />
    <line x1="15" y1="21" x2="15" y2="17" />
    <line x1="21" y1="17" x2="17" y2="17" />
    <line x1="21" y1="13" x2="19" y2="13" />
    <line x1="21" y1="9" x2="17" y2="9" />
  </svg>
);

const CheckMarkBadge = () => (
  <div className="absolute -top-3 -right-3 w-[22px] h-[22px] bg-blue-500 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  </div>
);

const LineIcon = () => (
  <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="4" fill="#F5F5F5" />
    <path
      d="M14 34L34 14"
      stroke="#666"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="4 4"
    />
    <circle cx="14" cy="34" r="3" fill="#4285F4" />
    <circle cx="34" cy="14" r="3" fill="#4285F4" />
  </svg>
);

const PolygonIcon = () => (
  <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="4" fill="#F5F5F5" />
    <path
      d="M24 14L12 32H36L24 14Z"
      fill="#4285F4"
      fillOpacity="0.15"
      stroke="#666"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="14" r="3" fill="#4285F4" />
    <circle cx="12" cy="32" r="3" fill="#4285F4" />
    <circle cx="36" cy="32" r="3" fill="#4285F4" />
  </svg>
);

/* ─── Custom Dropdown ─── */
interface UnitSelectorProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
}

function UnitSelector<T extends string>({
  value,
  options,
  onChange,
}: UnitSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white transition-all shadow-sm cursor-pointer flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[60] top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-48">
          <ul className="flex-1 overflow-y-auto py-1 custom-scrollbar">
            {options.map(option => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    option.value === value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Props ─── */
interface MeasureToolProps {
  map: OlMap | null;
  /** Called when the measure draw mode is activated or deactivated */
  onActiveChange?: (active: boolean) => void;
}

const MeasureTool: React.FC<MeasureToolProps> = ({ map, onActiveChange }) => {
  const { t } = useTranslation(['maps']);
  /* ── UI State ── */
  const [isOpen, setIsOpen] = useState(false);
  const [measureType, setMeasureType] = useState<MeasureType>('length');
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('m');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('m2');
  const [isActive, setIsActive] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── OL Refs ── */
  const sourceRef = useRef<VectorSource>(new VectorSource());
  const layerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawRef = useRef<Draw | null>(null);
  const helpOverlayRef = useRef<Overlay | null>(null);
  const measureOverlayRef = useRef<Overlay | null>(null);
  const helpElementRef = useRef<HTMLDivElement | null>(null);
  const measureElementRef = useRef<HTMLDivElement | null>(null);
  const sketchRef = useRef<import('ol/Feature').default | null>(null);
  const listenerRef = useRef<EventsKey | null>(null);
  const staticOverlaysRef = useRef<Overlay[]>([]);
  const pointerMoveKeyRef = useRef<EventsKey | null>(null);

  const lengthUnitRef = useRef(lengthUnit);
  const areaUnitRef = useRef(areaUnit);
  useEffect(() => {
    lengthUnitRef.current = lengthUnit;
  }, [lengthUnit]);
  useEffect(() => {
    areaUnitRef.current = areaUnit;
  }, [areaUnit]);

  // Notify parent when active state changes
  useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive, onActiveChange]);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // Prevent closing the popup if the user is actively drawing on the map canvas
        if (isActive && target.closest('.ol-viewport')) {
          return;
        }
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isActive]);

  /* ── Stop drawing if panel is closed ── */
  useEffect(() => {
    if (!isOpen) {
      setIsActive(false);
    }
  }, [isOpen]);

  /* ── Ensure vector layer is on the map ── */
  useEffect(() => {
    if (!map) return;
    if (layerRef.current) return;

    const layer = new VectorLayer({
      source: sourceRef.current,
      style: vectorStyle,
      zIndex: 999,
    });
    map.addLayer(layer);
    layerRef.current = layer;

    return () => {
      if (map && layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  /* ── Create / recreate help tooltip ── */
  const createHelpTooltip = useCallback(() => {
    if (!map) return;
    if (helpElementRef.current) helpElementRef.current.remove();
    if (helpOverlayRef.current) map.removeOverlay(helpOverlayRef.current);

    const el = document.createElement('div');
    el.className = 'ol-tooltip hidden';
    helpElementRef.current = el;

    const overlay = new Overlay({
      element: el,
      offset: [15, 0],
      positioning: 'center-left',
    });
    map.addOverlay(overlay);
    helpOverlayRef.current = overlay;
  }, [map]);

  /* ── Create / recreate measure tooltip ── */
  const createMeasureTooltip = useCallback(() => {
    if (!map) return;
    if (measureElementRef.current) measureElementRef.current.remove();
    if (measureOverlayRef.current) map.removeOverlay(measureOverlayRef.current);

    const el = document.createElement('div');
    el.className = 'ol-tooltip ol-tooltip-measure';
    measureElementRef.current = el;

    const overlay = new Overlay({
      element: el,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
      insertFirst: false,
    });
    map.addOverlay(overlay);
    measureOverlayRef.current = overlay;
  }, [map]);

  /* ── Pointer-move handler ── */
  const attachPointerMove = useCallback(() => {
    if (!map) return;

    if (pointerMoveKeyRef.current) {
      unByKey(pointerMoveKeyRef.current);
      pointerMoveKeyRef.current = null;
    }

    const key = map.on('pointermove', evt => {
      if (evt.dragging) return;
      const el = helpElementRef.current;
      if (!el) return;

      let helpMsg = 'Click to start drawing';
      if (sketchRef.current) {
        const geom = sketchRef.current.getGeometry();
        if (geom instanceof Polygon) {
          helpMsg = 'Click to continue polygon\nDouble-click to finish';
        } else if (geom instanceof LineString) {
          helpMsg = 'Click to continue line\nDouble-click to finish';
        }
      }
      el.innerHTML = helpMsg;
      helpOverlayRef.current?.setPosition(evt.coordinate);
      el.classList.remove('hidden');
    });

    pointerMoveKeyRef.current = key;

    const viewport = map.getViewport();
    const hide = () => helpElementRef.current?.classList.add('hidden');
    viewport.addEventListener('mouseout', hide);

    return () => {
      viewport.removeEventListener('mouseout', hide);
    };
  }, [map]);

  /* ── Start measuring ── */
  const startMeasure = useCallback(() => {
    if (!map) return;

    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }

    createHelpTooltip();
    createMeasureTooltip();
    const cleanupPointerMove = attachPointerMove();

    const type = measureType === 'area' ? 'Polygon' : 'LineString';

    const draw = new Draw({
      source: sourceRef.current,
      type: type as 'Polygon' | 'LineString',
      style: drawStyle,
    });

    draw.on('drawstart', evt => {
      // Clear previous measurement before starting a new one
      sourceRef.current.clear();
      if (map) {
        staticOverlaysRef.current.forEach(o => map.removeOverlay(o));
        staticOverlaysRef.current = [];
      }

      sketchRef.current = evt.feature;

      listenerRef.current = sketchRef.current.getGeometry()!.on('change', gEvt => {
        const geom = gEvt.target;
        let output = '';
        let tooltipCoord: number[] | undefined;

        if (geom instanceof Polygon) {
          output = formatArea(geom, areaUnitRef.current, t);
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else if (geom instanceof LineString) {
          output = formatLength(geom, lengthUnitRef.current, t);
          tooltipCoord = geom.getLastCoordinate();
        }

        if (measureElementRef.current) {
          measureElementRef.current.innerHTML = output;
        }
        if (tooltipCoord) {
          measureOverlayRef.current?.setPosition(tooltipCoord);
        }
      });
    });

    draw.on('drawend', () => {
      // Freeze tooltip as static label
      if (measureElementRef.current) {
        measureElementRef.current.className = 'ol-tooltip ol-tooltip-static';
      }
      if (measureOverlayRef.current) {
        measureOverlayRef.current.setOffset([0, -7]);
        staticOverlaysRef.current.push(measureOverlayRef.current);
      }

      // Null out refs BEFORE creating new tooltip so the static overlay is preserved
      sketchRef.current = null;
      measureElementRef.current = null;
      measureOverlayRef.current = null;
      createMeasureTooltip();

      if (listenerRef.current) {
        unByKey(listenerRef.current);
        listenerRef.current = null;
      }
    });

    map.addInteraction(draw);
    drawRef.current = draw;

    return cleanupPointerMove;
  }, [map, measureType, createHelpTooltip, createMeasureTooltip, attachPointerMove]);

  /* ── Stop measuring ── */
  const stopMeasure = useCallback(() => {
    if (!map) return;

    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    if (listenerRef.current) {
      unByKey(listenerRef.current);
      listenerRef.current = null;
    }
    if (pointerMoveKeyRef.current) {
      unByKey(pointerMoveKeyRef.current);
      pointerMoveKeyRef.current = null;
    }
    if (helpElementRef.current) {
      helpElementRef.current.remove();
      helpElementRef.current = null;
    }
    if (helpOverlayRef.current && map) {
      map.removeOverlay(helpOverlayRef.current);
      helpOverlayRef.current = null;
    }
    if (measureElementRef.current) {
      measureElementRef.current.remove();
      measureElementRef.current = null;
    }
    if (measureOverlayRef.current && map) {
      map.removeOverlay(measureOverlayRef.current);
      measureOverlayRef.current = null;
    }

    sketchRef.current = null;
  }, [map]);

  /* ── Clear all measurements ── */
  const clearMeasurements = useCallback(() => {
    stopMeasure();
    setIsActive(false);
    sourceRef.current.clear();

    if (map) {
      staticOverlaysRef.current.forEach(o => map.removeOverlay(o));
      staticOverlaysRef.current = [];
    }
  }, [map, stopMeasure]);

  /* ── Toggle active state ── */
  useEffect(() => {
    if (isActive) {
      startMeasure();
    } else {
      stopMeasure();
    }
    return () => {
      stopMeasure();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, measureType]);

  /* ── Update existing measurements when unit changes ── */
  useEffect(() => {
    if (!map || !sourceRef.current) return;

    // Get all drawn features
    const features = sourceRef.current.getFeatures();
    if (features.length === 0) return;

    // For each static overlay, find the matching feature and update its text
    staticOverlaysRef.current.forEach(overlay => {
      const el = overlay.getElement();
      if (!el) return;

      const overlayCoord = overlay.getPosition();
      if (!overlayCoord) return;

      // Find the feature that generated this overlay
      // We do this by checking if the overlay coordinate matches the feature's label coordinate
      for (const feature of features) {
        const geom = feature.getGeometry();
        if (!geom) continue;

        let isMatch = false;
        let output = '';

        if (geom instanceof Polygon) {
          const interiorPt = geom.getInteriorPoint().getCoordinates();
          // Check if coordinates are close enough (ignoring tiny float differences)
          if (
            Math.abs(interiorPt[0] - overlayCoord[0]) < 1 &&
            Math.abs(interiorPt[1] - overlayCoord[1]) < 1
          ) {
            isMatch = true;
            output = formatArea(geom, areaUnit, t);
          }
        } else if (geom instanceof LineString) {
          const lastCoord = geom.getLastCoordinate();
          if (
            Math.abs(lastCoord[0] - overlayCoord[0]) < 1 &&
            Math.abs(lastCoord[1] - overlayCoord[1]) < 1
          ) {
            isMatch = true;
            output = formatLength(geom, lengthUnit, t);
          }
        }

        if (isMatch) {
          el.innerHTML = output;
          break; // Move to next overlay
        }
      }
    });
  }, [lengthUnit, areaUnit, map]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      clearMeasurements();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Render ─── */
  return (
    <div ref={dropdownRef} className="relative">
      {/* Small icon button — same style as GetLocationButton */}
      <div className="tooltip tooltip-left" data-tip={t('measure_tool')}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-white rounded-lg shadow-lg p-2 flex items-center justify-center border transition-all duration-200 ease-in-out ${
            isActive
              ? 'border-blue-400 ring-2 ring-blue-400'
              : 'border-gray-200 hover:border-gray-500'
          } hover:bg-[#f5f5f5] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]`}
          title={t('measure_tool')}
        >
          <RulerIcon />
        </button>
      </div>

      {/* Popup panel — slides to the left */}
      {isOpen && (
        <div className="absolute bottom-0 right-full mr-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 min-w-[240px]">
          <div className="p-3 relative z-10 bg-white rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <span className="text-sm font-semibold text-gray-800">
                {t('measure_tool')}
              </span>
              {isActive && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ring-1 ring-blue-200">
                  {t('measure_active')}
                </span>
              )}
            </div>

            {/* Type selector - acts as draw toggles */}
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-gray-500 mb-2">
                {t('measure_start_stop')}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (measureType === 'length' && isActive) setIsActive(false);
                    else {
                      setMeasureType('length');
                      setIsActive(true);
                    }
                  }}
                  className={`flex flex-col items-center p-1.5 rounded-lg transition-all hover:bg-gray-50 flex-1 border ${
                    measureType === 'length' && isActive
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="relative bg-[#F8F9FA] rounded p-2 mb-1 w-full flex items-center justify-center">
                    <LineIcon />
                    {measureType === 'length' && isActive && <CheckMarkBadge />}
                  </div>
                  <div
                    className={`mt-1 text-[11.5px] font-medium w-full text-center ${measureType === 'length' && isActive ? 'text-blue-600' : 'text-gray-700'}`}
                  >
                    {t('measure_line')}
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (measureType === 'area' && isActive) setIsActive(false);
                    else {
                      setMeasureType('area');
                      setIsActive(true);
                    }
                  }}
                  className={`flex flex-col items-center p-1.5 rounded-lg transition-all hover:bg-gray-50 flex-1 border ${
                    measureType === 'area' && isActive
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="relative bg-[#F8F9FA] rounded p-2 mb-1 w-full flex items-center justify-center">
                    <PolygonIcon />
                    {measureType === 'area' && isActive && <CheckMarkBadge />}
                  </div>
                  <div
                    className={`mt-1 text-[11.5px] font-medium w-full text-center ${measureType === 'area' && isActive ? 'text-blue-600' : 'text-gray-700'}`}
                  >
                    {t('measure_area')}
                  </div>
                </button>
              </div>
            </div>

            {/* Unit selector */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-gray-500 mb-2">
                {t('measure_unit')}
              </div>
              {measureType === 'length' ? (
                <UnitSelector<LengthUnit>
                  value={lengthUnit}
                  onChange={setLengthUnit}
                  options={LENGTH_UNITS.map(u => ({
                    value: u,
                    label:
                      u === 'mi'
                        ? t('unit_mi')
                        : u === 'km'
                          ? t('unit_km')
                          : u === 'ft'
                            ? t('unit_ft')
                            : u === 'usft'
                              ? t('unit_usft')
                              : u === 'yd'
                                ? t('unit_yd')
                                : u === 'nmi'
                                  ? t('unit_nmi')
                                  : t('unit_m'),
                  }))}
                />
              ) : (
                <UnitSelector<AreaUnit>
                  value={areaUnit}
                  onChange={setAreaUnit}
                  options={AREA_UNITS.map(u => ({
                    value: u,
                    label:
                      u === 'acre'
                        ? t('unit_acre')
                        : u === 'sqmi'
                          ? t('unit_sqmi')
                          : u === 'km2'
                            ? t('unit_sqkm')
                            : u === 'hectare'
                              ? t('unit_hectare')
                              : u === 'sqyd'
                                ? t('unit_sqyd')
                                : u === 'sqft'
                                  ? t('unit_sqft')
                                  : u === 'squsft'
                                    ? t('unit_squsft')
                                    : t('unit_sqm'),
                  }))}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-1.5 border-t border-gray-100">
              <button
                onClick={clearMeasurements}
                className="w-full text-sm font-medium py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-red-600 border border-gray-200 transition-colors flex items-center justify-center gap-1.5"
                title={t('measure_clear')}
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {t('measure_clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasureTool;
