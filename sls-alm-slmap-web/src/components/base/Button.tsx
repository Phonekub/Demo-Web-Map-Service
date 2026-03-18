import React from 'react';

interface ButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  className?: string;
  variant?:
    | 'primary'
    | 'success'
    | 'secondary'
    | 'outline'
    | 'danger'
    | 'error'
    | 'warning'
    | 'accent'
    | 'info'
    | 'neutral';
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  required?: boolean;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  iconOnly?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  className,
  variant = 'primary',
  type = 'button',
  icon,
  iconPosition = 'left',
  disabled = false,
  title,
  size = 'md',
  iconOnly = false,
  tooltip,
  tooltipPosition = 'top',
}: ButtonProps) => {
  const variantClasses = {
    primary: 'btn-primary',
    success: 'btn-success',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-error',
    error: 'btn-error',
    warning: 'btn-warning',
    accent: 'btn-accent',
    info: 'btn-info',
    neutral: 'btn-neutral',
  };

  const buttonClassName = iconOnly
    ? `btn btn-sm btn-circle ${variantClasses[variant]} ${className ?? ''}`
    : `btn btn-${size} ${variantClasses[variant]} ${className} rounded-lg flex items-center ${icon ? 'gap-2' : 'justify-center'}`;

  return (
    <div className={`tooltip tooltip-${tooltipPosition}`} data-tip={tooltip}>
      <button
        onClick={onClick}
        type={type}
        className={buttonClassName}
        disabled={disabled}
        title={title}
      >
        {iconOnly ? (
          icon
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
            {children && (
              <span className={`flex-1 ${icon ? 'text-left' : 'text-center'}`}>
                {children}
              </span>
            )}
            {icon && iconPosition === 'right' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    </div>
  );
};

export default Button;
