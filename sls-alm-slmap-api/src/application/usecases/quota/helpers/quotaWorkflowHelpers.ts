// Helper functions for quota workflow processing

export function formatDateDDMMYYYY(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function getThaiMonthName(monthStr: string): string {
  const monthNames: { [key: string]: string } = {
    '01': 'มกราคม',
    '02': 'กุมภาพันธ์',
    '03': 'มีนาคม',
    '04': 'เมษายน',
    '05': 'พฤษภาคม',
    '06': 'มิถุนายน',
    '07': 'กรกฎาคม',
    '08': 'สิงหาคม',
    '09': 'กันยายน',
    '10': 'ตุลาคม',
    '11': 'พฤศจิกายน',
    '12': 'ธันวาคม',
  };
  return monthNames[monthStr] || monthStr;
}

export interface QuotaEmailTemplateData extends Record<string, string> {
  YEAR: string;
  ROUND: string;
  ZONE: string;
  START_MONTH: string;
  END_MONTH: string;
  DUE_DATE: string;
  WEB_LINK: string;
  LOCATION_TYPE: string;
}

export function buildQuotaEmailTemplateData(
  allocation: {
    year: number;
    roundName: string;
    zone: string;
    startMonth: string;
    endMonth: string;
    dueDate: Date;
  },
  locationTypeName: string = '',
): QuotaEmailTemplateData {
  return {
    YEAR: allocation.year.toString(),
    ROUND: allocation.roundName || '',
    ZONE: allocation.zone,
    START_MONTH: allocation.startMonth ? getThaiMonthName(allocation.startMonth) : '',
    END_MONTH: allocation.endMonth ? getThaiMonthName(allocation.endMonth) : '',
    DUE_DATE: formatDateDDMMYYYY(allocation.dueDate),
    WEB_LINK: process.env.BASE_URL_WEB || '',
    LOCATION_TYPE: locationTypeName,
  };
}

export function buildEmailConnection(zone: string) {
  return { zone };
}

export interface AllocationRoundStatusEntry {
  wfTransactionId: number | null;
  wfComplete: string | null;
  quotaAssign: number;
  annualTarget: number | null;
}

/**
 * Determines whether a single allocation entry meets the criteria
 * for the quota round to be auto-closed (status = 3).
 *
 * Rules (in priority order):
 * 1. If the allocation has a workflow transaction → it must be complete (wfComplete != 'W').
 * 2. Else if annualTarget is set → it must be 0 (nothing left to allocate).
 * 3. Else → assigned quota must be 0 or less.
 */
export function allocationMeetsRoundCompletionCriteria(
  a: AllocationRoundStatusEntry,
): boolean {
  if (a.wfTransactionId) {
    return !!a.wfComplete && a.wfComplete !== 'W';
  }
  if (a.annualTarget !== null && a.annualTarget !== undefined) {
    return Number(a.annualTarget) === 0;
  }
  return (a.quotaAssign || 0) <= 0;
}
