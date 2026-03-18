import _ from 'lodash';
import moment from 'moment';

export const setTimeZoneDate = (date: Date | null) => {
  if (_.isNull(date)) {
    return null;
  }

  const offset = parseInt(process.env.TIMEZONE_OFFSET || '');
  date.setTime(date.getTime() + offset * 60 * 1000);
  return date;
};

export const setFormatDate = (
  valueDate: Date | null,
  format = 'YYYY-MM-DD HH:mm:ss',
): string | null => {
  if (_.isNull(valueDate)) {
    return null;
  }

  return moment(valueDate).utc().format(format);
};

export const dateFormatYYYYMMDD = (valueDate: Date | null): string | null => {
  if (valueDate === null) {
    return null;
  }

  const date = new Date(valueDate);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const dateFormatDDSlashMMSlashYYYY = (valueDate: Date | null): string | null => {
  if (valueDate === null) {
    return null;
  }

  const date = new Date(valueDate);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

export const comma2Digit = (num: string) => {
  return parseFloat(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const dateFormatNoDashYYYYMMDD = (valueDate: Date | null): string | null => {
  if (valueDate === null) {
    return null;
  }

  const date = new Date(valueDate);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`;
};

export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

export const convertArrayStringToArray = (value: string) => {
  try {
    return JSON.parse(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
