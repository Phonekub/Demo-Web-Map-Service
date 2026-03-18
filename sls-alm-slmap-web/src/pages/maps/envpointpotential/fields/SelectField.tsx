import React from 'react';

interface SelectFieldProps {
  label: string;
  value: string;
  required?: boolean;
  options: { value: string; label: string }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  errorMsg?: string;
  showError?: boolean;
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  required,
  options,
  onChange,
  errorMsg,
  showError,
  disabled,
}) => (
  <div
    className={`form-control w-full mb-3 pr-2 pl-2${disabled ? ' opacity-50 pointer-events-none' : ''}`}
  >
    <label className="text-sm font-semibold text-gray-500">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <select
      className={`select select-bordered w-full font-normal bg-white${showError && errorMsg ? ' border-red-500' : ''}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <option value="">-กรุณาเลือก-</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {showError && errorMsg && <div className="text-red-500 text-xs mt-1">{errorMsg}</div>}
  </div>
);

export default SelectField;
