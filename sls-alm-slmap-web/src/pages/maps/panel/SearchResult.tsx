import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { LocationsResponse, Location } from '../../../services/location.service';
import { fetchLocations } from '../../../services/location.service';

interface SearchResultProps {
  locations: LocationsResponse & { params?: Record<string, any> };
  onClose?: () => void;
  isLoading?: boolean;
  onLocationSelect: (locationData: Location) => void;
  filterFn?: (location: any) => boolean;
  onItemsUpdate?: (
    updatedSearch: Location[],
    updatedPois: any[],
    updatedParams: any
  ) => void;
}

export const SearchResult = ({
  locations,
  onClose,
  isLoading = false,
  onLocationSelect,
  filterFn,
  onItemsUpdate,
}: SearchResultProps) => {
  const { t } = useTranslation(['common', 'maps']);

  // เช็คว่าเป็นโหมดวาด (Spatial) หรือไม่ (เอาไว้กัน Infinite Scroll Error 400)
  const isSpatialMode = locations.params?.isSpatial === true;

  // เช็คว่าเป็นโหมด Trade Area จริงๆ หรือไม่ (Seven ไม่นับ)
  const isTradeAreaType =
    locations.params?.type === 'tradearea' ||
    locations.params?.type === 'filterTradeArea';

  // Helper Key
  const getGroupKey = useCallback((loc: Location) => {
    return loc.poiId ? String(loc.poiId) : String(loc.id);
  }, []);

  // Grouping Logic ทำงานเฉพาะโหมด Trade Area เท่านั้น
  const groupItems = useCallback(
    (rawItems: Location[]) => {
      if (!isTradeAreaType) return rawItems;

      const seenKeys = new Set<string>();
      const grouped: Location[] = [];
      for (const loc of rawItems) {
        const key = getGroupKey(loc);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          grouped.push(loc);
        }
      }
      return grouped;
    },
    [isTradeAreaType, getGroupKey]
  );

  const baseInitialResults = locations.data.search || [];
  const filteredInitial = filterFn
    ? baseInitialResults.filter(filterFn)
    : baseInitialResults;
  const initialResults = groupItems(filteredInitial);

  const [items, setItems] = useState<Location[]>(initialResults);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(
    isSpatialMode ? false : initialResults.length < locations.total
  );

  // จาก HEAD
  const [allPois, setAllPois] = useState<any[]>(locations.data.poi || []);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // const params = useMemo(() => locations.params || {}, [locations.params]);

  const itemsRef = useRef(items);
  const allPoisRef = useRef(allPois);
  const paramsRef = useRef(locations.params || {});

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    allPoisRef.current = allPois;
  }, [allPois]);
  useEffect(() => {
    paramsRef.current = locations.params || {};
  }, [locations.params]);

  useEffect(() => {
    const p = locations.params || {};
    if (p.page === 1 || !p.page) {
      const baseResults = locations.data.search || [];
      const filtered = filterFn ? baseResults.filter(filterFn) : baseResults;
      const grouped = groupItems(filtered);

      setItems(grouped);
      setPage(1);
      setAllPois(locations.data.poi || []);

      if (isSpatialMode) {
        setHasMore(false);
      } else {
        setHasMore(grouped.length < locations.total);
      }
    }
  }, [locations, filterFn, groupItems, isSpatialMode]);

  useEffect(() => {
    // บล็อกถ้าเป็น Spatial หรือกำลังโหลดอยู่
    if (!loadMoreRef.current || !hasMore || isFetchingMore || isSpatialMode) return;

    const observer = new IntersectionObserver(async entries => {
      const target = entries[0];
      if (!target.isIntersecting) return;

      const currentItems = itemsRef.current;
      const currentPois = allPoisRef.current;
      const currentParams = paramsRef.current;

      const nextPage = page + 1;
      setIsFetchingMore(true);

      try {
        const newData = await fetchLocations({
          ...currentParams,
          page: nextPage,
          limit,
        });

        let newItems = newData.data.search || [];
        let newPois = newData.data.poi || [];

        // Apply filter logic
        if (filterFn) {
          newItems = newItems.filter(filterFn);
          newPois = newPois.filter(filterFn);
        }

        // Apply Deduplication
        let uniqueSearch: Location[] = [];
        if (isTradeAreaType) {
          const seenKeys = new Set<string>(currentItems.map(getGroupKey));
          uniqueSearch = [...currentItems];
          for (const loc of newItems) {
            const key = getGroupKey(loc);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              uniqueSearch.push(loc);
            }
          }
        } else {
          const combinedItems = [...currentItems, ...newItems];
          uniqueSearch = combinedItems.filter(
            (v, i, a) => a.findIndex(t => t.id === v.id) === i
          );
        }

        // Deduplicate POIs (HEAD logic)
        const combinedPois = [...currentPois, ...newPois];
        const uniquePois = combinedPois.filter(
          (v, i, a) => a.findIndex(t => t.id === v.id) === i
        );

        setItems(uniqueSearch);
        setAllPois(uniquePois);
        setPage(nextPage);

        // Check hasMore
        if (newItems.length === 0 || uniqueSearch.length >= newData.total) {
          setHasMore(false);
        }

        // Callback Update (HEAD logic)
        if (onItemsUpdate) {
          const updatedParams = { ...currentParams, page: nextPage };
          onItemsUpdate(uniqueSearch, uniquePois, updatedParams);
        }
      } catch (error) {
        console.error('Failed to load more data:', error);
        setHasMore(false);
      } finally {
        setIsFetchingMore(false);
      }
    });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [
    page,
    hasMore,
    limit,
    filterFn,
    isFetchingMore,
    isSpatialMode,
    isTradeAreaType,
    getGroupKey,
  ]);

  if (isLoading) {
    return (
      <div className="card bg-base-100 w-full shadow-sm">
        <div className="card-body">
          <h2 className="card-title">{t('maps:searching')}</h2>
          <p>{t('maps:searching_message')}</p>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="card bg-base-100 w-full shadow-sm">
        <div className="card-body">
          <h2 className="card-title">{t('maps:no_results_found')}</h2>
          <p>{t('maps:no_results_message')}</p>
          {onClose && (
            <div className="card-actions justify-end">
              <button className="btn btn-secondary" onClick={onClose}>
                {t('common:close')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 w-full shadow-sm">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">
            {/* ปรับ : การแสดงตัวเลขจาก Origin */}
            {t('maps:search_results', {
              count: isTradeAreaType ? items.length : locations.total,
            })}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost"
              aria-label="Close search results"
            >
              ✕
            </button>
          )}
        </div>
        <div className="h-[500px] overflow-y-auto space-y-2">
          {items.map(location => (
            <div
              key={location.id}
              className="p-3 border rounded-lg hover:bg-base-200 cursor-pointer transition-colors"
              onClick={() => {
                onLocationSelect(location);
              }}
            >
              <h3 className="font-medium">{location.branchName}</h3>
              <h3 className="text-xs">
                {t('maps:branch_code')}: {location.branchCode}
              </h3>

              {/* ปรับ: เพิ่มส่วนแสดง POI จาก Origin */}
              {isTradeAreaType && location.poiId && (
                <h3 className="text-xs text-gray-400">POI: {location.poiId}</h3>
              )}

              <h3 className="text-xs">
                {t('maps:location_label')}: {location.location}
              </h3>
            </div>
          ))}
          <div ref={loadMoreRef} className="h-6"></div>
        </div>
      </div>
    </div>
  );
};
