import { useEffect, useState, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { BaseMap, Button, Modal, type PointClickEvent } from '@/components';
import { ControlPanel } from './panel/ControlPanel';
import { LayerControl } from './panel/LayerControl';
import { useMapStore } from '@/stores/mapStore';
import {
  LocationClickPopup,
  type CoordinateBasicInfo,
} from '@/components/base/LocationClickPopup';
import { InfoPanel } from './panel/InfoPanel';
import { useSearchParams } from 'react-router-dom';
import type { Location } from '@/services/location.service';

import { useBackupFlowStore, useBackupProfileStore } from '@/stores/backupProfileStore';
import { MapTypeControl } from './panel/MapTypeControl';
import MeasureTool from '@/components/basemap/MeasureTool';
import type { MapType } from './panel/MapTypeControl';
import { GetLocationButton } from './panel/GetLocationButton';
import type { AlertType } from '@/components/base/PopupAlert';
import PopupAlert from '@/components/base/PopupAlert';
import { useTradeAreaStore } from '@/stores/tradeareaStore';
import { checkOverlapTradeArea } from '@/services/tradeArea.service';
import { useTranslation } from 'react-i18next';

export interface LocationData {
  id?: string;
  type: string;
  geom: { type: string; coordinates: [number, number] };
}

// Custom hook for screen size detection
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    ...screenSize,
    // Screen breakpoints for responsive behavior
    isMobile: screenSize.width < 768,
    isTablet: screenSize.width >= 768 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isLargeDesktop: screenSize.width >= 1920,
    // Calculate ratio compared to standard desktop
    screenRatio: screenSize.width / 1920,
  };
};

