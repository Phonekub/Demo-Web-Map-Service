import React, { useState, useRef, useEffect } from 'react';

interface HoverInputProps {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  /** Placeholder text */
  placeholder?: string;
  /** Input value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Input name */
  name?: string;
  /** CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Hover behavior type */
  hoverBehavior?: 'expand' | 'highlight' | 'shadow' | 'border' | 'all';
  /** Hover delay in milliseconds */
  hoverDelay?: number;
  /** Icon to show on hover */
  hoverIcon?: React.ReactNode;
  /** Tooltip text */
  tooltip?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** Auto-focus on hover */
  autoFocusOnHover?: boolean;
  /** Show clear button on hover */
  showClearOnHover?: boolean;
  /** Clear button click handler */
  onClear?: () => void;
}

export const HoverInput: React.FC<HoverInputProps> = ({
  type = 'text',
  placeholder,
  value = '',
  onChange,
  name,
  className = '',
  disabled = false,
  hoverBehavior = 'all',
  hoverDelay = 200,
  hoverIcon,
  tooltip,
  size = 'md',
  variant = 'default',
  autoFocusOnHover = false,
  showClearOnHover = false,
  onClear,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(true);
      if (autoFocusOnHover && !disabled && inputRef.current) {
        inputRef.current.focus();
      }
    }, hoverDelay);

    // Show tooltip with delay
    if (tooltip) {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      tooltipTimeoutRef.current = window.setTimeout(() => {
        setShowTooltip(true);
      }, hoverDelay + 300);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    setIsHovered(false);
    setShowTooltip(false);
  };

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
    setIsHovered(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!isHovered) {
      setIsHovered(false);
    }
  };

  // Clear input value
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
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

  // Hover effect classes
  const getHoverClasses = () => {
    if (!isHovered && !isFocused) return '';

    let classes = '';

    if (hoverBehavior === 'expand' || hoverBehavior === 'all') {
      classes += ' transform scale-105 ';
    }

    if (hoverBehavior === 'highlight' || hoverBehavior === 'all') {
      classes += ' bg-blue-50 ';
    }

    if (hoverBehavior === 'shadow' || hoverBehavior === 'all') {
      classes += ' shadow-lg ';
    }

    if (hoverBehavior === 'border' || hoverBehavior === 'all') {
      classes += ' border-blue-400 ';
    }

    return classes;
  };

  return (
    <div className="relative inline-block w-full">
      {/* Input container */}
      <div
        className={`
          relative transition-all duration-300 ease-in-out
          ${getHoverClasses()}
          ${className}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Input field */}
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full border rounded-lg transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${isHovered || isFocused ? 'shadow-md' : 'shadow-sm'}
            ${showClearOnHover && (isHovered || isFocused) && value ? 'pr-10' : ''}
            ${hoverIcon && (isHovered || isFocused) ? 'pl-10' : ''}

          `}
        />

        {/* Hover icon */}
        {hoverIcon && (isHovered || isFocused) && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-opacity duration-300">
            {hoverIcon}
          </div>
        )}

        {/* Clear button */}
        {showClearOnHover && (isHovered || isFocused) && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
      </div>

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

export default HoverInput;
