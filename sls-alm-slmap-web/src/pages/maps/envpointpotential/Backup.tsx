import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { fetchCommonCodes } from '@/services/master.service';
import PopupAlert from '../../../components/base/PopupAlert';
import LabelField from './fields/LabelField';
import InputField from './fields/InputField';
import SelectField from './fields/SelectField';
import CheckboxField from './fields/CheckboxField';
import MultiSelectField from './fields/MultiSelectField';
import TextboxListField from './fields/TextboxListField';
import TimeRangeField from './fields/TimeRangeField';

import { Button } from '@/components';
import { useBackupFlowStore, usePopulationStore } from '@/stores/backupProfileStore';

const InputType = {
  LIST: 'List',
  CHECK_BOX_LIST: 'CheckBoxList',
  TEXT_BOX_LIST: 'TextboxList',
} as const;

import {
  createDynamicForm,
  fetchDynamicBlankFormBySubzone,
  fetchDynamicForm,
  updateDynamicForm,
  type DynamicFormApiResponse,
  type DynamicFormUpsertPayload,
} from '@/services/backup.service';
// --------
// Helper function for POI field lookup
function getPoiFieldValue(layersData: any, poiId: any, field: string) {
  if (!Array.isArray(layersData) || layersData.length === 0 || !poiId) return '';
  const subCategories = layersData[0]?.subCategories;
  if (!Array.isArray(subCategories)) return '';
  for (const sub of subCategories) {
    if (Array.isArray(sub.pois)) {
      const found = sub.pois.find((poi: any) => String(poi.id) === String(poiId));
      if (found) return found[field] || '';
    }
  }
  return '';
}

interface EnvBackupProps {
  poiId?: number;
  formId?: number;
  children?: React.ReactNode;
  subCode?: string;
  layersData?: any;
}

