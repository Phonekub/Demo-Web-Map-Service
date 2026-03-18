import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchBackupProfileLayers,
  fetchCompetitorNearby,
  fetchPotentialByPoiId,
  type BackupProfileLayer,
  type BackupProfilePoiItem,
  type CompetitorNearbyData,
  type LocationInfo,
} from '@/services/location.service';
import { createBackupProfile, updateBackupProfile } from '@/services/backup.service';
import Button from '@/components/base/Button';
import EnvBackup from '../envpointpotential/Backup';
import {
  useBackupFlowStore,
  useBackupProfileStore,
  usePopulationStore,
  type StrategicPayload,
} from '@/stores/backupProfileStore';
import { useUserStore } from '@/stores';
import PopupAlert from '@/components/base/PopupAlert';
import { useTranslation } from 'react-i18next';
import { getLanguage } from '@/stores/languageStore';

// ============================================================================
// Types
// ============================================================================
export interface SelectedPoiData {
  layerId: number;
  layerName: string;
  poiId: number;
  poiName: string;
  coordinates?: number[];
  population?: number;
  customers?: number;
  percentPredictCustomer?: number;
}

interface CreateBackupProfileProps {
  coordinates: Array<[number, number]>;
  formLocNumber?: string;
  locationName?: string;
  poiId?: string;
  location?: LocationInfo | null;
  onCancel: () => void;
  onClearArea: () => void;
  onSave: (selectedPois: SelectedPoiData[]) => void;
  existingBackupLocation?: any;
}

const DEFAULT_STRATEGIC: StrategicPayload = {
  strategicLocation: '01',
  strategicSupport: '02',
  strategicPlace: '01',
  strategicPlaceOther: 'Shopping Mall',
  strategicPlaceName: 'Siam Paragon',
  strategicPlaceGuid: '660e8400-e29b-41d4-a716-446655440001',
  strategicPosition: '01',
  strategicPositionOther: 'Near entrance',
  strategicPositionName: 'Ground Floor - Main Entrance',
  strategicFloor: 'G',
  strategicFloorOther: 'Ground Floor',
  strategicCustomerType: '01',
  strategicHousingType: '02',
  strategicIndustrialEstateName: 'N/A',
};

const MIN_POLYGON_POINTS = 3;

