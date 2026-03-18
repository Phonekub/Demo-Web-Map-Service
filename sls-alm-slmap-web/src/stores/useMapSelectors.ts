import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from './mapStore';

/**
 * Performance-optimized selector hooks for map store
 * Uses shallow comparison to prevent unnecessary re-renders
 */

// Viewport state selector
export const useMapViewport = () =>
  useMapStore(
    useShallow(state => ({
      center: state.center,
      zoom: state.zoom,
      setCenter: state.setCenter,
      setZoom: state.setZoom,
      centerOnPoint: state.centerOnPoint,
    }))
  );

// Layer data selector
export const useMapLayers = () =>
  useMapStore(
    useShallow(state => ({
      pointLayers: state.pointLayers,
      polygonLayers: state.polygonLayers,
      setPointLayers: state.setPointLayers,
      addPointLayer: state.addPointLayer,
      setPolygonLayers: state.setPolygonLayers,
      addPolygonLayer: state.addPolygonLayer,
      clearAllLayers: state.clearAllLayers,
    }))
  );

// POI Layer selector
export const usePOILayer = () =>
  useMapStore(
    useShallow((state) => ({
      selectedLayerIds: state.selectedLayerIds,
      mapBounds: state.mapBounds,
      poiPoints: state.poiPoints,
      isFetchingPOI: state.isFetchingPOI,
      setSelectedLayerIds: state.setSelectedLayerIds,
      setMapBounds: state.setMapBounds,
      fetchAndSetPOI: state.fetchAndSetPOI,
      clearPOILayer: state.clearPOILayer,
    }))
  );

// Selection state selector
export const useMapSelection = () =>
  useMapStore(
    useShallow(state => ({
      selectedLocationId: state.selectedLocationId,
      selectedObjectId: state.selectedObjectId,
      editingPolygonId: state.editingPolygonId,
      setSelectedLocation: state.setSelectedLocation,
      setSelectedObject: state.setSelectedObject,
      setEditingPolygonId: state.setEditingPolygonId,
    }))
  );

// Editing state selector
export const useMapEditing = () =>
  useMapStore(
    useShallow(state => ({
      isEditing: state.isEditing,
      isCreatingArea: state.isCreatingArea,
      hasAreaData: state.hasAreaData,
      editedCoordinates: state.editedCoordinates,
      areaCoordinates: state.areaCoordinates,
      setIsEditing: state.setIsEditing,
      setIsCreatingArea: state.setIsCreatingArea,
      setHasAreaData: state.setHasAreaData,
      setEditedCoordinates: state.setEditedCoordinates,
      setAreaCoordinates: state.setAreaCoordinates,
      saveEditedPolygon: state.saveEditedPolygon,
      cancelEditing: state.cancelEditing,
      startCreatingArea: state.startCreatingArea,
      saveNewArea: state.saveNewArea,
      cancelCreatingArea: state.cancelCreatingArea,
    }))
  );

// Drawing state selector
export const useMapDrawing = () =>
  useMapStore(
    useShallow(state => ({
      drawMode: state.drawMode,
      clearAllObjectOnMap: state.clearAllObjectOnMap,
      setDrawMode: state.setDrawMode,
    }))
  );

// Business logic actions selector
export const useMapActions = () =>
  useMapStore(
    useShallow(state => ({
      handleSearchResults: state.handleSearchResults,
      clearMap: state.clearMap,
      updatePointAreaData: state.updatePointAreaData,
    }))
  );

export const useMapRemove = () =>
  useMapStore(
    useShallow(state => ({
      removeLayerId: state.removeLayerId,
      setRemoveLayerId: state.setRemoveLayerId,
    }))
  );
