import React from 'react';

interface SelectProps {
  options: { value: string | number; label: string }[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const Select = ({
  options,
  value,
  onChange,
  className,
  title,
  description,
  placeholder,
  disabled = false,
  size = 'md',
}: SelectProps) => {
  return (
    <fieldset className="fieldset mb-1 pt-0">
      {title && <legend className="fieldset-legend text-xs">{title}</legend>}
      <select
        value={value}
        onChange={onChange}
        className={`select select-${size} rounded-${size} px-3 py-2 ${className} focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed`}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description && <p className="label">{description}</p>}
    </fieldset>
  );
};

export default Select;
