import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PointLayer, PolygonLayer, PolygonData } from '@/components';
import type { LocationsResponse, POIPoint } from '@/services/location.service';
import { fetchSpatialLocations, fetchPOIByLayer } from '@/services/location.service';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Circle as CircleGeom } from 'ol/geom';
import type Map from 'ol/Map';
import {
  createChildArea,
  createTradeArea,
  updateTradeAreaLocation,
  type CreateTradeAreaRequest,
  type TradeAreaDto,
  type UpdateTradeAreaLocationRequest,
} from '@/services/tradeArea.service';

interface MapBounds {
  topLeft: [number, number];
  topRight: [number, number];
  bottomLeft: [number, number];
  bottomRight: [number, number];
}

interface MapState {
  // Map instance
  mapInstance: Map | null;

  // Map viewport state
  center: [number, number];
  zoom: number;

  // Layer data
  pointLayers: PointLayer[];
  polygonLayers: PolygonLayer[];
  selectedLayerIds: string[];

  // POI Layer state
  mapBounds: MapBounds | null;
  poiPoints: POIPoint[];
  poiPointsByLayer: Record<string, POIPoint[]>; // Isolated POI tracking by layer
  layerSpatialTypes: Record<string, string>; // Store spatialType per layer
  isFetchingPOI: boolean;
  layerVisibility: Record<string, boolean>; // Persist dropdown selections

  // Selection state
  selectedLocationId: string | null;
  editingPolygonId: string | null;
  selectedUid: string;
  selectedObjectId: string | null;

  // Editing state
  isEditing: boolean;
  editingAreaId: string | null;
  isCreatingArea: boolean;
  isCreatingBackupProfile: boolean;
  hasAreaData: boolean;
  editedCoordinates: Array<{ lat: number; lng: number }>;
  areaCoordinates: Array<{ lat: number; lng: number }>;
  editTradeAreaProperties: TradeAreaDto | null;
  radiusArea: {
    coordinates: number[];
    radius: number[];
  } | null;

  // creating area state
  creatingAreaStoreId: string | null;
  creatingAreaType: string | null;

  // Removing state
  removeLayerId: string | null;

  // Drawing state
  drawMode: 'circle' | 'polygon' | 'rectangle' | 'ellipse' | null;
  clearAllObjectOnMap: boolean;
  longestDistance: number | null;
  // Created POI state (for post-creation selection)
  createdPoiId: string | null;

  // Backup mark point (green pin shown on map from backup profile tab)
  backupMarkPoint: { latitude: number; longitude: number } | null;
  setBackupMarkPoint: (point: { latitude: number; longitude: number } | null) => void;

  // Actions - Map Instance
  setMapInstance: (map: Map | null) => void;

  // Actions - Viewport
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  centerOnPoint: (
    coordinates: [number, number],
    screenWidth: number,
    hasPopup?: boolean
  ) => void;

  // Actions - Layers
  setPointLayers: (layers: PointLayer[]) => void;
  addPointLayer: (layer: PointLayer) => void;
  setPolygonLayers: (layers: PolygonLayer[]) => void;
  addPolygonLayer: (layer: PolygonLayer) => void;
  removePolygonLayer: (layerId: string) => void;
  clearAllLayers: () => void;
  toggleLayerVisibility: (layerId: string) => void;
  poiByLayer: Record<string, POIPoint[]>; // เก็บ POI แยกตาม layer ID
  addPOILayer: (layerId: string, spatialType: string) => Promise<void>;
  removePOILayer: (layerId: string) => void;

  // Actions - POI Layers
  setSelectedLayerIds: (layerIds: string[]) => void;
  setMapBounds: (bounds: MapBounds) => void;
  fetchAndSetPOI: (forceRefresh?: boolean) => Promise<void>;
  setLayerVisibility: (visibility: Record<string, boolean>) => void;
  setLayerSpatialTypes: (types: Record<string, string>) => void;
  clearPOILayer: () => void;
  spatialType: string; // To track spatial type of selected layers
  setSpatialType: (spatialType: string) => void;

  // Actions - Selection
  setSelectedLocation: (locationId: string | null) => void;
  setEditingPolygonId: (id: string | null) => void;
  setSelectedUid: (uid: string) => void;
  setSelectedObject: (id: string | null) => void;

