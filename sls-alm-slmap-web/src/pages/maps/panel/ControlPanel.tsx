import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchResult } from './SearchResult';
import { CompetitorPopup } from './CompetitorPopup';
import {
  fetchSpatialLocations,
  type Location,
  type LocationInfo,
  type LocationsResponse,
} from '../../../services/location.service';
import { SearchPanel } from './SearchPanel';
import { InfoPanel } from './InfoPanel';
import { Button } from '../../../components';
import { useMapStore } from '@/stores/mapStore';
import { useFilterStore } from '@/stores';
import { useMapDrawing } from '../../../stores/useMapSelectors';
import { CreateBackupProfile } from '../pointpotential/CreateBackupProfile';

// No more props - everything comes from the store!

interface ControlProps {
  locationData: Location | null;
}

export const ControlPanel = ({ locationData }: ControlProps) => {
  const { t } = useTranslation(['maps']);

  // Get data and actions from store
  const handleSearchResults = useMapStore(state => state.handleSearchResults);
  const displayPoiCircleWithStores = useMapStore(
    state => state.displayPoiCircleWithStores
  );
  const setZoom = useMapStore(state => state.setZoom);
  const { clearAllObjectOnMap } = useMapDrawing();
  const setDrawMode = useMapStore(state => state.setDrawMode);
  const centerOnPoint = useMapStore(state => state.centerOnPoint);
  const areaCoordinates = useMapStore(state => state.areaCoordinates);
  const setSelectedUid = useMapStore(state => state.setSelectedUid);
  const selectedUid = useMapStore(state => state.selectedUid);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [isInfoPanelUpdateForm, setIsInfoPanelUpdateForm] = useState(true);
  const createdPoiId = useMapStore(state => state.createdPoiId);
  const setCreatedPoiId = useMapStore(state => state.setCreatedPoiId);
  const [searchResults, setSearchResults] = useState<LocationsResponse | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Array<{
    lat: number;
    lng: number;
  }> | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [selectedStoreCode, setSelectedStoreCode] = useState<string | null>(null);
  const [showCompetitorPopup, setShowCompetitorPopup] = useState(false);
  const [selectedSevenImpactCompetitorPoi, setSelectedSevenImpactCompetitorPoi] =
    useState<{
      uid: string;
      branchCode: string;
      coordinates: [number, number];
    } | null>(null);
  const isCreatingBackupProfile = useMapStore(state => state.isCreatingBackupProfile);
  const [backupCoordinates, setBackupCoordinates] = useState<Array<[number, number]>>([]);
  const [infoActiveTab, setInfoActiveTab] = useState<string>('Information');
  // React to newly created POI: select it and show InfoPanel
  useEffect(() => {
    if (createdPoiId) {
      setSelectedPoiId(createdPoiId);
      setShowInfoPanel(true);
      setShowSearchPanel(false);
      setIsInfoPanelUpdateForm(true);
      setCreatedPoiId(null); // Clear to avoid re-triggering
    }
  }, [createdPoiId, setCreatedPoiId]);

  // const [poiData, setPoiData] = useState<Poi>();
  // const [potentialStore, setPotentialStore] = useState<PotentialStore | null>(null);
  // const [sevenEleven, setSevenEleven] = useState<SevenEleven | null>(null);
  // const [vendingMachine, setVendingMachine] = useState<VendingMachine | null>(null);

  // ============================================================================
  // Helper: Normalize Polygon
  // ============================================================================
  const normalizePolygon = (coords: any[]) => {
    if (!coords || !Array.isArray(coords) || coords.length === 0) return null;
    const level1 = coords[0];
    if (!level1 || !Array.isArray(level1)) return null;
    if (Array.isArray(level1[0]) && Array.isArray(level1[0][0])) return level1;
    if (Array.isArray(level1[0]) && typeof level1[0][0] === 'number') return coords;
    if (typeof level1[0] === 'number') return [coords];
    return null;
  };

  // ============================================================================
  // Backup Profile Coordinate Preparation
  // ============================================================================

  /** Convert area coordinates to spatial format for backup profile */
  useEffect(() => {
    if (!isCreatingBackupProfile || !areaCoordinates?.length) {
      return;
    }

    const spatialCoords: Array<[number, number]> = areaCoordinates.map(coord => [
      coord.lng,
      coord.lat,
    ]);

    // Ensure polygon is closed (first point equals last point)
    if (spatialCoords.length > 0) {
      const first = spatialCoords[0];
      const last = spatialCoords[spatialCoords.length - 1];
      const isClosed = first[0] === last[0] && first[1] === last[1];
      if (!isClosed) {
        spatialCoords.push(first);
      }
    }

    setBackupCoordinates(spatialCoords);
  }, [isCreatingBackupProfile, areaCoordinates]);

  // ============================================================================
  // Effects
  // ============================================================================
  const { isEditing, isCreatingArea } = useMapStore();
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  useEffect(() => {
    if (clearAllObjectOnMap) {
      setSearchResults(null);
      // Ensure search panel inputs are also cleared, even if the panel is closed
      useFilterStore.getState().resetAll();
    }
  }, [clearAllObjectOnMap]);

  const onSearchResults = useCallback(
    (results: LocationsResponse | null, show: boolean) => {
      setSearchResults(results);
      setShowSearchResults(show);

      // Extract and save filterType from search params
      if (results?.params?.type) {
        setFilterType(results.params.type);
      }

      if (results) {
        handleSearchResults(results);
      }
    },
    [handleSearchResults]
  );

  const handleCloseResults = () => {
    setShowSearchResults(false);
  };

  const handleFilterToggle = () => {
    setShowSearchPanel(!showSearchPanel);
    setShowInfoPanel(false);
  };

  const onLocationSelect = (locationData: Location) => {
    setShowSearchPanel(false);
    setShowInfoPanel(true);

    setSelectedUid(locationData.uid || ''); // Store uid from location
    setSelectedStoreCode(locationData.branchCode);
    setSelectedLocation(locationData);
    setShowInfoPanel(true);

    //TODO: Refactor isTradeAreaSearch
    const isTradeAreaSearch =
      filterType === 'filterTradeArea' || filterType === 'tradearea';

    if (isTradeAreaSearch) {
      setSelectedPoiId(locationData.poiId != null ? String(locationData.poiId) : '');
    } else {
      setSelectedPoiId(String(locationData.id));
    }

    // Center map on selected location
    const coordinates: [number, number] = [
      locationData.geom.coordinates[0],
      locationData.geom.coordinates[1],
    ];

    // Check if this is a 7-11 competitor search
    const isSevenImpactCompetitorSearch = filterType === 'sevenImpactCompetitor';

    // Display circle for selected POI if it has a radius
    if (searchResults) {
      const poiData = searchResults.data.poi.find(
        poi => poi.id === parseInt(locationData.id)
      );

      if (poiData?.radius) {
        // Use mapStore function to display circle
        // Always force re-zoom on every click
        displayPoiCircleWithStores(
          poiData.id,
          coordinates,
          poiData.radius,
          'sevenEleven',
          true
        );
      } else {
        // No radius, use default zoom
        setZoom(14.99);
        setTimeout(() => {
          setZoom(15);
          centerOnPoint(coordinates, window.innerWidth, isSevenImpactCompetitorSearch);
        }, 10);
      }

      // Show competitor popup if this is a competitor search
      if (isSevenImpactCompetitorSearch && poiData) {
        setSelectedSevenImpactCompetitorPoi({
          uid: locationData.uid,
          branchCode: locationData.branchCode,
          coordinates: coordinates,
        });
        setShowCompetitorPopup(true);
      }
    } else {
      setTimeout(() => {
        setZoom(15);
        centerOnPoint(coordinates, window.innerWidth, isSevenImpactCompetitorSearch);
      }, 10);
    }
  };

  const handleEnableDrawing = (
    shape: 'circle' | 'polygon' | 'rectangle' | 'ellipse' | null,
    type: string
  ) => {
    setDrawMode(shape);
    setFilterType(type);
    setShowSearchPanel(false);
  };

  useEffect(() => {
    if (Array.isArray(areaCoordinates) && areaCoordinates.length > 0) {
      setCoordinates(areaCoordinates);
    } else {
      setCoordinates([]);
    }
  }, [areaCoordinates]);

  useEffect(() => {
    async function handleSearchSpatial() {
      if (
        !coordinates ||
        coordinates.length === 0 ||
        !filterType ||
        isCreatingBackupProfile ||
        isCreatingArea ||
        isEditing
      )
        return;

      try {
        const spatialCoords: Array<[number, number]> = coordinates.map(coord => [
          coord.lng,
          coord.lat,
        ]);

        if (spatialCoords.length > 0) {
          const first = spatialCoords[0];
          const last = spatialCoords[spatialCoords.length - 1];
          const isClosed = first[0] === last[0] && first[1] === last[1];
          if (!isClosed) {
            spatialCoords.push(first);
          }
        }

        // Map filterType
        const spatialType = filterType === 'filterTradeArea' ? 'tradearea' : filterType;
        const result = await fetchSpatialLocations(spatialType, spatialCoords);

        const rawSearch = result?.data?.search ?? [];
        const rawPoi = result?.data?.poi ?? [];

        //  Normalize POI สำหรับ Trade Area
        let normalizedPoi = rawPoi;
        if (filterType === 'filterTradeArea') {
          normalizedPoi = rawPoi.map((item: any) => {
            let shapeObj =
              typeof item.shape === 'string' ? JSON.parse(item.shape) : item.shape;
            if (!shapeObj && item.type === 'Polygon' && Array.isArray(item.coordinates)) {
              shapeObj = { type: 'Polygon', coordinates: item.coordinates };
            }
            if (!shapeObj || !shapeObj.coordinates) return item;
            const cleanCoords = normalizePolygon(shapeObj.coordinates);
            return cleanCoords
              ? { ...item, shape: { ...shapeObj, coordinates: cleanCoords } }
              : item;
          });
        }

        const searchResults = {
          data: {
            search: rawSearch,
            poi: normalizedPoi,
          },
          total: result?.total ?? rawSearch.length ?? 0,
          params: {
            type: filterType,
            isSpatial: true,
          },
        };

        onSearchResults(searchResults, true);
        setDrawMode(null);
      } catch (error) {
        console.error('Error fetching spatial locations:', error);
        const searchResults = {
          data: { search: [], poi: [] },
          total: 0,
        };
        onSearchResults(searchResults, true);
      }
    }

    handleSearchSpatial();
  }, [
    coordinates,
    filterType,
    onSearchResults,
    setDrawMode,
    isCreatingBackupProfile,
    isCreatingArea,
  ]);

  // ============================================================================
  // Backup Profile Handlers
  // ============================================================================

  /** Cancel backup profile creation and reset all states */
  const handleBackupProfileCancel = useCallback(() => {
    setCoordinates([]);
    useMapStore.getState().setAreaCoordinates([]);
    useMapStore.getState().cancelCreatingArea();
    useMapStore.getState().setIsCreatingBackupProfile(false);
  }, []);

  /** Clear drawn area and reset drawing mode for redraw */
  const handleBackupProfileClearArea = useCallback(() => {
    const { radiusArea } = useMapStore.getState();

    // Clear all coordinate states
    setCoordinates([]);
    setBackupCoordinates([]);
    useMapStore.getState().setAreaCoordinates([]);

    // Clear polygon layers and edited coordinates
    useMapStore.setState({
      polygonLayers: [],
      editedCoordinates: [],
    });

    // Toggle isCreatingArea to reset drawing interaction
    useMapStore.getState().setIsCreatingArea(false);

    // Re-initialize drawing after short delay
    setTimeout(() => {
      if (radiusArea) {
        useMapStore.getState().setRadiusArea(radiusArea.coordinates, radiusArea.radius);
      }
      useMapStore.getState().setIsCreatingArea(true);
    }, 50);
  }, []);

  /** Save selected POIs and close backup profile panel */
  const handleBackupProfileSave = useCallback(() => {
    // TODO: Implement API call to save selected POIs
    useMapStore.getState().setIsCreatingBackupProfile(false);
    setCoordinates([]);
    useMapStore.getState().setAreaCoordinates([]);
    useMapStore.getState().cancelCreatingArea();
  }, []);

  // ============================================================================
  // Render
  // ============================================================================
  useEffect(() => {
    if (!locationData) {
      return;
    }
    onLocationSelect(locationData);
  }, [locationData]);

  useEffect(() => {
    setIsDrawing(isCreatingArea || isEditing);
  }, [isEditing, isCreatingArea]);

  return (
    <div className="flex flex-row z-11">
      {/* Main Panel */}
      <div className="w-72 max-w-1/3">
        {!isDrawing && (
          <Button
            className="btn btn-primary shadow-none rounded-lg px-6 w-full"
            onClick={() => handleFilterToggle()}
          >
            {t('maps:search_filter')}
          </Button>
        )}

        {/* Search Results */}
        {!isDrawing && showSearchResults && searchResults && !isCreatingBackupProfile && (
          <div className="mt-2 w-full shadow-lg">
            <SearchResult
              locations={searchResults}
              onClose={handleCloseResults}
              isLoading={false}
              onLocationSelect={onLocationSelect}
            />
          </div>
        )}
      </div>

      {/* Sub Panel */}
      {(!isDrawing || isCreatingBackupProfile) &&
        (showSearchPanel || showInfoPanel || isCreatingBackupProfile) && (
          <div
            className={`ml-3 ${
              infoActiveTab === 'Trade Area' ? 'w-[60%] xl:w-[80%]' : 'w-[60%] xl:w-[80%]'
            }`}
          >
            {showSearchPanel && (
              <SearchPanel
                onSearchResults={onSearchResults}
                closeFilterPanel={() => setShowSearchPanel(false)}
                onEnableDrawing={handleEnableDrawing}
                areaCoordinates={areaCoordinates}
              />
            )}
            {/* Only show InfoPanel if not creating area or backup profile */}
            {showInfoPanel && !isCreatingBackupProfile && (
              <InfoPanel
                poiId={selectedPoiId || ''}
                uid={selectedUid}
                storeCode={selectedStoreCode || ''}
                location={selectedLocation || null}
                onClose={() => setShowInfoPanel(false)}
                isCreateBackupArea={false}
                // selectComponent={startTab}
                onTabChange={setInfoActiveTab}
                isUpdateForm={isInfoPanelUpdateForm}
                // startTab={startTab}
              />
            )}
            {isCreatingBackupProfile && (
              <CreateBackupProfile
                coordinates={backupCoordinates}
                onCancel={handleBackupProfileCancel}
                onClearArea={handleBackupProfileClearArea}
                onSave={handleBackupProfileSave}
                poiId={selectedPoiId || ''}
                location={selectedLocation || null}
                locationName={selectedLocation?.branchName || ''}
              />
            )}
          </div>
        )}

      {/* Competitor Popup */}
      {showCompetitorPopup && selectedSevenImpactCompetitorPoi && (
        <CompetitorPopup
          uid={selectedSevenImpactCompetitorPoi.uid}
          branchCode={selectedSevenImpactCompetitorPoi.branchCode}
          coordinates={selectedSevenImpactCompetitorPoi.coordinates}
          onClose={() => setShowCompetitorPopup(false)}
        />
      )}
    </div>
  );
};
