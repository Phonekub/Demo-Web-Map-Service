import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Workbook, Cell } from 'exceljs';
import { PassThrough, Stream } from 'stream';
import { ExcelExportGatewayPort } from '../../../application/ports/exportReportGateway.repository';

@Injectable()
export class ExcelExportGateway implements ExcelExportGatewayPort {
  private readonly COLORS = {
    HEADER_BG: 'FFDAF1F8',
    BORDER: 'FFD1D5DB',
    TEXT_BLACK: 'FF000000',
  };

  async generateDynamicReport(
    headers: string[],
    data: any[],
    sheetName = 'Report',
  ): Promise<Stream> {
    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // 1. วาด Header
      const headerRow = worksheet.getRow(1);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        this.styleHeaderCell(cell);

        // ตั้งความกว้างคอลัมน์อัตโนมัติเบื้องต้น
        worksheet.getColumn(index + 1).width =
          header.length < 15 ? 15 : header.length + 5;
      });

      // 2. วาด Data Rows
      data.forEach((rowData, rowIndex) => {
        const row = worksheet.getRow(rowIndex + 2);

        // เนื่องจาก data เป็น Array ของ Object ที่ key คือชื่อ Header
        headers.forEach((header, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          const value = rowData[header];

          cell.value = value ?? ''; // ถ้าเป็น null ให้เป็นค่าว่าง
          this.styleDataCell(cell);
        });
      });

      // 3. จัดการ Stream
      const stream = new PassThrough();
      workbook.xlsx
        .write(stream)
        .then(() => stream.end())
        .catch((err) => {
          stream.emit('error', err);
        });

      return stream;
    } catch (error) {
      console.error('Dynamic Excel Export Error:', error);
      throw new InternalServerErrorException('Failed to generate Excel file');
    }
  }

  // ==========================================
  //  Private Helpers (Styling)
  // ==========================================

  private styleHeaderCell(cell: Cell) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.COLORS.HEADER_BG },
    };
    cell.font = { bold: true, name: 'Sarabun', size: 12 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = this.getThinBorder();
  }

  private styleDataCell(cell: Cell) {
    cell.font = { name: 'Sarabun', size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = this.getThinBorder();

    if (typeof cell.value === 'number') {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.numFmt = '#,##0.00';
    }

    if (cell.value instanceof Date) {
      cell.numFmt = 'DD/MM/YYYY HH:mm:ss';
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  private getThinBorder() {
    return {
      top: { style: 'thin' as any },
      left: { style: 'thin' as any },
      bottom: { style: 'thin' as any },
      right: { style: 'thin' as any },
    };
  }
}
