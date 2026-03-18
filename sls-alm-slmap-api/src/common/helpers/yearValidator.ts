import { InvalidYearFormatException } from '../exceptions/quota.exception';

export class YearValidator {
  private static readonly YEAR_REGEX = /^\d{4}$/;

  static validate(year: string): void {
    if (!this.YEAR_REGEX.test(year)) {
      throw new InvalidYearFormatException();
    }
  }
}
