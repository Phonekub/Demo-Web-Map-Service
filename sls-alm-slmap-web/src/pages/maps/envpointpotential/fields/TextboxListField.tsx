import { Input } from '@/components';
import React, { useState, useEffect, useMemo } from 'react';

interface TextboxListFieldProps {
  label: string;
  value: string[];
  count: number;
  required?: boolean;
  onChange: (values: string[]) => void;
  showError?: boolean;
  errorMsg?: string;
  itemLabels?: string[];
  isShowPercent?: boolean;
  isShowTotal?: boolean;
  totalTitle?: string;
  validateTotalMin?: number;
  validateTotalMax?: number;
  disabled?: boolean;
  validateRegex?: string;
  type?: 'number' | 'string';
  validateMin?: number;
  validateMax?: number;
}

const TextboxListField: React.FC<TextboxListFieldProps> = ({
  label,
  value,
  count,
  required = false,
  onChange,
  showError = false,
  errorMsg = '',
  itemLabels = [],
  isShowPercent = false,
  isShowTotal = false,
  totalTitle = '',
  validateTotalMin,
  validateTotalMax,
  disabled,
  validateRegex,
  type = 'number',
  validateMin,
  validateMax,
}) => {
  // Build a regex from validateRegex if provided
  const regexPattern = useMemo(() => {
    if (!validateRegex) return null;
    try {
      return new RegExp(validateRegex);
    } catch {
      return null;
    }
  }, [validateRegex]);

  // Extract character-level pattern for keystroke and onChange filtering
  const charPattern = useMemo(() => {
    if (!validateRegex) return null;
    try {
      // Remove anchors and quantifiers to get base character pattern
      // e.g., ^[0-9]+$ -> [0-9]
      const cleaned = validateRegex
        .replace(/^\^/, '')
        .replace(/\$$/, '')
        .replace(/[+*?{}\d]+$/, '');
      return new RegExp(cleaned);
    } catch {
      return null;
    }
  }, [validateRegex]);

  const hasValidation = !!regexPattern;
  const [localValues, setLocalValues] = useState<string[]>([]);

  // Initialize local values from props
  useEffect(() => {
    const values = Array.isArray(value) ? value : Array(count).fill('');
    setLocalValues(values);
  }, [value, count]);

  const values = localValues;

  let total = 0;
  if (isShowPercent || isShowTotal) {
    total = values.reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }

  let totalError = '';
  if (isShowTotal) {
    if (typeof validateTotalMin === 'number' && total < validateTotalMin) {
      totalError = `Total ต้องไม่น้อยกว่า ${validateTotalMin}`;
    } else if (typeof validateTotalMax === 'number' && total > validateTotalMax) {
      totalError = `Total ต้องไม่เกิน ${validateTotalMax}`;
    }
  }

  let minMaxError = '';
  if (type === 'number') {
    for (let i = 0; i < values.length; i++) {
      const val = parseFloat(values[i]);
      if (typeof validateMin === 'number' && val < validateMin) {
        minMaxError = `ค่า ${itemLabels[i] || i + 1} ต้องไม่น้อยกว่า ${validateMin}`;
        break;
      } else if (typeof validateMax === 'number' && val > validateMax) {
        minMaxError = `ค่า ${itemLabels[i] || i + 1} ต้องไม่เกิน ${validateMax}`;
        break;
      }
    }
  }

  // Check if at least one value is filled
  const atLeastOneFilled = values.some(v => v && v.trim() !== '');

  return (
    <div
      className={`flex flex-col mb-2 pr-2 pl-2${disabled ? ' opacity-50 pointer-events-none' : ''}`}
    >
      <label className="font-semibold mb-1 text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
        {/* <span className="ml-2 text-xs text-blue-500">[{type?.toUpperCase() || 'UNKNOWN'}]</span> */}
      </label>
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {itemLabels && itemLabels[idx] && (
              <span
                className="w-[250px] text-gray-700 text-sm break-words"
                title={itemLabels[idx]}
              >
                {itemLabels[idx]}
              </span>
            )}
            <input
              type={hasValidation ? 'text' : 'number'}
              inputMode={hasValidation ? 'numeric' : undefined}
              pattern={
                hasValidation && validateRegex
                  ? validateRegex.replace(/^\^/, '').replace(/\$$/, '')
                  : undefined
              }
              value={values[idx] || ''}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (hasValidation && charPattern) {
                  const navigationKeys = [
                    'Backspace',
                    'Delete',
                    'Tab',
                    'Escape',
                    'Enter',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ];
                  if (navigationKeys.includes(e.key)) return;
                  if (
                    (e.ctrlKey || e.metaKey) &&
                    ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())
                  )
                    return;
                  if (!charPattern.test(e.key)) {
                    e.preventDefault();
                  }
                }
              }}
              onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                if (hasValidation && regexPattern) {
                  const pasted = e.clipboardData.getData('text');
                  if (!regexPattern.test(pasted)) {
                    e.preventDefault();
                  }
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                let val = e.target.value;

                // ถ้ามี validateRegex ให้กรองด้วย charPattern ก่อน
                if (hasValidation && charPattern && val) {
                  val = val
                    .split('')
                    .filter(ch => charPattern.test(ch))
                    .join('');
                }

                // ถ้า type เป็น number ให้กรองเฉพาะตัวเลข และบังคับค่าขั้นต่ำ
                if (type === 'number') {
                  val = val.replace(/[^0-9]/g, '');
                  if (val !== '' && Number(val) < 1) {
                    val = '1';
                  }
                }

                const newValues = [...localValues];
                newValues[idx] = val;
                setLocalValues(newValues);
              }}
              onBlur={() => {
                onChange(localValues);
              }}
              disabled={disabled}
              className={`border p-1 rounded flex-1 ${showError && required && !atLeastOneFilled ? 'border-red-500' : 'border-gray-300'}`}
            />
            {isShowPercent && (
              <Input
                type="text"
                value={
                  total > 0 && values[idx]
                    ? `${(((parseFloat(values[idx]) || 0) * 100) / total).toFixed(2)}%`
                    : ''
                }
                disabled
                placeholder="%"
                className="border p-1 rounded w-[60px] ml-2 bg-gray-100 text-gray-500 text-center border-2 "
              />
            )}
          </div>
        ))}
      </div>
      {isShowTotal && (
        <div className="flex flex-col mt-2">
          <div className="flex items-center">
            <span className="w-[250px] text-gray-700 font-semibold text-sm">
              {totalTitle || 'Total'}
            </span>
            <Input
              type="text"
              value={total}
              disabled
              className={`border p-1 rounded w-[100px] ml-2 bg-gray-100 text-gray-700 text-center border-2  font-bold ${totalError ? 'border-red-500' : ''}`}
            />
          </div>
          {totalError && <span className="text-red-500 text-xs mt-1">{totalError}</span>}
        </div>
      )}
      {showError && errorMsg && (
        <span className="text-red-500 text-xs mt-1">{errorMsg}</span>
      )}
      {showError && minMaxError && (
        <span className="text-red-500 text-xs mt-1">{minMaxError}</span>
      )}
    </div>
  );
};

export default TextboxListField;
