import { userZoneAndSubZoneAuthorization } from './user.helper';

describe('userZoneAndSubZoneAuthorization', () => {
  it('should return true when user has the required zone and sub-zone', () => {
    const userZoneCodes = {
      Z001: ['SZ001', 'SZ002', 'SZ003'],
      Z002: ['SZ004', 'SZ005'],
    };

    const result = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: 'Z001',
      subzoneCode: 'SZ001',
    });

    expect(result).toBe(true);
  });

  it('should return true when checking a different sub-zone in the same zone', () => {
    const userZoneCodes = {
      Z001: ['SZ001', 'SZ002', 'SZ003'],
      Z002: ['SZ004', 'SZ005'],
    };

    const result = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: 'Z001',
      subzoneCode: 'SZ002',
    });

    expect(result).toBe(true);
  });

  it('should return true when checking a sub-zone in a different zone', () => {
    const userZoneCodes = {
      Z001: ['SZ001', 'SZ002'],
      Z002: ['SZ004'],
    };

    const result = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: 'Z002',
      subzoneCode: 'SZ004',
    });

    expect(result).toBe(true);
  });

  it('should return false when user is missing the required zone code', () => {
    const userZoneCodes = {
      Z001: ['SZ001', 'SZ002'],
    };

    const result = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: 'Z002',
      subzoneCode: 'SZ004',
    });

    expect(result).toBe(false);
  });

  it('should return false when user has the zone but not the sub-zone', () => {
    const userZoneCodes = {
      Z001: ['SZ001'],
      Z002: ['SZ004', 'SZ005'],
    };

    const result = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: 'Z001',
      subzoneCode: 'SZ002',
    });

    expect(result).toBe(false);
  });

  it('should return false when user has the zone but empty sub-zones array', () => {
    const userZoneCodes = {
      Z001: [],
      Z002: ['SZ004'],
    };

    const result = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: 'Z001',
      subzoneCode: 'SZ001',
    });

    expect(result).toBe(false);
  });

  it('should return false when zoneCode is empty string', () => {
    const userZoneCodes = {
      Z001: ['SZ001', 'SZ002', 'SZ003'],
    };

    const result = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: '',
      subzoneCode: 'SZ001',
    });

    expect(result).toBe(false);
  });

  it('should return false when subzoneCode is empty string', () => {
    const userZoneCodes = {
      Z001: ['SZ001', 'SZ002', 'SZ003', 'SZ004'],
    };

    const result = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: 'Z001',
      subzoneCode: '',
    });

    expect(result).toBe(false);
  });

  it('should return false when userZoneCodes is empty object', () => {
    const userZoneCodes = {};

    const result = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: 'Z001',
      subzoneCode: 'SZ001',
    });

    expect(result).toBe(false);
  });

  it('should return false when userZoneCodes is null', () => {
    const result = userZoneAndSubZoneAuthorization(null, {
      zoneCode: 'Z001',
      subzoneCode: 'SZ001',
    });

    expect(result).toBe(false);
  });

  it('should return false when userZoneCodes is undefined', () => {
    const result = userZoneAndSubZoneAuthorization(undefined, {
      zoneCode: 'Z001',
      subzoneCode: 'SZ001',
    });

    expect(result).toBe(false);
  });
});
