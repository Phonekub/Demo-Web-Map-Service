import React from 'react';
import Select, { components as selectComponents } from 'react-select';
import type { StylesConfig, GroupBase } from 'react-select';

interface MultiSelectFieldProps {
  label: string;
  value: { value: string; label: string }[] | string[];
  required?: boolean;
  options: { value: string; label: string }[];
  onChange: (newValue: { value: string; label: string }[]) => void;
  placeholder?: string;
  components?: any;
  styles?: StylesConfig<
    { value: string; label: string },
    true,
    GroupBase<{ value: string; label: string }>
  >;
  errorMsg?: string;
  showError?: boolean;
  disabled?: boolean;
}

const CheckboxOption = (props: any) => (
  <selectComponents.Option {...props}>
    <input
      type="checkbox"
      checked={props.isSelected}
      onChange={() => {}}
      style={{ marginRight: 8 }}
    />
    <span>{props.label}</span>
  </selectComponents.Option>
);

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  value,
  required,
  options,
  onChange,
  placeholder = 'กรุณาเลือก',
  components,
  styles,
  errorMsg,
  showError,
  disabled,
}) => {
  // Map value: if string[], convert to object[] using options
  // Parse PostgreSQL array string to JS array if needed
  function parsePgArray(str: string): string[] {
    return str
      .replace(/^{|}$/g, '')
      .split(',')
      .map(s => s.replace(/^"|"$/g, '').trim())
      .filter(Boolean);
  }
  let fixedValue: string[] | { value: string; label: string }[] | undefined = value;
  if (typeof value === 'string') {
    const strVal = value as string;
    if (
      strVal.length > 1 &&
      strVal.charAt(0) === '{' &&
      strVal.charAt(strVal.length - 1) === '}'
    ) {
      fixedValue = parsePgArray(strVal);
    }
  }
  const valueObjArr: { value: string; label: string }[] = Array.isArray(fixedValue)
    ? typeof fixedValue[0] === 'string'
      ? (fixedValue as string[]).map(
          v => options.find(opt => opt.value === v) || { value: v, label: v }
        )
      : (fixedValue as { value: string; label: string }[])
    : [];
  return (
    <div
      className={`form-control w-full mb-3 pr-2 pl-2 mt-2${disabled ? ' opacity-50 pointer-events-none' : ''}`}
    >
      <label className="text-sm font-semibold text-gray-500">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div>
        <Select
          isMulti
          isDisabled={disabled}
          options={options}
          value={valueObjArr}
          onChange={newValue => onChange(Array.isArray(newValue) ? newValue : [])}
          placeholder={placeholder}
          classNamePrefix="react-select"
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          components={{ ...components, Option: CheckboxOption }}
          styles={{
            ...styles,
            control: (base, state) => ({
              ...base,
              borderColor:
                showError && errorMsg
                  ? '#ef4444'
                  : base.borderColor || (state.isFocused ? '#2563eb' : base.borderColor),
              borderWidth: showError && errorMsg ? '1px' : base.borderWidth,
              boxShadow: showError && errorMsg ? 'none' : base.boxShadow,
              borderRadius: '8px',
              '&:hover': {
                borderColor: showError && errorMsg ? '#ef4444' : '#2563eb',
              },
            }),
          }}
        />
      </div>
      {showError && errorMsg && (
        <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
      )}
    </div>
  );
};

export default MultiSelectField;
