import { useCallback, useMemo, useState } from 'react';
import { useBackupProfileStore } from '@/stores/backupProfileStore';
import { useQuery } from '@tanstack/react-query';
import { type BackupProfile } from '@/services/backup.service';
import { fetchCompetitorNearby } from '@/services/location.service';
import { fetchEntertainmentNearby } from '@/services/location.service';
import { fetchCommonCodes } from '@/services/master.service';
import type { LocationInfo } from '@/services/location.service';
import { BackupHeader } from './BackupHeader';
import { useTranslation } from 'react-i18next';

interface CompetitorTabProps {
  backupData?: BackupProfile;
  location: LocationInfo | null;
  formLocNumber?: string;
}

type ActiveSection = '500m' | '50m' | 'streetfood';

const QUERY_STALE_TIME = 30 * 60 * 1000; // 30 minutes

const CompetitorTab = ({ location, formLocNumber }: CompetitorTabProps) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('500m');
  const { t } = useTranslation(['common', 'backup']);
  const { data: streetFoodOptions = [] } = useQuery({
    queryKey: ['commonCodes', 'STREET_FOODS_TYPE'],
    queryFn: async () => {
      const result = await fetchCommonCodes('STREET_FOODS_TYPE');
      return result.map(item => ({
        id: item.value,
        category: item.text,
      }));
    },
    staleTime: QUERY_STALE_TIME,
  });

  const { data: fetchCompetitor500m, isLoading: isLoadingCompetitor500m } = useQuery({
    queryKey: ['competitorData'],
    queryFn: () =>
      fetchCompetitorNearby(
        location?.geom?.coordinates[1] ?? 0,
        location?.geom?.coordinates[0] ?? 0,
        500
      ),
    enabled: true,
    staleTime: QUERY_STALE_TIME,
  });

  const { data: fetchCompetitor50m, isLoading: isLoadingCompetitor50m } = useQuery({
    queryKey: ['competitorData'],
    queryFn: () =>
      fetchCompetitorNearby(
        location?.geom?.coordinates[1] ?? 0,
        location?.geom?.coordinates[0] ?? 0,
        50
      ),
    enabled: true,
    staleTime: QUERY_STALE_TIME,
  });

  const { data: fetchEntertainment, isLoading: isLoadingEntertainment } = useQuery({
    queryKey: ['entertainmentData'],
    queryFn: () =>
      fetchEntertainmentNearby(
        location?.geom?.coordinates[1] ?? 0,
        location?.geom?.coordinates[0] ?? 0,
        500
      ),
    enabled: true,
    staleTime: QUERY_STALE_TIME,
  });

  const { streetFood, syncStreetFoodFromApi } = useBackupProfileStore();
  const totalCompetitors = fetchCompetitor500m?.length ?? 0;

  const categoryCounts = useMemo(
    () =>
      fetchCompetitor500m?.reduce(
        (acc, item) => {
          acc[item.competitorTypeName] = (acc[item.competitorTypeName] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    [fetchCompetitor500m]
  );

  const categoryText = useMemo(
    () =>
      Object.entries(categoryCounts ?? {})
        .map(([category, count]) => `${category} ${count} จุด`)
        .join(', '),
    [categoryCounts]
  );

  const handleSectionChange = useCallback((section: ActiveSection) => {
    setActiveSection(section);
  }, []);

  return (
    <div className="px-4 py-3 pr-4">
      <BackupHeader location={location} formLocNumber={formLocNumber} />
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => handleSectionChange('500m')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === '500m'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('backup:competitorsWithin500m')}
          </button>
          <button
            onClick={() => handleSectionChange('50m')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === '50m'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('backup:storesWithin50m')}
          </button>
          <button
            onClick={() => handleSectionChange('streetfood')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === 'streetfood'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('backup:streetFood10m')}
          </button>
        </div>

        {activeSection === '500m' && (
          <div className="overflow-y-auto max-h-[280px]">
            {/* Summary Text */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-6">
                <div>
                  <span className="text-sm font-semibold text-gray-600">
                    {t('backup:totalCompetitors')} :
                  </span>
                  <span className="ml-2 text-blue-600 font-semibold">
                    {totalCompetitors} {t('backup:point')}
                  </span>
                </div>
              </div>
              <div className="flex gap-6 mt-2">
                <div>
                  <span className="text-sm font-semibold text-gray-600">
                    {t('backup:storeTypes')} :
                  </span>
                  <span className="ml-2 text-gray-700">{categoryText}</span>
                </div>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-3">
              {t('backup:totalCompetitors')}
            </p>

            <div className="rounded-lg border border-gray-200">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-orange-500">
                    <th className="px-2 py-2 text-center text-xs font-medium text-white">
                      {t('backup:storeName')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-white">
                      {t('backup:storeType')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-white">
                      {t('backup:openingHours')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-white">
                      {t('backup:sales')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-white">
                      {t('backup:grade')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-white">
                      {t('backup:distanceMeters')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCompetitor500m ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-4 text-center text-gray-400 italic"
                      >
                        {t('common:loading')}
                      </td>
                    </tr>
                  ) : (fetchCompetitor500m?.length ?? 0) > 0 ? (
                    fetchCompetitor500m?.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 transition-colors`}
                      >
                        <td className="px-2 py-2 text-left border-b border-gray-100 text-gray-700">
                          {item.branchName}
                        </td>
                        <td className="px-2 py-2 text-center border-b border-gray-100 text-gray-700">
                          {item.competitorTypeName}
                        </td>
                        <td className="px-2 py-2 text-center border-b border-gray-100 text-gray-700">
                          {item.openTime && item.closeTime
                            ? `${item.openTime} - ${item.closeTime}`
                            : '-'}
                        </td>
                        <td className="px-2 py-2 text-center border-b border-gray-100 text-gray-700">
                          {typeof item.saleAverage === 'number'
                            ? item.saleAverage.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '-'}
                        </td>
                        <td className="px-2 py-2 text-center border-b border-gray-100 text-gray-700">
                          {item.grade || '-'}
                        </td>
                        <td className="px-2 py-2 text-center border-b border-gray-100 text-blue-600 font-medium">
                          {item.distance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-4 text-center text-gray-400 italic"
                      >
                        {t('backup:noCompetitorData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-sm font-semibold text-gray-700 mt-6 mb-3">Chain store</p>

            <div className="rounded-lg border border-gray-200">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-yellow-500">
                    <th className="px-2 py-2 text-center text-xs font-medium text-white">
                      {t('backup:storeName')}
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-white">
                      {t('backup:distanceMeters')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingEntertainment ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-4 text-center text-gray-400 italic"
                      >
                        {t('common:loading')}
                      </td>
                    </tr>
                  ) : (fetchEntertainment?.length ?? 0) > 0 ? (
                    fetchEntertainment?.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 transition-colors`}
                      >
                        <td className="px-2 py-2 text-left border-b border-gray-100 text-gray-700">
                          {item.branchName}
                        </td>
                        <td className="px-2 py-2 text-left border-b border-gray-100 text-gray-700">
                          {item.distance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-4 text-center text-gray-400 italic"
                      >
                        {t('backup:noChainStoreData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === '50m' && (
          <div className="overflow-y-auto max-h-[280px] rounded-lg border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-purple-500">
                  <th className="px-2 py-2 text-center text-xs font-medium text-white">
                    {t('backup:storeName')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-white">
                    {t('backup:storeType')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-white">
                    {t('backup:productType')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-white">
                    {t('backup:distanceMeters')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingCompetitor50m ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-2 py-4 text-center text-gray-400 italic"
                    >
                      {t('common:loading')}
                    </td>
                  </tr>
                ) : (fetchCompetitor50m?.length ?? 0) > 0 ? (
                  fetchCompetitor50m?.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-purple-50 transition-colors`}
                    >
                      <td className="px-2 py-2 text-left border-b border-gray-100 text-gray-700">
                        {item.branchName}
                      </td>
                      <td className="px-2 py-2 text-center border-b border-gray-100 text-gray-700">
                        {item.competitorTypeName}
                      </td>
                      <td className="px-2 py-2 text-center border-b border-gray-100 text-gray-700">
                        Non-Food
                      </td>
                      <td className="px-2 py-2 text-center border-b border-gray-100 text-blue-600 font-medium">
                        {item.distance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-2 py-4 text-center text-gray-400 italic"
                    >
                      {t('backup:noStoreDataWithin50m')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeSection === 'streetfood' && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg overflow-y-auto max-h-[280px]">
            {streetFoodOptions.map(item => (
              <div
                key={item.id}
                className="flex items-center p-2 hover:bg-white rounded transition-colors"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={streetFood.includes(item.id)}
                  onChange={() => syncStreetFoodFromApi(item.id)}
                />
                <span className="text-sm text-gray-700">{item.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorTab;