// ============================================================================
// Utils
// ============================================================================
const toNum = (v: unknown): number => {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getPoiId = (poi: BackupProfilePoiItem): number =>
  toNum((poi as any).poiId ?? poi.id);

const getPoiName = (poi: BackupProfilePoiItem, lang: any): string => {
  if (lang === 'th') {
    return (poi as any).namt ?? (poi as any).name ?? '-';
  } else {
    return (poi as any).name ?? (poi as any).namt ?? '-';
  }
};

const getLayerName = (layer: BackupProfileLayer, lang: any): string => {
  if (lang === 'th') {
    return layer.layerTh ?? layer.layerEn ?? layer.layerName ?? '-';
  } else if (lang === 'km') {
    return layer.layerKh ?? layer.layerEn ?? layer.layerName ?? '-';
  } else {
    return layer.layerEn ?? layer.layerTh ?? layer.layerName ?? '-';
  }
};

const getPoiCoords = (poi: BackupProfilePoiItem): number[] | undefined =>
  (poi as any).coordinates ?? (poi as any).geom?.coordinates ?? undefined;

const extractPoiStats = (poi: BackupProfilePoiItem) => {
  const population = (poi as any).populationAmount;
  const percentPredictCustomer = (poi as any).percentPredictCustomer;

  const customers = toNum(population) * (toNum(percentPredictCustomer) / 100);

  return {
    population: population != null ? Math.ceil(toNum(population)) : undefined,
    customers: customers != null ? Math.ceil(toNum(customers)) : undefined,
    percentPredictCustomer:
      percentPredictCustomer != null ? toNum(percentPredictCustomer) : undefined,
  };
};

type PoiIndexItem = {
  poiId: number;
  layerId: number;
  layerName: string;
  poiName: string;
  coordinates?: number[];
  population?: number;
  customers?: number;
  percentPredictCustomer?: number;
};

// ============================================================================
// Main
// ============================================================================
export const CreateBackupProfile: React.FC<CreateBackupProfileProps> = ({
  coordinates,
  poiId,
  location,
  onCancel,
  onSave,
  existingBackupLocation,
}) => {
  const { step, setStep } = useBackupFlowStore();
  const { user } = useUserStore();

  const {
    setCompetitors,
    competitors,
    setSelectedPoiId,
    selectedPoiId,
    profilePois: storeProfilePois,
  } = useBackupProfileStore();
  const { t } = useTranslation(['common', 'backup']);
  const lang = getLanguage();

  const strategicFromStore = useBackupProfileStore(state => state.strategic);
  const strategic = strategicFromStore ?? DEFAULT_STRATEGIC;

  // population store
  const populationByPoi = usePopulationStore(s => (s as any).byPoi ?? {});

  // Local state
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
  const [selectedPois, setSelectedPois] = useState<Map<number, SelectedPoiData>>(
    new Map()
  );
  const [selectedPoiDetail, setSelectedPoiDetail] = useState<BackupProfilePoiItem | null>(
    null
  );
  const [showAlert, setShowAlert] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('error');
  const [afterCloseAction, setAfterCloseAction] = useState<null | (() => void)>(null);
  const [showConfirmWarning, setShowConfirmWarning] = useState(false);
  const [showPoiWarning, setShowPoiWarning] = useState(false);

  const envBackupRef = useRef<any>(null);

  // Derived
  const poiNum = useMemo(() => (poiId ? toNum(poiId) : 0), [poiId]);
  const hasDrawnArea = coordinates.length >= MIN_POLYGON_POINTS;

  const locationLng = location?.geom?.coordinates?.[0] ?? 0;
  const locationLat = location?.geom?.coordinates?.[1] ?? 0;
  const canFetchCompetitor = !!location?.geom?.coordinates?.length;

  // Existing data
  const existingData = useMemo(() => {
    if (!existingBackupLocation) return null;
    return existingBackupLocation?.data ?? existingBackupLocation ?? null;
  }, [existingBackupLocation]);

  // uid in store (edit mode)
  const storeUid = useBackupProfileStore((s: any) => s.uid);
  const updateUid = useMemo(() => {
    return storeUid || existingData?.uid || existingBackupLocation?.uid || null;
  }, [storeUid, existingData, existingBackupLocation]);

  const isEditMode = !!updateUid;

  // ========================================================================
  // Helpers: resolve stats with store override
  // ========================================================================
  const resolveStatsWithStore = useCallback(
    (
      poiIdNum: number,
      fallbackPopulation?: number,
      fallbackPercent?: number,
      isLayer1?: boolean
    ) => {
      const store = populationByPoi?.[poiIdNum];

      const percent =
        store?.percentPredictCustomer != null &&
        String(store.percentPredictCustomer).trim() !== ''
          ? toNum(store.percentPredictCustomer)
          : toNum(fallbackPercent ?? (isLayer1 ? 3.0 : 2.5));

      const population =
        store?.populationAmount != null && String(store.populationAmount).trim() !== ''
          ? Math.ceil(toNum(store.populationAmount))
          : Math.ceil(toNum(fallbackPopulation));

      const customers = population * (percent / 100);

      return {
        population,
        percentPredictCustomer: percent,
        customers: Math.ceil(customers),
      };
    },
    [populationByPoi]
  );

  // ========================================================================
  // Queries
  // ========================================================================
  const layersQuery = useQuery({
    queryKey: ['backupProfileLayers', JSON.stringify(coordinates)],
    queryFn: () => fetchBackupProfileLayers(coordinates),
    enabled: hasDrawnArea && step === 'layer-selection',
    staleTime: 5 * 60 * 1000,
  });

  const competitorQuery = useQuery({
    queryKey: ['competitorNearby', locationLat, locationLng],
    queryFn: () => fetchCompetitorNearby(locationLat, locationLng, 500),
    enabled: !isEditMode && canFetchCompetitor,
    staleTime: 5 * 60 * 1000,
  });

  const potentialQuery = useQuery({
    queryKey: ['potentialPois', poiNum],
    queryFn: () => fetchPotentialByPoiId(poiNum),
    enabled: !!location,
    staleTime: 5 * 60 * 1000,
  });

  const displayFormLocNumber = potentialQuery.data?.potentialStore?.formLocNumber || '-';
  const displayLocationName = potentialQuery.data?.poi?.name || '-';

  // Extract layers
  const layers: BackupProfileLayer[] = useMemo(
    () => layersQuery.data?.data?.layers || [],
    [layersQuery.data]
  );

  const currentLayer = useMemo(
    () => layers.find(l => l.layerId === selectedLayerId) || null,
    [layers, selectedLayerId]
  );

  const currentPois = useMemo<BackupProfilePoiItem[]>(() => {
    if (!currentLayer) return [];
    const subCats = (currentLayer as any).subCategories ?? [];
    return (subCats as any[]).flatMap(
      (sc: any) => (sc?.pois ?? []) as BackupProfilePoiItem[]
    );
  }, [currentLayer]);

  const poiIndex = useMemo(() => {
    const map = new Map<number, PoiIndexItem>();

    for (const layer of layers as any[]) {
      const subCats: any[] = layer?.subCategories ?? [];
      for (const sc of subCats) {
        const pois: any[] = sc?.pois ?? [];
        for (const poi of pois) {
          const id = getPoiId(poi);
          if (!id) continue;

          const stats = extractPoiStats(poi);

          map.set(id, {
            poiId: id,
            layerId: toNum(layer.layerId),
            layerName: String(layer.layerName ?? `Layer-${layer.layerId}`),
            poiName: getPoiName(poi, lang) || `POI-${id}`,
            coordinates: getPoiCoords(poi),
            population: stats.population,
            customers: stats.customers,
            percentPredictCustomer: stats.percentPredictCustomer,
          });
        }
      }
    }

    return map;
  }, [layers]);

  const totalPopulation = useMemo(() => {
    return Array.from(selectedPois.values()).reduce((sum, p) => {
      const idx = poiIndex.get(p.poiId);
      const isLayer1 = (idx?.layerId ?? p.layerId) === 1;
      const resolved = resolveStatsWithStore(
        p.poiId,
        idx?.population ?? p.population,
        idx?.percentPredictCustomer ?? p.percentPredictCustomer,
        isLayer1
      );
      return sum + toNum(resolved.population);
    }, 0);
  }, [selectedPois, poiIndex, resolveStatsWithStore]);

  const totalCustomer = useMemo(() => {
    return Array.from(selectedPois.values()).reduce((sum, p) => {
      const idx = poiIndex.get(p.poiId);
      const isLayer1 = (idx?.layerId ?? p.layerId) === 1;
      const resolved = resolveStatsWithStore(
        p.poiId,
        idx?.population ?? p.population,
        idx?.percentPredictCustomer ?? p.percentPredictCustomer,
        isLayer1
      );
      return sum + toNum(resolved.customers);
    }, 0);
  }, [selectedPois, poiIndex, resolveStatsWithStore]);

  // ========================================================================
  // Helpers
  // ========================================================================
  const resetSelectionState = useCallback(() => {
    setSelectedLayerId(null);
    setSelectedPois(new Map());
    setSelectedPoiDetail(null);
    setSelectedPoiId(null);
  }, [setSelectedPoiId]);

  const buildClosedPolygon = useCallback(() => {
    const polygon = [...coordinates];
    if (polygon.length > 0) {
      const first = polygon[0];
      const last = polygon[polygon.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) polygon.push(first);
    }
    return polygon;
  }, [coordinates]);

  const polygonToWkt = useCallback((polygon: Array<[number, number]>) => {
    const wktCoords = polygon.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
    return `POLYGON((${wktCoords}))`;
  }, []);

  const setCompetitorsFromNearby = useCallback(
    (raw: CompetitorNearbyData[] | undefined) => {
      if (!Array.isArray(raw)) {
        setCompetitors([]);
        return;
      }
      setCompetitors(
        raw.map(item => ({
          id: 0,
          backupLocationId: 0,
          competitorLayerId: item.competitorLayerId || 6,
          competitorId: item.id,
          distance: item.distance ?? '',
          competitorType: item.competitorType,
          competitorTypeName: item.competitorTypeName,
          grade: item.grade,
        }))
      );
    },
    [setCompetitors]
  );

  // buildPayload uses store values if exist for that poiId
  const buildPayload = useCallback(() => {
    const selectedPoiArray = Array.from(selectedPois.values());

    const polygon = buildClosedPolygon();
    const shapeWkt = polygonToWkt(polygon);

    const resolved = selectedPoiArray
      .map(sel => poiIndex.get(sel.poiId) || null)
      .filter(Boolean) as PoiIndexItem[];

    // compute population by layer using overridden pop
    const populationByLayer = new Map<number, number>();
    for (const p of resolved) {
      const isLayer1 = p.layerId === 1;
      const s = resolveStatsWithStore(
        p.poiId,
        p.population,
        p.percentPredictCustomer,
        isLayer1
      );
      const pop = toNum(s.population);
      populationByLayer.set(p.layerId, (populationByLayer.get(p.layerId) ?? 0) + pop);
    }

    const totalPopAllLayers = Array.from(populationByLayer.values()).reduce(
      (sum, v) => sum + v,
      0
    );

    const profiles =
      totalPopAllLayers > 0
        ? Array.from(populationByLayer.entries()).map(([layerId, layerPop]) => ({
            profileLayerId: layerId,
            backupPercentage: parseFloat(
              ((layerPop / totalPopAllLayers) * 100).toFixed(2)
            ),
          }))
        : Array.from(populationByLayer.keys()).map(layerId => ({
            profileLayerId: layerId,
            backupPercentage: parseFloat((100 / populationByLayer.size).toFixed(2)),
          }));

    const profilePois = resolved.map(p => {
      const isLayer1 = p.layerId === 1;

      const s = resolveStatsWithStore(
        p.poiId,
        p.population,
        p.percentPredictCustomer,
        isLayer1
      );

      return {
        poiId: p.poiId,
        profileLayerId: p.layerId,
        distance: isLayer1 ? '500m' : '800m',
        populationAmount: toNum(s.population),
        customerAmount: toNum(s.customers),
        percentPredictCustomer: toNum(s.percentPredictCustomer),
      };
    });

    const competitorPayload = (competitors || []).map(c => ({
      competitorLayerId: toNum((c as any).competitorLayerId ?? 6),
      competitorId: toNum((c as any).competitorId),
      distance: toNum((c as any).distance),
      competitorType: toNum((c as any).competitorType),
    }));

    const mainProfileLayerId =
      profiles.length > 0
        ? profiles.reduce((maxItem, current) =>
            current.backupPercentage > maxItem.backupPercentage ? current : maxItem
          ).profileLayerId
        : null;

    const basePayload = {
      mainProfile: mainProfileLayerId?.toString() || '',
      poiId: poiNum,
      poiLayerId: 1,
      shape: shapeWkt,
      ...strategic,
      profiles,
      profilePois,
      competitors: competitorPayload,
      createBy: user?.id || 0,
    };

    const selectedResolvedForCallback: SelectedPoiData[] = resolved.map(r => {
      const isLayer1 = r.layerId === 1;
      const s = resolveStatsWithStore(
        r.poiId,
        r.population,
        r.percentPredictCustomer,
        isLayer1
      );

      return {
        layerId: r.layerId,
        layerName: r.layerName,
        poiId: r.poiId,
        poiName: r.poiName,
        coordinates: r.coordinates,
        population: toNum(s.population),
        customers: toNum(s.customers),
        percentPredictCustomer: toNum(s.percentPredictCustomer),
      };
    });

    return {
      selectedPoiArray: selectedResolvedForCallback,
      basePayload,
      updatePayload: { ...basePayload, updateBy: user?.id || 0 },
    };
  }, [
    selectedPois,
    competitors,
    poiNum,
    user,
    buildClosedPolygon,
    polygonToWkt,
    poiIndex,
    strategic,
    resolveStatsWithStore,
  ]);

  // ========================================================================
  // Effects
  // ========================================================================
  useEffect(() => {
    if (isEditMode) return;
    if (layers.length > 0 && selectedLayerId === null) {
      setSelectedLayerId(layers[0].layerId);
    }
  }, [isEditMode, layers, selectedLayerId]);

  const [didPrefill, setDidPrefill] = useState(false);
  useEffect(() => {
    if (!isEditMode) return;
    if (layers.length === 0) return;
    if (didPrefill) return;

    const next = new Map<number, SelectedPoiData>();

    const idsFromStore = (storeProfilePois || [])
      .map(p => toNum((p as any).poiId))
      .filter(Boolean);

    for (const id of idsFromStore) {
      const latest = poiIndex.get(id);
      if (!latest) continue;

      next.set(id, {
        poiId: latest.poiId,
        layerId: latest.layerId,
        layerName: latest.layerName,
        poiName: latest.poiName,
        coordinates: latest.coordinates,
        population: latest.population,
        customers: latest.customers,
        percentPredictCustomer: latest.percentPredictCustomer,
      });
    }

    setSelectedPois(next);

    if (selectedLayerId === null) {
      const first = Array.from(next.values())[0];
      setSelectedLayerId(first?.layerId ?? layers[0]?.layerId ?? null);
    }

    setDidPrefill(true);
  }, [isEditMode, layers, didPrefill, selectedLayerId, storeProfilePois, poiIndex]);

  useEffect(() => {
    if (!isEditMode) setCompetitorsFromNearby(competitorQuery.data);
  }, [isEditMode, competitorQuery.data, setCompetitorsFromNearby]);

  // ========================================================================
  // Handlers
  // ========================================================================
  const handlePoiToggle = useCallback(
    (poi: BackupProfilePoiItem) => {
      const id = getPoiId(poi);
      if (!id) return;

      const latest = poiIndex.get(id);
      if (!latest) return;

      setSelectedPois(prev => {
        const next = new Map(prev);

        if (next.has(id)) {
          next.delete(id);

          if (selectedPoiDetail) {
            const detailId = getPoiId(selectedPoiDetail);
            if (detailId === id) setSelectedPoiDetail(null);
          }
        } else {
          // when adding, use store override immediately (for totals/callback)
          const isLayer1 = latest.layerId === 1;
          const s = resolveStatsWithStore(
            latest.poiId,
            latest.population,
            latest.percentPredictCustomer,
            isLayer1
          );

          next.set(id, {
            poiId: latest.poiId,
            layerId: latest.layerId,
            layerName: latest.layerName,
            poiName: latest.poiName,
            coordinates: latest.coordinates,
            population: toNum(s.population),
            customers: toNum(s.customers),
            percentPredictCustomer: toNum(s.percentPredictCustomer),
          });
        }

        return next;
      });
    },
    [poiIndex, selectedPoiDetail, resolveStatsWithStore]
  );

  const handlePoiClick = useCallback(
    (poi: BackupProfilePoiItem) => {
      const id = getPoiId(poi);
      setSelectedPoiDetail(poi);
      setSelectedPoiId(id || null);
    },
    [setSelectedPoiId]
  );

  const handleNext = useCallback(async () => {
    if (!hasDrawnArea) return;
    setStep('layer-selection');
    await layersQuery.refetch();
  }, [hasDrawnArea, setStep, layersQuery]);

  const handleBack = useCallback(() => {
    setStep('area-selection');
  }, [setStep]);

  const handleSave = useCallback(async () => {
    // Check if at least one POI checkbox is selected
    if (selectedPois.size === 0) {
      setShowPoiWarning(true);
      return;
    }

    // Check if POI is selected first
    if (!poiNum) {
      setPopupType('error');
      setPopupMessage(t('backup:poiNotFound'));
      setShowAlert(true);
      return;
    }

    // Check if data is confirmed
    const isConfirmed = envBackupRef.current?.isDataConfirmed?.();
    if (!isConfirmed) {
      setShowConfirmWarning(true);
      return;
    }

    try {
      const { selectedPoiArray, basePayload, updatePayload } = buildPayload();

      let ok = false;

      if (updateUid) {
        const res = await updateBackupProfile(updateUid, updatePayload);
        ok = !!res;
        setPopupType(ok ? 'success' : 'error');
        setPopupMessage(ok ? t('backup:successUpdateBP') : t('backup:failUpdateBP'));
      } else {
        const res = await createBackupProfile(basePayload);
        ok = !!res;
        setPopupType(ok ? 'success' : 'error');
        setPopupMessage(ok ? t('backup:createSuccessBP') : t('backup:failCreateBP'));
      }

      setShowAlert(true);

      if (ok) {
        setAfterCloseAction(() => () => {
          onSave(selectedPoiArray);
          setStep('area-selection');
          resetSelectionState();
        });
      } else {
        setAfterCloseAction(null);
      }
    } catch (err: any) {
      const apiMessage: string =
        err?.response?.data?.message || err?.message || 'Unknown error';

      if (apiMessage.includes('มี Backup Profile ของ POI นี้แล้ว')) {
        setPopupType('error');
        setPopupMessage(t('backup:poiHaveBP'));
        setShowAlert(true);
        setAfterCloseAction(null);
        return;
      }

      console.error(err);
      setPopupType('error');
      setPopupMessage(apiMessage || t('backup:errorOccurred'));
      setShowAlert(true);
      setAfterCloseAction(null);
    }
  }, [
    poiNum,
    buildPayload,
    updateUid,
    onSave,
    setStep,
    resetSelectionState,
    selectedPois,
    t,
  ]);

  // ========================================================================
  // Render
  // ========================================================================
  if (step === 'area-selection') {
    if (potentialQuery.isLoading) {
      return (
        <div
          className="fixed top-20 left-1/2 z-50"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        </div>
      );
    }
    return (
      <div
        className="fixed top-20 left-1/2 z-50 flex flex-col items-center"
        style={{ transform: 'translateX(-50%)' }}
      >
        <div className="bg-white shadow-lg border border-gray-200 rounded-xl px-10 py-6 flex flex-col w-[600px]">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-lg font-bold text-gray-800 tracking-wide">
                {t('backup:formLocNumber')}{' '}
                <span className="text-blue-600 underline cursor-pointer">
                  {displayFormLocNumber}
                </span>
              </div>
              <div className="text-base text-gray-600 font-medium">
                {t('backup:locationName')} {displayLocationName}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="min-w-[100px] px-6 py-2 font-semibold"
                onClick={onCancel}
              >
                {t('common:cancel')}
              </Button>
              <Button
                variant="primary"
                className="min-w-[100px] px-6 py-2 font-semibold"
                onClick={handleNext}
                disabled={!hasDrawnArea}
              >
                {t('common:next')}
              </Button>
            </div>
          </div>

          {!hasDrawnArea && (
            <div className="mt-3 text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
              {t('backup:pleaseDrawArea')}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (layersQuery.isLoading) {
    return (
      <div
        className="fixed top-20 left-1/2 z-50"
        style={{ transform: 'translateX(-50%)' }}
      >
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-20 left-1/2 z-50" style={{ transform: 'translateX(-50%)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-[850px] flex flex-col overflow-hidden border border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-gray-500">{t('backup:formLocNumber')}</span>
              <p className="text-blue-600 font-semibold text-sm">
                {displayFormLocNumber}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t('backup:locationName')}</span>
              <p className="text-gray-800 font-medium text-sm">{displayLocationName}</p>
            </div>
            <div className="flex items-center gap-3 text-gray-600 text-sm">
              <span className="flex items-center gap-1">
                <span className="text-orange-500">👥</span>
                <span>{totalPopulation.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-blue-500">👤</span>
                <span>{totalCustomer.toLocaleString()}</span>
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="px-5 py-2">
              {t('common:back')}
            </Button>
            <Button variant="primary" onClick={handleSave} className="px-5 py-2">
              {t('common:save')}
            </Button>
          </div>
        </div>

        <div className="flex" style={{ height: '520px' }}>
          {/* Left: layers */}
          <div className="w-32 bg-blue-50/70 border-r border-gray-200 overflow-y-auto flex-shrink-0">
            {layers.map(layer => {
              const active = selectedLayerId === layer.layerId;
              return (
                <button
                  key={layer.layerId}
                  onClick={() => setSelectedLayerId(layer.layerId)}
                  className={`w-full flex items-center justify-between px-3 py-3 text-left text-s font-medium transition-all ${
                    active ? 'bg-blue-600 text-white' : 'text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <span className="truncate">{getLayerName(layer, lang)}</span>
                  {active && <span className="ml-1">›</span>}
                </button>
              );
            })}
            {layers.length === 0 && (
              <div className="p-3 text-xs text-gray-500 text-center">ไม่พบเลเยอร์</div>
            )}
          </div>

          {/* Middle: pois */}
          <div className="w-56 border-r border-gray-200 overflow-y-auto flex-shrink-0 p-2 bg-white">
            {currentLayer ? (
              <div className="space-y-2">
                {currentPois.map(poi => {
                  const id = getPoiId(poi);
                  const checked = id ? selectedPois.has(id) : false;

                  const focused =
                    selectedPoiDetail != null && getPoiId(selectedPoiDetail) === id;

                  // show store override in list
                  const idx = poiIndex.get(id);
                  const fallback = extractPoiStats(poi);
                  const isLayer1 = (idx?.layerId ?? 0) === 1;

                  const s = resolveStatsWithStore(
                    id,
                    idx?.population ?? fallback.population,
                    idx?.percentPredictCustomer ?? fallback.percentPredictCustomer,
                    isLayer1
                  );

                  const pop = toNum(s.population);
                  const cus = toNum(s.customers);

                  return (
                    <div
                      key={id || String((poi as any).id)}
                      onClick={() => handlePoiClick(poi)}
                      className={`border rounded-lg p-2.5 cursor-pointer transition-all ${
                        focused
                          ? 'border-blue-500 bg-blue-50'
                          : checked
                            ? 'border-blue-300 bg-blue-50/50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            e.stopPropagation();
                            handlePoiToggle(poi);
                          }}
                          className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-yellow-500 text-xs">✏️</span>
                            <span className="font-medium text-gray-800 text-xs truncate">
                              {getPoiName(poi, lang)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-0.5">
                              <span className="text-orange-500">👥</span>
                              <span>{pop.toLocaleString()}</span>
                            </span>
                            <span className="flex items-center gap-0.5">
                              <span className="text-blue-500">👤</span>
                              <span>{cus.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {currentPois.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-xs">
                    {t('backup:noPOIInLayer')}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-xs">
                {t('backup:pleaseSelectLayer')}
              </div>
            )}
          </div>

          {/* Right: detail */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
            {selectedPoiId != null ? (
              <EnvBackup
                ref={envBackupRef}
                poiId={selectedPoiId}
                key={selectedPoiId}
                subCode={selectedPoiDetail?.subCode || ''}
                layersData={
                  Array.isArray(layersQuery.data?.data?.layers)
                    ? layersQuery.data.data.layers
                    : []
                } //add to send data provCode,provGrade,provCategory
              />
            ) : null}
          </div>
        </div>
      </div>

      <PopupAlert
        open={showPoiWarning}
        type="info"
        message="คุณยังไม่ได้เลือก POI กรุณาเลือกอย่างน้อย 1 POI เพื่อดำเนินการต่อ"
        onClose={() => setShowPoiWarning(false)}
        onCancel={() => setShowPoiWarning(false)}
        cancelText="ปิด"
      />

      <PopupAlert
        open={showConfirmWarning}
        type="info"
        message="คุณยังไม่ได้กดปุ่ม 'ยืนยันข้อมูล' กรุณากดปุ่มดังกล่าวเพื่อยืนยันข้อมูลก่อนดำเนินการต่อ"
        onClose={() => setShowConfirmWarning(false)}
        onCancel={() => setShowConfirmWarning(false)}
        cancelText="ปิด"
      />

      <PopupAlert
        open={showAlert}
        type={popupType}
        message={popupMessage}
        onClose={() => {
          setShowAlert(false);
          if (afterCloseAction) {
            afterCloseAction();
            setAfterCloseAction(null);
          }
        }}
      />
    </div>
  );
};

export default CreateBackupProfile;
