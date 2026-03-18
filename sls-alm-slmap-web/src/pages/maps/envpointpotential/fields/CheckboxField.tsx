import React from 'react';

interface CheckboxFieldProps {
  label: string;
  value: string[];
  required?: boolean;
  options: { value: string; label: string }[];
  onChange: (optionValue: string) => void;
  errorMsg?: string;
  showError?: boolean;
  disabled?: boolean;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({
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
    <label className="label py-1">
      <span className="text-sm font-semibold">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
    </label>
    <div className="flex gap-10 mt-1">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className={`checkbox checkbox-sm rounded${showError && errorMsg ? ' border-red-500 border' : ''}`}
            style={showError && errorMsg ? { boxShadow: '0 0 0 1px #ef4444' } : {}}
            checked={value?.includes(opt.value)}
            onChange={() => onChange(opt.value)}
          />
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
    {showError && errorMsg && <div className="text-red-500 text-xs mt-1">{errorMsg}</div>}
  </div>
);

export default CheckboxField;
