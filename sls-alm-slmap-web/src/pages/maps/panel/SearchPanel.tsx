import {
  createElement,
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { type LocationsResponse } from '../../../services/location.service';
import Card from '../../../components/base/Card';
import { useFilterStore } from '@/stores';
import { useMapStore } from '@/stores/mapStore';
import { Button } from '../../../components';
import { ShapeSelector } from './ShapeSelector';
import {
  BuildingStorefrontIcon,
  TruckIcon,
} from '@heroicons/react/24/solid';
import { FilterTradeArea } from '../filter/FilterTradeArea';

const FilterSeven = lazy(() =>
  import('../filter/FilterSeven').then(module => ({
    default: module.FilterSeven,
  }))
);


export interface FilterComponentProps {
  onSearchSubmit: (results: LocationsResponse) => void;
  onClose: () => void;
  areaCoordinates?: { lat: number; lng: number }[];
  onEnableDrawing?: (
    shape: 'circle' | 'polygon' | 'rectangle' | 'ellipse' | null
  ) => void;
  onDrawComplete?: (coordinates: Array<{ lat: number; lng: number }>) => void;
}

interface ComponentMapItem {
  filterName: string;
  filterKey: string;
  component: () => Promise<{ default: React.ComponentType<FilterComponentProps> }>;
  icon: React.ReactNode;
}

interface SearchPanelProps {
  onSearchResults: (results: LocationsResponse | null, show: boolean) => void;
  closeFilterPanel: () => void;
  onEnableDrawing?: (
    shape: 'circle' | 'polygon' | 'rectangle' | 'ellipse' | null,
    filterKey: string
  ) => void;
  areaCoordinates?: { lat: number; lng: number }[] | undefined;
}

export const SearchPanel = ({
  onSearchResults,
  closeFilterPanel: closeFilter,
  onEnableDrawing,
  areaCoordinates: _areaCoordinates,
}: SearchPanelProps) => {
  const { t } = useTranslation(['maps']);
  const { areaCoordinates } = useMapStore();
  const {
    lastFilterIndex,
    setLastFilter,
    setError,
    resetFilter,
    setIsSevenElevenFilter,
  } = useFilterStore();
  const [showShapeButtons, setShowShapeButtons] = useState(false);
  const [currentFilterIndex, setCurrentFilterIndex] = useState(lastFilterIndex);

  const componentsMap: ComponentMapItem[] = useMemo(
    () => [
      {
        filterName: t('maps:filter_seven_eleven'),
        filterKey: 'sevenEleven',
        component: () => Promise.resolve({ default: FilterSeven }),
        icon: <BuildingStorefrontIcon className="size-5" />,
      },
      {
        filterName: t('maps:filter_trade_area'),
        filterKey: 'filterTradeArea',
        component: () => Promise.resolve({ default: FilterTradeArea }),
        icon: <TruckIcon className="size-5" />,
      },
    ],
    [t]
  );

  const initialFilter = componentsMap[lastFilterIndex];

  const [currentComponent, setCurrentComponent] =
    useState<React.ComponentType<FilterComponentProps> | null>(null);

  // Load component when page opens
  useEffect(() => {
    (async () => {
      const loaded = await initialFilter.component();
      setCurrentComponent(() => loaded.default);
      console.log('Initial filter loaded:', initialFilter.filterKey);
    })();
  }, [initialFilter]);

  const handleShapeSelect = useCallback(
    (shape: 'circle' | 'polygon' | 'rectangle' | 'ellipse' | null) => {
      if (onEnableDrawing) {
        onEnableDrawing(shape, componentsMap[currentFilterIndex].filterKey);
        setShowShapeButtons(false);
        resetFilter(componentsMap[currentFilterIndex].filterKey);
      }
    },
    [onEnableDrawing, componentsMap, currentFilterIndex, resetFilter]
  );

  const onSearchSubmit = (location: LocationsResponse) => {
    onSearchResults(location, true);
  };

  const onComponentSelect = async (
    componentLoader: ComponentMapItem['component'],
    filterIndex: number
  ) => {
    // Clear map state to prevent fetching with old coordinates
    const setAreaCoordinates = useMapStore.getState().setAreaCoordinates;
    const setPolygonLayers = useMapStore.getState().setPolygonLayers;
    const setPointLayers = useMapStore.getState().setPointLayers;
    const setDrawMode = useMapStore.getState().setDrawMode;

    setAreaCoordinates([]);
    setPolygonLayers([]);
    setPointLayers([]);
    setDrawMode(null);

    // Reset previous filter state
    const nextFilter = componentsMap[filterIndex];
    setError(nextFilter.filterKey, '');
    resetFilter(nextFilter.filterKey);

    // save last filter
    setLastFilter(filterIndex);

    // Switch to new filter
    const loadedComponent = await componentLoader();
    setCurrentComponent(() => loadedComponent.default);
    setCurrentFilterIndex(filterIndex);

    if (componentsMap[filterIndex].filterKey == 'sevenEleven') {
      setIsSevenElevenFilter(true);
    } else {
      setIsSevenElevenFilter(false);
    }
  };

  return (
    <Card>
      <div className="grid grid-cols-7">
        <div className="col-span-2 pt-0">
          <div className="flex flex-col">
            {componentsMap.map((item, index) => (
              <div className="mb-3" key={index}>
                <Button
                  type="button"
                  variant="primary"
                  className={`btn-outline shadow-none w-full ${currentFilterIndex === index && 'btn-active'}`}
                  onClick={() => onComponentSelect(item.component, index)}
                  icon={item.icon}
                >
                  {item.filterName}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-1 divider divider-horizontal"></div>

        <div className="col-span-4 min-h-[300px] max-h-[500px] overflow-y-auto p-3">
          {/* Area Search Button - Top Right */}
          <div className="flex justify-end mb-2">
            <div className="relative">
              <Button
                variant="outline"
                className="text-sm px-3 py-1.5"
                type="button"
                onClick={() => setShowShapeButtons(!showShapeButtons)}
              >
                <svg
                  className="w-4 h-4 mr-1 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                {t('maps:search_by_area')}
              </Button>

              {/* Shape Selector Buttons */}
              {showShapeButtons && <ShapeSelector onShapeSelect={handleShapeSelect} />}
            </div>
          </div>
          {currentComponent && (
            <Suspense fallback={<div>{t('maps:searching')}</div>}>
              {createElement(currentComponent, {
                onSearchSubmit,
                onClose: () => closeFilter(),
                areaCoordinates: areaCoordinates,
              })}
            </Suspense>
          )}
        </div>
      </div>
    </Card>
  );
};