export const MapsPage: React.FC = () => {
  const { t } = useTranslation(['common', 'tradearea']);
  // Screen size detection with custom hook (keep as local - UI only)
  const screenInfo = useScreenSize();

  const { step } = useBackupFlowStore();
  const isMapBlocked = step === 'layer-selection';

  const [searchParams] = useSearchParams();

  // Map type state - เพิ่ม outdoors
  const [mapType, setMapType] = useState<'street' | 'terrain' | 'hybrid' | 'outdoors'>(
    'street'
  );
  const handleMapTypeChange = (type: MapType) => {
    setMapType(type);
  };

  //added by Phone
  // use 2 state: popup, marker pin
  const [clickedLocation, setClickedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // State for showing InfoPanel for potential point
  const [potentialPoi, setPotentialPoi] = useState<{
    latitude: number;
    longitude: number;
    zone: string;
    subzone: string;
  } | null>(null);

  // State for showing InfoPanel for environment data
  const [envPotentialPoi, setEnvPotentialPoi] = useState<{
    latitude: number;
    longitude: number;
    zone: string;
    subzone: string;
  } | null>(null);

  // State for marker pin (separate from popup)
  const [markPoint, setMarkPoint] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  //end added by Phone

  //const [poiId, setPoiId] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);

  // Get all map state and actions from Zustand store
  const {
    // POI Layer state
    selectedLayerIds,
    mapBounds,
    poiPointsByLayer,
    setSelectedLayerIds,
    setMapBounds,
    fetchAndSetPOI,
    setPointLayers,
    setSpatialType,
    setLayerSpatialTypes,
    // Map viewport
    center,
    zoom,
    pointLayers,
    polygonLayers,
    isEditing,
    isCreatingArea,
    isCreatingBackupProfile,
    selectedLocationId,
    editingAreaId,
    editedCoordinates,
    drawMode,
    clearAllObjectOnMap,
    selectedUid,
    // Actions
    setEditedCoordinates,
    areaCoordinates,
    setAreaCoordinates,
    //added by Phone
    setZoom,
    setCenter,
    //end added by Phone
    setMapInstance,
    // Async actions

    cancelEditing,

    cancelCreatingArea,
    radiusArea,
    setIsCreatingArea,
    setIsEditing,
    longestDistance,
    setLongestDistance,
    editTradeAreaProperties,
    creatingAreaType,
  } = useMapStore();

  // Get mapInstance for MeasureTool
  const mapInstance = useMapStore(state => state.mapInstance);
  const {
    setOpenModal: setOpenTradeareaModal,
    setView,
    currentWfStep,
  } = useTradeAreaStore();

  const createdPoiId = useMapStore(state => state.createdPoiId);

  // Close creation panel when a POI is created and ControlPanel takes over
  useEffect(() => {
    if (createdPoiId) {
      setPotentialPoi(null);
      setEnvPotentialPoi(null);
      setMarkPoint(null);
    }
  }, [createdPoiId]);

  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [popupType, setPopupType] = useState<AlertType>('info');
  const [popupMessage, setPopupMessage] = useState<string>('');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isLoading] = useState<boolean>(false);
  const [actionModal, setActionModal] = useState<ReactNode>(null);
  const [titleModal, setTitleModal] = useState<string>('');
  const [childModal, setChildModal] = useState<ReactNode>(null);
  const prevCreatingBackupRef = useRef(false);
  useEffect(() => {
    const prev = prevCreatingBackupRef.current;
    const now = isCreatingBackupProfile;

    // Detect: false -> true
    if (!prev && now) {
      // Reset only for "create new backup area" mode (not edit)
      if (isCreatingArea && !isEditing) {
        useBackupProfileStore.getState().reset();
        useBackupFlowStore.getState().reset();
      }
    }

    prevCreatingBackupRef.current = now;
  }, [isCreatingBackupProfile, isCreatingArea, isEditing]);

  // Wrapper to pass screenWidth to centerOnPoint for location selection
  useEffect(() => {
    // Store's centerOnPoint needs screenWidth, passed via handleLocationSelect
  }, [screenInfo.width]);

  // Handle polygon modification during editing
  const handlePolygonModify = (
    _polygonId: string,
    coordinates: Array<{ lat: number; lng: number }>
  ) => {
    setEditedCoordinates(coordinates);
    setAreaCoordinates(coordinates);
  };

  // Handle layer selection changes
  const handleLayersChange = useCallback(
    (layerIds: string[], layerSpatialTypes?: Record<string, string>) => {
      // Update selected layers (could be empty, single, or multiple)
      setSelectedLayerIds(layerIds);

      if (layerSpatialTypes && Object.keys(layerSpatialTypes).length > 0) {
        // Store spatialType for each layer
        setLayerSpatialTypes(layerSpatialTypes);

        // Set global spatialType to first layer's type (for backwards compatibility)
        const firstLayerId = layerIds[0];
        if (firstLayerId && layerSpatialTypes[firstLayerId]) {
          setSpatialType(layerSpatialTypes[firstLayerId]);
        }
      }
      // Note: fetchAndSetPOI will be called by useEffect
    },
    [setSpatialType, setSelectedLayerIds, setLayerSpatialTypes]
  );

  // Handle map movement/zoom
  const handleMapMove = useCallback(
    (bounds: {
      topLeft: [number, number];
      topRight: [number, number];
      bottomLeft: [number, number];
      bottomRight: [number, number];
    }) => {
      setMapBounds(bounds);
    },
    [setMapBounds]
  );

  // Track previous selectedLayerIds to detect bounds-only changes
  const prevSelectedLayerIdsRef = useRef<string[]>([]);

  // Fetch POI when layers or bounds change (with debouncing)
  useEffect(() => {
    const prevLayerIds = prevSelectedLayerIdsRef.current;
    const layersChanged =
      JSON.stringify(prevLayerIds) !== JSON.stringify(selectedLayerIds);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedFetch = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce map movements by 500ms
      debounceTimer = setTimeout(() => {
        // If only bounds changed (not layers), force refresh all layers
        const forceRefresh = !layersChanged && mapBounds !== null;
        fetchAndSetPOI(forceRefresh);
      }, 500);
    };

    debouncedFetch();

    // Update previous layer IDs
    prevSelectedLayerIdsRef.current = selectedLayerIds;

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [selectedLayerIds, mapBounds, fetchAndSetPOI]);

  // Function to generate random color for POI areas (fallback)
  const generateRandomColor = () => {
    // สร้างสี HSL แบบ random ที่ดูสวยงาม
    const hue = Math.floor(Math.random() * 360); // 0-359
    const saturation = Math.floor(Math.random() * 30) + 60; // 60-90%
    const lightness = Math.floor(Math.random() * 20) + 50; // 50-70%

    return `RGB(${hue}, ${saturation}, ${lightness})`;
  };

  // Convert POI to separate polygon and point layers based on type
  const poiLayersFromCheckbox = useMemo(() => {
    if (!poiPointsByLayer || Object.keys(poiPointsByLayer).length === 0) {
      return { polygonLayers: [], pointLayers: [] };
    }

    const polygonLayers: any[] = [];
    const pointLayers: any[] = [];

    // ✅ O(k) - Iterate layers only (k = small number of layers)
    Object.entries(poiPointsByLayer).forEach(([layerId, points]) => {
      if (points.length === 0) return;

      const firstItem = points[0];

      // ✅ Check first item only to determine type
      const isPolygonType =
        (firstItem as any).type === 'Polygon' ||
        Array.isArray(firstItem.coordinates?.[0]?.[0]);

      if (isPolygonType) {
        // All items in this layer are polygons
        polygonLayers.push({
          id: `poi-layer-${layerId}`,
          name: `POI Layer ${layerId}`,
          data: points.map(p => ({
            id: p.id?.toString() || `poly-${Math.random()}`,
            coordinates: p.coordinates,
            properties: {
              ...p,
              id: p.id,
              name: p.storeName || (p as any).name || 'Trade Area',
              layerId: layerId,
              areaColor: p.areaColor || generateRandomColor(),
            },
          })),
          visible: true,
          zIndex: 10,
        });
      } else {
        // All items in this layer are points
        pointLayers.push({
          id: `poi-layer-${layerId}`,
          name: `POI Layer ${layerId}`,
          data: points.map(p => ({
            id: p.id?.toString() || `point-${Math.random()}`,
            coordinates: p.coordinates as any as [number, number],
            properties: {
              ...p,
              name: p.storeName || (p as any).name,
              layerId: layerId,
              symbol: (p as any).symbol,
            },
          })),
          symbol: (firstItem as any).symbol || 'seven',
          visible: true,
          zIndex: 20,
        });
      }
    });

    return { polygonLayers, pointLayers };
  }, [poiPointsByLayer]);

  // Combine all polygon layers (existing + POI from checkbox)
  const allPolygonLayers = useMemo(() => {
    return [
      ...polygonLayers, // From search, info panel, etc. (UNCHANGED)
      ...poiLayersFromCheckbox.polygonLayers, // From layer checkbox (NEW)
    ];
  }, [polygonLayers, poiLayersFromCheckbox.polygonLayers]);

  // Combine all point layers (existing + POI from checkbox)
  const allPointLayers = useMemo(() => {
    return [
      ...pointLayers, // From search, info panel, etc. (UNCHANGED)
      ...poiLayersFromCheckbox.pointLayers, // From layer checkbox (NEW)
    ];
  }, [pointLayers, poiLayersFromCheckbox.pointLayers]);

  // Handle map click to show location info
  const handleMapClick = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      if (!isEditing && !isCreatingArea && !drawMode && !isMeasuring) {
        setClickedLocation(coords);
        setMarkPoint(coords);
        setPotentialPoi(null); // Close InfoPanel if open
        setCenter([coords.longitude, coords.latitude]);
        setZoom(15);
      }
    },
    [isEditing, isCreatingArea, drawMode, isMeasuring, setCenter, setZoom]
  );

  // Handle clicking on an existing POI icon on the map
  const handlePointClick = useCallback((event: PointClickEvent) => {
    const props = (event.properties || {}) as Record<string, any>;

    // Always show InfoPanel when clicking POI icon
    setClickedLocation(null);

    const locationData: any = {
      ...props,
      id: String(props.id || event.pointId || ''),
      uid: String(props.uid || ''),
      poiId: props.poiId ? Number(props.poiId) : undefined,
      branchCode: String(props.branchCode || props.storeCode || ''),
      geom: {
        type: 'Point',
        coordinates: [event.coordinates[0], event.coordinates[1]],
      },
    };
    setLocation(locationData);
  }, []);

  // Close location popup and remove marker
  const handleCloseLocationPopup = () => {
    setClickedLocation(null);
    setMarkPoint(null);
  };

  // Handler for "สร้างทำเลศักยภาพ" button
  const handleCreatePotential = (info: CoordinateBasicInfo) => {
    if (clickedLocation) {
      setPotentialPoi(info);
      setClickedLocation(null); // Hide popup
      // Keep markPoint (marker) visible
    }
  };

  // Handler for "สร้างข้อมูลสภาพแวดล้อม" button
  const handleCreateEnvPotential = (info: CoordinateBasicInfo) => {
    if (clickedLocation) {
      setEnvPotentialPoi(info);
      setClickedLocation(null); // Hide popup
      // Keep markPoint (marker) visible
    }
  };

  // Handler to close InfoPanel
  const handleCloseInfoPanel = () => {
    setPotentialPoi(null);
    setMarkPoint(null); // Remove marker when InfoPanel closes
  };

  // Handler to close Env InfoPanel
  const handleCloseEnvInfoPanel = () => {
    setEnvPotentialPoi(null);
    setMarkPoint(null);
  };

  // Handle current location found
  const handleLocationFound = (latitude: number, longitude: number) => {
    // Update map center to current location
    setCenter([longitude, latitude]);
    setZoom(16); // Zoom in closer

    // Add a marker at current location
    setMarkPoint({ latitude, longitude });

    // Optionally, you can also trigger location click popup
    // setClickedLocation({ latitude, longitude });
  };

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const poiId = searchParams.get('poiId');
    const store = searchParams.get('store');

    // Validate all required parameters
    if (!lat || !lon || !poiId || !store) {
      console.warn('Missing required query parameters');
      return;
    }

    // Parse coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      console.error('Invalid coordinates');
      return;
    }

    // // Set POI ID
    //setPoiId(poiId);

    // // Set location data with proper structure
    const locationData: Location = {
      id: poiId,
      uid: `uid-${poiId}`,
      branchName: store,
      branchCode: store,
      location: `${latitude}, ${longitude}`,
      geom: {
        type: 'Point',
        coordinates: [latitude, longitude], // [longitude, latitude]
      },
      area: {
        id: `area-${poiId}`,
        shape: 'Polygon',
        coordinates: [], // Empty array, will be populated if needed
      },
    };

    setLocation(locationData);
    setPointLayers([
      {
        id: 'approval-point',
        name: '',
        data: [
          {
            id: '',
            coordinates: [latitude, longitude],
          },
        ],
      },
    ]);
  }, [searchParams, setCenter, setZoom]);

  const handleSaveNewArea = async () => {
    setView('create');
    setOpenTradeareaModal(true);
    setIsCreatingArea(false);
    setIsEditing(false);
  };

  const handleSaveEdited = async () => {
    setOpenTradeareaModal(true);
    setIsEditing(false);
  };

  const onCloseTradeareaModal = async () => {
    setOpenModal(false);
    if (isCreatingArea) {
      await handleSaveNewArea();
    } else if (isEditing) {
      await handleSaveEdited();
    }
  };

  const handleSave = async () => {
    const distanceCheckResult = await distanceAlert();
    if (!distanceCheckResult.success) {
      setPopupType('error');
      setPopupMessage(distanceCheckResult.message || 'เกิดข้อผิดพลาด');
      setPopupOpen(true);
      return;
    }

    setActionModal(
      <>
        <Button
          variant={'primary'}
          onClick={() => {
            onCloseTradeareaModal();
          }}
        >
          {isLoading && <span className="loading loading-spinner loading-md"></span>}
          {!isLoading && t('common:confirm')}
        </Button>
        <Button
          variant="outline"
          className="btn btn-ghost"
          type="submit"
          onClick={() => {
            setOpenModal(false);
          }}
          disabled={isLoading}
        >
          {t('common:cancel')}
        </Button>
      </>
    );

    setTitleModal(t('tradearea:process_confirm'));
    setChildModal(
      longestDistance && currentWfStep !== 101
        ? t('tradearea:warning_message', { meter: longestDistance })
        : t('tradearea:confirm_drawing')
    );

    setOpenModal(true);
  };

  const distanceAlert = async (): Promise<{ success: boolean; message?: string }> => {
    if (!radiusArea || radiusArea.radius.length === 0) {
      return { success: true };
    }
    const [centerLng, centerLat] = radiusArea.coordinates;
    const maxRadius = Math.max(...radiusArea.radius); // Get max radius in meters

    let isWithinRadius = true;
    const coordinates = isCreatingArea ? areaCoordinates : editedCoordinates;

    if (isCreatingArea && coordinates.length === 0) {
      return {
        success: false,
        message: 'ไม่พบข้อมูลพื้นที่ กรุณาวาดใหม่อีกครั้ง',
      };
    }

    for (const coord of coordinates) {
      // Calculate distance from center
      const dLng =
        (coord.lng - centerLng) * 111000 * Math.cos((centerLat * Math.PI) / 180);
      const dLat = (coord.lat - centerLat) * 111000;
      const distance = Math.sqrt(dLng * dLng + dLat * dLat);
      if (distance > maxRadius) {
        isWithinRadius = false;
        setLongestDistance(maxRadius);
        break;
      }

      for (const n of radiusArea.radius) {
        if (n <= distance) setLongestDistance(n);
        else break;
      }
    }

    // Helper function to check if polygon has self-intersections
    const checkPolygonSelfIntersection = (
      coordinates: Array<{ lat: number; lng: number }>
    ): {
      hasSelfIntersection: boolean;
      intersectingSegments: Array<[number, number]>;
    } => {
      // Closed polygon must have at least 4 points (3 unique + 1 closing point)
      if (coordinates.length < 4) {
        return { hasSelfIntersection: false, intersectingSegments: [] };
      }

      // Check if polygon is closed (first and last point are the same)
      const isClosed =
        coordinates[0].lat === coordinates[coordinates.length - 1].lat &&
        coordinates[0].lng === coordinates[coordinates.length - 1].lng;

      const intersectingSegments: Array<[number, number]> = [];

      const segmentLimit = isClosed ? coordinates.length - 2 : coordinates.length - 1;

      // Check each segment against all other segments (skip adjacent segments)
      for (let i = 0; i < segmentLimit; i++) {
        for (let j = i + 2; j < segmentLimit; j++) {
          // Skip adjacent segments
          if (j === i + 1) continue;

          const p1 = coordinates[i];
          const p2 = coordinates[i + 1];
          const p3 = coordinates[j];
          const p4 = coordinates[j + 1];

          // Skip if comparing segment to itself
          if (p1 === p3 && p2 === p4) continue;

          const doLineSegmentsIntersect = (
            p1: { lat: number; lng: number },
            p2: { lat: number; lng: number },
            p3: { lat: number; lng: number },
            p4: { lat: number; lng: number }
          ): boolean => {
            if (p1.lat === p4.lat && p1.lng === p4.lng) {
              return false;
            }

            const ccw = (A: typeof p1, B: typeof p2, C: typeof p3): boolean => {
              return (
                (C.lat - A.lat) * (B.lng - A.lng) > (B.lat - A.lat) * (C.lng - A.lng)
              );
            };

            return (
              ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
            );
          };

          if (doLineSegmentsIntersect(p1, p2, p3, p4)) {
            intersectingSegments.push([i, j]);
          }
        }
      }

      return {
        hasSelfIntersection: intersectingSegments.length > 0,
        intersectingSegments,
      };
    };

    const intersectionCheck = checkPolygonSelfIntersection(coordinates);
    if (intersectionCheck.hasSelfIntersection) {
      return {
        success: false,
        message: `พื้นที่มีเส้นตัดกัน\n` + `กรุณาปรับพื้นที่ให้เป็นรูปแบบปกติ`,
      };
    }

    const overlapResponse = await checkOverlapTradeArea(
      [coordinates.map(coord => [coord.lng, coord.lat])],
      editTradeAreaProperties ? Number(editTradeAreaProperties.id) : undefined,
      creatingAreaType || 'delivery_area'
    );

    if (overlapResponse.hasOverlap) {
      return {
        success: false,
        message: 'พื้นที่ทับซ้อนกับพื้นที่อื่น',
      };
    }

    if (!isWithinRadius)
      if (currentWfStep === 101) {
        return {
          success: false,
          message: 'ไม่อนุญาติให้พื้นที่วาดมีขนาดเกิน 600 เมตรจากร้านสาขา',
        };
      } else {
        return {
          success: true,
        };
      }

    return { success: true };
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Search area and InfoPanel - top left */}
      <div className="absolute top-6 left-6 z-10 flex flex-row items-start gap-2">
        <ControlPanel locationData={location || null} />
        {(potentialPoi || envPotentialPoi) && (
          <div className="min-w-[1400px]">
            <InfoPanel
              poiId=""
              uid={selectedUid}
              storeCode=""
              location={{
                branchName: '',
                branchCode: '',
                geom: {
                  type: 'Point',
                  coordinates: [
                    (potentialPoi || envPotentialPoi)?.longitude ?? 0,
                    (potentialPoi || envPotentialPoi)?.latitude ?? 0,
                  ],
                },
              }}
              onClose={potentialPoi ? handleCloseInfoPanel : handleCloseEnvInfoPanel}
              type={potentialPoi ? 'default' : 'env'}
              coordinateBasicInfo={potentialPoi || envPotentialPoi}
              isCreateBackupArea={isCreatingBackupProfile}
              isUpdateForm={false}
            />
          </div>
        )}
      </div>
      {/* Points/Areas Counter and Clear Map - top right */}
      {(pointLayers.length > 0 || polygonLayers.length > 0) && (
        <div className="absolute top-4 right-[12em] z-10 flex items-center gap-3">
          {/* ...existing counter and buttons code... */}
          <div className="flex items-center gap-3">
            {/*<span className="text-sm text-gray-600">
                Points:{' '}
                {pointLayers.reduce((total, layer) => total + layer.data.length, 0)}
                {polygonLayers.length > 0 && (
                  <>
                    {' '}
                    | Areas:{' '}
                    {polygonLayers.reduce((total, layer) => total + layer.data.length, 0)}
                  </>
                )}
              </span>*/}
            {isEditing && !isCreatingBackupProfile && (
              <div className="bg-white rounded-lg px-4 py-2 shadow-lg">
                <button
                  onClick={handleSave}
                  className="btn btn-sm btn-success rounded-lg"
                >
                  บันทึก
                </button>
                <button
                  onClick={cancelEditing}
                  className="btn btn-sm btn-outline btn-error rounded-lg"
                >
                  ยกเลิก
                </button>
              </div>
            )}

            {isCreatingArea && !isCreatingBackupProfile && (
              <div className="bg-white rounded-lg px-4 py-2 shadow-lg">
                <button
                  onClick={handleSave}
                  className="btn btn-sm btn-success rounded-lg mr-2"
                >
                  บันทึก
                </button>
                <button
                  onClick={cancelCreatingArea}
                  className="btn btn-sm btn-outline btn-error rounded-lg"
                >
                  ยกเลิก
                </button>
              </div>
            )}

            {/*<button
                onClick={clearMap}
                className="btn btn-sm btn-outline btn-error rounded-lg"
              >
                Clear Map
              </button>*/}
          </div>
        </div>
      )}
      <div className="absolute top-4 right-4 z-10">
        <LayerControl onLayersChange={handleLayersChange} />
      </div>
      {/* Get Current Location Button - bottom right (above debug panel) */}
      <div className="absolute bottom-[4.3em] pb-5 right-4 z-10">
        <GetLocationButton onLocationFound={handleLocationFound} />
      </div>
      {/* Measure Tool - above zoom & location buttons */}
      <div className="absolute bottom-[3.3em] right-4 z-10">
        <MeasureTool map={mapInstance} onActiveChange={setIsMeasuring} />
      </div>
      {/* Map Type Toggle - bottom right */}
      <div className="absolute bottom-4 right-4 z-10">
        <MapTypeControl currentType={mapType} onToggle={handleMapTypeChange} />
      </div>
      {/* Editing Mode Indicator */}
      {isEditing && !isCreatingBackupProfile && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div
            className={`${
              isCreatingArea ? 'bg-green-600' : 'bg-blue-600'
            } text-white px-4 py-2 rounded-lg shadow-lg`}
          >
            <div className="flex items-center gap-2">
              <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-medium">
                {isCreatingArea
                  ? 'กำลังสร้าง Area ใหม่ - ลากจุดเพื่อปรับรูปร่าง'
                  : 'กำลังแก้ไข Area - ลากจุดเพื่อปรับขนาด'}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Location Click Popup */}
      {clickedLocation && (
        <div
          className="absolute z-20 left-1/2"
          style={{
            top: 'calc(50% + 36px)',
            transform: 'translateX(-50%)',
          }}
        >
          <LocationClickPopup
            latitude={clickedLocation.latitude}
            longitude={clickedLocation.longitude}
            onClose={handleCloseLocationPopup}
            onCreatePotential={handleCreatePotential}
            onCreateEnvData={handleCreateEnvPotential}
          />
        </div>
      )}
      {/* Fullscreen Map */}
      <BaseMap
        center={center}
        zoom={zoom}
        height="calc(100vh - var(--header-height, 65px))"
        width="100%"
        pointLayers={allPointLayers}
        polygonLayers={allPolygonLayers}
        markPoints={
          markPoint
            ? [
                {
                  id: 'clicked-pin',
                  coordinates: [markPoint.longitude, markPoint.latitude],
                  properties: { type: 'clicked-location' },
                },
              ]
            : []
        }
        className="w-full"
        isEditing={isEditing}
        onPolygonModify={handlePolygonModify}
        fitPadding={[50, 50, 50, screenInfo.width * 0.6]}
        drawMode={drawMode}
        onDrawComplete={setAreaCoordinates}
        clearAllObjectOnMap={clearAllObjectOnMap}
        disableAutoFit={true}
        onMapMove={handleMapMove}
        onMapClick={handleMapClick}
        onPointClick={handlePointClick}
        editingAreaId={editingAreaId}
        isCreatingArea={isCreatingArea}
        isMeasuring={isMeasuring}
        radiusArea={radiusArea}
        onMapInit={setMapInstance}
        mapType={mapType}
      />
      {isMapBlocked && <div className="absolute inset-0 z-[5] pointer-events-auto" />}

      {/* Debug info - bottom right */}
      {import.meta.env.DEV && (
        <div className="absolute bottom-4 left-4 z-10 bg-black text-white text-xs p-2 rounded opacity-50">
          <div>
            Point Layers: {allPointLayers.length} | Polygon Layers:{' '}
            {allPolygonLayers.length}
          </div>
          {/* <div>
          POI Polygons: {poiPoints.length} | Selected Layers: {selectedLayerIds.length}
        </div> */}
          <div>
            Editing: {isEditing ? 'YES' : 'NO'} | Selected Location: {selectedLocationId}
          </div>
          <div>Edited Coords: {editedCoordinates.length} points</div>
          <div>
            Screen: {screenInfo.width}x{screenInfo.height} (
            {screenInfo.isMobile ? 'Mobile' : screenInfo.isTablet ? 'Tablet' : 'Desktop'})
          </div>
          <div>Offset Ratio: {screenInfo.screenRatio.toFixed(2)}x</div>
          <div>Map Type: {mapType.toUpperCase()}</div>
          {markPoint && (
            <div>
              Current Location: {markPoint.latitude.toFixed(6)},{' '}
              {markPoint.longitude.toFixed(6)}
            </div>
          )}
          {/* {allPolygonLayers.length > 0 && (
          <div>
            Polygons:{' '}
            {allPolygonLayers
              .map(layer => `${layer.id}(${layer.data.length})`)
              .join(', ')}
          </div>
        )} */}
        </div>
      )}

      <PopupAlert
        open={popupOpen}
        type={popupType}
        message={popupMessage}
        onClose={() => {
          setPopupOpen(false);
        }}
      />

      {/* Confirm Modal */}
      <Modal
        id="trade_area_approve_modal"
        title={titleModal}
        isOpen={openModal}
        onClose={() => {}}
        closeButton={false}
        location="center"
        size="md"
        actions={actionModal}
      >
        {childModal}
      </Modal>
    </div>
  );
};
