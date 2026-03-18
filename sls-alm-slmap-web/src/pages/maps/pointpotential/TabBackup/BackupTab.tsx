import { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HoverDropdown } from '@/components/base/HoverDropdown';
import { fetchCommonCodes } from '@/services/master.service';
import type { LocationInfo } from '@/services/location.service';
import { fetchLocationById } from '@/services/location.service';
import { BackupHeader } from './BackupHeader';
import { useBackupProfileStore } from '@/stores/backupProfileStore';
import { useMapViewport } from '@/stores/useMapSelectors';
import { useMapStore } from '@/stores/mapStore';
import type { GeoPolygon } from '@/stores/backupProfileStore';
import { useTranslation } from 'react-i18next';

interface BackupTabProps {
  location: LocationInfo | null;
  poiId: string;
  formLocNumber?: string;
  nation?: string;
}

const QUERY_STALE_TIME = 30 * 60 * 1000;

type TableRow =
  | {
      kind: 'header';
      profileLayerId: number;
      profileLayerName: string;
      backupPercentage: number;
      pointCount: number;
      totalPopulation: number;
      totalCustomer: number;
    }
  | {
      kind: 'poi';
      profileLayerId: number;
      poi: any;
    };

export function calculateProfilesFromPois(profilePois: any[]) {
  const pois = Array.isArray(profilePois) ? profilePois : [];

  const countByLayer = new Map<number, number>();
  for (const p of pois) {
    const layerId = Number(p.profileLayerId);
    if (!layerId) continue;
    countByLayer.set(layerId, (countByLayer.get(layerId) ?? 0) + 1);
  }

  const totalPois = Array.from(countByLayer.values()).reduce((a, b) => a + b, 0);

  const percentByLayer = new Map<number, string>();
  for (const [layerId, cnt] of countByLayer.entries()) {
    const percent = totalPois > 0 ? (cnt / totalPois) * 100 : 0;
    percentByLayer.set(layerId, percent.toFixed(2));
  }

  return {
    countByLayer,
    percentByLayer,
    totalPois,
  };
}

