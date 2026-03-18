import { Button, Input, Select, type DropdownOption } from '../../../../components';
import { useQuery } from '@tanstack/react-query';
import { fetchCommonCodes } from '../../../../services/master.service';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PopupAlert from '../../../../components/base/PopupAlert';
import type { SevenData } from '../../../../services/location.service';

export type SevenFormData = SevenData;

interface SevenProps {
  poiId: string;
  onDataChange?: (data: any) => void;
  formData: SevenFormData;
  showForm?: boolean;
  setShowForm?: (show: boolean) => void;
  invalidFields?: string[];
}

const Seven: React.FC<SevenProps> = ({
  onDataChange,
  formData,
  showForm,
  setShowForm,
  invalidFields = [],
}) => {
  const { t } = useTranslation(['maps']);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const handleStoreFranchiseFetch = async (): Promise<DropdownOption[]> => {
    try {
      const result = await fetchCommonCodes('STORE_FRANCHISE');
      return result.map<DropdownOption>(status => ({
        value: status.value,
        label: status.text,
      }));
    } catch (error) {
      console.error('Failed to fetch storeFranchise:', error);
      return [];
    }
  };

  const { data: storeFranchiseOptionsData } = useQuery({
    queryKey: ['storeFranchise'],
    queryFn: handleStoreFranchiseFetch,
    enabled: true,
    staleTime: Infinity,
  });

  const handleImpactSizeFetch = async (): Promise<DropdownOption[]> => {
    try {
      const result = await fetchCommonCodes('IMPACT_TYPE_SITE');
      return result.map<DropdownOption>(status => ({
        value: status.value,
        label: status.text,
      }));
    } catch (error) {
      console.error('Failed to fetch impactSize:', error);
      return [];
    }
  };

  const { data: impactSizeOptionsData } = useQuery({
    queryKey: ['impactSize'],
    queryFn: handleImpactSizeFetch,
    enabled: true,
    staleTime: Infinity,
  });

  const handleStoreBuildingTypeFetch = async (): Promise<DropdownOption[]> => {
    try {
      const result = await fetchCommonCodes('STORE_BUILDING_TYPE');
      return result.map<DropdownOption>(status => ({
        value: status.value,
        label: status.text,
      }));
    } catch (error) {
      console.error('Failed to fetch storeBuildingType:', error);
      return [];
    }
  };

  const { data: storeBuildingTypeOptionsData } = useQuery({
    queryKey: ['storeBuildingType'],
    queryFn: handleStoreBuildingTypeFetch,
    enabled: true,
    staleTime: Infinity,
  });

  const setFormData = (updater: any) => {
    if (onDataChange) {
      if (typeof updater === 'function') {
        onDataChange(updater(formData));
      } else {
        onDataChange(updater);
      }
    }
  };

  const handleUpdate = (field: string, value: string) => {
    if (['width', 'length', 'saleArea', 'stockArea', 'storeArea'].includes(field)) {
      setFormData((prev: any) => ({
        ...prev,
        dimension: {
          ...prev.dimension,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  // Reset form data helper
  const resetFormData = () => {
    setFormData({
      name: '',
      storeCode: '',
      standardLayout: '',
      estimateDateOpen: '',
      impactType: '',
      impactDetail: '',
      investmentType: '',
      storeBuildingType: '',
      dimension: {
        width: '',
        length: '',
        saleArea: '',
        stockArea: '',
        storeArea: '',
      },
      parkingCount: '',
    });
  };

  const handleDeleteClick = () => {
    setShowDeletePopup(true);
  };
  const handleDeleteConfirm = () => {
    setShowDeletePopup(false);
    if (setShowForm) {
      setShowForm(false);
    }
    resetFormData();
  };
  const handleDeleteCancel = () => {
    setShowDeletePopup(false);
  };

  return (
    <>
      <div className="space-y-6 animate-fadeIn pt-1">
        {/* Header Buttons */}
        <div className="flex justify-end gap-2 mb-2">
          <Button
            variant="outline"
            className="text-blue-600 hover:bg-blue-50 transition-colors disabled:text-gray-400"
            size="sm"
            onClick={() => setShowForm && setShowForm(true)}
            disabled={!!showForm}
            icon={
              <svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            }
            iconPosition="left"
          >
            เพิ่ม
          </Button>

          <Button
            variant="outline"
            className="text-blue-600 hover:bg-blue-50 transition-colors disabled:text-gray-400"
            size="sm"
            onClick={handleDeleteClick}
            disabled={!showForm}
            icon={
              <svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            }
            iconPosition="left"
          >
            ลบ
          </Button>
        </div>

        {/* Form Grid */}
        {showForm && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-3">
            {/* Row 1 */}
            <div>
              <Input
                title={t('seven_store_name')}
                required
                type="text"
                placeholder={t('seven_store_name')}
                value={formData.name}
                onChange={e => handleUpdate('name', e.target.value)}
                size="sm"
                className={`${invalidFields.includes('name') ? 'border-red-500' : ''}`}
              >
                {invalidFields.includes('name') && (
                  <div className="text-xs text-red-500 ml-1">
                    {t('seven_store_name_required')}
                  </div>
                )}
              </Input>
            </div>
            <Input
              title={t('seven_store_code')}
              type="text"
              placeholder={t('seven_store_code')}
              value={formData.storeCode}
              onChange={e => handleUpdate('storeCode', e.target.value)}
              size="sm"
            />

            {/* Row 2 (Search Style) */}
            <Input
              title={t('seven_standard_type')}
              type="text"
              placeholder={t('seven_standard_type')}
              value={formData.standardLayout}
              onChange={e => handleUpdate('standardLayout', e.target.value)}
              size="sm"
            />
            <Input
              title={t('seven_open_month')}
              type="text"
              placeholder={t('seven_open_month')}
              value={formData.estimateDateOpen}
              onChange={e => handleUpdate('estimateDateOpen', e.target.value)}
              size="sm"
            />

            {/* Row 3 */}
            <Select
              title={t('seven_impact_type')}
              value={formData.impactType || ''}
              onChange={e => handleUpdate('impactType', e.target.value)}
              options={impactSizeOptionsData || []}
              placeholder={t('potential_select_placeholder')}
            />

            {/* Row 4 */}
            <Select
              title={t('seven_shop_type')}
              value={formData.storeBuildingType || ''}
              onChange={e => handleUpdate('storeBuildingType', e.target.value)}
              options={storeBuildingTypeOptionsData || []}
              placeholder={t('potential_select_placeholder')}
            />
            <Select
              title={t('seven_investment_type')}
              value={formData.investmentType || ''}
              onChange={e => handleUpdate('investmentType', e.target.value)}
              options={storeFranchiseOptionsData || []}
              placeholder={t('potential_select_placeholder')}
            />

            {/* Row 5 (Custom Select) */}
            <div>
              <Input
                title={t('seven_width')}
                required
                type="text"
                placeholder={t('seven_width')}
                value={formData.dimension?.width || ''}
                onChange={e => {
                  let value = e.target.value.replace(/[^0-9.,]/g, '');
                  value = value.replace(',', '.');
                  const parts = value.split('.');
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                  }
                  handleUpdate('width', value);
                }}
                size="sm"
                className={`${invalidFields.includes('width') || invalidFields.includes('dimension.width') ? 'border-red-500' : ''}`}
              >
                {(invalidFields.includes('width') ||
                  invalidFields.includes('dimension.width')) && (
                  <div className="text-xs text-red-500 ml-1">
                    {t('seven_width_required')}
                  </div>
                )}
              </Input>
            </div>
            <div>
              <Input
                title={t('seven_length')}
                required
                type="text"
                placeholder={t('seven_length')}
                value={formData.dimension?.length || ''}
                onChange={e => {
                  let value = e.target.value.replace(/[^0-9.,]/g, '');
                  value = value.replace(',', '.');
                  const parts = value.split('.');
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                  }
                  handleUpdate('length', value);
                }}
                size="sm"
                className={`${invalidFields.includes('length') || invalidFields.includes('dimension.length') ? 'border-red-500' : ''}`}
              >
                {(invalidFields.includes('length') ||
                  invalidFields.includes('dimension.length')) && (
                  <div className="text-xs text-red-500 ml-1">
                    {t('seven_length_required')}
                  </div>
                )}
              </Input>
            </div>

            {/* Row 6 */}
            <div>
              <Input
                title={t('seven_sale_area')}
                required
                type="text"
                placeholder={t('seven_sale_area')}
                value={formData.dimension?.saleArea || ''}
                onChange={e => {
                  let value = e.target.value.replace(/[^0-9.,]/g, '');
                  value = value.replace(',', '.');
                  const parts = value.split('.');
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                  }
                  handleUpdate('saleArea', value);
                }}
                size="sm"
                className={`${invalidFields.includes('saleArea') || invalidFields.includes('dimension.saleArea') ? 'border-red-500' : ''}`}
              >
                {(invalidFields.includes('saleArea') ||
                  invalidFields.includes('dimension.saleArea')) && (
                  <div className="text-xs text-red-500 ml-1">
                    {t('seven_sale_area_required')}
                  </div>
                )}
              </Input>
            </div>
            <div>
              <Input
                title={t('seven_stock_area')}
                required
                type="text"
                placeholder={t('seven_stock_area')}
                value={formData.dimension?.stockArea || ''}
                onChange={e => {
                  let value = e.target.value.replace(/[^0-9.,]/g, '');
                  value = value.replace(',', '.');
                  const parts = value.split('.');
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                  }
                  handleUpdate('stockArea', value);
                }}
                size="sm"
                className={`${invalidFields.includes('stockArea') || invalidFields.includes('dimension.stockArea') ? 'border-red-500' : ''}`}
              >
                {(invalidFields.includes('stockArea') ||
                  invalidFields.includes('dimension.stockArea')) && (
                  <div className="text-xs text-red-500 ml-1">
                    {t('seven_stock_area_required')}
                  </div>
                )}
              </Input>
            </div>

            {/* Row 7 */}
            <div>
              <Input
                title={t('seven_total_area')}
                required
                type="text"
                placeholder={t('seven_total_area')}
                value={formData.dimension?.storeArea || ''}
                onChange={e => {
                  let value = e.target.value.replace(/[^0-9.,]/g, '');
                  value = value.replace(',', '.');
                  const parts = value.split('.');
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                  }
                  handleUpdate('storeArea', value);
                }}
                size="sm"
                className={`${invalidFields.includes('storeArea') || invalidFields.includes('dimension.storeArea') ? 'border-red-500' : ''}`}
              >
                {(invalidFields.includes('storeArea') ||
                  invalidFields.includes('dimension.storeArea')) && (
                  <div className="text-xs text-red-500 ml-1">
                    {t('seven_total_area_required')}
                  </div>
                )}
              </Input>
            </div>
            <div>
              <Input
                title={t('seven_parking_count')}
                required
                type="text"
                placeholder={t('seven_parking_count')}
                value={formData.parkingCount}
                onChange={e => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  handleUpdate('parkingCount', value);
                }}
                size="sm"
                className={`${invalidFields.includes('parkingCount') ? 'border-red-500' : ''}`}
              >
                {invalidFields.includes('parkingCount') && (
                  <div className="text-xs text-red-500 ml-1">
                    {t('seven_parking_count_required')}
                  </div>
                )}
              </Input>
            </div>
          </div>
        )}
      </div>

      {/* Popup Alert for delete confirmation */}
      <PopupAlert
        open={showDeletePopup}
        type="info"
        message="คุณต้องการลบข้อมูล 7-11 หรือไม่?"
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default Seven;
