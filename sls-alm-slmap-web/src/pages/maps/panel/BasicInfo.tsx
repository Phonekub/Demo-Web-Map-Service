import { forwardRef } from 'react';
import PointPotentialBasicInfo from '../pointpotential/Information';
import type { BasicInfoRef } from '../pointpotential/Information';
import EnvInformation from '../envpointpotential/Information';

const BasicInfo = forwardRef<BasicInfoRef, any>(
  ({ poiId, type, isUpdateForm, ...props }, ref) => {
    if (type === 'env') {
      return <EnvInformation type={type} poiId={poiId} {...props} ref={ref} />;
    } else {
      return (
        <PointPotentialBasicInfo
          poiId={poiId}
          isUpdateForm={isUpdateForm}
          {...props}
          ref={ref}
        />
      );
    }
  }
);

export { BasicInfo };
