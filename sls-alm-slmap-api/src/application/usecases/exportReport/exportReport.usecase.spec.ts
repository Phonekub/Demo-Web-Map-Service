import { Test, TestingModule } from '@nestjs/testing';
import { ExportReportUseCase } from './exportReport.usecase';
import { Language } from '../../../common/enums/language.enum';

describe('ExportReportUseCase', () => {
  let useCase: ExportReportUseCase;

  const masterRepositoryMock = {
    getReportFields: jest.fn(),
    getReportConfig: jest.fn(),
    executeDynamicQuery: jest.fn(),
  };

  const excelExportGatewayMock = {
    generateDynamicReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportReportUseCase,
        {
          provide: 'MasterRepository',
          useValue: masterRepositoryMock,
        },
        {
          provide: 'ExcelDynamicExportGatewayPort',
          useValue: excelExportGatewayMock,
        },
      ],
    }).compile();

    useCase = module.get(ExportReportUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw when report fields not found', async () => {
    masterRepositoryMock.getReportFields.mockResolvedValueOnce([]);

    await expect(useCase.handler(1, Language.TH)).rejects.toThrow(
      'Report configuration fields not found',
    );

    expect(masterRepositoryMock.getReportFields).toHaveBeenCalledWith(1);
    expect(masterRepositoryMock.getReportConfig).not.toHaveBeenCalled();
    expect(masterRepositoryMock.executeDynamicQuery).not.toHaveBeenCalled();
    expect(excelExportGatewayMock.generateDynamicReport).not.toHaveBeenCalled();
  });

  it('should throw when report config not found', async () => {
    masterRepositoryMock.getReportFields.mockResolvedValueOnce([
      { fieldName: 'A', displayName: 'A' },
    ]);
    masterRepositoryMock.getReportConfig.mockResolvedValueOnce(null);

    await expect(useCase.handler(1, Language.TH)).rejects.toThrow(
      'Report query configuration not found',
    );

    expect(masterRepositoryMock.getReportFields).toHaveBeenCalledWith(1);
    expect(masterRepositoryMock.getReportConfig).toHaveBeenCalledWith(1);
    expect(masterRepositoryMock.executeDynamicQuery).not.toHaveBeenCalled();
    expect(excelExportGatewayMock.generateDynamicReport).not.toHaveBeenCalled();
  });

  it('should throw when reportQuery not found in config', async () => {
    masterRepositoryMock.getReportFields.mockResolvedValueOnce([
      { fieldName: 'A', displayName: 'A' },
    ]);
    masterRepositoryMock.getReportConfig.mockResolvedValueOnce({
      reportQuery: '',
      reportFileName: 'x',
    });

    await expect(useCase.handler(1, Language.TH)).rejects.toThrow(
      'Report query configuration not found',
    );

    expect(masterRepositoryMock.executeDynamicQuery).not.toHaveBeenCalled();
    expect(excelExportGatewayMock.generateDynamicReport).not.toHaveBeenCalled();
  });

  it('should execute dynamic query with dbName=allmap and map rows by field display names (default language)', async () => {
    masterRepositoryMock.getReportFields.mockResolvedValueOnce([
      {
        fieldName: 'BRANCH_CODE',
        displayName: 'Branch Code',
        displayNameTh: 'รหัสสาขา',
        displayNameEn: 'Branch Code EN',
        displayNameKh: 'Branch Code KH',
      },
      {
        fieldName: 'branchName',
        displayName: 'Branch Name',
        displayNameTh: 'ชื่อสาขา',
      },
    ]);

    masterRepositoryMock.getReportConfig.mockResolvedValueOnce({
      reportQuery: 'select ...',
      reportFileName: 'my-report',
    });

    // ensure mapping supports exact key + lowercase key
    masterRepositoryMock.executeDynamicQuery.mockResolvedValueOnce([
      { BRANCH_CODE: 'B001', branchname: 'Seven One' },
      { branch_code: 'B002', branchName: 'Seven Two' },
      { BRANCH_CODE: null, branchName: undefined },
    ]);

    excelExportGatewayMock.generateDynamicReport.mockResolvedValueOnce('excel-stream');

    const result = await useCase.handler(99);

    expect(masterRepositoryMock.getReportFields).toHaveBeenCalledWith(99);
    expect(masterRepositoryMock.getReportConfig).toHaveBeenCalledWith(99);
    expect(masterRepositoryMock.executeDynamicQuery).toHaveBeenCalledWith(
      'select ...',
      'allmap',
    );

    // default language uses displayName
    expect(excelExportGatewayMock.generateDynamicReport).toHaveBeenCalledWith(
      ['Branch Code', 'Branch Name'],
      [
        { 'Branch Code': 'B001', 'Branch Name': 'Seven One' },
        { 'Branch Code': 'B002', 'Branch Name': 'Seven Two' },
        { 'Branch Code': '', 'Branch Name': '' },
      ],
      'my-report',
    );

    expect(result).toEqual({
      excelStream: 'excel-stream',
      fileName: 'my-report',
    });
  });

  it('should use language-specific display names (TH/EN/KM) with fallback to displayName', async () => {
    const fields = [
      {
        fieldName: 'name',
        displayName: 'Name (default)',
        displayNameTh: 'ชื่อ (TH)',
        displayNameEn: 'Name (EN)',
        displayNameKh: 'ឈ្មោះ (KM)',
      },
      {
        fieldName: 'code',
        displayName: 'Code (default)',
        displayNameTh: '',
        displayNameEn: undefined,
        displayNameKh: null,
      },
    ];

    // Provide enough mock resolutions for 3 handler calls
    masterRepositoryMock.getReportFields.mockResolvedValue(fields);
    masterRepositoryMock.getReportConfig.mockResolvedValue({
      reportQuery: 'select ...',
      reportFileName: null,
    });
    masterRepositoryMock.executeDynamicQuery.mockResolvedValue([
      { name: 'A', code: 'C1' },
    ]);
    excelExportGatewayMock.generateDynamicReport.mockResolvedValue('stream');

    await useCase.handler(1, Language.TH);
    expect(excelExportGatewayMock.generateDynamicReport).toHaveBeenLastCalledWith(
      ['ชื่อ (TH)', 'Code (default)'],
      [{ 'ชื่อ (TH)': 'A', 'Code (default)': 'C1' }],
      'report',
    );

    await useCase.handler(1, Language.EN);
    expect(excelExportGatewayMock.generateDynamicReport).toHaveBeenLastCalledWith(
      ['Name (EN)', 'Code (default)'],
      [{ 'Name (EN)': 'A', 'Code (default)': 'C1' }],
      'report',
    );

    await useCase.handler(1, Language.KM);
    expect(excelExportGatewayMock.generateDynamicReport).toHaveBeenLastCalledWith(
      ['ឈ្មោះ (KM)', 'Code (default)'],
      [{ 'ឈ្មោះ (KM)': 'A', 'Code (default)': 'C1' }],
      'report',
    );
  });

  it('should default fileName to "report" when config.reportFileName is empty', async () => {
    masterRepositoryMock.getReportFields.mockResolvedValueOnce([
      { fieldName: 'x', displayName: 'X' },
    ]);
    masterRepositoryMock.getReportConfig.mockResolvedValueOnce({
      reportQuery: 'select 1',
      reportFileName: '',
    });
    masterRepositoryMock.executeDynamicQuery.mockResolvedValueOnce([{ x: '1' }]);
    excelExportGatewayMock.generateDynamicReport.mockResolvedValueOnce('stream');

    const result = await useCase.handler(5, Language.EN);

    expect(excelExportGatewayMock.generateDynamicReport).toHaveBeenCalledWith(
      ['X'],
      [{ X: '1' }],
      'report',
    );
    expect(result).toEqual({ excelStream: 'stream', fileName: 'report' });
  });
});