const EnvBackup = forwardRef<any, EnvBackupProps>(
  ({ poiId, children, subCode, layersData }, ref) => {
    const poiMap = useMemo(() => {
      const map: Record<string, any> = {};
      if (Array.isArray(layersData) && layersData.length > 0) {
        // Loop through ALL layers, not just layersData[0]
        for (const layer of layersData) {
          if (Array.isArray(layer.subCategories)) {
            for (const sub of layer.subCategories) {
              if (Array.isArray(sub.pois)) {
                for (const poi of sub.pois) {
                  if (poi && poi.id !== undefined && poi.id !== null) {
                    map[String(poi.id)] = poi;
                  }
                }
              }
            }
          }
        }
      }
      return map;
    }, [layersData]);

    // add state object for dynamic options
    const [commonCodeOptions, setCommonCodeOptions] = useState<
      Record<string, { value: string; text: string; codeMapping?: string }[]>
    >({});
    const [mapFields, setMapFields] = useState<any[]>([]);
    const [formDataMap, setFormDataMap] = useState<Record<string, any>>({});
    const [formTitle, setFormTitle] = useState<string>('');
    const [formVersionId, setFormVersionId] = useState<string>('');
    const [errorFields, setErrorFields] = useState<Record<string, string>>({});
    const [showAlert, setShowAlert] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('error');
    const [isSubmit, setIsSubmit] = useState(false);
    const [referenceObj, setReferenceObj] = useState('');
    const [referenceKey, setReferenceKey] = useState('');
    const [createdUser, setCreatedUser] = useState('');
    const [formId, setFormId] = useState<number | undefined>(undefined);
    const [isDataConfirmed, setIsDataConfirmed] = useState(false);
    const { step } = useBackupFlowStore();
    const setPopulation = usePopulationStore(s => s.setPopulation);

    // Find population/percent field IDs dynamically by FIELD_NAME
    const populationFieldId = useMemo(() => {
      const f = mapFields.find((f: any) => f.FIELD_NAME === 'TOTAL_POPULATION');
      return f?.FIELD_ID ?? '10501012';
    }, [mapFields]);

    const percentFieldId = useMemo(() => {
      const f = mapFields.find((f: any) => f.FIELD_NAME === 'EXPECTED_CUSTOMER_PCT');
      return f?.FIELD_ID ?? '10501011';
    }, [mapFields]);

    // Real-time sync: Update population store immediately when form values change
    const prevSyncRef = useRef<string>('');
    useEffect(() => {
      if (!poiId) return;

      const popRaw = formDataMap[populationFieldId];
      const pctRaw = formDataMap[percentFieldId];

      // Build a key to avoid unnecessary store updates
      const syncKey = `${poiId}|${popRaw}|${pctRaw}`;
      if (prevSyncRef.current === syncKey) return;
      prevSyncRef.current = syncKey;

      const popStr =
        popRaw !== undefined && popRaw !== null && popRaw !== '' ? String(popRaw) : '';
      const pctStr =
        pctRaw !== undefined && pctRaw !== null && pctRaw !== '' ? String(pctRaw) : '';

      setPopulation(poiId, popStr, pctStr);
    }, [formDataMap, poiId, setPopulation, populationFieldId, percentFieldId]);

    const normalizeTextboxListValue = useCallback(
      (value: string | string[] | number): string[] => {
        if (Array.isArray(value)) {
          return value
            .map((v: unknown) => (v == null ? '' : String(v)))
            .map((v: string) => (v === 'NaN' ? '' : v));
        }

        if (typeof value === 'string') {
          const trimmed = value.trim();

          if (trimmed.length === 0) {
            return [];
          }

          // JSON array format: "[...]"
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              return Array.isArray(parsed)
                ? parsed
                    .map((v: unknown) => (v == null ? '' : String(v)))
                    .map((v: string) => (v === 'NaN' ? '' : v))
                : [trimmed];
            } catch {
              return [trimmed];
            }
          }

          // Object-like format: "{...}"
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            return trimmed
              .slice(1, -1)
              .split(',')
              .map((s: string) => s.replace(/^"|"$/g, '').trim())
              .map((v: string) => (v === 'NaN' ? '' : v));
          }

          if (trimmed.includes(',')) {
            return trimmed
              .split(',')
              .map((s: string) => s.trim())
              .map((v: string) => (v === 'NaN' ? '' : v));
          }

          return [trimmed === 'NaN' ? '' : trimmed];
        }

        // Handle number values
        if (typeof value === 'number') {
          return isNaN(value) ? [''] : [String(value)];
        }

        // Handle null, undefined, or other types
        return [];
      },
      []
    );

    const calculateFormula = useCallback(
      (formula: string, mapFields?: any[]) => {
        if (!formula) return null;
        // create mapping FIELD_NAME -> FIELD_ID
        const fieldNameToId: Record<string, string> = {};
        if (Array.isArray(mapFields)) {
          mapFields.forEach(f => {
            if (f.FIELD_NAME && f.FIELD_ID) {
              fieldNameToId[f.FIELD_NAME.toUpperCase()] = f.FIELD_ID;
            }
          });
        }

        const safeFormula = formula.replace(/([A-Z_][A-Z0-9_]*)/g, match => {
          const fieldId = fieldNameToId[match.toUpperCase()];
          let value;
          if (fieldId) {
            value = formDataMap[fieldId];
          } else {
            value = formDataMap[match];
          }
          // if array -> sum it
          if (Array.isArray(value)) {
            value = value.reduce((sum: number, v: any) => {
              const num = Number(v);
              return sum + (isNaN(num) ? 0 : num);
            }, 0);
          }
          return value !== undefined && value !== null && value !== '' ? value : 0;
        });
        try {
          return Function(`return (${safeFormula})`)();
        } catch {
          return null;
        }
      },
      [formDataMap]
    );

    const refetchAndSyncPopulation = async () => {
      const obj = 'poi';
      const key = poiId?.toString() || '';

      if (!poiId) return;

      // 1) refetch latest form
      const res: any = await fetchDynamicForm(obj, key);

      // ถ้า not found -> fallback blank
      const isNotFound =
        res?.success === false &&
        (res?.error?.code === 'NOT_FOUND' ||
          String(res?.error?.message || '').includes('ไม่พบ'));

      const data = !isNotFound
        ? res
        : await fetchDynamicBlankFormBySubzone(subCode || '');

      const fields = data?.fields || data?.form?.fields || [];

      // 2) rebuild initialData from returned fields (latest)
      const latestData: Record<string, any> = {};
      fields.forEach((f: any) => {
        let value = f.VALUE ?? '';

        // for TextboxList: input must be array, formula must use sum
        if (f.INPUT_TYPE === 'TextboxList') {
          // for string array format JSON "[1,2,3]"
          if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
            try {
              const arr = JSON.parse(value);
              value = arr.map((v: any) => Number(v));
            } catch {
              value = [];
            }
          }
          // for string array format curly-brace {"1","2","3"})
          else if (
            typeof value === 'string' &&
            value.startsWith('{') &&
            value.endsWith('}')
          ) {
            value = value
              .slice(1, -1)
              .split(',')
              .map((s: string) => Number(s.replace(/"/g, '').trim()));
          }
          // if single number, convert to array
          else if (typeof value === 'number') {
            value = [value];
          }

          // If field requires integer only (via regex), convert array elements to integers
          if (f.VALIDATE_REGEX && Array.isArray(value)) {
            value = value.map((v: any) => {
              const num = Number(v);
              if (isNaN(num) || num === 0) return '';
              return Math.floor(num);
            });
          }
        } else if (
          f.INPUT_TYPE === 'TimeRange' &&
          typeof value === 'string' &&
          value.trim().startsWith('{')
        ) {
          try {
            value = JSON.parse(value);
          } catch {
            value = { start: '', end: '' };
          }
        }

        // If field requires integer only (via regex), convert to integer
        if (
          f.VALIDATE_REGEX &&
          value !== '' &&
          value !== null &&
          value !== undefined &&
          f.INPUT_TYPE !== 'TextboxList'
        ) {
          value = Math.floor(Number(value));
        }

        latestData[f.FIELD_ID] = value;
      });

      // 3) update UI state too (optional แต่แนะนำ)
      setMapFields(fields);
      setFormDataMap(latestData);

      const latestFormId = data?.form?.FORM_ID;
      if (latestFormId) setFormId(latestFormId);

      // 4) sync to population store (per-poi) using dynamic field IDs
      setPopulation(
        poiId,
        String(latestData[populationFieldId] ?? ''),
        String(latestData[percentFieldId] ?? '')
      );
    };

    useEffect(() => {
      if (mapFields.length < 1) {
        return;
      }

      const fetchAll = async () => {
        const typesToFetch = [
          InputType.LIST,
          InputType.CHECK_BOX_LIST,
          InputType.TEXT_BOX_LIST,
        ];
        const keys = mapFields
          .filter(f => f.LIST_VALUE && typesToFetch.includes(f.INPUT_TYPE))
          .map(f => f.LIST_VALUE);
        const result: Record<string, { value: string; text: string }[]> = {};
        await Promise.all(
          keys.map(async key => {
            result[key] = await fetchCommonCodes(key);
          })
        );
        setCommonCodeOptions(result);
      };
      fetchAll();
    }, [mapFields]);

    useEffect(() => {
      const fetchForm = async () => {
        try {
          let data: DynamicFormApiResponse | any = null;
          const obj = 'poi';
          const key = poiId?.toString() || '';

          if (poiId) {
            const res: any = await fetchDynamicForm(obj, key);

            const isNotFound =
              res?.success === false &&
              (res?.error?.code === 'NOT_FOUND' ||
                String(res?.error?.message || '').includes('ไม่พบ'));

            // ถ้าเจอ form จริง -> ใช้ res
            // ถ้า NOT_FOUND -> ไป blank
            if (!isNotFound) data = res;
          }

          // fallback blank form (กรณี poiId ไม่มี หรือ not found)
          if (!data) {
            const blank: any = await fetchDynamicBlankFormBySubzone(subCode || '');
            data = blank;
          }

          const fields = data.fields || data.form?.fields;
          const title = data.FORM_TITLE || data.form?.FORM_TITLE;
          const versionId = data.FORM_VERSION_ID || data.form?.FORM_VERSION_ID;
          const refObj = obj;
          const refKey = key;
          const user = data.CREATED_USER || data.form?.CREATED_USER;
          const formId = data.form?.FORM_ID;

          if (formId) setFormId(formId);

          if (title) setFormTitle(title);
          if (versionId !== undefined && versionId !== null)
            setFormVersionId(String(versionId));
          if (refObj) setReferenceObj(refObj);
          if (refKey) setReferenceKey(refKey);
          if (user) setCreatedUser(user);

          if (fields) {
            // Sort fields by SEQ to ensure correct order
            const sortedFields = Array.isArray(fields)
              ? [...fields].sort((a, b) => (a.SEQ || 0) - (b.SEQ || 0))
              : fields;
            setMapFields(sortedFields);

            const initialData: Record<string, any> = {};
            const poi = poiId ? poiMap[String(poiId)] : null;

            fields.forEach((f: any) => {
              let value = f.VALUE || '';

              // Set PROV_CODE and PROV_RATE from POI data if available
              if (poi && f.FIELD_NAME === 'PROV_CODE') {
                value = poi.provCode || '';
              } else if (poi && f.FIELD_NAME === 'PROV_RATE') {
                value = poi.provGrade || '';
              } else if (f.INPUT_TYPE === 'TextboxList') {
                value = normalizeTextboxListValue(value);
              } else if (
                f.INPUT_TYPE === 'TimeRange' &&
                typeof value === 'string' &&
                value.trim().startsWith('{')
              ) {
                try {
                  value = JSON.parse(value);
                } catch {
                  value = { start: '', end: '' };
                }
              }
              // If field requires integer only (via regex), convert to integer (for non-array fields)
              else if (
                f.VALIDATE_REGEX &&
                value !== '' &&
                value !== null &&
                value !== undefined &&
                f.INPUT_TYPE !== 'TextboxList'
              ) {
                value = Math.floor(Number(value));
              }

              initialData[f.FIELD_ID] = value;
            });
            setFormDataMap(initialData);
          } else {
            // กันกรณี fields ไม่มีจริง ๆ
            setMapFields([]);
            setFormDataMap({});
          }
        } catch (err) {
          console.error('Error fetching form:', err);

          // fallback blank อีกชั้น เผื่อ fetchDynamicFormByPoiId throw
          try {
            const blank: any = await fetchDynamicBlankFormBySubzone(subCode || '');

            const fields = blank.fields || blank.form?.fields;
            // Sort fields by SEQ to ensure correct order
            const sortedFields = Array.isArray(fields)
              ? [...fields].sort((a, b) => (a.SEQ || 0) - (b.SEQ || 0))
              : fields;
            setMapFields(sortedFields || []);

            const initialData: Record<string, any> = {};
            const poi = poiId ? poiMap[String(poiId)] : null;

            (fields || []).forEach((f: any) => {
              let value = f.VALUE || '';

              // Set PROV_CODE and PROV_RATE from POI data if available
              if (poi && f.FIELD_NAME === 'PROV_CODE') {
                value = poi.provCode || '';
              } else if (poi && f.FIELD_NAME === 'PROV_RATE') {
                value = poi.provGrade || '';
              } else if (f.INPUT_TYPE === 'TextboxList') {
                // Parse TextboxList array format
                if (
                  typeof value === 'string' &&
                  value.startsWith('[') &&
                  value.endsWith(']')
                ) {
                  try {
                    const arr = JSON.parse(value);
                    value = arr.map((v: any) => String(Number(v)));
                  } catch {
                    value = [];
                  }
                } else if (
                  typeof value === 'string' &&
                  value.startsWith('{') &&
                  value.endsWith('}')
                ) {
                  value = value
                    .slice(1, -1)
                    .split(',')
                    .map((s: string) => {
                      const cleaned = s.replace(/"/g, '').trim();
                      const num = Number(cleaned);
                      if (isNaN(num) || num === 0) return '';
                      return String(f.VALIDATE_REGEX ? Math.floor(num) : num);
                    });
                } else if (typeof value === 'number') {
                  value = [String(f.VALIDATE_REGEX ? Math.floor(value) : value)];
                }
              }
              // If field requires integer only (via regex), convert to integer (for non-array fields)
              else if (
                f.VALIDATE_REGEX &&
                value !== '' &&
                value !== null &&
                value !== undefined
              ) {
                value = Math.floor(Number(value));
              }

              initialData[f.FIELD_ID] = value;
            });
            setFormDataMap(initialData);
          } catch (e) {
            console.error('Fallback blank form failed:', e);
          }
        }
      };

      fetchForm();
    }, [poiId, poiMap]);

    // Reset validation errors when POI changes
    useEffect(() => {
      setIsSubmit(false);
      setErrorFields({});
    }, [poiId]);

    const validateTextboxListMinMax = () => {
      for (const field of mapFields) {
        if (field.INPUT_TYPE !== 'TextboxList') continue;

        const min = field.VALIDATE_MIN;
        const max = field.VALIDATE_MAX;
        if (min == null && max == null) continue;

        const arr = normalizeTextboxListValue(formDataMap[field.FIELD_ID]);

        for (let i = 0; i < arr.length; i++) {
          const raw = arr[i];
          if (raw === '' || raw == null) continue;

          const n = Number(raw);
          if (Number.isNaN(n)) {
            return `${field.TITLE || 'ค่า'} ช่องที่ ${i + 1} ต้องเป็นตัวเลข`;
          }
          if (min != null && n < Number(min)) {
            return `${field.TITLE || 'ค่า'} ช่องที่ ${i + 1} ต้องไม่น้อยกว่า ${min}`;
          }
          if (max != null && n > Number(max)) {
            return `${field.TITLE || 'ค่า'} ช่องที่ ${i + 1} ต้องไม่เกิน ${max}`;
          }
        }
      }
      return null;
    };

    const validateTextboxListTotal = () => {
      for (const field of mapFields) {
        if (
          field.INPUT_TYPE === 'TextboxList' &&
          field.IS_SHOW_TOTAL &&
          typeof field.VALIDATE_TOTAL_MAX === 'number'
        ) {
          let values = formDataMap[field.FIELD_ID];
          if (typeof values === 'string') {
            try {
              const parsed = JSON.parse(values);
              values = Array.isArray(parsed) ? parsed : [Number(values)];
            } catch {
              values = [Number(values)];
            }
          }
          if (!Array.isArray(values)) values = [];

          const total = values.reduce((sum: number, v: any) => {
            const num = Number(v);
            return sum + (isNaN(num) ? 0 : num);
          }, 0);

          if (total > field.VALIDATE_TOTAL_MAX) {
            const showTitle = field.TOTAL_TITLE || field.TITLE || '';
            return `${showTitle} Total ต้องไม่เกิน ${field.VALIDATE_TOTAL_MAX}`.trim();
          }
        }
      }
      return null;
    };

    const validateTimeRangeField = () => {
      for (const field of mapFields) {
        if (field.INPUT_TYPE === 'TimeRange') {
          const value = formDataMap[field.FIELD_ID];

          // Check if one time is filled but not the other
          if (value) {
            const hasStart = value.start && value.start.trim() !== '';
            const hasEnd = value.end && value.end.trim() !== '';

            if (hasStart && !hasEnd) {
              const fieldTitle = field.TITLE || 'ช่วงเวลา';
              return `${fieldTitle}: กรุณาเลือกเวลาสิ้นสุด`;
            }

            if (!hasStart && hasEnd) {
              const fieldTitle = field.TITLE || 'ช่วงเวลา';
              return `${fieldTitle}: กรุณาเลือกเวลาเริ่มต้น`;
            }

            // Check if end time is before start time
            if (hasStart && hasEnd && value.end < value.start) {
              return 'เวลาสิ้นสุดต้องมากกว่าหรือเท่ากับเวลาเริ่ม';
            }
          }
        }
      }
      return null;
    };

    const validateRequiredFields = () => {
      const missingFields = mapFields.filter(field => {
        if (field.IS_LOCKED) return false;

        // Skip validation for fields disabled by parent condition
        if (
          field.PARENT_FIELD_ID &&
          (field.SHOW_IF_PARENT_VALUE != null || field.ENABLED_IF_PARENT_VALUE != null)
        ) {
          const expectedTarget =
            field.ENABLED_IF_PARENT_VALUE != null &&
            String(field.ENABLED_IF_PARENT_VALUE).trim() !== ''
              ? field.ENABLED_IF_PARENT_VALUE
              : field.SHOW_IF_PARENT_VALUE;

          if (expectedTarget != null && String(expectedTarget).trim() !== '') {
            const parentId = String(field.PARENT_FIELD_ID);
            const rawParentVal = formDataMap[parentId];
            const expected = String(expectedTarget).toLowerCase().trim();

            let parentValStr = '';
            if (Array.isArray(rawParentVal)) {
              if (rawParentVal.length > 0) {
                parentValStr = String(rawParentVal[0]).toLowerCase().trim();
              }
            } else {
              parentValStr = String(rawParentVal ?? '')
                .toLowerCase()
                .trim();
            }

            if (parentValStr === 'y') parentValStr = 'true';
            else if (parentValStr === 'n') parentValStr = 'false';

            if (parentValStr !== expected) return false;
          }
        }

        return (
          field.IS_REQUIRED &&
          (formDataMap[field.FIELD_ID] === undefined ||
            formDataMap[field.FIELD_ID] === null ||
            formDataMap[field.FIELD_ID] === '' ||
            (Array.isArray(formDataMap[field.FIELD_ID]) &&
              (formDataMap[field.FIELD_ID].length === 0 ||
                formDataMap[field.FIELD_ID].every(
                  (v: any) => v === '' || v === null || v === undefined
                ))))
        );
      });

      const newErrorFields = { ...errorFields };
      missingFields.forEach(f => {
        newErrorFields[f.FIELD_ID] = `กรุณากรอกข้อมูล${f.TITLE ? ' ' + f.TITLE : ''}`;
      });
      return { missingFields, newErrorFields };
    };

    const mapFieldsForApi = () => {
      return mapFields.map(field => {
        let value = formDataMap[field.FIELD_ID];

        if (field.FIELD_NAME === 'PROV_CODE') {
          value = getPoiFieldValue(layersData, poiId, 'provCode');
        }
        if (field.FIELD_NAME === 'PROV_RATE') {
          value = getPoiFieldValue(layersData, poiId, 'provGrade');
        }

        if (field.FORMULA) {
          const formulaResult = calculateFormula(field.FORMULA, mapFields);
          value = formulaResult;
        }

        if (field.INPUT_TYPE === 'CheckBoxList' && Array.isArray(value)) {
          value = value.map((v: any) => {
            if (typeof v === 'string') {
              try {
                const parsed = JSON.parse(v);
                return parsed.value ?? v;
              } catch {
                return v;
              }
            }
            return v.value ?? v;
          });
        }

        if (
          field.INPUT_TYPE === 'TextboxList' &&
          typeof field.DATA_TYPE === 'string' &&
          field.DATA_TYPE.trim().toLowerCase() === 'number'
        ) {
          if (typeof value === 'string') {
            if (value && value.startsWith('{') && value.endsWith('}')) {
              value = value
                .slice(1, -1)
                .split(',')
                .map((s: string) => {
                  const v = s.replace(/^"|"$/g, '').trim();
                  if (v === '' || v === undefined || v === null) return '';
                  const num = Number(v);
                  return isNaN(num) ? '' : num;
                });
            } else {
              try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                  value = parsed.map((vv: any) => {
                    if (vv === '' || vv === undefined || vv === null) return '';
                    const num = Number(vv);
                    return isNaN(num) ? '' : num;
                  });
                } else {
                  value = [Number(value)];
                }
              } catch {
                value = [Number(value)];
              }
            }
          } else if (Array.isArray(value)) {
            value = value.map((vv: any) => {
              if (vv === '' || vv === undefined || vv === null) return '';
              const num = Number(vv);
              return isNaN(num) ? '' : num;
            });
          }
        }

        return { FIELD_ID: field.FIELD_ID, DATA_TYPE: field.DATA_TYPE, VALUE: value };
      });
    };

    const handleSave = async (): Promise<boolean> => {
      setIsSubmit(true);

      const minMaxError = validateTextboxListMinMax();
      if (minMaxError) {
        setPopupType('error');
        setPopupMessage(minMaxError);
        setShowAlert(true);
        return false;
      }

      const totalError = validateTextboxListTotal();
      if (totalError) {
        setPopupType('error');
        setPopupMessage(totalError);
        setShowAlert(true);
        return false;
      }

      const timeRangeError = validateTimeRangeField();
      if (timeRangeError) {
        setPopupType('error');
        setPopupMessage(timeRangeError);
        setShowAlert(true);
        return false;
      }

      const { missingFields, newErrorFields } = validateRequiredFields();
      if (missingFields.length > 0) {
        setErrorFields(newErrorFields);
        setPopupType('error');
        setPopupMessage(`กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน`);
        setShowAlert(true);
        return false;
      }

      const errorList = Object.values(errorFields).filter(e => !!e);
      if (errorList.length > 0) {
        setPopupType('error');
        setPopupMessage(errorList[0]);
        setShowAlert(true);
        return false;
      }

      const payload: DynamicFormUpsertPayload = {
        formVersionId: Number(formVersionId),
        poiId: String(poiId),
        referenceObj,
        referenceKey,
        createdUser,
        fields: mapFieldsForApi(),
      };

      // console.log('POST payload:', payload);

      try {
        const result = await createDynamicForm(payload);

        if (result && result.success === false) {
          setPopupType('error');
          setPopupMessage(
            result?.error?.message || result?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
          );
          setShowAlert(true);
          return false;
        }

        setPopupType('success');
        setPopupMessage('บันทึกข้อมูลสำเร็จ');
        setShowAlert(true);
        setIsSubmit(false);
        setErrorFields({});
        await refetchAndSyncPopulation();
        return true;
      } catch (error: any) {
        console.error('API Error:', error);
        setPopupType('error');
        setPopupMessage(error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        setShowAlert(true);
        return false;
      }
    };

    const handleUpdate = async (): Promise<boolean> => {
      setIsSubmit(true);

      const minMaxError = validateTextboxListMinMax();
      if (minMaxError) {
        setPopupType('error');
        setPopupMessage(minMaxError);
        setShowAlert(true);
        return false;
      }

      const totalError = validateTextboxListTotal();
      if (totalError) {
        setPopupType('error');
        setPopupMessage(totalError);
        setShowAlert(true);
        return false;
      }

      const timeRangeError = validateTimeRangeField();
      if (timeRangeError) {
        setPopupType('error');
        setPopupMessage(timeRangeError);
        setShowAlert(true);
        return false;
      }

      const { missingFields, newErrorFields } = validateRequiredFields();
      if (missingFields.length > 0) {
        setErrorFields(newErrorFields);
        setPopupType('error');
        setPopupMessage(`กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน`);
        setShowAlert(true);
        return false;
      }

      const errorList = Object.values(errorFields).filter(e => !!e);
      if (errorList.length > 0) {
        setPopupType('error');
        setPopupMessage(errorList[0]);
        setShowAlert(true);
        return false;
      }

      const payload: DynamicFormUpsertPayload = {
        formVersionId: Number(formVersionId),
        poiId: String(poiId),
        referenceObj,
        referenceKey,
        LastEditsUser: createdUser,
        fields: mapFieldsForApi(),
      };

      // console.log('PUT payload:', payload);

      try {
        const result = await updateDynamicForm(formId!, payload);

        if (result && result.success === false) {
          setPopupType('error');
          setPopupMessage(
            result?.error?.message || result?.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล'
          );
          setShowAlert(true);
          return false;
        }

        setPopupType('success');
        setPopupMessage('อัปเดตข้อมูลสำเร็จ');
        setShowAlert(true);
        setIsSubmit(false);
        setErrorFields({});
        await refetchAndSyncPopulation();
        return true;
      } catch (error: any) {
        console.error('API Error:', error);
        setPopupType('error');
        setPopupMessage(error?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
        setShowAlert(true);
        return false;
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        handleSave,
        handleUpdate,
        isDataConfirmed: () => isDataConfirmed,
      }),
      [handleSave, handleUpdate, isDataConfirmed]
    );

    return (
      <div className="flex-1 flex flex-col">
        <div className="overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <LabelField value={formTitle} />
              {step === 'layer-selection' && (
                <Button
                  variant="outline"
                  className="w-40 border-blue-600 text-blue-500"
                  onClick={async () => {
                    let success = false;
                    if (formId) {
                      success = await handleUpdate();
                    } else {
                      success = await handleSave();
                    }
                    if (success) {
                      setIsDataConfirmed(true);
                    }
                  }}
                >
                  ยืนยันข้อมูล
                </Button>
              )}
            </div>
            <LabelField value={formVersionId} />
          </div>

          <div className="space-y-4">
            {mapFields.map((field: any, index: number) => {
              const key = `${index}_${field.FIELD_ID}`;
              const isLocked = !!field.IS_LOCKED;

              // use options from commonCodeOptions
              const options = field.LIST_VALUE
                ? commonCodeOptions[field.LIST_VALUE] || []
                : [];

              // --- Conditional visibility: parent_field_id / show_if_parent_value ---
              let isParentDisabled = false;
              if (
                field.PARENT_FIELD_ID &&
                (field.SHOW_IF_PARENT_VALUE != null ||
                  field.ENABLED_IF_PARENT_VALUE != null)
              ) {
                const expectedTarget =
                  field.ENABLED_IF_PARENT_VALUE != null &&
                  String(field.ENABLED_IF_PARENT_VALUE).trim() !== ''
                    ? field.ENABLED_IF_PARENT_VALUE
                    : field.SHOW_IF_PARENT_VALUE;

                if (expectedTarget != null && String(expectedTarget).trim() !== '') {
                  const parentId = String(field.PARENT_FIELD_ID);
                  const rawParentVal = formDataMap[parentId];
                  const expected = String(expectedTarget).toLowerCase().trim();

                  let parentValStr = '';
                  if (Array.isArray(rawParentVal)) {
                    if (rawParentVal.length > 0) {
                      parentValStr = String(rawParentVal[0]).toLowerCase().trim();
                    }
                  } else {
                    parentValStr = String(rawParentVal ?? '')
                      .toLowerCase()
                      .trim();
                  }

                  // Normalize checkbox Y/N to true/false for comparison
                  if (parentValStr === 'y') parentValStr = 'true';
                  else if (parentValStr === 'n') parentValStr = 'false';

                  isParentDisabled = parentValStr !== expected;
                }
              }

              // Effective required: false if parent-disabled
              const effectiveRequired = isParentDisabled ? false : field.IS_REQUIRED;

              if (field.INPUT_TYPE === 'Text') {
                const min =
                  field.VALIDATE_MIN !== null && field.VALIDATE_MIN !== undefined
                    ? field.VALIDATE_MIN
                    : undefined;
                const max =
                  field.VALIDATE_MAX !== null && field.VALIDATE_MAX !== undefined
                    ? field.VALIDATE_MAX
                    : undefined;

                // Check if regex pattern is for integers only
                const isIntegerOnly =
                  field.VALIDATE_REGEX &&
                  (/^\^?\[0-9\]\+\$?$/.test(field.VALIDATE_REGEX) ||
                    /^\^?\\d\+\$?$/.test(field.VALIDATE_REGEX));

                const formulaResult = field.FORMULA
                  ? calculateFormula(field.FORMULA, mapFields)
                  : null;
                let inputValue = field.FORMULA
                  ? (formulaResult ?? '')
                  : formDataMap[field.FIELD_ID] || '';
                if (
                  typeof field.FIELD_NAME === 'string' &&
                  poiId &&
                  poiMap[String(poiId)]
                ) {
                  if (field.FIELD_NAME === 'PROV_CODE') {
                    inputValue = poiMap[String(poiId)].provCode || '';
                  } else if (field.FIELD_NAME === 'PROV_RATE') {
                    inputValue = poiMap[String(poiId)].provGrade || '';
                  }
                }

                return (
                  <div>
                    <InputField
                      key={key}
                      label={field.TITLE}
                      value={inputValue}
                      required={effectiveRequired}
                      type={field.DATA_TYPE === 'NUMBER' ? 'number' : 'text'}
                      step={isIntegerOnly ? 1 : undefined}
                      pattern={field.VALIDATE_REGEX || undefined}
                      min={min}
                      max={max}
                      onKeyDown={e => {
                        // Block decimal input for integer-only fields
                        if (
                          isIntegerOnly &&
                          (e.key === '.' ||
                            e.key === ',' ||
                            e.key === 'e' ||
                            e.key === 'E')
                        ) {
                          e.preventDefault();
                        }
                      }}
                      onChange={e => {
                        setFormDataMap(fm => ({
                          ...fm,
                          [field.FIELD_ID]: e.target.value,
                        }));
                      }}
                      onError={errMsg =>
                        setErrorFields(f => ({ ...f, [field.FIELD_ID]: errMsg }))
                      }
                      showError={isSubmit}
                      errorMsg={errorFields[field.FIELD_ID]}
                      disabled={isLocked || isParentDisabled}
                    />
                  </div>
                );
              }

              if (field.INPUT_TYPE === 'List') {
                let filteredOptions = options;
                //find PROV_RATE value to check codeMapping
                if (field.LIST_VALUE === 'BK_HOUSE_RATE') {
                  let provrate = formDataMap['PROV_RATE'];
                  if (!provrate && poiId && poiMap[String(poiId)]) {
                    provrate = poiMap[String(poiId)].provGrade || '';
                  }
                  const hasCodeMapping = filteredOptions.some(
                    opt =>
                      'codeMapping' in opt &&
                      opt.codeMapping !== undefined &&
                      opt.codeMapping !== null
                  );
                  if (hasCodeMapping && provrate && provrate !== '') {
                    filteredOptions = filteredOptions.filter(
                      opt => opt.codeMapping === provrate
                    );
                  }
                }

                // Filter options by VALIDATE_REGEX if present
                if (field.VALIDATE_REGEX && filteredOptions.length > 0) {
                  try {
                    const regex = new RegExp(field.VALIDATE_REGEX);
                    filteredOptions = filteredOptions.filter(opt =>
                      regex.test(opt.value)
                    );
                  } catch (err) {
                    console.error(
                      'Invalid regex pattern for filtering options:',
                      field.VALIDATE_REGEX
                    );
                  }
                }

                const selectOptions = filteredOptions.map(opt => ({
                  value: opt.value,
                  label: opt.text ?? opt.value ?? '',
                }));
                return (
                  <SelectField
                    key={key}
                    label={field.TITLE}
                    value={formDataMap[field.FIELD_ID] || ''}
                    required={effectiveRequired}
                    options={selectOptions}
                    onChange={e => {
                      const newVal = e.target.value;

                      setFormDataMap(fm => {
                        const next: Record<string, any> = {
                          ...fm,
                          [field.FIELD_ID]: newVal,
                        };
                        // Clear child fields whose PARENT_FIELD_ID === this field
                        mapFields.forEach((child: any) => {
                          if (String(child.PARENT_FIELD_ID) === String(field.FIELD_ID)) {
                            const expected = String(child.SHOW_IF_PARENT_VALUE ?? '')
                              .toLowerCase()
                              .trim();
                            let normalized = String(newVal).toLowerCase().trim();
                            if (normalized === 'y') normalized = 'true';
                            else if (normalized === 'n') normalized = 'false';
                            if (normalized !== expected) {
                              next[child.FIELD_ID] = '';
                            }
                          }
                        });
                        return next;
                      });

                      // Validate after setting the value
                      let errorMsg = '';

                      // Required validation
                      if (effectiveRequired && !newVal) {
                        errorMsg = `กรุณากรอกข้อมูล${field.TITLE ? ' ' + field.TITLE : ''}`;
                      }
                      // Regex validation
                      else if (field.VALIDATE_REGEX && newVal) {
                        try {
                          const regex = new RegExp(field.VALIDATE_REGEX);
                          if (!regex.test(newVal)) {
                            errorMsg = `กรุณาเลือกค่าที่ถูกต้อง${field.TITLE ? ' สำหรับ ' + field.TITLE : ''}`;
                          }
                        } catch (err) {
                          console.error('Invalid regex pattern:', field.VALIDATE_REGEX);
                        }
                      }

                      setErrorFields(f => ({ ...f, [field.FIELD_ID]: errorMsg }));
                    }}
                    showError={isSubmit}
                    errorMsg={errorFields[field.FIELD_ID]}
                    disabled={isParentDisabled}
                  />
                );
              }

              if (field.INPUT_TYPE === 'CheckBox') {
                const checked = formDataMap[field.FIELD_ID] === 'Y';
                let value: string[] = [];
                if (checked) value = ['Y'];
                else if (formDataMap[field.FIELD_ID] === 'N') value = ['N'];

                return (
                  <CheckboxField
                    key={key}
                    label={field.TITLE}
                    value={value}
                    required={effectiveRequired}
                    options={[
                      { value: 'Y', label: 'ใช่' },
                      { value: 'N', label: 'ไม่ใช่' },
                    ]}
                    onChange={optionValue => {
                      let newVal: string | null = null;
                      if (optionValue.includes('Y')) newVal = 'Y';
                      else if (optionValue.includes('N')) newVal = 'N';

                      setFormDataMap(fm => {
                        const next: Record<string, any> = {
                          ...fm,
                          [field.FIELD_ID]: newVal,
                        };
                        // Clear child fields whose PARENT_FIELD_ID === this field
                        mapFields.forEach((child: any) => {
                          if (String(child.PARENT_FIELD_ID) === String(field.FIELD_ID)) {
                            const expected = String(child.SHOW_IF_PARENT_VALUE ?? '')
                              .toLowerCase()
                              .trim();
                            let normalized = String(newVal ?? '')
                              .toLowerCase()
                              .trim();
                            if (normalized === 'y') normalized = 'true';
                            else if (normalized === 'n') normalized = 'false';
                            if (normalized !== expected) {
                              next[child.FIELD_ID] = '';
                            }
                          }
                        });
                        return next;
                      });
                      if (optionValue.length > 0) {
                        setErrorFields(f => ({ ...f, [field.FIELD_ID]: '' }));
                      }
                    }}
                    showError={isSubmit}
                    errorMsg={errorFields[field.FIELD_ID]}
                    disabled={isParentDisabled}
                  />
                );
              }

              if (field.INPUT_TYPE === 'TextboxList') {
                const items = options.map(opt => opt.text ?? opt.value);
                let count = Number(field.LIST_VALUE) || 1;
                let labels: string[] = Array(count).fill('');
                if (items.length > 0) {
                  count = items.length;
                  labels = items;
                }

                let values: string[] = normalizeTextboxListValue(
                  formDataMap[field.FIELD_ID]
                );
                if (values.length < count) {
                  values = [...values, ...Array(count - values.length).fill('')];
                }

                if (values.length > count) {
                  values = values.slice(0, count);
                }

                return (
                  <TextboxListField
                    key={key}
                    label={field.TITLE}
                    value={values}
                    count={count}
                    required={effectiveRequired}
                    onChange={newValues => {
                      setFormDataMap(fm => ({ ...fm, [field.FIELD_ID]: newValues }));
                      setErrorFields(f => ({ ...f, [field.FIELD_ID]: '' }));
                    }}
                    showError={isSubmit}
                    errorMsg={errorFields[field.FIELD_ID]}
                    itemLabels={labels}
                    isShowPercent={!!field.IS_SHOW_PERCENT}
                    isShowTotal={!!field.IS_SHOW_TOTAL}
                    totalTitle={field.TOTAL_TITLE}
                    validateTotalMin={field.VALIDATE_TOTAL_MIN}
                    validateTotalMax={field.VALIDATE_TOTAL_MAX}
                    disabled={isParentDisabled}
                    validateRegex={field.VALIDATE_REGEX}
                    validateMin={field.VALIDATE_MIN}
                    validateMax={field.VALIDATE_MAX}
                    type={
                      typeof field.DATA_TYPE === 'string' &&
                      field.DATA_TYPE.trim().toLowerCase() === 'number'
                        ? 'number'
                        : 'string'
                    }
                  />
                );
              }

              if (field.INPUT_TYPE === 'CheckBoxList') {
                const multiOptions = options.map(opt => ({
                  value: opt.value,
                  label: opt.text ?? opt.value ?? '',
                }));
                return (
                  <MultiSelectField
                    key={key}
                    label={field.TITLE}
                    value={formDataMap[field.FIELD_ID] || []}
                    required={effectiveRequired}
                    options={multiOptions}
                    onChange={val =>
                      setFormDataMap(fm => ({ ...fm, [field.FIELD_ID]: val }))
                    }
                    showError={isSubmit}
                    errorMsg={errorFields[field.FIELD_ID]}
                    disabled={isParentDisabled}
                  />
                );
              }

              if (field.INPUT_TYPE === 'TimeRange') {
                let value = formDataMap[field.FIELD_ID];
                if (!value || typeof value !== 'object') value = { start: '', end: '' };
                return (
                  <TimeRangeField
                    key={key}
                    label={field.TITLE}
                    value={value}
                    required={effectiveRequired}
                    onChange={val => {
                      setFormDataMap(fm => ({ ...fm, [field.FIELD_ID]: val }));
                      setErrorFields(f => ({ ...f, [field.FIELD_ID]: '' }));
                    }}
                    showError={isSubmit}
                    errorMsg={errorFields[field.FIELD_ID]}
                    disabled={isParentDisabled}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>

        <PopupAlert
          open={showAlert}
          type={popupType}
          message={popupMessage}
          onClose={() => setShowAlert(false)}
        />

        {children}
      </div>
    );
  }
);

export default EnvBackup;
