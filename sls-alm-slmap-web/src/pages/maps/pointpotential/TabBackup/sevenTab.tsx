import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchSevenNearby,
  type SevenElevenNearbyData,
} from '@/services/location.service';
import { type BackupProfile } from '@/services/backup.service';
import type { LocationInfo } from '@/services/location.service';
import { BackupHeader } from './BackupHeader';
import { useTranslation } from 'react-i18next';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface SevenTabProps {
  backupData?: BackupProfile;
  location: LocationInfo | null;
  formLocNumber?: string;
  nation?: string;
}

// ============================================================================
// Constants
// ============================================================================

const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Component
// ============================================================================

const SevenTab = ({ location, formLocNumber, nation, backupData }: SevenTabProps) => {
  // ============================================================================
  // Local State
  // ============================================================================
  const [sevenData, setSevenData] = useState<SevenElevenNearbyData[]>([]);

  // ============================================================================
  // Store
  // ============================================================================

  const { t } = useTranslation(['common', 'backup', 'maps']);

  // ============================================================================
  // Data Fetching
  // ============================================================================
  const { data: fetchSevenData } = useQuery({
    queryKey: [
      'sevenData',
      backupData?.poiId,
    ],
    queryFn: () =>
      fetchSevenNearby(
        location?.geom?.coordinates[1] ?? 0,
        location?.geom?.coordinates[0] ?? 0,
        500
      ),
    enabled: true,
    staleTime: QUERY_STALE_TIME,
  });

  // ============================================================================
  // Effects
  // ============================================================================
  useEffect(() => {
    if (fetchSevenData) {
      setSevenData(fetchSevenData);
    }
  }, [fetchSevenData]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="px-4 py-3 pr-4">
      <BackupHeader location={location} formLocNumber={formLocNumber} nation={nation} />

      {/* Seven-Eleven Table */}
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm mt-4">
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="bg-green-500">
              <th className="px-2 py-2 text-center text-xs font-medium text-white w-24">
                {t('backup:branchCode')}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-white">
                {t('backup:branchName')}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-white w-28">
                {t('backup:storeType')}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-white w-32">
                {t('backup:averageSales')}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-white w-28">
                {t('backup:distanceMeters')}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-white w-32">
                {t('backup:formCode')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sevenData.length > 0 ? (
              sevenData.map((item, index) => (
                <tr
                  key={item.id}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors`}
                >
                  <td className="px-2 text-center py-2 border-b border-gray-100 text-gray-700 font-medium">
                    {item.branchCode}
                  </td>
                  <td className="px-2 text-center py-2 border-b border-gray-100 text-gray-700">
                    {item.branchName}
                  </td>
                  <td className="px-2 text-center py-2 border-b border-gray-100 text-gray-700">
                    {item.sevenTypeName}
                  </td>
                  <td className="px-2 text-center py-2 border-b border-gray-100 text-gray-700">
                    {typeof item.saleAverage === 'number'
                      ? item.saleAverage.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '-'}
                  </td>
                  <td className="px-2 text-center py-2 border-b border-gray-100 text-blue-600 font-medium">
                    {typeof item.distance === 'number'
                      ? item.distance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '-'}
                  </td>
                  <td className="px-2 py-2 text-center border-b border-gray-100 text-blue-600 font-medium">
                    {item.formLocNumber}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-gray-400 italic">
                  ไม่มีข้อมูล 7-Eleven
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SevenTab;