  // Actions - Editing
  setIsEditing: (isEditing: boolean) => void;
  setEditingAreaId: (id: string | null) => void;
  setIsCreatingArea: (isCreating: boolean) => void;
  setIsCreatingBackupProfile: (isCreating: boolean) => void;
  setHasAreaData: (hasData: boolean) => void;
  setEditedCoordinates: (coords: Array<{ lat: number; lng: number }>) => void;
  setAreaCoordinates: (coords: Array<{ lat: number; lng: number }>) => void;
  setTradeAreaProperties: (props: TradeAreaDto | null) => void;
  setRadiusArea: (coords: number[], radius: number[]) => void;

  // Action - Creating Area
  setCreatingAreaStoreId: (id: string | null) => void;
  setCreatingAreaType: (type: string | null) => void;
  setLongestDistance: (distance: number | null) => void;
  // Actions - Removing
  setRemoveLayerId: (id: string | null) => void;

  // Actions - Drawing
  setDrawMode: (mode: 'circle' | 'polygon' | 'rectangle' | 'ellipse' | null) => void;

  // Actions - Created POI
  setCreatedPoiId: (id: string | null) => void;

  // Complex actions (business logic)
  handleSearchResults: (
    result: LocationsResponse,
    preservePoint?: { id: number; coordinates: [number, number] },
    layerId?: string
  ) => void;
  displayPoiCircle: (
    poiId: number,
    coordinates: [number, number],
    radiusKm: number
  ) => void;
  displayPoiCircleWithStores: (
    poiId: number,
    coordinates: [number, number],
    radiusKm: number,
    spatialType: string,
    preserveZoom?: boolean
  ) => Promise<void>;
  clearMap: () => void;
  updatePointAreaData: (newCoordinates: Array<{ lat: number; lng: number }>) => void;

  // Async actions (API operations)
  saveEditedPolygon: (
    data: TradeAreaDto
  ) => Promise<{ success: boolean; message: string }>;
  cancelEditing: () => void;
  startCreatingArea: () => void;
  saveNewArea: (
    req: CreateTradeAreaRequest
  ) => Promise<{ success: boolean; message: string }>;
  createChildArea: (data: TradeAreaDto) => Promise<{ success: boolean; message: string }>;
  cancelCreatingArea: () => void;
}

// Utility function to calculate center offset (same as your existing logic)
const calculateOffsetCenter = (
  targetCoordinates: [number, number],
  zoomLevel: number,
  screenWidth: number,
  hasPopup: boolean = false
): [number, number] => {
  const baseOffset = 0.8;

  // if (screenWidth < 768) {
  //   baseOffset = 0.008;
  // } else if (screenWidth < 1024) {
  //   baseOffset = 0.012;
  // } else if (screenWidth >= 1920) {
  //   baseOffset = 0.018;
  // }

  const zoomFactor = Math.pow(2, 10 - zoomLevel);
  const screenFactor = Math.min(screenWidth / 1920, 2.5);
  let longitudeOffset = baseOffset * zoomFactor * screenFactor;

  // Subtract extra offset when popup is visible to move point more to the left
  // (negative offset moves the center right, making the point appear left)
  if (hasPopup) {
    const popupOffset = 0.3; // Additional offset for popup
    longitudeOffset -= popupOffset * zoomFactor * screenFactor;
  }

  return [targetCoordinates[0] - longitudeOffset, targetCoordinates[1]];
};

