import * as _ from 'lodash';

export const userZoneAndSubZoneAuthorization = (
  userZoneCodes: Record<string, string[]>,
  zone: {
    zoneCode: string;
    subzoneCode: string;
  },
): boolean => {
  if (_.isEmpty(userZoneCodes) || _.isNil(userZoneCodes)) {
    return false;
  }

  if (_.isEmpty(zone?.zoneCode) || _.isEmpty(zone?.subzoneCode)) {
    return false;
  }

  if (userZoneCodes[zone.zoneCode] === undefined) {
    return false;
  }

  return userZoneCodes[zone.zoneCode].includes(zone.subzoneCode);
};
