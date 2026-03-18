export class QuotaException extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'QuotaException';
  }
}

export class InvalidYearFormatException extends QuotaException {
  constructor(message = 'Invalid quota year format') {
    super('INVALID_YEAR_FORMAT', message);
    this.name = 'InvalidYearFormatException';
  }
}

export class CatalogNotFoundException extends QuotaException {
  constructor(message: string) {
    super('CATALOG_NOT_FOUND', message);
    this.name = 'CatalogNotFoundException';
  }
}

export class NegativeTargetException extends QuotaException {
  constructor(message = 'Target values cannot be negative') {
    super('NEGATIVE_TARGET', message);
    this.name = 'NegativeTargetException';
  }
}

export class PairNotSelectedException extends QuotaException {
  constructor(message: string) {
    super('PAIR_NOT_SELECTED', message);
    this.name = 'PairNotSelectedException';
  }
}

export class ConfigNotVisibleException extends QuotaException {
  constructor(message: string) {
    super('CONFIG_NOT_VISIBLE', message);
    this.name = 'ConfigNotVisibleException';
  }
}

export class DataAccessException extends QuotaException {
  constructor(message = 'Data access error') {
    super('DATA_ACCESS_ERROR', message);
    this.name = 'DataAccessException';
  }
}

export class InvalidRoundStatusException extends QuotaException {
  constructor(message = 'Quota round status does not allow this operation') {
    super('INVALID_ROUND_STATUS', message);
    this.name = 'InvalidRoundStatusException';
  }
}

export class QuotaNotFoundException extends QuotaException {
  constructor(message = 'Quota record not found') {
    super('QUOTA_NOT_FOUND', message);
    this.name = 'QuotaNotFoundException';
  }
}

export class InvalidReportImpactSiteStatusException extends QuotaException {
  constructor(message = 'Quota report impact site status does not allow this operation') {
    super('INVALID_IMPACT_SITE_STATUS', message);
    this.name = 'InvalidReportImpactSiteStatusException';
  }
}
