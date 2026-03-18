import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRentalLocation } from '@/services/backup.service';
import { HoverDropdown } from '@/components/base/HoverDropdown';
import type { LocationInfo } from '@/services/location.service';
import type { BackupProfile } from '@/services/backup.service';
import { BackupHeader } from './BackupHeader';
import { useTranslation } from 'react-i18next';
// ============================================================================
// Types & Interfaces
// ============================================================================

interface LocationTabProps {
  backupData?: BackupProfile;
  location: LocationInfo | null;
  formLocNumber?: string;
  nation?: string;
}

type ActiveTab = 'loc' | 'feature';

// ============================================================================
// Constants
// ============================================================================

const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes

const AREA_UNIT_OPTIONS = [
  { value: '1', label: 'ตร.ม.' },
  { value: '2', label: 'ตร.วา' },
];

// ============================================================================
// Component
// ============================================================================

const LocationTab = ({ location, formLocNumber, nation }: LocationTabProps) => {
  const { t } = useTranslation(['common', 'backup', 'maps']);

  // ============================================================================
  // Local State
  // ============================================================================
  const [activeTab, setActiveTab] = useState<ActiveTab>('loc');
  const [bldAreaUnit, setBldAreaUnit] = useState('1');
  const [bldBackAreaUnit, setBldBackAreaUnit] = useState('1');

  // ============================================================================
  // Data Fetching
  // ============================================================================
  const { data: rentalData } = useQuery({
    queryKey: ['rentalLocation', formLocNumber],
    queryFn: () => fetchRentalLocation(formLocNumber),
    enabled: !!formLocNumber,
    staleTime: QUERY_STALE_TIME,
  });

  const data = rentalData;

  // ============================================================================
  // Handlers
  // ============================================================================
  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="px-4 py-3 pr-4">
      <BackupHeader location={location} formLocNumber={formLocNumber} nation={nation} />

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-gray-200 mb-4 mt-4">
        <button
          onClick={() => handleTabChange('loc')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'loc'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('backup:targetLocation')}
        </button>
        <button
          onClick={() => handleTabChange('feature')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'feature'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('backup:feature')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'loc' && (
        <div className="space-y-4 overflow-y-auto max-h-[280px]">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">
                {t('backup:targetLocation')} :
              </label>
              <input
                value={data?.locTarget || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:deedNumber')} :
              </label>
              <input
                value={data?.deedNumber || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:deedPropNo')} :
              </label>
              <input
                value={data?.deedPropNo || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:LandSurveyPage')} :
              </label>
              <input
                value={data?.deedFrontSurvey || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:addrNo')} :
              </label>
              <input
                value={data?.addrNo || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:addrMoo')} :
              </label>
              <input
                value={data?.addrMoo || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:addrSoi')} :
              </label>
              <input
                value={data?.addrSoi || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:addrRoad')} :
              </label>
              <input
                value={data?.addrRoad || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:addrSubDistrict')} :
              </label>
              <input
                value={data?.addrSubDistrict || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:addrDistrict')} :
              </label>
              <input
                value={data?.districtName || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:addrProvince')} :
              </label>
              <input
                value={data?.provinceName || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:addrPostCode')} :
              </label>
              <input
                value={data?.addrPostCode || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                {t('backup:oldBusiness')} :
              </label>
              <input
                value={data?.oldBusiness || ''}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feature' && (
        <div className="space-y-4 overflow-y-auto max-h-[280px]">
          {/* Building Section */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-semibold text-gray-700">
                {t('backup:feature')} :
              </label>
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={data?.isBuilding === '1'}
                  className="mr-2 w-4 h-4 accent-blue-600"
                />
                {t('backup:buildingFeature')}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-600 w-24">
                  {t('backup:number')}:
                </label>
                <input
                  value={data?.bldFloor || ''}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                  readOnly
                />
                <span className="text-sm text-gray-600">{t('backup:floor')}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={''}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                  readOnly
                />
                <span className="text-sm text-gray-600">{t('backup:numberOfUnits')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-600 w-24">
                  {t('backup:buildingSize')} :
                </label>
                <span className="text-sm text-gray-600">{t('backup:width')}</span>
                <input
                  value={data?.bldWidth || ''}
                  className="w-16 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                  readOnly
                />
                <span className="text-sm text-gray-600">{t('backup:meters')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('backup:length')}</span>
                <input
                  value={data?.bldDepth || ''}
                  className="w-16 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                  readOnly
                />
                <span className="text-sm text-gray-600">{t('backup:meters')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <label className="text-sm font-semibold text-gray-600 w-24">
                {t('backup:totalArea')} :
              </label>
              <input
                value={data?.bldTotalArea || ''}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                readOnly
              />
              <div className="w-32">
                <HoverDropdown
                  options={AREA_UNIT_OPTIONS}
                  value={bldAreaUnit}
                  onChange={setBldAreaUnit}
                  hoverBehavior="shadow"
                  maxHeight="150px"
                  showClearButton={false}
                />
              </div>
            </div>
          </div>

          {/* Back of Building Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-semibold text-gray-700">
                {t('backup:backOfBuilding')} :
              </label>
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={data?.bldBack === '1'}
                  className="mr-2 w-4 h-4 accent-blue-600"
                />
                {t('backup:have')}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('backup:width')}</span>
                <input
                  value={data?.bldBackWidth || ''}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                  readOnly
                />
                <span className="text-sm text-gray-600">{t('backup:meters')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('backup:length')}</span>
                <input
                  value={data?.bldBackDepth || ''}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                  readOnly
                />
                <span className="text-sm text-gray-600">เมตร</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <label className="text-sm font-semibold text-gray-600 w-24">
                {t('backup:totalArea')} :
              </label>
              <input
                value={data?.bldTotalArea || ''}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                readOnly
              />
              <div className="w-32">
                <HoverDropdown
                  options={AREA_UNIT_OPTIONS}
                  value={bldBackAreaUnit}
                  onChange={setBldBackAreaUnit}
                  hoverBehavior="shadow"
                  maxHeight="150px"
                  showClearButton={false}
                />
              </div>
            </div>
          </div>

          {/* Empty Land Section */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-semibold text-gray-700">
                {t('backup:emptyLand')} :
              </label>
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={data?.isLand === '1'}
                  className="mr-2 w-4 h-4 accent-green-600"
                />
                {t('backup:have')}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('backup:width')}</span>
                <input
                  value={data?.landWidth || ''}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                  readOnly
                />
                <span className="text-sm text-gray-600">{t('backup:meters')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('backup:length')}</span>
                <input
                  value={data?.landDepth || ''}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm shadow-sm"
                  readOnly
                />
                <span className="text-sm text-gray-600">{t('backup:meters')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationTab;
