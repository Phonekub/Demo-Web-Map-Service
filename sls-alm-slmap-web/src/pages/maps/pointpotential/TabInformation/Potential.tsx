import { useTranslation } from 'react-i18next';
import { Input, Select, type DropdownOption } from '../../../../components';
import { useQuery } from '@tanstack/react-query';
import { fetchCommonCodes } from '../../../../services/master.service';
import type { CoordinateBasicInfo } from '../../../../components/base/LocationClickPopup';
import type { PotentialData } from '../../../../services/location.service';
import { useMemo } from 'react';

const GRADE_OPTIONS: DropdownOption[] = [
  { value: 'A+', label: 'A+' },
  { value: 'A', label: 'A' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B', label: 'B' },
  { value: 'B-', label: 'B-' },
  { value: 'C+', label: 'C+' },
  { value: 'C', label: 'C' },
  { value: 'C-', label: 'C-' },
];

export type PotentialFormData = PotentialData;

interface PotentialSidebarProps {
  poiId: string;
  onDataChange?: (data: PotentialFormData) => void;
  formData: PotentialFormData;
  invalidFields?: string[];
  coordinateBasicInfo?: CoordinateBasicInfo | null;
}

const Potential: React.FC<PotentialSidebarProps> = ({
  onDataChange,
  formData,
  invalidFields = [],
  coordinateBasicInfo = null,
}) => {
  const { t } = useTranslation(['maps']);

  const handleLocationTypeStatusFetch = async (): Promise<DropdownOption[]> => {
    try {
      const result = await fetchCommonCodes('LOCATION_TYPE');
      return result.map<DropdownOption>(status => ({
        value: status.value,
        label: status.text,
      }));
    } catch (error) {
      console.error('Failed to fetch locationType:', error);
      return [];
    }
  };

  const { data: locationTypeOptionsData } = useQuery({
    queryKey: ['locationType'],
    queryFn: handleLocationTypeStatusFetch,
    enabled: true,
    staleTime: Infinity,
  });

  const handleAreaTypeFetch = async (): Promise<DropdownOption[]> => {
    try {
      const result = await fetchCommonCodes('BUILDING_TYPE');
      return result.map<DropdownOption>(status => ({
        value: status.value,
        label: status.text,
      }));
    } catch (error) {
      console.error('Failed to fetch areaType:', error);
      return [];
    }
  };

  const { data: areaTypeOptionsData } = useQuery({
    queryKey: ['areaType'],
    queryFn: handleAreaTypeFetch,
    enabled: true,
    staleTime: Infinity,
  });

  const handleUpdate = (field: keyof PotentialFormData, value: string | number) => {
    if (!onDataChange) {
      return;
    }

    const isNumericField = ['cigaretteSale', 'alcoholSale'].includes(field);

    const updatedValue = isNumericField
      ? value === ''
        ? undefined
        : Number(value)
      : String(value);

    onDataChange({
      ...formData,
      [field]: updatedValue,
    });
  };

  const showStatus = useMemo(() => {
    const status = formData?.status !== undefined && formData?.status !== '';
    const approveStatus =
      formData?.approveStatus !== undefined && formData?.approveStatus !== '';
    return status || approveStatus;
  }, [formData?.status, formData?.approveStatus]);

  return (
    <div className="p-4">
      {showStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formData?.status !== undefined && formData?.status !== '' && (
            <div className="form-control">
              <Input
                title={t('potential_location_status')}
                type="text"
                value={formData?.status || ''}
                disabled
                className="w-full bg-gray-100 border border-gray-200 rounded-md text-gray-500 cursor-not-allowed"
                size="sm"
              />
            </div>
          )}

          {formData?.approveStatus !== undefined && formData?.approveStatus !== '' && (
            <div className="form-control">
              <Input
                title={t('potential_approve_status')}
                type="text"
                value={formData?.approveStatus || ''}
                disabled
                className="w-full bg-gray-100 border border-gray-200 rounded-md text-gray-500 cursor-not-allowed"
                size="sm"
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1">
        <div>
          <Input
            title={t('potential_name')}
            required
            type="text"
            placeholder={t('potential_name_placeholder')}
            value={formData.name}
            onChange={e => handleUpdate('name', e.target.value)}
            size="sm"
            className={`${invalidFields.includes('name') ? 'border-red-500' : ''}`}
          >
            {invalidFields.includes('name') && (
              <div className="text-xs text-red-500  ml-1">
                {t('potential_name_required')}
              </div>
            )}
          </Input>
        </div>

        <Input
          title={t('potential_address')}
          type="text"
          placeholder={t('potential_address_placeholder')}
          value={formData.address}
          onChange={e => handleUpdate('address', e.target.value)}
          size="sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          title={t('potential_trade_type')}
          size="md"
          value={formData.locationType === undefined ? '' : formData.locationType}
          onChange={e => handleUpdate('locationType', e.target.value)}
          options={locationTypeOptionsData || []}
          placeholder={t('potential_select_placeholder')}
        />

        <Select
          title={t('potential_area_status')}
          size="md"
          value={formData.areaType === undefined ? '' : formData.areaType}
          onChange={e => handleUpdate('areaType', e.target.value)}
          options={areaTypeOptionsData || []}
          placeholder={t('potential_select_placeholder')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          title={t('potential_trade_area')}
          size="md"
          value={formData.grade === undefined ? '' : formData.grade}
          onChange={e => handleUpdate('grade', e.target.value)}
          options={GRADE_OPTIONS}
          placeholder={t('potential_select_placeholder')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-control w-full">
          <Input
            title={t('potential_region')}
            type="text"
            value={coordinateBasicInfo?.zone || formData.zoneCode || ''}
            disabled
            className="w-full bg-gray-100 border border-gray-200 rounded-md text-gray-500 cursor-not-allowed"
            size="sm"
          />
        </div>
        <div className="form-control w-full">
          <Input
            title={t('potential_department')}
            type="text"
            value={coordinateBasicInfo?.subzone || formData.subZoneCode || ''}
            disabled
            size="sm"
            className="w-full p-2 bg-gray-100 border border-gray-200 rounded-md text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        <div className="space-y-3">
          <span className="text-xs font-semibold text-gray-500">
            {t('potential_cigarette_sale')} <span className="text-red-500">*</span>
          </span>
          <div className={'flex gap-7 '}>
            <label
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleUpdate('cigaretteSale', 1)}
            >
              <input
                type="radio"
                name="cigaretteSale-group"
                className={`radio radio-primary radio-xs ${invalidFields.includes('cigaretteSale') ? 'border border-red-500 ' : ''}`}
                checked={formData.cigaretteSale === 1}
                readOnly
              />
              <span
                className={`text-xs ${formData.cigaretteSale === 1 ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
              >
                {t('potential_yes')}
              </span>
            </label>
            <label
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleUpdate('cigaretteSale', 0)}
            >
              <input
                type="radio"
                name="cigaretteSale-group"
                className={`radio radio-primary radio-xs ${invalidFields.includes('cigaretteSale') ? 'border border-red-500 ' : ''}`}
                checked={formData.cigaretteSale === 0}
                readOnly
              />
              <span
                className={`text-xs ${formData.cigaretteSale === 0 ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
              >
                {t('potential_no')}
              </span>
            </label>
          </div>
          {invalidFields.includes('cigaretteSale') && (
            <div className="text-xs text-red-500  ml-1">
              {t('potential_field_required')}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <span className="text-xs font-semibold text-gray-500">
            {t('potential_alcohol_sale')} <span className="text-red-500">*</span>
          </span>
          <div className={'flex gap-7 '}>
            <label
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleUpdate('alcoholSale', 1)}
            >
              <input
                type="radio"
                name="alcoholSale-group"
                className={`radio radio-primary radio-xs ${invalidFields.includes('alcoholSale') ? 'border border-red-500 ' : ''}`}
                checked={formData.alcoholSale === 1}
                readOnly
              />
              <span
                className={`text-xs ${formData.alcoholSale === 1 ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
              >
                {t('potential_yes')}
              </span>
            </label>
            <label
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleUpdate('alcoholSale', 0)}
            >
              <input
                type="radio"
                name="alcoholSale-group"
                className={`radio radio-primary radio-xs ${invalidFields.includes('alcoholSale') ? 'border border-red-500 ' : ''}`}
                checked={formData.alcoholSale === 0}
                readOnly
              />
              <span
                className={`text-xs ${formData.alcoholSale === 0 ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
              >
                {t('potential_no')}
              </span>
            </label>
          </div>
          {invalidFields.includes('alcoholSale') && (
            <div className="text-xs text-red-500  ml-1">
              {t('potential_field_required')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Potential;
