import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PopupAlert from '../../../../components/base/PopupAlert';
import { fetchCommonCodes } from '@/services/master.service';
import { Input, Select, DatePicker, Button, type DropdownOption } from '@/components';
import type { VendingData } from '../../../../services/location.service';
import SevenElevenSelector from './sevenElevenSelector';

export type VendingMachineFormData = VendingData & { status?: string };

interface VendingProps {
  poiId: string;
  onDataChange?: (data: any) => void;
  formData: VendingMachineFormData;
  showForm?: boolean;
  setShowForm?: (show: boolean) => void;
  invalidFields?: string[];
  lat: number;
  long: number;
}

const Vending: React.FC<VendingProps> = ({
  onDataChange,
  formData,
  showForm,
  setShowForm,
  invalidFields = [],
  lat,
  long,
}) => {
  const { t } = useTranslation(['common', 'maps']);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showSevenSelector, setShowSevenSelector] = useState(false);
  const [vendingTypeOptions, setVendingTypeOptions] = useState<DropdownOption[]>([]);

  const handleVendingTypeFetch = async () => {
    try {
      const result = await fetchCommonCodes('VENDING_TYPE');
      const formattedOptions = result.map(item => ({
        value: item.value,
        label: item.text,
      }));
      setVendingTypeOptions(formattedOptions);
    } catch (error) {
      console.error('Failed to fetch vending types:', error);
      setVendingTypeOptions([]);
    }
  };

  useEffect(() => {
    handleVendingTypeFetch();
  }, []);

  const setFormData = (updater: any) => {
    if (onDataChange) {
      const newData =
        typeof updater === 'function' ? updater(formData) : { ...formData, ...updater };

      const finalData = {
        ...newData,
        motherStoreName: newData.motherStoreName || formData.motherStoreName,
        parentBranchCode: newData.parentBranchCode || formData.parentBranchCode,

        // 2. Mapping อื่นๆ
        vendingType: newData.installationType
          ? Number(newData.installationType)
          : newData.vendingType || formData.vendingType,

        floor: newData.floor !== undefined ? String(newData.floor) : formData.floor,

        // ตรวจสอบชื่อฟิลด์ที่อาจจะส่งมาจาก API หรือมาจาก Form
        machineId: newData.vendingCode || newData.machineId || formData.machineId,
      };

      onDataChange(finalData);
    }
  };
  const handleUpdate = (field: string, value: any) => {
    const isEmpty = value === '' || value === null || value === undefined;
    let processedValue = isEmpty ? undefined : value;
    let nextVendingType =
      formData.vendingType === '' || formData.vendingType === null
        ? undefined
        : formData.vendingType;

    if (field === 'installationType') {
      processedValue = isEmpty ? undefined : String(value);
      nextVendingType = isEmpty ? undefined : Number(value);
    } else if (field === 'floor') {
      processedValue = isEmpty ? undefined : String(value);
    }

    const updatedData = {
      ...formData,
      [field]: processedValue,
      vendingType: nextVendingType,
      motherStoreName:
        field === 'motherStoreName' ? processedValue : formData.motherStoreName,
      locationAddress: field === 'address' ? processedValue : formData.address,
      targetPoint: field === 'position' ? processedValue : formData.position,
    };

    onDataChange?.(updatedData);
  };
  // Reset form data helper
  const resetFormData = () => {
    setFormData({
      businessTypeCode: '',
      status: '',
      parentBranchCode: '',
      motherStoreName: '',
      name: '',
      vendingCode: '',
      serialNumber: '',
      model: '',
      installationType: '',
      position: '',
      floor: '',
      address: '',
      contractStartDate: '',
      contractEndDate: '',
      area_cancel_date: '',
      serviceStartDate: '',
      serviceEndDate: '',
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
      <div className="space-y-6 animate-fadeIn pt-1 px-2">
        {/* Header Buttons */}
        <div className="flex w-full justify-end gap-2 mb-2">
          <Button
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
            type="button"
            variant="primary"
            className="flex flex-row bg-transparent shadow-none items-center gap-1 px-4 py-1 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm "
            onClick={() => setShowForm && setShowForm(true)}
            size="sm"
            // disabled={showForm}
          >
            {t('common:add')}
          </Button>
          <Button
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
            className="bg-transparent shadow-none flex items-center gap-1 px-4 py-1 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm"
            onClick={handleDeleteClick}
            disabled={!showForm}
            size="sm"
          >
            {t('common:delete')}
          </Button>
        </div>

        {/* Form Grid */}
        {showForm && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 ">
            {/* Row 1 */}
            <Input
              title={t('maps:vending_business_type_code')}
              type="text"
              placeholder={t('maps:vending_business_type_code')}
              value={formData.businessTypeCode}
              onChange={e => handleUpdate('businessTypeCode', e.target.value)}
              disabled={true}
              size="sm"
            />
            <Input
              title={t('maps:vending_status')}
              type="text"
              value={formData.status || 'รอส่งยืนยัน'}
              disabled
              size="sm"
            />

            {/* Row 2 (Search Style) */}
            <div>
              {showSevenSelector && (
                <SevenElevenSelector
                  isOpen={showSevenSelector}
                  onClose={() => setShowSevenSelector(false)}
                  onSelect={seven => {
                    console.log('Selected IDs:', seven);
                    // สร้างก้อนข้อมูลใหม่โดยรวมค่าที่เลือกมา
                    const updatedWithSeven = {
                      ...formData,
                      parentBranchCode: seven?.branchCode ?? '',
                      motherStoreName: seven?.branchName ?? '',
                    };

                    // ส่งข้อมูลที่อัปเดตแล้วกลับไปที่ Parent ทันที
                    onDataChange?.(updatedWithSeven);
                    setShowSevenSelector(false);
                  }}
                  lat={lat}
                  long={long}
                />
              )}
              <div>
                {/* รหัสสาขายานแม่ */}
                <div className="flex items-end">
                  <div className="flex-1">
                    <Input
                      title={t('maps:vending_parent_branch_code')}
                      required={true}
                      type="text"
                      placeholder={t('maps:vending_parent_branch_code')}
                      className={`input w-full h-[25px] rounded-r-none ${invalidFields.includes('parentBranchCode') ? 'border-red-500' : ''}`}
                      value={formData.parentBranchCode}
                      disabled={true}
                      size="sm"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowSevenSelector(true)}
                    size="sm"
                    className={`btn border-gray-300 font-medium text-black bg-transparent shadow-none w-fit h-[25px] rounded-l-none border-l-0 ${invalidFields.includes('parentBranchCode') ? 'border-red-500' : ''}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </Button>
                </div>

                {/* แสดง Error Message ถ้ามี */}
                {invalidFields.includes('parentBranchCode') && (
                  <div className="text-xs text-red-500 mt-1">
                    {t('maps:vending_parent_branch_code_required')}
                  </div>
                )}
              </div>
              {/* <Button
                title={t('maps:vending_parent_branch_code')}
                required={true}
                variant="primary"
                onClick={() => setShowSevenSelector(true)}
                size="sm"
                className={`${invalidFields.includes('parentBranchCode') ? 'border-red-500' : ''} border-gray-300 font-medium text-black bg-transparent shadow-none w-full`}
              >
                {invalidFields.includes('parentBranchCode') && (
                  <div className="text-xs text-red-500 ml-1">
                    {t('vending_parent_branch_code_required')}
                  </div>
                )}
                {formData.parentBranchCode}
              </Button> */}
            </div>
            <Input
              title={t('maps:vending_mother_store_name')}
              type="text"
              placeholder={t('maps:vending_mother_store_name')}
              value={formData.motherStoreName }
              onChange={e => handleUpdate('motherStoreName', e.target.value)}
              size="sm"
              disabled={true}
            />

            {/* Row 3 */}
            <Input
              title={t('maps:vending_name')}
              type="text"
              placeholder={t('maps:vending_name')}
              value={formData.name}
              onChange={e => handleUpdate('name', e.target.value)}
              size="sm"
            />

            {/* Row 4 */}
            <Input
              title={t('maps:vending_code')}
              type="text"
              placeholder={t('maps:vending_code')}
              value={formData.vendingCode}
              onChange={e => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                handleUpdate('vendingCode', value);
              }}
              size="sm"
            />
            <Input
              title={t('maps:vending_serial_number')}
              type="text"
              placeholder={t('maps:vending_serial_number')}
              value={formData.serialNumber}
              onChange={e => handleUpdate('serialNumber', e.target.value)}
              size="sm"
            />

            {/* Row 5 (Custom Select) */}
            <Select
              title={t('maps:vending_model')}
              value={formData.model || ''}
              onChange={e => handleUpdate('model', e.target.value)}
              options={[
                { value: 'TCN', label: 'TCN' },
                { value: 'FUJI', label: 'FUJI' },
              ]}
              placeholder={t('maps:potential_select_placeholder')}
            />
            <Select
              title={t('maps:vending_installation_type')}
              value={formData.installationType ? String(formData.installationType) : ''}
              onChange={e => handleUpdate('installationType', e.target.value)}
              options={vendingTypeOptions}
              placeholder={t('maps:potential_select_placeholder')}
            />

            {/* Row 6 */}
            <Input
              title={t('maps:vending_position')}
              type="text"
              placeholder={t('maps:vending_position')}
              value={formData.position || ''}
              onChange={e => handleUpdate('position', e.target.value)}
              size="sm"
            />
            <div>
              <Input
                title={t('maps:vending_floor')}
                required
                type="text"
                placeholder={t('maps:vending_floor')}
                value={formData.floor || ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    handleUpdate('floor', val);
                  }
                }}
                size="sm"
                className={`${invalidFields.includes('floor') ? 'border-red-500' : ''}`}
              />
            </div>

            {/* Row 7 (Full Width) */}
            <div className="col-span-2">
              <Input
                title={t('maps:vending_address')}
                type="text"
                placeholder={t('maps:vending_address')}
                value={formData.address || ''}
                onChange={e => handleUpdate('address', e.target.value)}
                size="sm"
              />
            </div>

            {/* Row 8 (3 Columns - Dates) */}
            <div className="grid grid-cols-3 col-span-2 gap-4 items-center align-middle text-center text-nowrap">
              <Input
                title={t('maps:vending_contract_start_date')}
                type="text"
                placeholder={t('maps:vending_contract_start_date')}
                value={formData.contractStartDate}
                disabled
                size="sm"
                className="flex flex-col justify-center"
              />
              <Input
                title={t('maps:vending_contract_end_date')}
                type="text"
                placeholder={t('maps:vending_contract_end_date')}
                value={formData.contractEndDate}
                disabled
                size="sm"
                className="flex flex-col justify-center"
              />
              <Input
                title={t('maps:vending_cancel_date')}
                type="text"
                placeholder={t('maps:vending_cancel_date')}
                value={formData.contractCancelDate}
                disabled
                size="sm"
                className="flex flex-col justify-center"
              />
            </div>

            {/* Row 9 (2 Columns - Service Dates) */}

            <div className="grid grid-cols-2 col-span-2 gap-4">
              {/* <Input
              title={t('vending_service_start_date')}
              type="text"
              value={formData.serviceStartDate}
              onChange={e => handleUpdate('serviceStartDate', e.target.value)}
              size="sm"
            /> */}
              <DatePicker
                title={t('maps:vending_service_start_date')}
                value={
                  formData.serviceStartDate ? new Date(formData.serviceStartDate) : null
                }
                onChange={date =>
                  handleUpdate('serviceStartDate', date ? date.toISOString() : '')
                }
              />
              {/* <Input
              title={t('vending_service_end_date')}
              type="text"
              value={formData.serviceEndDate}
              onChange={e => handleUpdate('serviceEndDate', e.target.value)}
              size="sm"
            /> */}
              <DatePicker
                title={t('maps:vending_service_end_date')}
                value={formData.serviceEndDate ? new Date(formData.serviceEndDate) : null}
                onChange={date =>
                  handleUpdate('serviceEndDate', date ? date.toISOString() : '')
                }
              />
            </div>
          </div>
        )}
      </div>
      <PopupAlert
        type="info"
        open={showDeletePopup}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        onClose={handleDeleteCancel}
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        message="ยืนยันการลบข้อมูล Vending Machine หรือไม่?"
      />
    </>
  );
};

export default Vending;
