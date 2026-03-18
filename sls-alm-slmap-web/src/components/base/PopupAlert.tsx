import { useTranslation } from 'react-i18next';

// ============================================================================
// Types
// ============================================================================

export type AlertType = 'success' | 'error' | 'info';

export interface PopupAlertProps {
  open: boolean;
  type?: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  messageClassName?: string;
}

// ============================================================================
// Alert Configuration
// ============================================================================

const ALERT_CONFIG: Record<
  AlertType,
  {
    title: string;
    bgColor: string;
    iconColor: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    title: 'Success',
    bgColor: 'bg-[#f0f9f4]',
    iconColor: 'bg-[#43bc82]',
    icon: (
      <svg
        className="w-8 h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
  error: {
    title: 'Error',
    bgColor: 'bg-red-50',
    iconColor: 'bg-red-500',
    icon: (
      <svg
        className="w-8 h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
  info: {
    title: 'Warning',
    bgColor: 'bg-[#FFF9F2]',
    iconColor: 'bg-yellow-200',
    icon: (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
    ),
  },
};

// ============================================================================
// Component
// ============================================================================

const PopupAlert: React.FC<PopupAlertProps> = ({
  open,
  type = 'success',
  message,
  messageClassName,
  onClose,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  title,
}) => {
  const { t } = useTranslation(['common']);

  if (!open) return null;

  const config = ALERT_CONFIG[type];
  const hasConfirmCancel = onConfirm && onCancel;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCancel || onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-[32px] shadow-xl p-6 flex flex-col items-center w-full max-w-[320px] animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div
          className={`w-24 h-24 ${config.bgColor} rounded-full flex items-center justify-center mb-4`}
        >
          <div
            className={`w-14 h-14 ${config.iconColor} rounded-full flex items-center justify-center shadow-sm`}
          >
            {config.icon}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800 mb-1">{title || config.title}</h2>

        {/* Message */}
        <p
          className={`text-gray-500 text-sm mb-6 text-center leading-relaxed whitespace-pre-line ${messageClassName || ''}`}
        >
          {message}
        </p>

        {/* Action Buttons */}
        {hasConfirmCancel ? (
          <div className="flex gap-3 w-full">
            <button
              className="flex-1 py-3 bg-[#3366ff] hover:bg-blue-700 text-white text-lg font-medium rounded-2xl transition-all active:scale-95"
              onClick={onConfirm}
            >
              {confirmText || t('confirm')}
            </button>
            <button
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg font-medium rounded-2xl transition-all active:scale-95"
              onClick={onCancel}
            >
              {cancelText || t('cancel')}
            </button>
          </div>
        ) : (
          <button
            className="w-full py-3 bg-[#3366ff] hover:bg-blue-700 text-white text-lg font-medium rounded-2xl transition-all active:scale-95"
            onClick={onClose}
          >
            ปิด
          </button>
        )}
      </div>
    </div>
  );
};

export default PopupAlert;