export const useMapStore = create<MapState>()(
  devtools(
    (set, get) => ({
      // Initial state
      mapInstance: null,
      center: [100.5437, 13.7495], // Bangkok
      zoom: 10,
      pointLayers: [],
      polygonLayers: [],
      selectedLayerIds: [],
      mapBounds: null,
      poiPoints: [],
      poiPointsByLayer: {},
      layerSpatialTypes: {},
      poiByLayer: {},
      isFetchingPOI: false,
      layerVisibility: {},
      selectedLocationId: null,
      selectedObjectId: null,
      editingPolygonId: null,
      selectedUid: '',
      isEditing: false,
      editingAreaId: null,
      isCreatingArea: false,
      isCreatingBackupProfile: false,
      hasAreaData: false,
      editedCoordinates: [],
      areaCoordinates: [],
      drawMode: null,
      clearAllObjectOnMap: false,
      removeLayerId: null,
      editTradeAreaProperties: null,
      backupMarkPoint: null,
      creatingAreaStoreId: null,
      creatingAreaType: null,
      radiusArea: null,
      createdPoiId: null,
      longestDistance: null,
      spatialType: '',
      // เพิ่มใน store
      addPOILayer: async (layerId: string, spatialType: string) => {
        const { mapBounds } = get();
        if (!mapBounds) return;

        try {
          const coordinates: Array<[number, number]> = [
            mapBounds.topLeft,
            mapBounds.topRight,
            mapBounds.bottomRight,
            mapBounds.bottomLeft,
            mapBounds.topLeft,
          ];

          const points = await fetchPOIByLayer({
            layerIds: [layerId],
            coordinates,
            spatialType,
          });

          set(
            state => {
              const newPoiByLayer = { ...state.poiByLayer, [layerId]: points };
              const allPoi = Object.values(newPoiByLayer).flat();

              return {
                poiByLayer: newPoiByLayer,
                poiPoints: allPoi, // รวม POI ทุก layer
              };
            },
            false,
            'addPOILayer'
          );
        } catch (error) {
          console.error('Failed to add POI layer:', error);
        }
      },

      removePOILayer: (layerId: string) => {
        set(
          state => {
            const newPoiByLayer = { ...state.poiByLayer };
            delete newPoiByLayer[layerId];
            const allPoi = Object.values(newPoiByLayer).flat();

            return {
              poiByLayer: newPoiByLayer,
              poiPoints: allPoi,
            };
          },
          false,
          'removePOILayer'
        );
      },

      // Map instance action
      setMapInstance: mapInstance => set({ mapInstance }, false, 'setMapInstance'),

      // Viewport actions
      setCenter: center => set({ center }, false, 'setCenter'),

      setZoom: zoom => set({ zoom }, false, 'setZoom'),

      centerOnPoint: (coordinates, screenWidth, hasPopup = false) => {
        const { zoom } = get();
        const offsetCenter = calculateOffsetCenter(
          coordinates,
          zoom,
          screenWidth,
          hasPopup
        );
        set({ center: offsetCenter }, false, 'centerOnPoint');
      },

      // Layer actions
      setPointLayers: pointLayers => set({ pointLayers }, false, 'setPointLayers'),

      addPointLayer: layer =>
        set(
          state => ({ pointLayers: [...state.pointLayers, layer] }),
          false,
          'addPointLayer'
        ),

      setPolygonLayers: polygonLayers =>
        set({ polygonLayers }, false, 'setPolygonLayers'),

      addPolygonLayer: layer =>
        set(
          state => ({ polygonLayers: [...state.polygonLayers, layer] }),
          false,
          'addPolygonLayer'
        ),

      removePolygonLayer: layerId => {
        set(state => ({
          polygonLayers: state.polygonLayers.filter(layer => layer.id !== layerId),
        }));
      },

      clearAllLayers: () =>
        set({ pointLayers: [], polygonLayers: [] }, false, 'clearAllLayers'),

      toggleLayerVisibility: (layerId: string) =>
        set(
          state => ({
            pointLayers: state.pointLayers.map(layer =>
              layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
            ),
            polygonLayers: state.polygonLayers.map(layer =>
              layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
            ),
          }),
          false,
          'toggleLayerVisibility'
        ),

      // POI Layer actions
      setSelectedLayerIds: selectedLayerIds =>
        set({ selectedLayerIds }, false, 'setSelectedLayerIds'),

      setMapBounds: mapBounds => set({ mapBounds }, false, 'setMapBounds'),

      setLayerVisibility: (visibility: Record<string, boolean>) =>
        set({ layerVisibility: visibility }, false, 'setLayerVisibility'),

      setLayerSpatialTypes: (layerSpatialTypes: Record<string, string>) =>
        set({ layerSpatialTypes }, false, 'setLayerSpatialTypes'),

      setSpatialType: (spatialType: string) =>
        set({ spatialType }, false, 'setSpatialType'),

      fetchAndSetPOI: async (forceRefresh = false) => {
        const { selectedLayerIds, mapBounds, poiPointsByLayer, layerSpatialTypes } =
          get();

        if (!mapBounds) {
          console.log('⚠️ No map bounds, skipping fetch');
          return;
        }

        if (selectedLayerIds.length === 0) {
          // Clear all POI when no layers selected
          set(
            {
              poiPoints: [],
              poiPointsByLayer: {},
              layerSpatialTypes: {},
              isFetchingPOI: false,
            },
            false,
            'fetchAndSetPOI:clear'
          );
          return;
        }

        try {
          // Calculate which layers to add vs remove
          const currentLayerIds = Object.keys(poiPointsByLayer);
          const selectedSet = new Set(selectedLayerIds);
          const currentSet = new Set(currentLayerIds);

          // Layers to remove (in current but not in selected)
          const layersToRemove = currentLayerIds.filter(id => !selectedSet.has(id));

          // Layers to fetch (in selected but not in current)
          // If forceRefresh, re-fetch ALL selected layers (for map bounds change)
          const layersToFetch = forceRefresh
            ? selectedLayerIds
            : selectedLayerIds.filter(id => !currentSet.has(id));

          // Start with current data
          const updatedByLayer = { ...poiPointsByLayer };

          // Remove unchecked layers
          layersToRemove.forEach(layerId => {
            delete updatedByLayer[layerId];
          });

          // Fetch new layers if any
          if (layersToFetch.length > 0) {
            set({ isFetchingPOI: true }, false, 'fetchAndSetPOI:start');

            // Create 5-point polygon (4 corners + closing point)
            const coordinates: Array<[number, number]> = [
              mapBounds.topLeft,
              mapBounds.topRight,
              mapBounds.bottomRight,
              mapBounds.bottomLeft,
              mapBounds.topLeft,
            ];

            for (const layerId of layersToFetch) {
              try {
                // Get the spatialType for this specific layer
                const layerSpatialType = layerSpatialTypes[layerId] || 'deliveryArea';

                const newPoints = await fetchPOIByLayer({
                  layerIds: [layerId], // Single layer per call
                  coordinates,
                  spatialType: layerSpatialType,
                });

                // Store points under the requested layer ID
                updatedByLayer[layerId] = newPoints;
              } catch (error) {
                console.error(`❌ Failed to fetch layer ${layerId}:`, error);
                // Continue with other layers even if one fails
              }
            }
          }

          // Flatten for backwards compatibility
          const allPoints = Object.values(updatedByLayer).flat();

          set(
            {
              poiPoints: allPoints,
              poiPointsByLayer: updatedByLayer,
              isFetchingPOI: false,
            },
            false,
            'fetchAndSetPOI:success'
          );
        } catch (error) {
          console.error('Failed to fetch POI:', error);
          set(
            {
              isFetchingPOI: false,
            },
            false,
            'fetchAndSetPOI:error'
          );
        }
      },

      clearPOILayer: () =>
        set(
          {
            selectedLayerIds: [],
            poiPoints: [],
            poiPointsByLayer: {},
            layerSpatialTypes: {},
            mapBounds: null,
          },
          false,
          'clearPOILayer'
        ),

      // Selection actions
      setSelectedLocation: selectedLocationId =>
        set({ selectedLocationId }, false, 'setSelectedLocation'),

      setEditingPolygonId: editingPolygonId =>
        set({ editingPolygonId }, false, 'setEditingPolygonId'),

      setSelectedUid: selectedUid => set({ selectedUid }, false, 'setSelectedUid'),
      setBackupMarkPoint: backupMarkPoint => set({ backupMarkPoint }, false, 'setBackupMarkPoint'),
      setSelectedObject: selectedObjectId =>
        set({ selectedObjectId }, false, 'setSelectedObject'),

      // Editing actions
      setIsEditing: isEditing => set({ isEditing }, false, 'setIsEditing'),

      setEditingAreaId: editingAreaId =>
        set({ editingAreaId }, false, 'setEditingAreaId'),

      setIsCreatingArea: isCreatingArea =>
        set({ isCreatingArea }, false, 'setIsCreatingArea'),
      setIsCreatingBackupProfile: isCreatingBackupProfile =>
        set({ isCreatingBackupProfile }, false, 'setIsCreatingBackupProfile'),

      setHasAreaData: hasAreaData => set({ hasAreaData }, false, 'setHasAreaData'),

      setEditedCoordinates: editedCoordinates =>
        set({ editedCoordinates }, false, 'setEditedCoordinates'),

      setTradeAreaProperties: editTradeAreaProperties =>
        set({ editTradeAreaProperties }, false, 'setTradeAreaProperties'),

      setAreaCoordinates: areaCoordinates =>
        set({ areaCoordinates }, false, 'setAreaCoordinates'),

      setRemoveLayerId: removeLayerId =>
        set({ removeLayerId }, false, 'setRemoveLayerId'),

      setRadiusArea: (coordinates, radius) => {
        set({ radiusArea: { coordinates, radius } }, false, 'setRadiusArea');
      },

      // Action - Creating Area
      setCreatingAreaStoreId: creatingAreaStoreId =>
        set({ creatingAreaStoreId }, false, 'setCreatingAreaStoreId'),

      setCreatingAreaType: (type: string | null) =>
        set({ creatingAreaType: type }, false, 'setCreatingAreaType'),

      // Drawing actions
      setDrawMode: drawMode => set({ drawMode }, false, 'setDrawMode'),

      // Created POI action
      setCreatedPoiId: createdPoiId => set({ createdPoiId }, false, 'setCreatedPoiId'),

      setLongestDistance: longestDistance =>
        set({ longestDistance }, false, 'setLongestDistance'),

      // Complex business logic
      handleSearchResults: (result, preservePoint, layerId = 'search-results') => {
        const { pointLayers, polygonLayers } = get();
        const poiList = result.data?.poi || [];
        const newPoints: any[] = [];
        const newPolygons: any[] = [];

        poiList.forEach((poi: any) => {
          // ---- 1) หา coordinates ของ polygon ----
          let shapeCoords = poi?.shape?.coordinates;

          if (!shapeCoords && poi.type === 'Polygon' && Array.isArray(poi.coordinates)) {
            shapeCoords = poi.coordinates;
          }

          if (!shapeCoords && typeof poi.shape === 'string') {
            try {
              const parsed = JSON.parse(poi.shape);
              if (parsed && parsed.coordinates) {
                shapeCoords = parsed.coordinates;
              }
            } catch {
              // ignore
            }
          }

          // ถ้ามี shapeCoords แปลว่าเป็น Polygon (Trade Area)
          if (shapeCoords) {
            // เตรียม props สำหรับ feature
            const polygonProps: any = {
              ...poi,
              name: poi.name || poi.storeName,
            };

            // 🔹 ถ้า backend ให้ areaColor มา → ต้องเป็น string "RGB(r,g,b)" เท่านั้น
            // เพื่อให้ BaseMap.parse ได้
            if (typeof poi.areaColor === 'string') {
              // ถ้า backend ส่งมาอยู่แล้วเป็น "RGB(...)" ก็ใช้ตรง ๆ เลย
              // ถ้า format อื่น ก็จะไม่เข้าเงื่อนไขใน BaseMap → fallback เป็น default
              polygonProps.areaColor = poi.areaColor;
            }

            newPolygons.push({
              id: String(poi.id),
              coordinates: shapeCoords,
              properties: polygonProps,
            });

            return; // จบเคส polygon
          }

          // ---- 2) ถ้าไม่ใช่ polygon → จัดการเป็น point ปกติ ----
          let pointCoords = poi.coordinates;
          if (!pointCoords && poi.longitude && poi.latitude) {
            pointCoords = [poi.longitude, poi.latitude];
          }

          // Force symbol to 'seven' for Seven-Eleven POI in search-results
          let symbol = poi.symbol;
          // If this is search-results layer, always check Seven-Eleven
          if (
            (layerId === 'search-results' || layerId === 'spatial-results') &&
            (poi.layerId === '1' || poi.spatialType === 'sevenEleven')
          ) {
            symbol = 'seven';
          }

          if (pointCoords) {
            newPoints.push({
              id: String(poi.id),
              coordinates: pointCoords,
              properties: {
                name: poi.name,
                poiId: poi.id,
                symbol,
                layerProperties: poi.layerProperties,
              },
            });
          }
        });
        // Preserve Point เดิม

        // Get symbol from first POI (all points in same layer should have same symbol)
        // Try to get symbol from multiple sources
        let layerSymbol: string | undefined;
        // Source 1: Check poi array for symbol
        if (poiList.length > 0 && poiList[0].symbol) {
          layerSymbol = poiList[0].symbol;
        }

        // If preservePoint is provided and not already in results, add it
        if (preservePoint) {
          const alreadyExists = newPoints.some(p => p.id === String(preservePoint.id));
          if (!alreadyExists) {
            newPoints.unshift({
              id: String(preservePoint.id),
              coordinates: preservePoint.coordinates,
              properties: {
                name: `POI ${preservePoint.id}`,
                poiId: preservePoint.id,
                symbol: layerSymbol,
              },
            });
          }
        }

        // กรอง layer เก่าออก
        const otherPointLayers = pointLayers.filter(layer => layer.id !== layerId);
        const otherPolygonLayers = polygonLayers.filter(
          l => l.id !== 'trade-area-results'
        );

        const layerName =
          layerId === 'search-results' ? 'Search Results' : 'Stores in Radius';

        set(
          {
            //poiPoints: poiList,

            pointLayers: [
              ...otherPointLayers,
              ...(newPoints.length > 0
                ? [
                    {
                      id: layerId,
                      name: layerName,
                      // Force symbol and style for all points in search-results
                      data:
                        (layerId === 'search-results' || layerId === 'spatial-results')
                          ? newPoints.map(p => ({ ...p, properties: { ...p.properties, symbol: 'seven' } }))
                          : newPoints,
                      style:
                        (layerId === 'search-results' || layerId === 'spatial-results')
                          ? { iconScale: 0.7 }
                          : {
                              radius: 8,
                              fill: 'red',
                              stroke: { color: 'white', width: 2 },
                              iconScale: 0.7,
                            },
                      symbol:
                        (layerId === 'search-results' || layerId === 'spatial-results')
                          ? 'seven'
                          : layerSymbol,
                    },
                  ]
                : []),
            ],

            polygonLayers: [
              ...otherPolygonLayers,
              ...(newPolygons.length > 0
                ? [
                    {
                      id: 'trade-area-results',
                      name: 'Trade Area Results',
                      visible: true,
                      data: newPolygons,
                      // default style (BaseMap จะ override ถ้ามี areaColor)
                      style: {
                        fill: 'rgba(255, 0, 0, 0.4)',
                        stroke: { color: 'rgba(100, 100, 100, 0.5)', width: 1 },
                      },
                    },
                  ]
                : []),
            ],
            clearAllObjectOnMap: false,
          },
          false,
          'handleSearchResults'
        );
      },

      displayPoiCircle: (
        poiId: number,
        coordinates: [number, number],
        radiusKm: number
      ) => {
        const { setZoom, centerOnPoint } = get();

        // Convert lon/lat to map projection
        const center = fromLonLat(coordinates);
        // Convert radius from km to meters for OpenLayers
        const radiusInMeters = radiusKm * 1000;
        // Create circle geometry
        const circleGeom = new CircleGeom(center, radiusInMeters);

        // Convert circle to polygon with 64 points
        const numPoints = 64;
        const circleCoordinates: Array<[number, number]> = [];
        const radius = circleGeom.getRadius();
        const centerCoords = circleGeom.getCenter();

        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const dx = radius * Math.cos(angle);
          const dy = radius * Math.sin(angle);
          const point = toLonLat([centerCoords[0] + dx, centerCoords[1] + dy]);
          circleCoordinates.push([point[0], point[1]]);
        }

        const circlePolygon: PolygonData = {
          id: `poi-circle-${poiId}`,
          coordinates: [circleCoordinates],
          properties: {
            name: `POI Circle - ${poiId}`,
            type: 'poi-circle',
            poiId,
          },
        };

        const circleLayer: PolygonLayer = {
          id: 'poi-circle',
          name: 'Selected POI Circle',
          data: [circlePolygon],
          style: {
            fill: 'rgba(255, 0, 0, 0.2)',
            stroke: { color: 'red', width: 2 },
          },
        };

        set({ polygonLayers: [circleLayer] }, false, 'displayPoiCircle');

        // Calculate zoom level based on circle radius
        // Larger radius = more zoom out (lower zoom level)
        // Formula: zoom = 15 - log2(radius in km)
        const calculatedZoom = Math.max(3, Math.min(15, 15 - Math.log2(radiusKm)));
        setZoom(calculatedZoom);
        centerOnPoint(coordinates, window.innerWidth);
      },

      displayPoiCircleWithStores: async (
        poiId: number,
        coordinates: [number, number],
        radiusKm: number,
        spatialType: string,
        preserveZoom: boolean = false
      ) => {
        const { setZoom, centerOnPoint, handleSearchResults } = get();

        // Check if this is competitor search type
        const isSevenImpactCompetitorSearch = spatialType === 'sevenImpactCompetitor';

        // Convert lon/lat to map projection
        const center = fromLonLat(coordinates);
        // Convert radius from km to meters for OpenLayers
        const radiusInMeters = radiusKm * 1000;
        // Create circle geometry
        const circleGeom = new CircleGeom(center, radiusInMeters);

        // Convert circle to polygon with 64 points for display
        const numPoints = 64;
        const circleCoordinates: Array<[number, number]> = [];
        const radius = circleGeom.getRadius();
        const centerCoords = circleGeom.getCenter();

        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const dx = radius * Math.cos(angle);
          const dy = radius * Math.sin(angle);
          const point = toLonLat([centerCoords[0] + dx, centerCoords[1] + dy]);
          circleCoordinates.push([point[0], point[1]]);
        }

        const circlePolygon: PolygonData = {
          id: `poi-circle-${poiId}`,
          coordinates: [circleCoordinates],
          properties: {
            name: `POI Circle - ${poiId}`,
            type: 'poi-circle',
            poiId,
          },
        };

        const circleLayer: PolygonLayer = {
          id: 'poi-circle',
          name: 'Selected POI Circle',
          data: [circlePolygon],
          style: {
            fill: 'rgba(255, 0, 0, 0.2)',
            stroke: { color: 'red', width: 2 },
          },
        };

        // Fetch 7-11 stores within the circle using spatial search
        try {
          const spatialResult = await fetchSpatialLocations(
            spatialType,
            circleCoordinates
          );

          // Display circle layer
          set(
            { polygonLayers: [circleLayer] },
            false,
            'displayPoiCircleWithStores:circle'
          );

          // Add spatial results as a separate layer using handleSearchResults
          if (spatialResult?.data?.poi && spatialResult.data.poi.length > 0) {
            handleSearchResults(
              spatialResult,
              { id: poiId, coordinates },
              'spatial-results'
            );
          }
        } catch (error) {
          console.error('Failed to fetch stores within circle:', error);

          // Display circle even if spatial fetch fails
          set(
            { polygonLayers: [circleLayer] },
            false,
            'displayPoiCircleWithStores:error'
          );
        }

        // Calculate zoom level based on circle radius
        const calculatedZoom = Math.max(3, Math.min(15, 15 - Math.log2(radiusKm)));
        if (preserveZoom) {
          // Force re-zoom by setting to slightly different value first
          setZoom(calculatedZoom - 0.01);
          setTimeout(() => setZoom(calculatedZoom), 10);
        } else {
          setZoom(calculatedZoom);
        }
        // centerOnPoint(coordinates, window.innerWidth);
        // setZoom(calculatedZoom);
        // Only shift map if it's competitor search
        centerOnPoint(coordinates, window.innerWidth, isSevenImpactCompetitorSearch);
      },

      clearMap: () => {
        set(
          {
            pointLayers: [],
            polygonLayers: [],
            isEditing: false,
            isCreatingArea: false,
            editingPolygonId: null,
            selectedLocationId: null,
            hasAreaData: false,
            editedCoordinates: [],
            drawMode: null,
            areaCoordinates: [],
            clearAllObjectOnMap: true,
          },
          false,
          'clearMap'
        );
      },

      updatePointAreaData: newCoordinates => {
        const { selectedLocationId } = get();
        if (!selectedLocationId) return;

        const areaCoordinates = [newCoordinates.map(coord => [coord.lng, coord.lat])];

        // Update point layers
        set(
          state => ({
            pointLayers: state.pointLayers.map(layer =>
              layer.id === 'search-results'
                ? {
                    ...layer,
                    data: layer.data.map(point => {
                      if (point.properties?.locationId === selectedLocationId) {
                        return {
                          ...point,
                          properties: {
                            ...point.properties,
                            area: {
                              id:
                                (point.properties.area as { id?: string })?.id ||
                                `area-${selectedLocationId}`,
                              shape: 'polygon',
                              coordinates: areaCoordinates,
                            },
                          },
                        };
                      }
                      return point;
                    }),
                  }
                : layer
            ),
          }),
          false,
          'updatePointAreaData:points'
        );

        // Update polygon layers
        set(
          state => ({
            polygonLayers: state.polygonLayers.map(layer =>
              layer.id === 'area-results'
                ? {
                    ...layer,
                    data: layer.data.map(polygon => ({
                      ...polygon,
                      coordinates: areaCoordinates,
                    })),
                  }
                : layer
            ),
            hasAreaData: true,
          }),
          false,
          'updatePointAreaData:polygons'
        );
      },

      // Async actions (API operations)
      saveEditedPolygon: async (
        data: TradeAreaDto
      ): Promise<{ success: boolean; message: string }> => {
        const {
          editingAreaId,
          editedCoordinates,
          setIsEditing,
          setEditedCoordinates,
          editTradeAreaProperties,
          longestDistance,
        } = get();

        if (!editingAreaId) {
          return { success: false, message: 'ไม่มีข้อมูลการแก้ไขที่จะบันทึก' };
        }

        const body: TradeAreaDto = {
          ...editTradeAreaProperties,
          shape: {
            type: 'Polygon',
            coordinates: [editedCoordinates.map(coord => [coord.lng, coord.lat])],
          },
          warning: longestDistance?.toString() ?? undefined,
          comment: data.comment || '',
          effectiveDate: data.effectiveDate || undefined,
          areaColor: data.areaColor || undefined,
        };

        try {
          if (!editTradeAreaProperties) {
            return {
              success: false,
              message: 'ไม่มีข้อมูลการแก้ไขที่จะบันทึก (Tradearea Id)',
            };
          }

          const requestData: UpdateTradeAreaLocationRequest = {
            id: Number(body.id),
            body,
          };

          await updateTradeAreaLocation(requestData);

          return { success: true, message: `บันทึกสำเร็จ` };
        } catch (error) {
          console.error('Failed to save edited polygon:', error);
          return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึก' };
        } finally {
          setIsEditing(false);
          setEditedCoordinates([]);
        }
      },

      createChildArea: async (
        data: TradeAreaDto
      ): Promise<{ success: boolean; message: string }> => {
        const {
          editingAreaId,
          editedCoordinates,
          setIsEditing,
          setEditedCoordinates,
          editTradeAreaProperties,
          longestDistance,
        } = get();

        if (!editingAreaId) {
          return { success: false, message: 'ไม่มีข้อมูลการแก้ไขที่จะบันทึก' };
        }

        if (!editTradeAreaProperties) {
          return { success: false, message: 'ไม่มีข้อมูลการแก้ไขที่จะบันทึก' };
        }

        const body: TradeAreaDto = {
          ...editTradeAreaProperties,
          shape: {
            type: 'Polygon',
            coordinates:
              editedCoordinates.length > 0
                ? [editedCoordinates.map(coord => [coord.lng, coord.lat])]
                : [],
          },
          warning: longestDistance?.toString() ?? undefined,
          comment: data.comment || '',
          effectiveDate: data.effectiveDate || undefined,
          areaColor: data.areaColor || undefined,
        };

        try {
          await createChildArea(Number(body.id), body);

          setIsEditing(false);
          setEditedCoordinates([]);
          return { success: true, message: `บันทึกสำเร็จ` };
        } catch (error) {
          console.error('Failed to save edited polygon:', error);
          return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึก' };
        } finally {
          setIsEditing(false);
          setEditedCoordinates([]);
        }
      },

      cancelEditing: () => {
        const { polygonLayers, setIsEditing, setEditedCoordinates } = get();

        setIsEditing(false);

        // Reset coordinates back to original values if needed
        const currentPolygonLayer = polygonLayers.find(
          layer => layer.id === 'area-results'
        );
        if (currentPolygonLayer && currentPolygonLayer.data.length > 0) {
          const originalCoords = currentPolygonLayer.data[0].coordinates[0].map(
            coord => ({
              lat: coord[1],
              lng: coord[0],
            })
          );
          setEditedCoordinates(originalCoords);
        } else {
          setEditedCoordinates([]);
        }
      },

      startCreatingArea: () => {
        const { setIsCreatingArea, setIsEditing } = get();
        setIsCreatingArea(true);
        setIsEditing(true);
      },

      saveNewArea: async (
        req: CreateTradeAreaRequest
      ): Promise<{ success: boolean; message: string }> => {
        const {
          creatingAreaStoreId,
          areaCoordinates,
          setIsCreatingArea,
          setIsEditing,
          setEditedCoordinates,
          creatingAreaType,
        } = get();
        if (!creatingAreaStoreId || areaCoordinates.length === 0) {
          return { success: false, message: 'ไม่มีข้อมูลที่จะบันทึก' };
        }

        try {
          const requestData: CreateTradeAreaRequest = {
            ...req,
            poiId: Number(creatingAreaStoreId),
            shape: {
              type: 'Polygon',
              coordinates: [areaCoordinates.map(coord => [coord.lng, coord.lat])],
            },
            status: 'DRAFT',
            type: creatingAreaType || 'delivery_area',
          };

          await createTradeArea(requestData);

          return { success: true, message: 'สร้าง area ใหม่เรียบร้อยแล้ว!' };
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
          };
        } finally {
          setIsCreatingArea(false);
          setIsEditing(false);
          setEditedCoordinates([]);
        }
      },

      cancelCreatingArea: () => {
        set(
          {
            isCreatingArea: false,
            isEditing: false,
            editedCoordinates: [],
            polygonLayers: [],
          },
          false,
          'cancelCreatingArea'
        );
      },
    }),
    {
      name: 'map-store',
      enabled: import.meta.env.DEV,
    }
  )
);
