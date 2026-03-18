import type { LocationInfo } from '@/services/location.service';
import { fetchPotentialByPoiId } from '@/services/location.service';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// ============================================================================
// Types
// ============================================================================

interface EmptyProfileStateProps {
  /** Callback when create button is clicked */
  onCreateClick?: () => void;
  location: LocationInfo | null;

  poiId?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Empty state component shown when no backup profile data exists.
 * Displays a title and a button to create a new backup profile.
 */
export const EmptyProfileState: React.FC<EmptyProfileStateProps> = ({
  location,
  onCreateClick,
  poiId,
}) => {
  const { t } = useTranslation(['common', 'backup']);
  const [fetchedName, setFetchedName] = useState<string | null>(null);

  // Fetch the POI name when branchName is not available (e.g. after creating a POI)
  useEffect(() => {
    if (!location?.branchName && poiId) {
      fetchPotentialByPoiId(poiId)
        .then(data => {
          setFetchedName(data?.poi?.name || null);
        })
        .catch(() => {
          setFetchedName(null);
        });
    }
  }, [location?.branchName, poiId]);

  const displayName = location?.branchName || fetchedName || '-';
  const title = t('backup:locationName') + ': ' + displayName;
  const buttonText = t('backup:createBackupProfile');
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
        <button
          onClick={onCreateClick}
          className="mt-6 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};
