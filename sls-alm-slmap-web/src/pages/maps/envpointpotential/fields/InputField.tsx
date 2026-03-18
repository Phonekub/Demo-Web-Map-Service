import React, { useState } from 'react';
import { Input } from '../../../../components';

interface InputFieldProps {
  label: string;
  value: string;
  required?: boolean;
  type?: string;
  step?: number | string;
  pattern?: string;
  min?: number;
  max?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onError?: (error: string) => void;
  showError?: boolean;
  errorMsg?: string;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  required,
  type = 'text',
  step,
  pattern,
  min,
  max,
  onChange,
  onKeyDown,
  onError,
  showError,
  errorMsg,
  disabled,
}) => {
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // if number type and starts with leading zeros, remove them
    if (type === 'number' && /^0\d+/.test(val)) {
      val = val.replace(/^0+/, '');
      if (val === '') val = '0';
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value: val,
        },
      };
      onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
      return;
    }
    let numVal = Number(val);
    let errMsg = '';
    if (type === 'number' && val !== '') {
      // if the number is negative, change it to 0 immediately
      if (numVal < 1) {
        val = '1';
        numVal = 1;
        // create a new event to update the input value
        const newEvent = {
          ...e,
          target: {
            ...e.target,
            value: val,
          },
        };
        setError('');
        if (onError) onError('');
        onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
        return;
      }
      if (min !== undefined && numVal < min) {
        if (min !== undefined && max !== undefined) {
          errMsg = `ค่าที่สามารถใส่ได้ ${min} - ${max}`;
        } else if (min !== undefined) {
          errMsg = `ค่าที่น้อยที่สุดคือ ${min}`;
        } else if (max !== undefined) {
          errMsg = `ค่าที่มากที่สุดคือ ${max}`;
        }
      } else if (max !== undefined && numVal > max) {
        if (min !== undefined && max !== undefined) {
          errMsg = `ค่าที่สามารถใส่ได้ ${min} - ${max}`;
        } else if (max !== undefined) {
          errMsg = `ค่าที่มากที่สุดคือ ${max}`;
        } else if (min !== undefined) {
          errMsg = `ค่าที่น้อยที่สุดคือ ${min}`;
        }
      }
    }
    setError(errMsg);
    if (onError) onError(errMsg);
    onChange(e);
  };

  const displayError = errorMsg || error;
  return (
    <div className="form-control w-full mb-3 pr-2 pl-2">
      <label className="text-sm font-semibold text-gray-500">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        type={type}
        className={`input input-bordered w-full font-normal bg-white${showError && displayError ? ' border-red-500' : ''}`}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        step={step}
        pattern={pattern}
        disabled={disabled}
        {...(min !== undefined ? { min } : {})}
        {...(max !== undefined ? { max } : {})}
      />
      {showError && displayError && (
        <div className="text-red-500 text-xs mt-1">{displayError}</div>
      )}
    </div>
  );
};

export default InputField;
