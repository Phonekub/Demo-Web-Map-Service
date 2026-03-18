import React, { useCallback, useEffect, useState } from 'react';
import PopupAlert from '../../base/PopupAlert';
import {
  getTradeAreaById,
  getTradeareaByPoiId,
  type CreateTradeAreaRequest,
  type TradeAreaDto,
} from '../../../services/tradeArea.service';
import HoverDropdown from '../HoverDropdown';
import { useTranslation } from 'react-i18next';
import { useMapStore } from '@/stores';
import { useTradeAreaStore } from '@/stores/tradeareaStore';

interface FormData {
  zonecode: string;
  subzone: string;
  branchCode: string;
  branchName: string;
  effectiveDate?: string;
  borderColor: string;
  detail: string;
  warning?: string;
}

function getIsoDateNow() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Color mapping
const borderColorToAreaColor = (color: string) => {
  if (color === 'GREEN') return 'RGB(152,221,0)';
  if (color === 'RED') return 'RGB(255,0,0)';
  if (color === 'BLUE') return 'RGB(0,112,255)';
  if (color === 'YELLOW') return 'RGB(255, 222, 48)';
  if (color === 'ORANGE') return 'RGB(255,153,0)';
  if (color === 'PURPLE') return 'RGB(153,51,255)';

  return color;
};
const areaColorToBorderColor = (color: string) => {
  if (color === 'RGB(152,221,0)') return 'GREEN';
  if (color === 'RGB(255,0,0)') return 'RED';
  if (color === 'RGB(0,112,255)') return 'BLUE';
  if (color === 'RGB(255, 222, 48)') return 'YELLOW';
  if (color === 'RGB(255,153,0)') return 'ORANGE';
  if (color === 'RGB(153,51,255)') return 'PURPLE';
  return color;
};

// Map API to form

// Validate required fields
const requiredFields = [
  'zonecode',
  'branchCode',
  'branchName',
  'effectiveDate',
  'borderColor',
];
function validateFields(form: any) {
  const errorObj: { [k: string]: boolean } = {};
  requiredFields.forEach(f => {
    errorObj[f] = !form[f];
  });
  return errorObj;
}

interface InformationTradeAreaProps {
  onClose?: () => void;
  onCancel?: () => void;
  view?: string;
  poiId: number;
  tradeareaId: number | null;
}

