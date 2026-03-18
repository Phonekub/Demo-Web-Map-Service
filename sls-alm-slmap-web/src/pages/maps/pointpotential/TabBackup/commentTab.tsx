import type { LocationInfo } from '@/services/location.service';
import { BackupHeader } from './BackupHeader';
import { useBackupProfileStore } from '@/stores/backupProfileStore';
import { useTranslation } from 'react-i18next';

interface CommentTabProps {
  location: LocationInfo | null;
  formLocNumber?: string;
}

// ============================================================================
// Component
// ============================================================================
const CommentTab = ({ location, formLocNumber }: CommentTabProps) => {
  // ============================================================================
  // Store
  // ============================================================================
  const { backupRemark, setBackupRemark } = useBackupProfileStore();
  const { t } = useTranslation(['common', 'backup']);

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="px-4 py-3 pr-4">
      <BackupHeader location={location} formLocNumber={formLocNumber} />

      {/* Comment Input */}
      <div className="mb-4 mt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          {t('backup:comment')}
        </label>
        <textarea
          className="w-full h-48 p-4 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm placeholder-gray-400"
          placeholder={t('backup:commentPlaceholder')}
          value={backupRemark}
          onChange={e => setBackupRemark(e.target.value)}
        />
      </div>
    </div>
  );
};

export default CommentTab;
