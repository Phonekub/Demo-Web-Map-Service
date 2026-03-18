import { useEffect, useState, useCallback } from 'react';
import { fromLonLat } from 'ol/proj';
import { useTranslation } from 'react-i18next';
import { useMapStore } from '@/stores/mapStore';
import {
  fetchCompetitorStores,
  type CompetitorStoresResponse,
} from '../../../services/location.service';

interface CompetitorPopupProps {
  uid: string;
  branchCode: string;
  coordinates: [number, number]; // [lng, lat]
  onClose: () => void;
}

const POPUP_CONFIG = {
  WIDTH: 440,
  HEIGHT: 400,
  OFFSET_X: 40,
  OFFSET_Y: -80,
  VIEWPORT_PADDING: 20,
  POSITION_DELAY: 100,
} as const;

export const CompetitorPopup = ({
  uid,
  branchCode,
  coordinates,
  onClose,
}: CompetitorPopupProps) => {
  const { t } = useTranslation(['maps']);
  const [data, setData] = useState<CompetitorStoresResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const mapInstance = useMapStore(state => state.mapInstance);

  // Fetch competitor stores data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await fetchCompetitorStores(uid);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch competitor stores:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [uid]);

  // Calculate popup position based on map coordinates
  const calculatePosition = useCallback(() => {
    if (!mapInstance) {
      setPosition({ x: POPUP_CONFIG.VIEWPORT_PADDING, y: 100 });
      return;
    }

    const mapElement = mapInstance.getTargetElement() as HTMLElement;
    if (!mapElement) return;

    const projectedCoords = fromLonLat(coordinates);
    const pixel = mapInstance.getPixelFromCoordinate(projectedCoords);

    if (!pixel) return;

    const mapRect = mapElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate initial position relative to marker
    let x = mapRect.left + pixel[0] + POPUP_CONFIG.OFFSET_X;
    let y = mapRect.top + pixel[1] + POPUP_CONFIG.OFFSET_Y;

    // Adjust if popup exceeds viewport bounds
    if (x + POPUP_CONFIG.WIDTH > viewportWidth - POPUP_CONFIG.VIEWPORT_PADDING) {
      x = mapRect.left + pixel[0] - POPUP_CONFIG.WIDTH - POPUP_CONFIG.OFFSET_X;
    }

    if (x < POPUP_CONFIG.VIEWPORT_PADDING) {
      x = POPUP_CONFIG.VIEWPORT_PADDING;
    }

    if (y + POPUP_CONFIG.HEIGHT > viewportHeight - POPUP_CONFIG.VIEWPORT_PADDING) {
      y = viewportHeight - POPUP_CONFIG.HEIGHT - POPUP_CONFIG.VIEWPORT_PADDING;
    }

    if (y < POPUP_CONFIG.VIEWPORT_PADDING) {
      y = POPUP_CONFIG.VIEWPORT_PADDING;
    }

    setPosition({ x, y });
  }, [mapInstance, coordinates]);

  // Handle map movement and popup visibility
  useEffect(() => {
    if (!mapInstance) return;

    setIsVisible(false);
    let isFirstLoad = true;

    const handleMapMoveEnd = () => {
      setTimeout(() => {
        calculatePosition();
        setIsVisible(true);
        isFirstLoad = false;
      }, POPUP_CONFIG.POSITION_DELAY);
    };

    const handleMapMoveStart = () => {
      if (!isFirstLoad) {
        setIsVisible(false);
      }
    };

    mapInstance.once('moveend', handleMapMoveEnd);
    mapInstance.on('movestart', handleMapMoveStart);

    return () => {
      mapInstance.un('movestart', handleMapMoveStart);
      mapInstance.un('moveend', handleMapMoveEnd);
    };
  }, [coordinates, mapInstance, calculatePosition]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className="absolute w-[440px] pointer-events-auto transition-opacity duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          opacity: isVisible ? 1 : 0,
        }}
      >
        <div className="relative bg-white rounded-lg shadow-xl overflow-visible">
          {/* Triangle pointer */}
          <div
            className="absolute -left-6 top-14 w-0 h-0 z-10"
            style={{
              borderTop: '24px solid transparent',
              borderBottom: '24px solid transparent',
              borderRight: '24px solid white',
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between bg-[#424242] text-white px-4 py-3 gap-2 rounded-t-lg">
            <h3 className="text-base font-semibold truncate flex-1">
              {t('maps:competitor_popup_title', { branchCode, total: data?.total || 0 })}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-[#6D28D9] rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading loading-spinner loading-lg" />
              </div>
            ) : !data?.stores?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <svg
                  className="w-12 h-12 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium">{t('maps:no_options_found')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.stores.map((store, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-b-0 border-gray-100"
                  >
                    <span className="text-base text-gray-700">
                      {store.typeNameTh || store.typeName}
                    </span>
                    <span className="text-base font-medium text-gray-900">
                      {store.count} {t('maps:store_unit')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
