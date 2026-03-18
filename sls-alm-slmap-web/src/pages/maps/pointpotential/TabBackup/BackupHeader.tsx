import type { LocationInfo } from '@/services/location.service';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/userStore';
import { useState, useCallback } from 'react';
import { generateRentalLink } from '@/services/rental.service';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface BackupHeaderProps {
  location: LocationInfo | null;
  formLocNumber?: string;
  expectedOpenDate?: string;
  nation?: string;
}

// ============================================================================
// Component
// ============================================================================

export const BackupHeader = ({
  location,
  formLocNumber = '-',
  expectedOpenDate = '-',
  nation,
}: BackupHeaderProps) => {
  const { t } = useTranslation(['common', 'backup']);
  const { user } = useUserStore();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const handleRentalClick = useCallback(async () => {
    if (!formLocNumber || formLocNumber === '-') return;

    try {
      setIsGeneratingLink(true);
      const response = await generateRentalLink({
        formLocNumber,
        userId: user?.id || 0,
        timestamp: new Date().getTime(),
        nation: nation || 'TH',
      });

      if (response?.data?.url) {
        window.open(response.data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error generating rental link:', error);
    } finally {
      setIsGeneratingLink(false);
    }
  }, [formLocNumber, nation, user]);

  const hasFormLocNumber = formLocNumber && formLocNumber !== '-';

  return (
    <div className="mb-3 pb-2 border-b border-gray-200">
      <h2 className="text-base font-semibold text-blue-700 mb-2">
        {t('backup:locationName')} : {location?.branchName || '-'}
      </h2>
      <div className="flex gap-8">
        <div>
          <span className="text-xs text-gray-500 block mb-1">
            {t('backup:formLocNumber')}
          </span>
          {hasFormLocNumber ? (
            <button
              onClick={handleRentalClick}
              disabled={isGeneratingLink}
              className="text-blue-600 hover:text-blue-800 font-semibold text-lg underline cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLocNumber}
            </button>
          ) : (
            <p className="text-blue-600 font-semibold text-lg">{formLocNumber || '-'}</p>
          )}
        </div>
        <div>
          <span className="text-xs text-gray-500 block mb-1">
            {t('backup:expectedOpenDate')}
          </span>
          <p className="text-gray-700 font-medium text-lg">{expectedOpenDate || '-'}</p>
        </div>
      </div>
    </div>
  );
};

export default BackupHeader;