const InformationTradeArea: React.FC<InformationTradeAreaProps> = ({
  poiId,
  view,
  tradeareaId,
}) => {
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('success');
  const [popupMessage, setPopupMessage] = useState('บันทึกข้อมูลสำเร็จ');
  const currentday = getIsoDateNow();
  const [form, setForm] = useState<FormData>();
  const [loading, setLoading] = useState(!!tradeareaId);
  const [requiredError, setRequiredError] = useState<{ [k: string]: boolean }>({});
  const { t } = useTranslation(['tradearea']);
  const { saveNewArea, createChildArea, saveEditedPolygon } = useMapStore();
  const { setOpenModal, clearTradeareaId, setIsFetch, tradeareaType } =
    useTradeAreaStore();

  const mapApiToForm = useCallback(
    (data: TradeAreaDto): FormData => {
      const dateFormat = () => {
        const date = new Date(data.effectiveDate!);

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const effectiveDate = data.effectiveDate ? dateFormat() : getIsoDateNow();

      return {
        zonecode: data.zoneCode ?? '',
        subzone: data.subzoneCode ?? '',
        branchCode: data.storeCode ?? '',
        branchName: data.storeName ?? '',
        effectiveDate: tradeareaType === 'delivery_area' ? effectiveDate : undefined,
        borderColor: areaColorToBorderColor(data.areaColor ?? ''),
        detail: data.comment ?? '',
        warning: data.warning,
      };
    },
    [tradeareaType]
  );

  const fetchTradeArea = useCallback(async () => {
    setLoading(true);
    try {
      const res = tradeareaId
        ? await getTradeAreaById(tradeareaId)
        : await getTradeareaByPoiId(poiId);

      if (!res) {
        return;
      }

      const { data } = res;
      setForm(mapApiToForm(data));
    } catch (err) {
      console.error('getTradeAreaById error:', err);
    } finally {
      setLoading(false);
    }
  }, [poiId, tradeareaId, mapApiToForm]);

  useEffect(() => {
    fetchTradeArea();
  }, [fetchTradeArea]);

  const handleSave = async (_e: React.MouseEvent<HTMLButtonElement>) => {
    // Validate required fields
    const errorObj = validateFields(form);
    setRequiredError(errorObj);
    if (Object.values(errorObj).some(Boolean)) {
      setPopupType('error');
      setPopupMessage('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
      setShowAlert(true);
      return;
    }
    // Show confirm popup before save
    setPopupType('info');
    setPopupMessage('คุณต้องการบันทึกข้อมูลนี้หรือไม่?');
    setShowConfirm(true);
  };

  // Actually save after confirm
  const doSave = async () => {
    try {
      if (!form) return;
      const tradeAreaDto: CreateTradeAreaRequest = {
        comment: form.detail,
        effectiveDate: tradeareaType === 'delivery_area' ? form.effectiveDate : undefined,
        areaColor: borderColorToAreaColor(form.borderColor),
      };

      const updateAreaDto: TradeAreaDto = {
        comment: form.detail,
        effectiveDate: tradeareaType === 'delivery_area' ? form.effectiveDate : undefined,
        areaColor: borderColorToAreaColor(form.borderColor),
      };

      const actionMap = new Map<
        string,
        () => Promise<{
          success: boolean;
          message: string;
        }>
      >([
        [
          'edit',
          async () => {
            return await createChildArea(updateAreaDto);
          },
        ],
        [
          'save',
          async () => {
            return await saveEditedPolygon(updateAreaDto);
          },
        ],
        [
          'create',
          async () => {
            return await saveNewArea(tradeAreaDto);
          },
        ],
      ]);

      const handle = actionMap.get(view!);

      if (!handle) {
        return;
      }

      const result = await handle();

      if (result.message) {
        setPopupMessage(result.message);
      }

      if (!result.success) {
        setPopupType('error');
        return;
      }

      setPopupType('success');
      // setPopupType('success');
      // setPopupMessage('บันทึกข้อมูลสำเร็จ');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setPopupType('error');
        setPopupMessage(error?.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } finally {
      setShowAlert(true);
      clearTradeareaId();
    }
  };

  // Actually delete after confirm

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  // Centralized form rendering for all modes
  const isView = view === 'view';
  const isEdit = view === 'edit';
  const isCreate = view === 'create';
  const isSave = view === 'save';
  const readOnly = isView;
  const showSave = isEdit || isCreate || isSave;

  return (
    <>
      <form className={`bg-white rounded-xl border ${isView ? 'p-5 pl-10' : 'p-2'}`}>
        {/* {poiId && (
                    <div className="mb-2 text-blue-700 font-bold">POI ID: {poiId}</div>
                )} */}
        {/* {tradeareaId && (
                    <div className="mb-2 text-blue-700 font-bold">Trade Area ID: {tradeareaId}</div>
                )} */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 ">
              {t('zone')}
              {!readOnly && <span className="text-red-500">*</span>}
            </label>
            {readOnly ? (
              <div className="py-2 px-3 text-gray-700 rounded">
                {form?.zonecode || ''}
              </div>
            ) : (
              <input
                className={`w-full border rounded px-3 py-2 bg-gray-100 text-gray-500 ${requiredError.zonecode ? 'border-red-500' : ''}`}
                value={form?.zonecode || ''}
                readOnly
                disabled
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 ">
              {t('sub_zone')}
            </label>
            {readOnly ? (
              <div className="py-2 px-3 text-gray-700 rounded">{form?.subzone || ''}</div>
            ) : (
              <input
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500"
                value={form?.subzone || ''}
                readOnly
                disabled
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 ">
              {t('store_code')}
              {!readOnly && <span className="text-red-500">*</span>}
            </label>
            {readOnly ? (
              <div className="py-2 px-3 text-gray-700 rounded">
                {form?.branchCode || ''}
              </div>
            ) : (
              <input
                className={`w-full border rounded px-3 py-2 bg-gray-100 text-gray-500 ${requiredError.branchCode ? 'border-red-500' : ''}`}
                value={form?.branchCode || ''}
                readOnly
                disabled
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 ">
              {t('store_name')}
              {!readOnly && <span className="text-red-500">*</span>}
            </label>
            {readOnly ? (
              <div
                className="py-2 px-3 text-gray-700  rounded"
                title={form?.branchName || ''}
              >
                {form?.branchName || ''}
              </div>
            ) : (
              <input
                className={`w-full border rounded px-3 py-2 bg-gray-100 text-gray-500 ${requiredError.branchName ? 'border-red-500' : ''}`}
                value={form?.branchName || ''}
                readOnly
                disabled
                title={form?.branchName || ''}
              />
            )}
          </div>
          {tradeareaType === 'delivery_area' && (
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-700 ">
                {t('table.effective_date')}
                {!readOnly && <span className="text-red-500">*</span>}
              </label>
              {readOnly ? (
                <div className="py-2 px-3 text-gray-700 rounded">
                  {form?.effectiveDate
                    ? new Date(form?.effectiveDate || '').toLocaleDateString('th-TH')
                    : '-'}
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="date"
                    className={`input input-bordered w-full pr-10 cursor-pointer ${requiredError.effectiveDate ? 'border-red-500' : ''}`}
                    min={currentday}
                    value={form?.effectiveDate}
                    onChange={e => {
                      setForm(f => ({ ...f!, effectiveDate: e.target.value }));
                    }}
                    onFocus={e => e.target.showPicker && e.target.showPicker()}
                  />
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 ">
              {t('color_zone')}
              {!readOnly && <span className="text-red-500">*</span>}
            </label>
            {readOnly ? (
              <div
                className={`py-2 px-3 rounded font-bold
                                    ${form?.borderColor === 'GREEN' ? 'text-green-500' : ''}
                                    ${form?.borderColor === 'RED' ? 'text-red-500' : ''}
                                    ${form?.borderColor === 'BLUE' ? 'text-blue-500' : ''}
                                    ${form?.borderColor === 'YELLOW' ? 'text-yellow-400' : ''}
                                    ${form?.borderColor === 'ORANGE' ? 'text-orange-500' : ''}
                                    ${form?.borderColor === 'PURPLE' ? 'text-purple-500' : ''}`}
              >
                {form?.borderColor || ''}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <HoverDropdown
                  disabled={readOnly}
                  className={`w-full border rounded px-3 py-2
                                        ${form?.borderColor === 'GREEN' ? 'bg-green-500 text-white' : ''}
                                        ${form?.borderColor === 'RED' ? 'bg-red-500 text-white' : ''}
                                        ${form?.borderColor === 'BLUE' ? 'bg-blue-500 text-white' : ''}
                                        ${form?.borderColor === 'YELLOW' ? 'bg-yellow-400 text-white' : ''}
                                        ${form?.borderColor === 'ORANGE' ? 'bg-orange-500 text-white' : ''}
                                        ${form?.borderColor === 'PURPLE' ? 'bg-purple-500 text-white' : ''}
                                        ${requiredError.borderColor ? 'border-red-500' : ''}`}
                  value={form?.borderColor}
                  options={[
                    { value: 'GREEN', label: 'GREEN' },
                    { value: 'RED', label: 'RED' },
                    { value: 'BLUE', label: 'BLUE' },
                    { value: 'YELLOW', label: 'YELLOW' },
                    { value: 'ORANGE', label: 'ORANGE' },
                    { value: 'PURPLE', label: 'PURPLE' },
                  ]}
                  placeholder={t('placeholder.select_color_zone')}
                  onChange={value => setForm(f => ({ ...f!, borderColor: value }))}
                  showClearButton={false}
                  dropdownIcon={
                    <svg
                      className={`w-4 h-4 transition-transform duration-200`}
                      fill="none"
                      stroke={form?.borderColor ? 'white' : 'black'}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  }
                />
              </div>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1 text-gray-700">
            {t('description')}
          </label>
          {readOnly ? (
            <div className="py-2 px-3 text-gray-700 rounded min-h-[40px]">
              {form?.detail || ''}
            </div>
          ) : (
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={2}
              value={form?.detail || ''}
              onChange={e => setForm(f => ({ ...f!, detail: e.target.value }))}
            />
          )}
          {isView && form?.warning && (
            <div>
              <label className="block text-sm font-bold mt-2 text-gray-700 ">
                {t('warning')}
              </label>
              {/* <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 border border-yellow-400 font-semibold"> */}
              <div className="py-2 px-3 text-gray-700 rounded min-h-[40px]">
                {t('warning_message', { meter: form?.warning || '' })}
              </div>
              {/* </div> */}
            </div>
          )}
        </div>
        {showSave && (
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              className="px-8 py-2 border border-blue-500 text-blue-600 rounded-lg bg-white hover:bg-blue-50"
              onClick={() => {
                setOpenModal(false);
                clearTradeareaId();
              }}
            >
              {t('actions.cancel')}
            </button>
            <button
              type="button"
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={handleSave}
            >
              {isEdit ? t('actions.update') : t('actions.save')}
            </button>
          </div>
        )}
      </form>

      <PopupAlert
        open={showConfirm}
        type={popupType}
        message={popupMessage}
        onConfirm={doSave}
        onCancel={() => setShowConfirm(false)}
        // confirmText={pendingSave || pendingDelete ? t('actions.confirm') : undefined}
        // cancelText={pendingSave || pendingDelete ? t('actions.cancel') : undefined}
      />

      <PopupAlert
        open={showAlert}
        type={popupType}
        message={popupMessage}
        onClose={() => {
          setShowAlert(false);
          setOpenModal(false);
          setIsFetch(true);
          clearTradeareaId();
        }}
      />
    </>
  );
};

export default InformationTradeArea;
