import { useEffect, useMemo, useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { fetchCoordinateInfo } from '../../services/location.service';
import type { CoordinateInfoResponse } from '../../types/location.type';
import { useTranslation } from 'react-i18next';
import Button from './Button';

export interface CoordinateBasicInfo {
  latitude: number;
  longitude: number;
  zone: string;
  subzone: string;
}

interface LocationClickPopupProps {
  latitude: number;
  longitude: number;
  onClose: () => void;
  department?: string;
  onCreatePotential?: (data: {
    latitude: number;
    longitude: number;
    zone: string;
    subzone: string;
  }) => void;
  onCreateEnvData?: (data: {
    latitude: number;
    longitude: number;
    zone: string;
    subzone: string;
  }) => void;
}

export const LocationClickPopup: React.FC<LocationClickPopupProps> = ({
  latitude,
  longitude,
  onClose,
  onCreatePotential,
  onCreateEnvData,
}) => {
  const { t } = useTranslation(['maps']);
  const formatCoordinate = (value: number) => value.toFixed(6);
  const [coordinateInfo, setCoordinateInfo] = useState<CoordinateInfoResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { language } = useLanguageStore();

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const result = await fetchCoordinateInfo(latitude, longitude);
        setCoordinateInfo(result.data);
      } catch (error) {
        console.error('Error fetching coordinate info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [latitude, longitude, language]);

  const fullAddress = useMemo(() => {
    if (coordinateInfo == null) {
      return '';
    }

    return `${t('sub_district')}${
      coordinateInfo?.subDistrict || ''
    } ${t('district')}${coordinateInfo?.district || ''} ${t('province')}${coordinateInfo?.province || '-'}`.trim();
  }, [coordinateInfo, t]);

  // Demo mode: always grant permission
  const hasPermission = true;

  const handleClickCreatePotential = () => {
    if (onCreatePotential) {
      onCreatePotential({
        latitude,
        longitude,
        zone: coordinateInfo?.zone || '',
        subzone: coordinateInfo?.subzone || '',
      });
    }
  };

  const handleClickCreateEnv = () => {
    if (onCreateEnvData) {
      onCreateEnvData({
        latitude,
        longitude,
        zone: coordinateInfo?.zone || '',
        subzone: coordinateInfo?.subzone || '',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-5 pt-6 flex items-start justify-between w-[600px] border border-gray-200 relative">
      <button
        onClick={onClose}
        className="absolute top-0.5 right-0.5 text-gray-400 hover:text-gray-600 transition-colors z-20"
        aria-label="Close"
        style={{
          padding: 0,
          background: 'none',
          border: 'none',
          height: '28px',
          width: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-medium whitespace-pre-line break-words mb-1">
          {loading && t('location_popup_loading')}
          {!loading && fullAddress}
          {!loading && !coordinateInfo && (
            <span className="text-red-600">{t('location_popup_not_found')}</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mb-2">
          {t('location_popup_zone')}: {coordinateInfo?.zone ?? '-'}
          &nbsp;{t('location_popup_subzone')}: {coordinateInfo?.subzone ?? '-'}
        </div>
        <div className="text-xs text-gray-500">
          {t('location_popup_coordinates')}: {formatCoordinate(latitude)},{' '}
          {formatCoordinate(longitude)}
        </div>
      </div>

      {coordinateInfo && (
        <div className="flex flex-col gap-2 ml-4 min-w-[180px] max-w-[200px] pr-0 rounded-lg bg-white py-2 px-2 items-center">
          <div
            className={`${!hasPermission ? 'tooltip' : ''} w-full`}
            data-tip={t('not_authorized')}
          >
            <Button
              className={`${!hasPermission ? '' : 'border-blue-500 text-blue-700 hover:bg-blue-50'} w-full border font-semibold rounded px-3 py-1`}
              onClick={handleClickCreatePotential}
              variant="outline"
              disabled={!hasPermission}
              size="sm"
            >
              {t('location_popup_create_potential')}
            </Button>
          </div>
          <div
            className={`${!hasPermission ? 'tooltip' : ''} w-full`}
            data-tip={t('not_authorized')}
          >
            <Button
              className={`${!hasPermission ? '' : 'border-blue-500 text-blue-700 hover:bg-blue-50'} w-full border font-semibold rounded px-3 py-1`}
              variant="outline"
              onClick={handleClickCreateEnv}
              disabled={!hasPermission}
              size="sm"
            >
              {t('location_popup_create_envdata')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
