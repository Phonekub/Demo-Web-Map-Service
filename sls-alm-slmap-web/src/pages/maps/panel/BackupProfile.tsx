import { forwardRef } from 'react';
import EnvBackup from '../envpointpotential/Backup';
import PointPotentialBackup from '../pointpotential/Backup';
import type { LocationInfo } from '@/services/location.service';

const BackupProfile = forwardRef<
  any,
  { poiId: string; type?: 'default' | 'env'; formId?: number; location?: LocationInfo }
>(({ poiId, type, formId, location }, ref) => {
  if (type === 'env') {
    return <EnvBackup ref={ref} formId={formId} />;
  } else {
    return <PointPotentialBackup poiId={poiId} ref={ref} location={location!} />;
  }
});

BackupProfile.displayName = 'BackupProfile';

export { BackupProfile };
