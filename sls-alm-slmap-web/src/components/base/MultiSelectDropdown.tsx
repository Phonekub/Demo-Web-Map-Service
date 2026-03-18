import React, { useEffect, useRef, useState } from 'react';
import type { DropdownOption } from './HoverDropdown';
import { useTranslation } from 'react-i18next';

interface Props {
  options: DropdownOption[];
  /** For single-select */
  value?: string;
  /** Single-select change */
  onChange?: (value: string, option: DropdownOption) => void;
  /** Multi-select */
  multiple?: boolean;
  selectedValues?: string[];
  onMultipleChange?: (values: string[], options: DropdownOption[]) => void;
  placeholder?: string;
  searchable?: boolean;
  creatable?: boolean;
  onCreate?: (label: string) => DropdownOption | undefined;
  maxHeight?: string;
  showIcons?: boolean;
  hoverBehavior?: 'expand' | 'highlight' | 'shadow' | 'border' | 'all';
  hoverDelay?: number;
  openOnHover?: boolean;
  closeDelay?: number;
  tooltip?: string;
  disabled?: boolean;
}

export const MultiSelectDropdown: React.FC<
  Props & {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    dropdownIcon?: React.ReactNode;
    position?: 'bottom' | 'top' | 'auto';
  }
> = ({
  options = [],
  value,
  onChange,
  multiple = true,
  selectedValues = [],
  onMultipleChange,
  placeholder = 'Select...',
  searchable = true,

  maxHeight = '300px',
  showIcons = true,
  hoverBehavior = 'all',
  hoverDelay = 200,
  openOnHover = false,
  closeDelay = 300,
  tooltip,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'default',
  dropdownIcon,
  position = 'bottom',
}) => {
  const { t } = useTranslation(['common', 'maps']);

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const [localOptions, setLocalOptions] = useState<DropdownOption[]>(options);

  useEffect(() => setLocalOptions(options), [options]);

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(true);
      if (openOnHover && !disabled) {
        setIsOpen(true);
      }
    }, hoverDelay);

    // Show tooltip with delay
    if (tooltip) {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = window.setTimeout(
        () => setShowTooltip(true),
        hoverDelay + 300
      );
    }
  };

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    setIsHovered(false);
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setShowTooltip(false);

    if (openOnHover) {
      closeTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
      }, closeDelay);
    }
  };

  // Handle option click
  const handleOptionClick = (option: DropdownOption) => {
    if (option.disabled) return;

    if (multiple) {
      const newValues = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];

      const newOptions = newValues
        .map(val => localOptions.find(opt => opt.value === val)!)
        .filter(Boolean) as DropdownOption[];
      onMultipleChange?.(newValues, newOptions);
    } else {
      onChange?.(option.value, option);
      setIsOpen(false);
    }
    setSearchTerm('');
  };

  // Filter options based on search
  const filteredOptions =
    searchable && searchTerm
      ? localOptions.filter(
          o =>
            o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : localOptions;

  // Get selected option(s) for display
  const selectedOption = localOptions.find(o => o.value === value);
  const selectedOptionsMultiple = multiple
    ? localOptions.filter(o => selectedValues.includes(o.value))
    : [];

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg',
  };

  // Variant classes
  const variantClasses = {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    primary: 'border-blue-300 focus:border-blue-600 focus:ring-blue-600',
    secondary: 'border-gray-400 focus:border-gray-600 focus:ring-gray-600',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
    warning: 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
  };

  // Hover effect classes (reuse existing function)
  const getHoverClasses = () => {
    if (!isHovered && !isOpen) return '';

    let classes = '';
    if (hoverBehavior === 'expand' || hoverBehavior === 'all')
      classes += ' transform scale-105 ';
    if (hoverBehavior === 'highlight' || hoverBehavior === 'all')
      classes += ' bg-blue-50 ';
    if (hoverBehavior === 'shadow' || hoverBehavior === 'all') classes += ' shadow-lg ';
    if (hoverBehavior === 'border' || hoverBehavior === 'all')
      classes += ' border-blue-400 ';
    return classes;
  };

  // Default dropdown icon
  const defaultDropdownIcon = (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );

  // Clear selection without affecting external state
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (multiple) {
      onMultipleChange?.([], []);
    } else {
      onChange?.('', { value: '', label: '' } as DropdownOption);
    }
    setSearchTerm('');
  };

  return (
    <div className={`relative inline-block w-full ${className}`} ref={dropdownRef}>
      {/* Dropdown trigger */}
      <div
        className={`relative cursor-pointer transition-all duration-300 ease-in-out ${getHoverClasses()}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div
          className={`
            w-full border rounded-lg transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            disabled:bg-gray-100 disabled:cursor-not-allowed
            flex items-center justify-between
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${isHovered || isOpen ? 'shadow-md' : 'shadow-sm'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {/* Display value */}
          <div className="flex-1 flex items-center gap-2">
            {multiple && selectedOptionsMultiple.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedOptionsMultiple.slice(0, 3).map(option => (
                  <span
                    key={option.value}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {showIcons && option.icon && (
                      <span className="mr-1">{option.icon}</span>
                    )}
                    {option.label}
                  </span>
                ))}
                {selectedOptionsMultiple.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{selectedOptionsMultiple.length - 3}
                  </span>
                )}
              </div>
            ) : selectedOption ? (
              <div className="flex items-center gap-2">
                {showIcons && selectedOption.icon && selectedOption.icon}
                <span>{selectedOption.label}</span>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>

          {/* Dropdown icon + clear button */}
          <div className="flex items-center gap-2">
            {((multiple && selectedOptionsMultiple.length > 0) ||
              (!multiple && selectedOption)) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="clear"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <div className="text-gray-400">{dropdownIcon || defaultDropdownIcon}</div>
          </div>
        </div>
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg transition-all duration-200 ease-in-out transform origin-top scale-100 opacity-100 ${position === 'top' ? 'bottom-full mb-1 mt-0' : ''}`}
          style={{ maxHeight }}
        >
          {/* Search input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder={t('maps:search_option')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: `calc(${maxHeight} - ${searchable ? '60px' : '0px'})`,
              maxWidth: '300px',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                {t('maps:no_options_found')}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`px-3 py-2 cursor-pointer transition-colors duration-150 flex items-center gap-2 ${option.disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-900'} ${multiple && selectedValues.includes(option.value) ? 'bg-blue-100 text-blue-900' : value === option.value ? 'bg-blue-500 text-white' : ''} ${index === 0 ? 'rounded-t-lg' : ''} ${index === filteredOptions.length - 1 ? 'rounded-b-lg' : ''}`}
                  onClick={() => handleOptionClick(option)}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => {}}
                      className="rounded text-blue-600"
                    />
                  )}

                  {showIcons && option.icon && (
                    <span className="flex-shrink-0">{option.icon}</span>
                  )}

                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {option.description}
                      </div>
                    )}
                  </div>

                  {!multiple && value === option.value && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50 transition-opacity duration-200">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
