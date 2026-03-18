import React from 'react';

interface InputProps {
  type: string;
  placeholder?: string;
  value?: string | number;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputmode?:
    | 'search'
    | 'email'
    | 'tel'
    | 'text'
    | 'url'
    | 'none'
    | 'numeric'
    | 'decimal'
    | undefined;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;

  className?: string;
  title?: string; // Optional title prop
  description?: string; // Optional description prop
  icon?: React.ReactNode; // Optional icon prop
  iconPosition?: 'left' | 'right'; // Optional icon position (default: left)
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // Optional size prop (default: md)
  children?: React.ReactNode;
  step?: string | number; // Optional step prop
  pattern?: string; // Optional pattern prop
  min?: string | number; // Optional min prop
  max?: string | number; // Optional max prop
}

const Input = ({
  type,
  placeholder,
  value,
  onFocus,
  onChange,
  inputmode = 'text',
  onKeyDown,
  onBlur,
  disabled = false,
  readOnly = false,
  className,
  title,
  required = false,
  description,
  icon,
  iconPosition = 'left',
  size = 'md',
  children,
  step,
  pattern,
  min,
  max,
}: InputProps) => {
  return (
    <fieldset className="fieldset pt-0">
      {title && (
        <legend className="fieldset-legend">
          {title}
          {required && <span className="text-red-500">*</span>}
        </legend>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onFocus={onFocus}
          onChange={onChange}
          inputMode={inputmode}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          readOnly={readOnly}
          step={step}
          pattern={pattern}
          min={min}
          max={max}
          className={`input input-${size} w-full rounded-md focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
            icon && iconPosition === 'left' ? 'pl-10' : ''
          } ${icon && iconPosition === 'right' ? 'pr-10' : ''} ${className}`}
          disabled={disabled}
        />
        {icon && iconPosition === 'right' && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </span>
        )}
      </div>
      {description && <p className="label">{description}</p>}
      {children}
    </fieldset>
  );
};

export default Input;
