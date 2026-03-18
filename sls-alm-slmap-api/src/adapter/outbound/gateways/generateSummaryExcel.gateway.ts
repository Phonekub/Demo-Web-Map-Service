import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Workbook, Worksheet, Cell } from 'exceljs';
import { PassThrough, Stream } from 'stream';
import { ExcelSummaryExportGatewayPort } from '../../../application/ports/generateSummaryExcel.repository';
import { QuotaSummaryReportResponse } from '../../../domain/quotaSummaryReport';
import { Language } from '../../../common/enums/language.enum';

@Injectable()
export class GenerateSummaryExcelGateway implements ExcelSummaryExportGatewayPort {
  private readonly MONTH_KEYS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];

  private readonly COLORS = {
    BG_HEADER: 'FFDAF1F8',
    BG_TOTAL: 'FFDBEAFE',
    BG_GREEN: 'FFD1FAE5',
    BG_YELLOW: 'FFFEF9C3',
    BG_ZONE: 'FFF3F4F6',
    TEXT_BLACK: 'FF000000',
  };

  private getMonthLabels(language?: Language): string[] {
    const map = {
      EN: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      TH: [
        'ม.ค.',
        'ก.พ.',
        'มี.ค.',
        'เม.ย.',
        'พ.ค.',
        'มิ.ย.',
        'ก.ค.',
        'ส.ค.',
        'ก.ย.',
        'ต.ค.',
        'พ.ย.',
        'ธ.ค.',
      ],
      KM: [
        'មករា',
        'កុម្ភៈ',
        'មីនា',
        'មេសា',
        'ឧសភា',
        'មិថុនា',
        'កក្កដា',
        'សីហា',
        'កញ្ញា',
        'តុលា',
        'វិច្ឆិកា',
        'ធ្នូ',
      ],
    };

    const key = language?.toUpperCase?.() ?? 'EN';
    return map[key] ?? map.EN;
  }

  private getTotalLabel(language?: Language): string {
    const map = {
      EN: 'Total',
      TH: 'รวม',
      KM: 'សរុប',
    };

    const key = language?.toUpperCase?.() ?? 'EN';
    return map[key] ?? map.EN;
  }

  private getFooterLabels(language?: Language) {
    const map = {
      EN: {
        TOTAL: 'Total',
        BKK: 'Bangkok',
        BKK_PERCENT: '%Bangkok',
        REGIONAL: 'Upcountry',
        REGIONAL_PERCENT: '%Upcountry',
      },
      TH: {
        TOTAL: 'รวม',
        BKK: 'กทม.',
        BKK_PERCENT: '%กทม.',
        REGIONAL: 'มณฑล',
        REGIONAL_PERCENT: '%มณฑล',
      },
      KM: {
        TOTAL: 'សរុប',
        BKK: 'បាងកក',
        BKK_PERCENT: '%បាងកក',
        REGIONAL: 'ខេត្ត',
        REGIONAL_PERCENT: '%ខេត្ត',
      },
    };

    const key = language?.toUpperCase?.() ?? 'EN';
    return map[key] ?? map.EN;
  }

  async generateSummaryReport(
    data: QuotaSummaryReportResponse[],
    zoneRegionMap?: Map<string, string>,
    language?: Language,
  ): Promise<Stream> {
    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Summary Report');

      const totalColIndex = this.drawHeader(worksheet, language);
      this.drawDataRows(worksheet, data, totalColIndex);

      const stats = this.calculateFooterStats(data, zoneRegionMap);
      this.drawFooter(worksheet, stats, totalColIndex, language);

      const stream = new PassThrough();
      await workbook.xlsx.write(stream);
      stream.end();

      return stream;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to generate summary excel');
    }
  }

  // =========================
  // HEADER
  // =========================

  private drawHeader(ws: Worksheet, language?: Language): number {
    const row = ws.getRow(1);

    row.getCell(1).value = 'Zone';
    this.styleHeaderCell(row.getCell(1));
    ws.getColumn(1).width = 12;

    let col = 2;

    const monthLabels = this.getMonthLabels(language);

    monthLabels.forEach((label) => {
      const cell = row.getCell(col);
      cell.value = label;
      this.styleHeaderCell(cell);
      ws.getColumn(col).width = 12;
      col++;
    });

    const totalCell = row.getCell(col);
    totalCell.value = this.getTotalLabel(language);
    this.styleHeaderCell(totalCell);
    ws.getColumn(col).width = 15;

    return col;
  }

  // =========================
  // DATA ROWS
  // =========================

  private drawDataRows(
    ws: Worksheet,
    data: QuotaSummaryReportResponse[],
    totalColIndex: number,
  ) {
    let rowIndex = 2;

    data.forEach((item) => {
      const row = ws.getRow(rowIndex);

      const zoneCell = row.getCell(1);
      zoneCell.value = item.zoneCode;
      zoneCell.alignment = { vertical: 'middle', horizontal: 'center' };
      zoneCell.border = this.getBorder();
      zoneCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.COLORS.BG_ZONE },
      };
      zoneCell.font = { name: 'Sarabun' };

      let col = 2;

      this.MONTH_KEYS.forEach((key) => {
        const val = item.months?.[key] ?? 0;
        row.getCell(col).value = val;
        this.styleDataCell(row.getCell(col));
        col++;
      });

      const totalCell = row.getCell(totalColIndex);
      totalCell.value = item.total ?? 0;

      totalCell.alignment = { vertical: 'middle', horizontal: 'center' };
      totalCell.border = this.getBorder();
      totalCell.font = {
        name: 'Sarabun',
        color: { argb: this.COLORS.TEXT_BLACK },
      };
      totalCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.COLORS.BG_TOTAL },
      };
      totalCell.numFmt = '#,##0';

      rowIndex++;
    });
  }

  // =========================
  // FOOTER
  // =========================

  private calculateFooterStats(
    data: QuotaSummaryReportResponse[],
    zoneRegionMap?: Map<string, string>,
  ) {
    const init = () => ({
      months: Array(12).fill(0),
      total: 0,
    });

    const stats = {
      TOTAL: init(),
      BKK: init(),
      REGIONAL: init(),
    };

    data.forEach((item) => {
      const region = zoneRegionMap?.get(item.zoneCode);

      const target = region === 'BANGKOK' ? stats.BKK : stats.REGIONAL;

      this.MONTH_KEYS.forEach((key, i) => {
        const val = item.months?.[key] ?? 0;
        stats.TOTAL.months[i] += val;
        target.months[i] += val;
      });

      stats.TOTAL.total += item.total ?? 0;
      target.total += item.total ?? 0;
    });

    return stats;
  }

  private drawFooter(
    ws: Worksheet,
    stats: any,
    totalColIndex: number,
    language?: Language,
  ) {
    const labels = this.getFooterLabels(language);

    const rows = [
      { label: labels.TOTAL, key: 'TOTAL', percent: false, fill: this.COLORS.BG_TOTAL },
      { label: labels.BKK, key: 'BKK', percent: false, fill: this.COLORS.BG_GREEN },
      {
        label: labels.BKK_PERCENT,
        key: 'BKK',
        percent: true,
        fill: this.COLORS.BG_YELLOW,
      },
      {
        label: labels.REGIONAL,
        key: 'REGIONAL',
        percent: false,
        fill: this.COLORS.BG_GREEN,
      },
      {
        label: labels.REGIONAL_PERCENT,
        key: 'REGIONAL',
        percent: true,
        fill: this.COLORS.BG_YELLOW,
      },
    ];

    let rowIndex = ws.lastRow.number + 1;

    rows.forEach((cfg) => {
      const row = ws.getRow(rowIndex);

      let col = 1;

      for (let c = 1; c <= totalColIndex; c++) {
        const cell = row.getCell(c);

        if (c === 1) {
          cell.value = cfg.label;
        } else if (c <= 13) {
          const monthIndex = c - 2;
          const val = stats[cfg.key].months[monthIndex];
          const base = stats.TOTAL.months[monthIndex];

          cell.value = cfg.percent ? (base ? Math.round((val / base) * 100) : 0) : val;
        } else {
          const totalVal = stats[cfg.key].total;
          const totalBase = stats.TOTAL.total;

          cell.value = cfg.percent
            ? totalBase
              ? Math.round((totalVal / totalBase) * 100)
              : 0
            : totalVal;
        }

        cell.font = {
          bold: true,
          name: 'Sarabun',
          size: 11,
          color: { argb: this.COLORS.TEXT_BLACK },
        };

        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = this.getBorder();
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: cfg.fill },
        };
        cell.numFmt = '#,##0';

        col++;
      }

      rowIndex++;
    });
  }

  // =========================
  // HELPERS
  // =========================

  private styleHeaderCell(cell: Cell) {
    cell.font = { bold: true, name: 'Sarabun', size: 12 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = this.getBorder();
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.COLORS.BG_HEADER },
    };
  }

  private styleDataCell(cell: Cell) {
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = this.getBorder();
    cell.numFmt = '#,##0';
  }

  private getBorder() {
    const style = 'thin' as const;

    return {
      top: { style },
      left: { style },
      bottom: { style },
      right: { style },
    };
  }
}
