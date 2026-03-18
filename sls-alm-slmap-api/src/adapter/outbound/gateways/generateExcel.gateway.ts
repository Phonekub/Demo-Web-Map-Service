import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Workbook, Worksheet, Cell } from 'exceljs';
import { PassThrough, Stream } from 'stream';
import { ExcelExportGatewayPort } from '../../../application/ports/generateExcelGateway.repository';
import { QuotaAnnualTarget } from '../../../domain/quotaAnnualTarget';
import { Language } from '../../../common/enums/language.enum';
import { last } from 'lodash';
import { lang } from 'moment';

@Injectable()
export class QuotaExcelExportGateway implements ExcelExportGatewayPort {
  private readonly COLORS = {
    BG_BLUE_50: 'FFF0F9FF',
    BG_BLUE_200: 'FFDBEAFE',
    BG_YELLOW: 'FFFEF9C3',
    BG_GREEN: 'FFD1FAE5',
    TEXT_GRAY_500: 'FF6B7280',
    TEXT_GRAY_700: 'FF374151',
    BORDER_GRAY: 'FFD1D5DB',
    TEXT_BLACK: 'FF000000',
  };

  async generateQuotaReport(
    data: QuotaAnnualTarget[],
    language?: Language,
  ): Promise<Stream> {
    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Quota Annual Targets');

      const { sortedStructure, allQuotas } = this.analyzeColumns(data);
      const dataMap = this.transformDataToMap(data);

      const lastColIndex = this.drawDynamicHeader(
        worksheet,
        sortedStructure,
        allQuotas,
        language,
      );

      this.drawDataRows(worksheet, dataMap, sortedStructure, allQuotas, lastColIndex);

      this.drawFooter(
        worksheet,
        dataMap,
        sortedStructure,
        allQuotas,
        lastColIndex,
        language,
      );

      // 6. Return Stream
      const stream = new PassThrough();
      workbook.xlsx
        .write(stream)
        .then(() => stream.end())
        .catch((err) => {
          console.error(err);
          stream.emit('error', err);
        });

      return stream;
    } catch (error) {
      console.error('Excel Export Error:', error);
      throw new InternalServerErrorException('Failed to generate Excel file');
    }
  }

  // ==========================================
  //  Private Helpers
  // ==========================================

  private analyzeColumns(data: QuotaAnnualTarget[]) {
    const structure = new Map<string, Set<string>>();
    const globalQuotas = new Set<string>();

    const locOrder = new Map<string, string>();
    const quotaOrder = new Map<string, string>();

    data.forEach((item) => {
      const locName = item.locationTypeName || item.locationType || 'Unknown';
      const locCode = item.locationType || '99';
      const quotaName = item.quotaTypeName || item.quotaType || 'General';
      const quotaCode = item.quotaType || '99';

      if (!structure.has(locName)) {
        structure.set(locName, new Set<string>());
        locOrder.set(locName, locCode);
      }
      structure.get(locName).add(quotaName);
      globalQuotas.add(quotaName);

      if (!quotaOrder.has(quotaName)) {
        quotaOrder.set(quotaName, quotaCode);
      }
    });

    const sortedLocationKeys = Array.from(structure.keys()).sort((a, b) => {
      const codeA = locOrder.get(a) || '99';
      const codeB = locOrder.get(b) || '99';
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });

    const sortedStructure = new Map<string, string[]>();

    sortedLocationKeys.forEach((locName) => {
      const quotasArray = Array.from(structure.get(locName));
      quotasArray.sort((a, b) => {
        const codeA = quotaOrder.get(a) || '99';
        const codeB = quotaOrder.get(b) || '99';
        return codeA.localeCompare(codeB, undefined, { numeric: true });
      });
      sortedStructure.set(locName, quotasArray);
    });
    const sortedAllQuotas = Array.from(globalQuotas).sort((a, b) => {
      const codeA = quotaOrder.get(a) || '99';
      const codeB = quotaOrder.get(b) || '99';
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });

    return { sortedStructure, allQuotas: sortedAllQuotas };
  }

  private transformDataToMap(data: QuotaAnnualTarget[]) {
    const map = new Map<string, Map<string, Map<string, number>>>();

    data.forEach((item) => {
      const zoneKey = item.zoneCode || item.zoneId.toString();
      const loc = item.locationTypeName || item.locationType || 'Unknown';
      const quota = item.quotaTypeName || item.quotaType || 'General';
      const target = Number(item.target) || 0;

      if (!map.has(zoneKey)) map.set(zoneKey, new Map());
      const locMap = map.get(zoneKey);

      if (!locMap.has(loc)) locMap.set(loc, new Map());
      const quotaMap = locMap.get(loc);

      const currentVal = quotaMap.get(quota) || 0;
      quotaMap.set(quota, currentVal + target);
    });

    return map;
  }

  private drawDynamicHeader(
    worksheet: Worksheet,
    columnStructure: Map<string, string[]>,
    allQuotas: string[],
    language?: Language,
  ): number {
    const row1 = worksheet.getRow(1);
    const row2 = worksheet.getRow(2);

    // --- A. Zone ---
    const zoneCell = row1.getCell(1);
    zoneCell.value = 'Zone';
    worksheet.mergeCells('A1:A2');
    this.styleHeaderCell(zoneCell);
    this.styleHeaderCell(row2.getCell(1));

    let currentCol = 2;

    // --- B. Dynamic Location Columns ---
    for (const [location, quotas] of columnStructure.entries()) {
      const numberOfQuotas = quotas.length;

      // Loc Header
      const locCell = row1.getCell(currentCol);
      locCell.value = location;
      if (numberOfQuotas > 1) {
        worksheet.mergeCells(1, currentCol, 1, currentCol + numberOfQuotas - 1);
      }
      this.styleHeaderCell(locCell);

      // Quota Headers
      quotas.forEach((quota, index) => {
        const quotaCell = row2.getCell(currentCol + index);
        quotaCell.value = quota;
        this.styleHeaderCell(quotaCell);
        worksheet.getColumn(currentCol + index).width = 15;
      });

      currentCol += numberOfQuotas;
    }

    const translationTotal = {
      EN: 'Total',
      TH: 'รวม',
      KM: 'សរុប',
    };

    const totalLabel =
      translationTotal[`${language.toUpperCase()}`] || translationTotal['EN'];
    const totalGroupCell = row1.getCell(currentCol);
    totalGroupCell.value = totalLabel;

    // Merge ตามจำนวน Quota ทั้งหมดที่มี
    if (allQuotas.length > 1) {
      worksheet.mergeCells(1, currentCol, 1, currentCol + allQuotas.length - 1);
    }
    this.styleHeaderCell(totalGroupCell);

    allQuotas.forEach((quota, index) => {
      const cell = row2.getCell(currentCol + index);
      cell.value = quota;
      this.styleHeaderCell(cell);
      worksheet.getColumn(currentCol + index).width = 15;
    });

    currentCol += allQuotas.length;

    const translationGrandTotal = {
      EN: 'Total',
      TH: 'รวมทั้งหมด',
      KM: 'សរុបទាំងមូល',
    };

    const grandTotalLabel =
      translationGrandTotal[`${language.toUpperCase()}`] || translationGrandTotal['EN'];

    const grandTotalCell = row1.getCell(currentCol);
    grandTotalCell.value = grandTotalLabel;
    worksheet.mergeCells(1, currentCol, 2, currentCol);
    this.styleHeaderCell(grandTotalCell);
    this.styleHeaderCell(row2.getCell(currentCol));
    worksheet.getColumn(currentCol).width = 15;

    return currentCol;
  }

  private drawDataRows(
    worksheet: Worksheet,
    dataMap: Map<string, Map<string, Map<string, number>>>,
    columnStructure: Map<string, string[]>,
    allQuotas: string[],
    totalColIndex: number,
  ) {
    let currentRowIdx = 3;

    for (const [zoneId, zoneData] of dataMap.entries()) {
      const row = worksheet.getRow(currentRowIdx);

      const cellZone = row.getCell(1);
      cellZone.value = zoneId;
      this.styleDataCell(cellZone);

      let colIdx = 2;
      let rowGrandTotal = 0;

      // ตัวแปรเก็บผลรวมแยกตาม Quota สำหรับแถวนี้ (Horizontal Sum)
      const rowQuotaSums = new Map<string, number>();

      // 1. Loop Location columns (เรียงตาม columnStructure ที่ analyze มาจาก data ต้นฉบับ)
      for (const [location, quotas] of columnStructure.entries()) {
        const locData = zoneData.get(location);
        for (const quota of quotas) {
          let val = 0;
          if (locData && locData.has(quota)) {
            val = locData.get(quota);
          }

          const cell = row.getCell(colIdx);
          cell.value = val;
          this.styleDataCell(cell);

          rowGrandTotal += val;

          const currentQuotaSum = rowQuotaSums.get(quota) || 0;
          rowQuotaSums.set(quota, currentQuotaSum + val);

          colIdx++;
        }
      }

      // 2. Loop Fill Total Columns (เรียงตาม allQuotas ที่ได้จาก data ต้นฉบับ)
      for (const quota of allQuotas) {
        const sumVal = rowQuotaSums.get(quota) || 0;

        const cell = row.getCell(colIdx);
        cell.value = sumVal;
        this.styleDataCell(cell);
        cell.font = { size: 11, bold: true, color: { argb: this.COLORS.TEXT_BLACK } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: this.COLORS.BG_BLUE_50 },
        };

        colIdx++;
      }

      // 3. Fill Grand Total
      const cellTotal = row.getCell(totalColIndex);
      cellTotal.value = rowGrandTotal;
      this.styleDataCell(cellTotal);
      cellTotal.font = { size: 11, bold: true, color: { argb: this.COLORS.TEXT_BLACK } };
      cellTotal.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.COLORS.BG_BLUE_200 },
      };

      currentRowIdx++;
    }
  }

  private drawFooter(
    worksheet: Worksheet,
    dataMap: Map<string, Map<string, Map<string, number>>>,
    columnStructure: Map<string, string[]>,
    allQuotas: string[],
    totalColIndex: number,
    language?: Language,
  ) {
    // คำนวณ Stats (ต้องรองรับ column ใหม่ด้วย)
    const stats = this.calculateFooterStats(dataMap, columnStructure, allQuotas);

    const translationTotal = {
      EN: 'Total',
      TH: 'รวม',
      KM: 'សរុបទាំងមូល',
    };

    const summaryRows = [
      {
        label: translationTotal[`${language?.toUpperCase()}`] || translationTotal['EN'],
        type: 'TOTAL',
        isPercent: false,
        fill: this.COLORS.BG_BLUE_200,
        bold: true,
      },
      {
        label: 'กทม.',
        type: 'BKK',
        isPercent: false,
        fill: this.COLORS.BG_GREEN,
        bold: false,
      },
      {
        label: '%กทม.',
        type: 'BKK',
        isPercent: true,
        fill: this.COLORS.BG_YELLOW,
        color: this.COLORS.TEXT_GRAY_500,
      },
      {
        label: 'มณฑล',
        type: 'REGIONAL',
        isPercent: false,
        fill: this.COLORS.BG_GREEN,
        bold: false,
      },
      {
        label: '%มณฑล',
        type: 'REGIONAL',
        isPercent: true,
        fill: this.COLORS.BG_YELLOW,
        color: this.COLORS.TEXT_GRAY_500,
      },
    ];

    let currentRowIdx = worksheet.lastRow.number + 1;

    for (const config of summaryRows) {
      const row = worksheet.getRow(currentRowIdx);

      const labelCell = row.getCell(1);
      labelCell.value = config.label;
      this.styleFooterCell(labelCell, config);
      labelCell.alignment = { vertical: 'middle', horizontal: 'right' };

      let colIdx = 2;

      // 1. Footer for Locations
      for (const [location, quotas] of columnStructure.entries()) {
        for (const quota of quotas) {
          const cell = row.getCell(colIdx);
          const key = `${location}|${quota}`; // Key ปกติ

          const value = this.getFooterValue(stats, config.type, key);
          const totalValue = this.getFooterValue(stats, 'TOTAL', key);

          cell.value = config.isPercent ? this.getPercent(value, totalValue) : value;
          this.styleFooterCell(cell, config);
          colIdx++;
        }
      }

      // 2. ✅ Footer for New Total Columns (By Quota)
      for (const quota of allQuotas) {
        const cell = row.getCell(colIdx);
        // ใช้ Key พิเศษ "SUMMARY|QuotaName"
        const key = `SUMMARY|${quota}`;

        const value = this.getFooterValue(stats, config.type, key);
        const totalValue = this.getFooterValue(stats, 'TOTAL', key);

        cell.value = config.isPercent ? this.getPercent(value, totalValue) : value;
        this.styleFooterCell(cell, config);
        cell.font = Object.assign({}, cell.font, { bold: true }); // ตัวหนา

        colIdx++;
      }

      // 3. Footer for Grand Total
      const totalCell = row.getCell(totalColIndex);
      const grandTotalVal = this.getGrandTotalValue(stats, config.type);
      const grandTotalBase = this.getGrandTotalValue(stats, 'TOTAL');

      totalCell.value = config.isPercent
        ? this.getPercent(grandTotalVal, grandTotalBase)
        : grandTotalVal;
      this.styleFooterCell(totalCell, config);

      currentRowIdx++;
    }
  }

  private calculateFooterStats(
    dataMap: Map<string, Map<string, Map<string, number>>>,
    columnStructure: Map<string, string[]>,
    allQuotas: string[],
  ) {
    const initStat = () => ({
      cols: new Map<string, number>(),
      grand: 0,
    });

    const stats = {
      TOTAL: initStat(),
      BKK: initStat(),
      REGIONAL: initStat(),
    };

    dataMap.forEach((locMap, zoneCode) => {
      const isBkkZone = this.isBKK(zoneCode);
      const targetGroup = isBkkZone ? 'BKK' : 'REGIONAL';

      let zoneTotal = 0;

      locMap.forEach((quotaMap, loc) => {
        quotaMap.forEach((val, quota) => {
          // 1. สะสมยอด Location|Quota ปกติ
          const key = `${loc}|${quota}`;
          this.addToMap(stats[targetGroup].cols, key, val);
          this.addToMap(stats.TOTAL.cols, key, val);

          // 2. ✅ สะสมยอดสำหรับ Column Total ใหม่ (Key: SUMMARY|Quota)
          const summaryKey = `SUMMARY|${quota}`;
          this.addToMap(stats[targetGroup].cols, summaryKey, val);
          this.addToMap(stats.TOTAL.cols, summaryKey, val);

          zoneTotal += val;
        });
      });

      stats[targetGroup].grand += zoneTotal;
      stats.TOTAL.grand += zoneTotal;
    });

    return stats;
  }

  private isBKK(zoneName: string): boolean {
    const bkkZones = ['BE', 'BG', 'BN', 'BS', 'BW'];
    return bkkZones.includes(zoneName);
  }

  private getPercent(value: number, total: number) {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  private addToMap(map: Map<string, number>, key: string, value: number) {
    const current = map.get(key) || 0;
    map.set(key, current + value);
  }

  private getFooterValue(stats: any, type: string, key: string): number {
    return stats[type].cols.get(key) || 0;
  }

  private getGrandTotalValue(stats: any, type: string): number {
    return stats[type].grand || 0;
  }

  private styleHeaderCell(cell: Cell) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDAF1F8' },
    };
    cell.font = { bold: true, name: 'Sarabun', size: 12 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  }

  private styleDataCell(cell: Cell) {
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    cell.numFmt = '#,##0';
  }

  private styleFooterCell(cell: Cell, config: any) {
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    if (config.fill) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: config.fill },
      };
    }

    cell.font = {
      name: 'Sarabun',
      size: 11,
      bold: true,
      color: { argb: this.COLORS.TEXT_BLACK },
    };

    cell.numFmt = '#,##0';
  }
}
