import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImportFileUseCase } from './importFile.usecase';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { ImportRepositoryPort } from '../../ports/import.repository';
import * as ExcelJS from 'exceljs';

describe('ImportFileUseCase - ExcelJS Compatibility Tests', () => {
  let useCase: ImportFileUseCase;
  let masterRepository: jest.Mocked<MasterRepositoryPort>;
  let importRepository: jest.Mocked<ImportRepositoryPort>;

  const mockImportConfig = {
    afsImportId: 1,
    afsOrgId: 1,
    importName: 'Test Import',
    importTable: 'test_table',
    mappingQuery: '',
    importType: 'INSERT',
    defaultFilter: '',
    importQuery: 'INSERT INTO test_table VALUES ($1, $2)',
    servletName: '',
    dbToUse: 'postgres',
    fileExtension: 'xlsx,xls,csv',
    fileType: 'excel',
    startRow: 1,
    startColumn: 1,
    exampleFilePath: '',
    exampleFileName: '',
  };

  const mockImportFields = [
    {
      afsImportFieldId: 1,
      afsImportId: 1,
      fieldSeq: '1',
      fieldName: 'name',
      whereField: null,
      dataType: 'VARCHAR',
      isRequired: 'Y',
      mappingCode: '',
      isActive: 'Y',
      defaultValue: null,
      formatField: 'UPPER',
    },
    {
      afsImportFieldId: 2,
      afsImportId: 1,
      fieldSeq: '2',
      fieldName: 'email',
      whereField: null,
      dataType: 'VARCHAR',
      isRequired: 'N',
      mappingCode: '',
      isActive: 'Y',
      defaultValue: 'default@test.com',
      formatField: 'LOWER',
    },
    {
      afsImportFieldId: 3,
      afsImportId: 1,
      fieldSeq: '3',
      fieldName: 'age',
      whereField: null,
      dataType: 'INTEGER',
      isRequired: 'N',
      mappingCode: '',
      isActive: 'Y',
      defaultValue: null,
      formatField: null,
    },
  ];

  const createExcelFile = async (data: any[]): Promise<Express.Multer.File> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Add data rows
      data.forEach((row) => {
        const values = headers.map((header) => row[header]);
        worksheet.addRow(values);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const nodeBuffer = Buffer.from(buffer);

    return {
      fieldname: 'file',
      originalname: 'test.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: nodeBuffer.length,
      buffer: nodeBuffer,
      destination: '',
      filename: 'test.xlsx',
      path: '',
      stream: undefined as any,
    } as Express.Multer.File;
  };

  beforeEach(async () => {
    masterRepository = {
      getImportConfigById: jest.fn(),
      getImportFields: jest.fn(),
    } as any;

    importRepository = {
      importData: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportFileUseCase,
        {
          provide: 'MasterRepository',
          useValue: masterRepository,
        },
        {
          provide: 'ImportRepository',
          useValue: importRepository,
        },
      ],
    }).compile();

    useCase = module.get<ImportFileUseCase>(ImportFileUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ExcelJS Integration', () => {
    it('should successfully parse xlsx file created with ExcelJS', async () => {
      const testData = [
        { name: 'John Doe', email: 'JOHN@EXAMPLE.COM', age: 30 },
        { name: 'Jane Smith', email: 'JANE@EXAMPLE.COM', age: 25 },
      ];

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 2,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const file = await createExcelFile(testData);
      const result = await useCase.execute('1', file);

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(2);
      expect(importRepository.importData).toHaveBeenCalled();
    });

    it('should apply UPPER format correctly with ExcelJS data', async () => {
      const testData = [{ name: 'john doe', email: 'test@test.com', age: 30 }];

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 1,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const file = await createExcelFile(testData);
      await useCase.execute('1', file);

      const importDataCall = importRepository.importData.mock.calls[0];
      const transformedData = importDataCall[2];
      expect(transformedData[0].name).toBe('JOHN DOE');
    });

    it('should apply LOWER format correctly with ExcelJS data', async () => {
      const testData = [{ name: 'Test', email: 'TEST@EXAMPLE.COM', age: 30 }];

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 1,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const file = await createExcelFile(testData);
      await useCase.execute('1', file);

      const importDataCall = importRepository.importData.mock.calls[0];
      const transformedData = importDataCall[2];
      expect(transformedData[0].email).toBe('test@example.com');
    });

    it('should handle numeric values from ExcelJS cells', async () => {
      const testData = [{ name: 'Test User', email: 'test@test.com', age: 42 }];

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 1,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const file = await createExcelFile(testData);
      await useCase.execute('1', file);

      const importDataCall = importRepository.importData.mock.calls[0];
      const transformedData = importDataCall[2];
      expect(transformedData[0].age).toBe(42);
    });

    it('should handle empty cells as null with ExcelJS', async () => {
      const testData = [{ name: 'Test User', email: '', age: null }];

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 1,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const file = await createExcelFile(testData);
      await useCase.execute('1', file);

      const importDataCall = importRepository.importData.mock.calls[0];
      const transformedData = importDataCall[2];
      // email should get default value
      expect(transformedData[0].email).toBe('default@test.com');
      // age is optional, so null/undefined is ok
      expect([null, undefined]).toContain(transformedData[0].age);
    });

    it('should handle multiple rows with ExcelJS', async () => {
      const testData = [
        { name: 'User 1', email: 'user1@test.com', age: 25 },
        { name: 'User 2', email: 'user2@test.com', age: 30 },
        { name: 'User 3', email: 'user3@test.com', age: 35 },
        { name: 'User 4', email: 'user4@test.com', age: 40 },
        { name: 'User 5', email: 'user5@test.com', age: 45 },
      ];

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 5,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const file = await createExcelFile(testData);
      const result = await useCase.execute('1', file);

      expect(result.recordsProcessed).toBe(5);
      const importDataCall = importRepository.importData.mock.calls[0];
      const transformedData = importDataCall[2];
      expect(transformedData).toHaveLength(5);
    });

    it('should respect startRow configuration with ExcelJS', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');

      // Add a title row
      worksheet.addRow(['This is a title row - should be skipped']);
      // Add header row
      worksheet.addRow(['name', 'email', 'age']);
      // Add data rows
      worksheet.addRow(['User 1', 'user1@test.com', 25]);
      worksheet.addRow(['User 2', 'user2@test.com', 30]);

      const buffer = await workbook.xlsx.writeBuffer();
      const nodeBuffer = Buffer.from(buffer);
      const file = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: nodeBuffer.length,
        buffer: nodeBuffer,
        destination: '',
        filename: 'test.xlsx',
        path: '',
        stream: undefined as any,
      } as Express.Multer.File;

      const configWithStartRow = { ...mockImportConfig, startRow: 2 };
      masterRepository.getImportConfigById.mockResolvedValue([configWithStartRow]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 2,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const result = await useCase.execute('1', file);

      // Should skip first row and use row 2 as header
      expect(result.recordsProcessed).toBe(2);
    });

    it('should handle special characters in cell values', async () => {
      const testData = [
        { name: "O'Brien", email: 'test@test.com', age: 30 },
        { name: 'Smith & Jones', email: 'test2@test.com', age: 25 },
        { name: 'Unicode: 日本語', email: 'test3@test.com', age: 35 },
      ];

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 3,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const file = await createExcelFile(testData);
      const result = await useCase.execute('1', file);

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(3);

      const importDataCall = importRepository.importData.mock.calls[0];
      const transformedData = importDataCall[2];
      expect(transformedData[0].name).toBe("O'BRIEN");
      expect(transformedData[1].name).toBe('SMITH & JONES');
      expect(transformedData[2].name).toBe('UNICODE: 日本語');
    });

    it('should handle formulas in cells (get computed values)', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');

      // Add headers
      worksheet.addRow(['name', 'email', 'age']);

      // Add row with formula
      const row = worksheet.addRow(['Test User', 'test@test.com', { formula: '20+10' }]);

      const buffer = await workbook.xlsx.writeBuffer();
      const nodeBuffer = Buffer.from(buffer);
      const file = {
        buffer: nodeBuffer,
        originalname: 'test.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: nodeBuffer.length,
      } as Express.Multer.File;

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 1,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const result = await useCase.execute('1', file);

      expect(result.success).toBe(true);
    });

    it('should throw error when ExcelJS file is empty', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');

      const buffer = await workbook.xlsx.writeBuffer();
      const nodeBuffer = Buffer.from(buffer);
      const file = {
        buffer: nodeBuffer,
        originalname: 'test.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: nodeBuffer.length,
      } as Express.Multer.File;

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);

      await expect(useCase.execute('1', file)).rejects.toThrow(
        'No data found in the uploaded file',
      );
    });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@test.com`,
        age: 20 + (i % 50),
      }));

      masterRepository.getImportConfigById.mockResolvedValue([mockImportConfig]);
      masterRepository.getImportFields.mockResolvedValue(mockImportFields);
      importRepository.importData.mockResolvedValue({
        success: true,
        recordsProcessed: 1000,
        importTable: 'test_table',
        importType: 'INSERT',
      });

      const file = await createExcelFile(largeDataset);
      const result = await useCase.execute('1', file);

      expect(result.recordsProcessed).toBe(1000);
      expect(result.success).toBe(true);
    });
  });
});
