import { useTranslation } from 'react-i18next';
import React from 'react';

interface ModalProps {
  id: string;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isOpen?: boolean;
  closeButton?: boolean;
  closeText?: string;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  location?: 'top' | 'center';
}

const Modal = ({
  id,
  title,
  children,
  actions,
  isOpen = false,
  closeButton = true,
  onClose,
  closeText,
  size = 'md',
  location = 'center',
}: ModalProps) => {
  const { t } = useTranslation('common');
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    xxl: 'max-w-[90vw] max-h-full',
  };

  const locationClasses = {
    top: 'modal-top',
    center: 'modal-middle',
  };

  return (
    <>
      <input
        type="checkbox"
        id={id}
        className="modal-toggle"
        checked={isOpen}
        onChange={() => {}}
      />
      <dialog className={`modal ${locationClasses[location]}`} role="dialog">
        <div
          className={`modal-box w-full ${sizeClasses[size]} p-0 flex flex-col max-h-[90vh]`}
        >
          {/* Fixed Header */}
          {title && (
            <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{title}</h3>
                {closeButton && (
                  <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">{children}</div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t">
            <div className="flex justify-end gap-1">
              {actions}
              {closeButton && (
                <button className="btn" onClick={onClose}>
                  {closeText || t('close')}
                </button>
              )}
            </div>
          </div>
        </div>
        <label className="modal-backdrop" htmlFor={id} onClick={onClose}>
          {t('close')}
        </label>
      </dialog>
    </>
  );
};

export default Modal;
