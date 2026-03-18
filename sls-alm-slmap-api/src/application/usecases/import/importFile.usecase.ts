import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { ImportRepositoryPort, RowData } from '../../ports/import.repository';
import { ImportConfig, ImportField, ImportResult } from '../../../domain/importConfig';
import * as ExcelJS from 'exceljs';
import { PassThrough } from 'stream';

interface ParsedData {
  workbook: ExcelJS.Workbook;
  jsonData: RowData[];
}

@Injectable()
export class ImportFileUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
    @Inject('ImportRepository')
    private readonly importRepository: ImportRepositoryPort,
  ) {}

  static validateFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv', // csv
      'application/pdf', // pdf
      'image/png', // png
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: Excel (.xlsx, .xls) or CSV (.csv)`,
      );
    }

    if (file.size === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }
  }

  async execute(importId: string, file: Express.Multer.File): Promise<ImportResult> {
    const importConfig = await this.getAndValidateConfig(importId);
    this.validateFileType(file, importConfig);
    const { jsonData } = await this.parseExcelFile(file, importConfig);
    const fields = await this.getAndValidateFields(importId);
    const transformedData = this.transformAndValidateData(jsonData, fields);
    const result = await this.importRepository.importData(
      importConfig.importTable,
      importConfig.importQuery,
      transformedData,
      importConfig,
    );

    return this.createSuccessResult(
      transformedData.length,
      importConfig.importTable,
      importConfig.importType,
      result,
    );
  }

  private async getAndValidateConfig(importId: string): Promise<ImportConfig> {
    const importConfigs = await this.masterRepository.getImportConfigById(importId);
    if (!importConfigs?.length) {
      throw new BadRequestException(`Import configuration not found for ID: ${importId}`);
    }
    return importConfigs[0];
  }

  private validateFileType(file: Express.Multer.File, config: ImportConfig): void {
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension) {
      throw new BadRequestException('File has no extension');
    }

    const allowedExtensions = config.fileExtension
      .toLowerCase()
      .split(',')
      .map((ext) => ext.trim());
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file type '${fileExtension}'. Expected: ${config.fileExtension}`,
      );
    }
  }

  private async parseExcelFile(
    file: Express.Multer.File,
    config: ImportConfig,
  ): Promise<ParsedData> {
    try {
      const workbook = new ExcelJS.Workbook();
      const bufferStream = new PassThrough();
      bufferStream.end(file.buffer);
      await workbook.xlsx.read(bufferStream);

      if (!workbook.worksheets.length) {
        throw new BadRequestException('Excel file contains no sheets');
      }

      const worksheet = workbook.worksheets[0];
      const startRow = config.startRow > 0 ? config.startRow : 1;
      const jsonData: RowData[] = [];

      // Get headers from the first row (or startRow)
      const headerRow = worksheet.getRow(startRow);
      const headers: string[] = [];
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      // Parse data rows starting after header
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= startRow) return; // Skip header and rows before startRow

        const rowData: RowData = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] =
              cell.value !== null && cell.value !== undefined ? cell.value : null;
          }
        });

        // Only add row if it has at least one value
        if (Object.keys(rowData).length > 0) {
          jsonData.push(rowData);
        }
      });

      if (!jsonData?.length) {
        throw new BadRequestException('No data found in the uploaded file');
      }

      return { workbook, jsonData };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to parse Excel file: ${errorMessage}`);
    }
  }

  private async getAndValidateFields(importId: string): Promise<ImportField[]> {
    const fields = await this.masterRepository.getImportFields(importId);
    if (!fields?.length) {
      throw new BadRequestException(
        `No field mappings configured for import ID: ${importId}`,
      );
    }
    return fields;
  }

  private transformAndValidateData(
    jsonData: RowData[],
    fields: ImportField[],
  ): RowData[] {
    return jsonData.map((row, index) => {
      try {
        return this.transformRow(row, fields);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new BadRequestException(`Row ${index + 1}: ${errorMessage}`);
      }
    });
  }

  private transformRow(row: RowData, fields: ImportField[]): RowData {
    const mappedRow: RowData = {};
    for (const field of fields) {
      const value = this.processFieldValue(row[field.fieldName], field);
      mappedRow[field.fieldName] = value;
    }
    return mappedRow;
  }

  private processFieldValue(rawValue: unknown, field: ImportField): unknown {
    let value = rawValue;

    // Apply default value if empty
    if (this.isEmptyValue(value) && field.defaultValue) {
      value = field.defaultValue;
    }

    // Validate required fields
    if (field.isRequired === 'Y' && this.isEmptyValue(value)) {
      throw new Error(`Required field '${field.fieldName}' is missing`);
    }

    // Handle date/timestamp fields
    if (!this.isEmptyValue(value) && this.isDateTimeField(field)) {
      value = this.formatDateTime(value);
    }

    // Apply formatting
    if (field.formatField && !this.isEmptyValue(value)) {
      value = this.applyFormat(value, field.formatField);
    }

    return value;
  }

  private isDateTimeField(field: ImportField): boolean {
    const dataType = field.dataType?.toLowerCase();
    const fieldName = field.fieldName?.toLowerCase();
    const whereField = field.whereField?.toLowerCase();
    return (
      dataType === 'timestamp' ||
      dataType === 'datetime' ||
      dataType === 'date' ||
      fieldName?.includes('date') ||
      whereField?.includes('date')
    );
  }

  private formatDateTime(value: unknown): string | null {
    if (this.isEmptyValue(value)) {
      return null;
    }

    const stringValue = String(value).trim();
    // If it's already null or empty, return null
    if (!stringValue || stringValue.toLowerCase() === 'null') {
      return null;
    }

    // Handle incomplete timestamp formats like "2025-09-05 00"
    if (/^\d{4}-\d{2}-\d{2}\s+\d{1,2}$/.test(stringValue)) {
      // Convert "2025-09-05 00" to "2025-09-05 00:00:00"
      return `${stringValue}:00:00`;
    }

    // Handle date only format "2025-09-05"
    if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
      return stringValue; // PostgreSQL can handle date format
    }

    // Handle other common formats
    try {
      const date = new Date(stringValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 19); // "YYYY-MM-DD HH:mm:ss"
      }
    } catch (error) {
      console.error(`Failed to format date time: ${error.message}`);
    }

    return stringValue;
  }

  private isEmptyValue(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

  private createSuccessResult(
    recordCount: number,
    tableName: string,
    importType: string,
    result: unknown,
  ): ImportResult {
    return {
      success: true,
      recordsProcessed: recordCount,
      importTable: tableName,
      importType,
      result,
    };
  }

  private applyFormat(value: unknown, formatField: string): unknown {
    if (!formatField) return value;

    const format = formatField.toUpperCase();

    try {
      switch (format) {
        case 'UPPER':
          return String(value).toUpperCase();
        case 'LOWER':
          return String(value).toLowerCase();
        case 'TRIM':
          return String(value).trim();
        case 'NUMBER':
          return Number(value);
        case 'BOOLEAN':
          return Boolean(value);
        default:
          return value;
      }
    } catch (error) {
      console.error(`Failed to apply format: ${error.message}`);
      return value;
    }
  }
}