const BackupTab = ({ location, formLocNumber, nation }: BackupTabProps) => {
  const { t } = useTranslation(['common', 'backup']);

  const [isTableVisible, setIsTableVisible] = useState(true);
  const [navigatingPoiId, setNavigatingPoiId] = useState<string | null>(null);

  const { centerOnPoint } = useMapViewport();
  const setSelectedUid = useMapStore(state => state.setSelectedUid);
  const setBackupMarkPoint = useMapStore(state => state.setBackupMarkPoint);
  const addPolygonLayer = useMapStore(state => state.addPolygonLayer);
  const removePolygonLayer = useMapStore(state => state.removePolygonLayer);

  const shape = useBackupProfileStore(state => state.shape) as GeoPolygon | null;

  const BACKUP_SHAPE_LAYER_ID = 'backup-profile-shape';

  useEffect(() => {
    if (!shape?.coordinates?.length) return;
    addPolygonLayer({
      id: BACKUP_SHAPE_LAYER_ID,
      name: 'Backup Profile Area',
      data: [
        {
          id: BACKUP_SHAPE_LAYER_ID,
          coordinates: shape.coordinates,
        },
      ],
      style: {
        fill: 'rgba(0, 0, 0, 0)',
        stroke: {
          color: 'rgba(34, 197, 94, 1)',
          width: 3,
        },
      },
    });
    return () => {
      removePolygonLayer(BACKUP_SHAPE_LAYER_ID);
      setBackupMarkPoint(null);
    };
  }, [shape, addPolygonLayer, removePolygonLayer, setBackupMarkPoint]);

  const { data: profileOptions = [] } = useQuery({
    queryKey: ['commonCodes', 'LAYER_LSM'],
    queryFn: async () => {
      const result = await fetchCommonCodes('LAYER_LSM');
      return result.map(item => ({ value: item.value, label: item.text }));
    },
    staleTime: QUERY_STALE_TIME,
  });

  const {
    mainProfile,
    subProfile,
    profiles,
    profilePois,
    setMainProfile,
    setSubProfile,
  } = useBackupProfileStore();

  const handleToggleTable = useCallback(() => {
    setIsTableVisible(prev => !prev);
  }, []);

  const handlePoiClick = useCallback(
    async (poiId: string | number) => {
      const id = String(poiId);
      if (!id || navigatingPoiId === id) return;
      try {
        setNavigatingPoiId(id);
        const res = await fetchLocationById(Number(id));
        const loc = (res as any)?.data ?? res;
        const coords = loc?.geom?.coordinates ?? loc?.coordinates;
        if (!coords || coords.length < 2) {
          console.warn('POI location has no coordinates:', id);
          return;
        }
        const [lng, lat] = coords;
        centerOnPoint([lng, lat], window.innerWidth, true);
        setBackupMarkPoint({ longitude: lng, latitude: lat });
        if (loc?.uid) setSelectedUid(loc.uid);
      } catch (err) {
        console.error('Failed to navigate to POI:', err);
      } finally {
        setNavigatingPoiId(null);
      }
    },
    [centerOnPoint, navigatingPoiId]
  );

  const tableRows: TableRow[] = useMemo(() => {
    const profs = Array.isArray(profiles) ? profiles : [];
    const pois = Array.isArray(profilePois) ? profilePois : [];

    const poisByLayer = new Map<number, any[]>();
    for (const p of pois) {
      const k = Number(p.profileLayerId);
      if (!k) continue;
      if (!poisByLayer.has(k)) poisByLayer.set(k, []);
      poisByLayer.get(k)!.push(p);
    }

    const { percentByLayer } = calculateProfilesFromPois(pois);

    const layerIdsFromProfiles = profs.map(p => Number(p.profileLayerId)).filter(Boolean);
    const layerIdsFromPois = Array.from(poisByLayer.keys());
    const allLayerIds = Array.from(
      new Set([...layerIdsFromProfiles, ...layerIdsFromPois])
    ).sort((a, b) => a - b);

    const rows: TableRow[] = [];

    for (const layerId of allLayerIds) {
      const children = poisByLayer.get(layerId) ?? [];

      const prof = profs.find(x => Number(x.profileLayerId) === layerId);
      const layerName =
        prof?.profileLayerName?.trim() ||
        profileOptions.find(o => String(o.value) === String(layerId))?.label ||
        '-';

      const pointCount = children.length;
      const totalPopulation = children.reduce(
        (sum, x) => sum + Number(x.populationAmount ?? 0),
        0
      );
      const totalCustomer = children.reduce(
        (sum, x) => sum + Number(x.customerAmount ?? 0),
        0
      );

      const backupPercentage = percentByLayer.get(layerId) ?? '0.00';

      rows.push({
        kind: 'header',
        profileLayerId: layerId,
        profileLayerName: layerName,
        backupPercentage: Number(backupPercentage),
        pointCount,
        totalPopulation,
        totalCustomer,
      });

      for (const child of children) {
        rows.push({ kind: 'poi', profileLayerId: layerId, poi: child });
      }
    }

    return rows;
  }, [profiles, profilePois, profileOptions]);

  return (
    <div className="px-4 py-3 pr-4">
      <BackupHeader location={location} formLocNumber={formLocNumber} nation={nation} />

      {/* Profile Selection */}
      <div className="flex gap-4 mb-4">
        <div className="flex flex-col flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-gray-600 mb-1">
            {t('backup:mainprofile')}
          </label>
          <HoverDropdown
            options={profileOptions}
            value={mainProfile ?? ''}
            onChange={setMainProfile}
            hoverBehavior="shadow"
            maxHeight="200px"
            disabled={true}
            showClearButton={false}
          />
        </div>

        <div className="flex flex-col flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-gray-600 mb-1">
            {t('backup:subprofile')}
          </label>
          <HoverDropdown
            options={profileOptions}
            value={subProfile ?? ''}
            onChange={setSubProfile}
            hoverBehavior="shadow"
            searchable={true}
            maxHeight="200px"
          />
        </div>
      </div>

      {/* Backup Table */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700 text-sm">Backup</span>
          <span
            className="text-xs text-blue-500 cursor-pointer select-none hover:text-blue-700 hover:underline"
            onClick={handleToggleTable}
          >
            {isTableVisible ? t('backup:hide') : t('backup:show')}
          </span>
        </div>

        {isTableVisible && (
          <div className="rounded-lg border border-gray-200 shadow-sm">
            <div className="overflow-y-auto max-h-[240px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-blue-50 z-10 shadow-sm">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-blue-700 border-b border-gray-200">
                      {t('backup:type')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-blue-700 border-b border-gray-200">
                      {t('backup:pointCount')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-blue-700 border-b border-gray-200">
                      {t('backup:totalPopulation')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-blue-700 border-b border-gray-200">
                      {t('backup:expectedPopulation')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-blue-700 border-b border-gray-200">
                      {t('backup:distance')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-blue-700 border-b border-gray-200">
                      {t('backup:backupPercentage')}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tableRows.length ? (
                    tableRows.map((row, idx) => {
                      if (row.kind === 'header') {
                        return (
                          <tr
                            key={`h-${row.profileLayerId}-${idx}`}
                            className="bg-gray-200 font-medium"
                          >
                            <td className="px-2 py-2 text-sm border-b border-gray-100 text-gray-800">
                              {row.profileLayerName}
                            </td>
                            <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-gray-800">
                              {row.pointCount}
                            </td>
                            <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-gray-800">
                              {row.totalPopulation.toLocaleString()}
                            </td>
                            <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-gray-800">
                              {row.totalCustomer.toLocaleString()}
                            </td>
                            <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-gray-500">
                              -
                            </td>
                            <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-gray-800">
                              {row.backupPercentage}%
                            </td>
                          </tr>
                        );
                      }

                      const p = row.poi;
                      const name = p.poiNamt || 'ไม่ระบุ';

                      return (
                        <tr
                          key={`p-${p.id}-${idx}`}
                          className="bg-white hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-2 py-2 text-sm text-left border-b border-gray-100 text-gray-700">
                            <span
                              className={`cursor-pointer hover:text-blue-600 hover:underline transition-colors ${
                                navigatingPoiId === String(p.poiId) ? 'opacity-50 pointer-events-none' : ''
                              }`}
                              onClick={() => handlePoiClick(p.poiId)}
                              title={t('common:navigateToLocation', { defaultValue: 'Navigate to location' })}
                            >
                              {name}
                              {navigatingPoiId === String(p.poiId) && (
                                <span className="ml-1 inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin align-middle" />
                              )}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-gray-700">
                            -
                          </td>
                          <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-gray-700">
                            {Number(p.populationAmount ?? 0).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-gray-700">
                            {Number(p.customerAmount ?? 0).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-gray-700">
                            {p.distance}
                          </td>
                          <td className="px-2 py-2 text-sm text-center border-b border-gray-100 text-blue-600 font-medium">
                            -
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-4 text-sm text-center border-b border-gray-100 text-gray-400 italic"
                      >
                        {t('backup:noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupTab;
