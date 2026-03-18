import { QuotaManagementController } from './quotaManagement.controller';
import { GetYearConfigsUseCase } from '../../../application/usecases/quota/getYearConfigs.usecase';
import { GetZoneAnnualTargetsByYearUseCase } from '../../../application/usecases/quota/getZoneAnnualTargetsByYear.usecase';
import { SaveAnnualQuotaUseCase } from '../../../application/usecases/quota/saveAnnualQuota.usecase';
import { ExportAnnualQuotaUseCase } from '../../../application/usecases/quota/exportAnnualQuota.usecase';
import { SearchQuotaAllocationUseCase } from '../../../application/usecases/quota/searchQuotaAllocation.usecase';
import { GetAllocationHistoryUseCase } from '../../../application/usecases/quota/getAllocationHistory.usecase';
import { GetQuotaRoundsUseCase } from '../../../application/usecases/quota/getQuotaRounds.usecase';
import { ApproveSelectedUseCase } from '../../../application/usecases/quota/approveSelected.usecase';
import { RejectSelectedUseCase } from '../../../application/usecases/quota/rejectSelected.usecase';
import { ProcessAllocationActionUseCase } from '../../../application/usecases/quota/processAllocationAction.usecase';
import { GetQuotaAllocationDetailUseCase } from '../../../application/usecases/quota/getQuotaAllocationDetail.usecase';
import { SaveLocationSelectionUseCase } from '../../../application/usecases/quota/saveLocationSelection.usecase';
import { GetItemHistoryUseCase } from '../../../application/usecases/quota/getItemHistory.usecase';
import { YearConfigsResponse } from '../../../domain/quotaConfig';
import { QuotaAnnualTargetsResponse } from '../../../domain/quotaAnnualTarget';
import { HttpException, HttpStatus } from '@nestjs/common';
import {
  DataAccessException,
  QuotaException,
} from '../../../common/exceptions/quota.exception';

import { GetQuotaConfigUseCase } from '../../../application/usecases/quotaRound/getQuotaConfig.usecase';
import { CloseQuotaConfigUseCase } from '../../../application/usecases/quotaRound/closeQuotaConfig.usecase';
import { CreateRoundUseCase } from '../../../application/usecases/quotaRound/createRound.usecase';
import { DeleteRoundUseCase } from '../../../application/usecases/quotaRound/deleteRound.usecase';
import { GetRoundWithAllosUseCase } from '../../../application/usecases/quotaRound/getRoundWithAllos.usecase';
import { SubmitQuotaRoundAllZonesUseCase } from '../../../application/usecases/quotaRound/submitQuotaRoundAllZones.usecase';
import { SubmitReviewRoundsAllZonesUseCase } from '../../../application/usecases/quotaRound/submitReviewRoundAll.usecase';
import { SubmitReviewRoundsByZoneUseCase } from '../../../application/usecases/quotaRound/submitReviewRoundsByZone.usecase';
import { SubmitRoundByZoneUseCase } from '../../../application/usecases/quotaRound/submitRoundByZone.usecase';
import { UpdateRoundUsecase } from '../../../application/usecases/quotaRound/updateRound.usecase';
import { ExportStoreSummaryUseCase } from '../../../application/usecases/quota/exportStoreSummary.usecase';
import { GetSummaryReportUseCase } from '../../../application/usecases/quota/getSummaryReport.usecase';
import { SaveStoreOpeningReportUseCase } from '../../../application/usecases/quota/saveStoreOpeningReport.usecase';
import { GetAllReportOpenPlanUseCase } from '../../../application/usecases/quota/getAllStoreOpenPlan.usecase';
import { GetMailTemplateUseCase } from '../../../application/usecases/quota/getMailTemplate.usecase';
import { GetMailParametersUseCase } from '../../../application/usecases/quota/getMailParameters.usecase';
import { SaveMailTemplateUseCase } from '../../../application/usecases/quota/saveMailTemplate.usecase';
import { CheckLocationHistoryUseCase } from '../../../application/usecases/quota/checkLocationHistory.usecase';
import { SaveImpactSiteReportUseCase } from '../../../application/usecases/quota/saveImpactSiteReport.usecase';
import { GetAllReportImpactSiteUseCase } from '../../../application/usecases/quota/getAllImpactSite.usecase';
import { DeleteReportImpactSiteUseCase } from '../../../application/usecases/quota/deleteImpactSite.usecase';

describe('QuotaManagementController', () => {
  let controller: QuotaManagementController;
  let mockGetYearConfigsUseCase: jest.Mocked<GetYearConfigsUseCase>;
  let mockGetMailTemplateUseCase: jest.Mocked<GetMailTemplateUseCase>;
  let mockGetMailParametersUseCase: jest.Mocked<GetMailParametersUseCase>;
  let mockSaveMailTemplateUseCase: jest.Mocked<SaveMailTemplateUseCase>;
  let mockGetZoneAnnualTargetsByYearUseCase: jest.Mocked<GetZoneAnnualTargetsByYearUseCase>;
  let mockSaveAnnualQuotaUseCase: jest.Mocked<SaveAnnualQuotaUseCase>;
  let mockExportAnnualQuotaUseCase: jest.Mocked<ExportAnnualQuotaUseCase>;
  let mockSearchQuotaAllocationUseCase: jest.Mocked<SearchQuotaAllocationUseCase>;
  let mockGetAllocationHistoryUseCase: jest.Mocked<GetAllocationHistoryUseCase>;
  let mockGetQuotaRoundsUseCase: jest.Mocked<GetQuotaRoundsUseCase>;
  let mockApproveSelectedUseCase: jest.Mocked<ApproveSelectedUseCase>;
  let mockRejectSelectedUseCase: jest.Mocked<RejectSelectedUseCase>;
  let mockProcessAllocationActionUseCase: jest.Mocked<ProcessAllocationActionUseCase>;
  let mockGetQuotaAllocationDetailUseCase: jest.Mocked<GetQuotaAllocationDetailUseCase>;
  let mockSaveLocationSelectionUseCase: jest.Mocked<SaveLocationSelectionUseCase>;
  let mockGetItemHistoryUseCase: jest.Mocked<GetItemHistoryUseCase>;
  let mockGetQuotaConfigUseCase: jest.Mocked<GetQuotaConfigUseCase>;
  let mockCloseQuotaConfigUseCase: jest.Mocked<CloseQuotaConfigUseCase>;
  let mockCreateRoundUseCase: jest.Mocked<CreateRoundUseCase>;
  let mockDeleteRoundUseCase: jest.Mocked<DeleteRoundUseCase>;
  let mockGetRoundWithAllosUseCase: jest.Mocked<GetRoundWithAllosUseCase>;
  let mockSubmitQuotaRoundAllZonesUseCase: jest.Mocked<SubmitQuotaRoundAllZonesUseCase>;
  let mockSubmitReviewRoundsAllZonesUseCase: jest.Mocked<SubmitReviewRoundsAllZonesUseCase>;
  let mockSubmitReviewRoundsByZoneUseCase: jest.Mocked<SubmitReviewRoundsByZoneUseCase>;
  let mockSubmitRoundByZoneUseCase: jest.Mocked<SubmitRoundByZoneUseCase>;
  let mockUpdateRoundUsecase: jest.Mocked<UpdateRoundUsecase>;
  let mockCheckLocationHistoryUseCase: jest.Mocked<CheckLocationHistoryUseCase>;
  let mockExportStoreSummaryUseCase: jest.Mocked<ExportStoreSummaryUseCase>;
  let mockGetSummaryReportUseCase: jest.Mocked<GetSummaryReportUseCase>;
  let mockSaveStoreOpeningReportUseCase: jest.Mocked<SaveStoreOpeningReportUseCase>;
  let mockGetAllReportOpenPlanUseCase: jest.Mocked<GetAllReportOpenPlanUseCase>;
  let mockSaveImpactSiteReportUseCase: jest.Mocked<SaveImpactSiteReportUseCase>;
  let mockGetAllReportImpactSiteUseCase: jest.Mocked<GetAllReportImpactSiteUseCase>;
  let mockDeleteReportImpactSiteUseCase: jest.Mocked<DeleteReportImpactSiteUseCase>;

  beforeEach(() => {
    mockGetYearConfigsUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetMailTemplateUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetMailParametersUseCase = {
      execute: jest.fn(),
    } as any;

    mockSaveMailTemplateUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetZoneAnnualTargetsByYearUseCase = {
      execute: jest.fn(),
    } as any;

    mockSaveAnnualQuotaUseCase = {
      execute: jest.fn(),
    } as any;

    mockExportAnnualQuotaUseCase = {
      execute: jest.fn(),
    } as any;

    mockSearchQuotaAllocationUseCase = {
      search: jest.fn(),
    } as any;

    mockGetAllocationHistoryUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetQuotaRoundsUseCase = {
      execute: jest.fn(),
    } as any;

    mockApproveSelectedUseCase = {
      execute: jest.fn(),
    } as any;

    mockRejectSelectedUseCase = {
      execute: jest.fn(),
    } as any;

    mockProcessAllocationActionUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetQuotaAllocationDetailUseCase = {
      execute: jest.fn(),
    } as any;

    mockSaveLocationSelectionUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetItemHistoryUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetQuotaConfigUseCase = {
      execute: jest.fn(),
    } as any;

    mockCloseQuotaConfigUseCase = {
      execute: jest.fn(),
    } as any;

    mockCreateRoundUseCase = {
      execute: jest.fn(),
    } as any;

    mockDeleteRoundUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetRoundWithAllosUseCase = {
      execute: jest.fn(),
    } as any;

    mockSubmitQuotaRoundAllZonesUseCase = {
      execute: jest.fn(),
    } as any;

    mockSubmitReviewRoundsAllZonesUseCase = {
      execute: jest.fn(),
    } as any;

    mockSubmitReviewRoundsByZoneUseCase = {
      execute: jest.fn(),
    } as any;

    mockSubmitRoundByZoneUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateRoundUsecase = {
      execute: jest.fn(),
    } as any;

    mockExportStoreSummaryUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetSummaryReportUseCase = {
      execute: jest.fn(),
    } as any;

    mockSaveStoreOpeningReportUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetAllReportOpenPlanUseCase = {
      execute: jest.fn(),
    } as any;

    mockSaveImpactSiteReportUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetAllReportImpactSiteUseCase = {
      execute: jest.fn(),
    } as any;

    mockDeleteReportImpactSiteUseCase = {
      execute: jest.fn(),
    } as any;

    mockCheckLocationHistoryUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new QuotaManagementController(
      mockGetYearConfigsUseCase,
      mockGetMailTemplateUseCase,
      mockGetMailParametersUseCase,
      mockGetZoneAnnualTargetsByYearUseCase,
      mockSaveAnnualQuotaUseCase,
      mockSaveMailTemplateUseCase,
      mockExportAnnualQuotaUseCase,
      mockExportStoreSummaryUseCase,
      mockGetQuotaAllocationDetailUseCase,
      mockSaveLocationSelectionUseCase,
      mockGetItemHistoryUseCase,
      mockSearchQuotaAllocationUseCase,
      mockGetAllocationHistoryUseCase,
      mockGetQuotaRoundsUseCase,
      mockApproveSelectedUseCase,
      mockRejectSelectedUseCase,
      mockProcessAllocationActionUseCase,
      mockGetQuotaConfigUseCase,
      mockGetRoundWithAllosUseCase,
      mockCreateRoundUseCase,
      mockUpdateRoundUsecase,
      mockDeleteRoundUseCase,
      mockSubmitRoundByZoneUseCase,
      mockSubmitQuotaRoundAllZonesUseCase,
      mockCloseQuotaConfigUseCase,
      mockSubmitReviewRoundsByZoneUseCase,
      mockSubmitReviewRoundsAllZonesUseCase,
      mockCheckLocationHistoryUseCase,
      mockGetSummaryReportUseCase,
      mockSaveStoreOpeningReportUseCase,
      mockGetAllReportOpenPlanUseCase,
      mockSaveImpactSiteReportUseCase,
      mockGetAllReportImpactSiteUseCase,
      mockDeleteReportImpactSiteUseCase,
    );
  });

  describe('getYearConfigs', () => {
    it('should return year configs when usecase succeeds', async () => {
      // Arrange
      const year = '2026';
      const mockResponse: YearConfigsResponse = {
        year: '2026',
        locationTypes: ['01', '02'],
        quotaTypes: ['01', '02'],
      };
      mockGetYearConfigsUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getYearConfigs(year);

      // Assert
      expect(mockGetYearConfigsUseCase.execute).toHaveBeenCalledWith('2026');
      expect(result).toEqual(mockResponse);
    });

    it('should return empty arrays when no configs found', async () => {
      // Arrange
      const year = '2027';
      const mockResponse: YearConfigsResponse = {
        year: '2027',
        locationTypes: [],
        quotaTypes: [],
      };
      mockGetYearConfigsUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getYearConfigs(year);

      // Assert
      expect(mockGetYearConfigsUseCase.execute).toHaveBeenCalledWith('2027');
      expect(result).toEqual(mockResponse);
      expect(result.locationTypes).toHaveLength(0);
      expect(result.quotaTypes).toHaveLength(0);
    });

    it('should throw 400 error with INVALID_YEAR_FORMAT code when year format is invalid', async () => {
      // Arrange
      const year = '26';
      const error: any = new Error('Invalid quota year format');
      error.code = 'INVALID_YEAR_FORMAT';
      mockGetYearConfigsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.getYearConfigs(year);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'INVALID_YEAR_FORMAT',
          message: 'Invalid quota year format',
        });
      }
    });

    it('should throw 500 error with DATA_ACCESS_ERROR code when data access fails', async () => {
      // Arrange
      const year = '2026';
      const error = new DataAccessException('Database connection failed');
      mockGetYearConfigsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.getYearConfigs(year);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(e.getResponse()).toEqual({
          code: 'DATA_ACCESS_ERROR',
          message: 'Database connection failed',
        });
      }
    });

    it('should throw 400 error for other errors', async () => {
      // Arrange
      const year = '2026';
      const error: any = new Error('Something went wrong');
      error.code = 'UNKNOWN_ERROR';
      mockGetYearConfigsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.getYearConfigs(year);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'Something went wrong',
        });
      }
    });

    it('should throw 400 error with UNKNOWN_ERROR when error has no code', async () => {
      // Arrange
      const year = '2026';
      const error = new Error('Unexpected error');
      mockGetYearConfigsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.getYearConfigs(year);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'Unexpected error',
        });
      }
    });
  });

  describe('getZoneAnnualTargetsByYear', () => {
    it('should return zone annual targets when usecase succeeds', async () => {
      // Arrange
      const year = '2026';
      const mockResponse: QuotaAnnualTargetsResponse = {
        year: '2026',
        items: [
          {
            id: 1,
            quotaConfigId: 1,
            locationType: '01',
            quotaType: '01',
            zoneId: 1,
            target: 50,
          },
          {
            id: 2,
            quotaConfigId: 1,
            locationType: '01',
            quotaType: '01',
            zoneId: 2,
            target: 45,
          },
        ],
      };
      mockGetZoneAnnualTargetsByYearUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getZoneAnnualTargetsByYear(year);

      // Assert
      expect(mockGetZoneAnnualTargetsByYearUseCase.execute).toHaveBeenCalledWith('2026');
      expect(result).toEqual(mockResponse);
    });

    it('should return empty items array when no targets found', async () => {
      // Arrange
      const year = '2027';
      const mockResponse: QuotaAnnualTargetsResponse = {
        year: '2027',
        items: [],
      };
      mockGetZoneAnnualTargetsByYearUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getZoneAnnualTargetsByYear(year);

      // Assert
      expect(mockGetZoneAnnualTargetsByYearUseCase.execute).toHaveBeenCalledWith('2027');
      expect(result).toEqual(mockResponse);
      expect(result.items).toHaveLength(0);
    });

    it('should throw 400 error with INVALID_YEAR_FORMAT code when year format is invalid', async () => {
      // Arrange
      const year = '26';
      const error: any = new Error('Invalid quota year format');
      error.code = 'INVALID_YEAR_FORMAT';
      mockGetZoneAnnualTargetsByYearUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.getZoneAnnualTargetsByYear(year);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'INVALID_YEAR_FORMAT',
          message: 'Invalid quota year format',
        });
      }
    });

    it('should throw 500 error with DATA_ACCESS_ERROR code when data access fails', async () => {
      // Arrange
      const year = '2026';
      const error = new DataAccessException('Database connection failed');
      mockGetZoneAnnualTargetsByYearUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.getZoneAnnualTargetsByYear(year);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(e.getResponse()).toEqual({
          code: 'DATA_ACCESS_ERROR',
          message: 'Database connection failed',
        });
      }
    });

    it('should throw 400 error for other errors', async () => {
      // Arrange
      const year = '2026';
      const error: any = new Error('Something went wrong');
      error.code = 'UNKNOWN_ERROR';
      mockGetZoneAnnualTargetsByYearUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.getZoneAnnualTargetsByYear(year);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'Something went wrong',
        });
      }
    });

    it('should throw 400 error with UNKNOWN_ERROR when error has no code', async () => {
      // Arrange
      const year = '2026';
      const error = new Error('Unexpected error');
      mockGetZoneAnnualTargetsByYearUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.getZoneAnnualTargetsByYear(year);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'Unexpected error',
        });
      }
    });
  });

  describe('saveAnnualQuota', () => {
    const mockRequest = {
      user: {
        id: 1,
        employeeId: 'EMP001',
        fullName: 'Test User',
        permissions: [],
        zoneCodes: [],
      },
    };

    it('should successfully save annual quota', async () => {
      // Arrange
      const request = {
        year: '2026',
        locationTypes: ['01', '02'],
        quotaTypes: ['01'],
        zoneTargets: [{ zoneId: 1, locationType: '01', quotaType: '01', target: 100 }],
      };
      const mockResponse = { success: true };
      mockSaveAnnualQuotaUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.saveAnnualQuota(request, mockRequest as any);

      // Assert
      expect(mockSaveAnnualQuotaUseCase.execute).toHaveBeenCalledWith(request, 1);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when use case returns failure with INVALID_YEAR_FORMAT', async () => {
      // Arrange
      const request = {
        year: '26',
        locationTypes: ['01'],
        quotaTypes: ['01'],
      };
      const mockResponse = {
        success: false,
        error: {
          code: 'INVALID_YEAR_FORMAT',
          message: 'Invalid quota year format',
        },
      };
      mockSaveAnnualQuotaUseCase.execute.mockResolvedValue(mockResponse);

      // Act & Assert
      try {
        await controller.saveAnnualQuota(request, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'INVALID_YEAR_FORMAT',
          message: 'Invalid quota year format',
        });
      }
    });

    it('should throw error when use case returns failure with CATALOG_NOT_FOUND', async () => {
      // Arrange
      const request = {
        year: '2026',
        locationTypes: ['99'],
        quotaTypes: ['01'],
      };
      const mockResponse = {
        success: false,
        error: {
          code: 'CATALOG_NOT_FOUND',
          message: 'Location types not found in catalog: 99',
        },
      };
      mockSaveAnnualQuotaUseCase.execute.mockResolvedValue(mockResponse);

      // Act & Assert
      try {
        await controller.saveAnnualQuota(request, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'CATALOG_NOT_FOUND',
          message: 'Location types not found in catalog: 99',
        });
      }
    });

    it('should throw error when use case returns failure with NEGATIVE_TARGET', async () => {
      // Arrange
      const request = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
        zoneTargets: [{ zoneId: 1, locationType: '01', quotaType: '01', target: -100 }],
      };
      const mockResponse = {
        success: false,
        error: {
          code: 'NEGATIVE_TARGET',
          message: 'Target values cannot be negative',
        },
      };
      mockSaveAnnualQuotaUseCase.execute.mockResolvedValue(mockResponse);

      // Act & Assert
      try {
        await controller.saveAnnualQuota(request, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'NEGATIVE_TARGET',
          message: 'Target values cannot be negative',
        });
      }
    });

    it('should throw error when use case returns failure with PAIR_NOT_SELECTED', async () => {
      // Arrange
      const request = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
        zoneTargets: [{ zoneId: 1, locationType: '02', quotaType: '01', target: 100 }],
      };
      const mockResponse = {
        success: false,
        error: {
          code: 'PAIR_NOT_SELECTED',
          message: 'Configuration not found for locationType=02, quotaType=01',
        },
      };
      mockSaveAnnualQuotaUseCase.execute.mockResolvedValue(mockResponse);

      // Act & Assert
      try {
        await controller.saveAnnualQuota(request, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'PAIR_NOT_SELECTED',
          message: 'Configuration not found for locationType=02, quotaType=01',
        });
      }
    });

    it('should throw 500 error when use case returns DATA_ACCESS_ERROR', async () => {
      // Arrange
      const request = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
      };
      const mockResponse = {
        success: false,
        error: {
          code: 'DATA_ACCESS_ERROR',
          message: 'Database connection failed',
        },
      };
      mockSaveAnnualQuotaUseCase.execute.mockResolvedValue(mockResponse);

      // Act & Assert
      try {
        await controller.saveAnnualQuota(request, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(e.getResponse()).toEqual({
          code: 'DATA_ACCESS_ERROR',
          message: 'Database connection failed',
        });
      }
    });

    it('should throw error when use case throws exception', async () => {
      // Arrange
      const request = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
      };
      const error: any = new Error('Unexpected error');
      error.code = 'UNEXPECTED_ERROR';
      mockSaveAnnualQuotaUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.saveAnnualQuota(request, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toEqual({
          code: 'UNEXPECTED_ERROR',
          message: 'Unexpected error',
        });
      }
    });

    it('should extract user ID from JWT token', async () => {
      // Arrange
      const request = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
      };
      const customRequest = {
        user: {
          id: 999,
          employeeId: 'EMP999',
          fullName: 'Another User',
          permissions: [],
          zoneCodes: [],
        },
      };
      const mockResponse = { success: true };
      mockSaveAnnualQuotaUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      await controller.saveAnnualQuota(request, customRequest as any);

      // Assert
      expect(mockSaveAnnualQuotaUseCase.execute).toHaveBeenCalledWith(request, 999);
    });
  });

  describe('getQuotaRounds', () => {
    it('should return rounds when year is valid', async () => {
      // Arrange
      const year = '2026';
      const mockRounds = [
        { value: 'Round 1', text: 'Round 1' },
        { value: 'Round 2', text: 'Round 2' },
      ];
      mockGetQuotaRoundsUseCase.execute.mockResolvedValue(mockRounds);

      // Act
      const result = await controller.getQuotaRounds(year);

      // Assert
      expect(mockGetQuotaRoundsUseCase.execute).toHaveBeenCalledWith(2026);
      expect(result).toEqual({ data: mockRounds });
    });

    it('should throw BAD_REQUEST when year is missing', async () => {
      // Act & Assert
      await expect(controller.getQuotaRounds('')).rejects.toThrow();
    });

    it('should throw BAD_REQUEST when year format is invalid', async () => {
      // Act & Assert
      await expect(controller.getQuotaRounds('26')).rejects.toThrow();
    });

    it('should return empty array when no rounds found', async () => {
      // Arrange
      const year = '2027';
      mockGetQuotaRoundsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await controller.getQuotaRounds(year);

      // Assert
      expect(result).toEqual({ data: [] });
    });
  });

  describe('approveSelected', () => {
    const mockRequest = {
      user: {
        id: 1,
        roleId: 5,
        zoneCodes: { BKK: true, CNX: true },
      },
    };

    it('should approve selected allocations successfully', async () => {
      // Arrange
      const ids = [1, 2, 3];
      const mockResponse = [
        { id: 1, success: true, message: 'Approved' },
        { id: 2, success: true, message: 'Approved' },
        { id: 3, success: false, message: 'Already completed' },
      ];
      mockApproveSelectedUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.approveSelected(ids, mockRequest as any);

      // Assert
      expect(mockApproveSelectedUseCase.execute).toHaveBeenCalledWith({
        ids,
        userId: 1,
        userZones: ['BKK', 'CNX'],
        roleId: 5,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw BAD_REQUEST when ids is not an array', async () => {
      // Act & Assert
      try {
        await controller.approveSelected('not-array' as any, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Request body must be a non-empty array of IDs.',
        });
      }
    });

    it('should throw BAD_REQUEST when ids array is empty', async () => {
      // Act & Assert
      try {
        await controller.approveSelected([], mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should throw UNAUTHORIZED when userId is missing', async () => {
      // Arrange
      const requestWithoutUser = {
        user: { roleId: 5, zoneCodes: { BKK: true } },
      };

      // Act & Assert
      try {
        await controller.approveSelected([1, 2], requestWithoutUser as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
        expect(e.getResponse()).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'User authentication required.',
        });
      }
    });

    it('should throw FORBIDDEN when userZones is empty', async () => {
      // Arrange
      const requestWithoutZones = {
        user: { id: 1, roleId: 5, zoneCodes: {} },
      };

      // Act & Assert
      try {
        await controller.approveSelected([1, 2], requestWithoutZones as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.FORBIDDEN);
        expect(e.getResponse()).toMatchObject({
          code: 'FORBIDDEN',
          message: 'Your role or zone permission does not allow this action.',
        });
      }
    });
  });

  describe('rejectSelected', () => {
    const mockRequest = {
      user: {
        id: 1,
        roleId: 5,
        zoneCodes: { BKK: true, CNX: true },
      },
    };

    it('should reject selected allocations successfully', async () => {
      // Arrange
      const body = { ids: [1, 2], reason: 'Invalid data' };
      const mockResponse = [
        { id: 1, success: true, message: 'Rejected' },
        { id: 2, success: true, message: 'Rejected' },
      ];
      mockRejectSelectedUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.rejectSelected(body, mockRequest as any);

      // Assert
      expect(mockRejectSelectedUseCase.execute).toHaveBeenCalledWith({
        ids: [1, 2],
        reason: 'Invalid data',
        userId: 1,
        userZones: ['BKK', 'CNX'],
        roleId: 5,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw BAD_REQUEST when ids is not an array', async () => {
      // Arrange
      const body = { ids: 'not-array' as any, reason: 'Test' };

      // Act & Assert
      try {
        await controller.rejectSelected(body, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Request body must contain a non-empty array of IDs.',
        });
      }
    });

    it('should throw BAD_REQUEST when ids array is empty', async () => {
      // Arrange
      const body = { ids: [], reason: 'Test' };

      // Act & Assert
      try {
        await controller.rejectSelected(body, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should throw BAD_REQUEST when reason is missing', async () => {
      // Arrange
      const body = { ids: [1, 2], reason: '' };

      // Act & Assert
      try {
        await controller.rejectSelected(body, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(e.getResponse()).toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Reason is required and must be a non-empty string.',
        });
      }
    });

    it('should throw BAD_REQUEST when reason is only whitespace', async () => {
      // Arrange
      const body = { ids: [1, 2], reason: '   ' };

      // Act & Assert
      try {
        await controller.rejectSelected(body, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should throw UNAUTHORIZED when userId is missing', async () => {
      // Arrange
      const body = { ids: [1, 2], reason: 'Test' };
      const requestWithoutUser = {
        user: { roleId: 5, zoneCodes: { BKK: true } },
      };

      // Act & Assert
      try {
        await controller.rejectSelected(body, requestWithoutUser as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should throw FORBIDDEN when userZones is empty', async () => {
      // Arrange
      const body = { ids: [1, 2], reason: 'Test' };
      const requestWithoutZones = {
        user: { id: 1, roleId: 5, zoneCodes: {} },
      };

      // Act & Assert
      try {
        await controller.rejectSelected(body, requestWithoutZones as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.FORBIDDEN);
      }
    });
  });

  describe('search', () => {
    const mockRequest = {
      user: {
        id: 1,
        roleId: 5,
        zoneCodes: { BKK: true, CNX: true },
      },
    };

    it('should search quota allocations successfully', async () => {
      // Arrange
      const query = {
        year: '2026',
        zone: 'BKK',
        isPending: true,
      };
      const mockResponse = {
        data: [
          { id: 1, zone: 'BKK', status: 'Pending' },
          { id: 2, zone: 'BKK', status: 'Pending' },
        ],
      };
      mockSearchQuotaAllocationUseCase.search.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.search(query as any, mockRequest as any);

      // Assert
      expect(mockSearchQuotaAllocationUseCase.search).toHaveBeenCalledWith(
        query,
        ['BKK', 'CNX'],
        1,
        5,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw BAD_REQUEST when year format is invalid', async () => {
      // Arrange
      const query = { year: '26' };

      // Act & Assert
      try {
        await controller.search(query as any, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should throw UNAUTHORIZED when userId is missing', async () => {
      // Arrange
      const query = { year: '2026' };
      const requestWithoutUser = {
        user: { roleId: 5, zoneCodes: { BKK: true } },
      };

      // Act & Assert
      try {
        await controller.search(query as any, requestWithoutUser as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getResponse()).toMatchObject({ code: 'UNAUTHORIZED' });
      }
    });

    it('should throw PERMISSION_DENIED when userZones is empty', async () => {
      // Arrange
      const query = { year: '2026' };
      const requestWithoutZones = {
        user: { id: 1, roleId: 5, zoneCodes: {} },
      };

      // Act & Assert
      try {
        await controller.search(query as any, requestWithoutZones as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getResponse()).toMatchObject({ code: 'PERMISSION_DENIED' });
      }
    });
  });

  describe('getAllocationHistory', () => {
    const mockRequest = {
      user: {
        id: 1,
        zoneCodes: { BKK: true, CNX: true },
      },
    };

    it('should get allocation history successfully', async () => {
      // Arrange
      const id = 123;
      const mockResponse = {
        data: [
          {
            sequence: 1,
            statusName: 'Approved',
            actionName: 'Approve',
            actionDate: '2026-01-15 10:30:00',
            actionBy: 'John Doe',
            remark: 'Looks good',
          },
        ],
      };
      mockGetAllocationHistoryUseCase.execute.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.getAllocationHistory(id, mockRequest as any);

      // Assert
      expect(mockGetAllocationHistoryUseCase.execute).toHaveBeenCalledWith({
        id: 123,
        userId: 1,
        userZones: ['BKK', 'CNX'],
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid id parameter', async () => {
      // Arrange
      const id = 0;
      mockGetAllocationHistoryUseCase.execute.mockRejectedValue(
        new QuotaException('BAD_REQUEST', 'Invalid allocation ID'),
      );

      // Act & Assert
      try {
        await controller.getAllocationHistory(id, mockRequest as any);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getResponse()).toMatchObject({ code: 'BAD_REQUEST' });
      }
    });

    it('should extract userZones correctly when zoneCodes is undefined', async () => {
      // Arrange
      const id = 123;
      const requestWithoutZones = {
        user: { id: 1, zoneCodes: undefined },
      };
      mockGetAllocationHistoryUseCase.execute.mockResolvedValue({ data: [] } as any);

      // Act
      await controller.getAllocationHistory(id, requestWithoutZones as any);

      // Assert
      expect(mockGetAllocationHistoryUseCase.execute).toHaveBeenCalledWith({
        id: 123,
        userId: 1,
        userZones: [],
      });
    });
  });
  describe('exportAnnualQuota', () => {
    let response: any;
  });

  describe('checkLocationHistory', () => {
    it('should return check results successfully', async () => {
      // Arrange
      const poiId = 292118;
      const mockResponse = { success: true, isUsed: true };
      mockCheckLocationHistoryUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.checkLocationHistory(poiId);

      // Assert
      expect(mockCheckLocationHistoryUseCase.execute).toHaveBeenCalledWith(poiId);
      expect(result).toEqual(mockResponse);
    });

    it('should throw HttpException when usecase throws an error', async () => {
      // Arrange
      const poiId = 292118;
      const error = new Error('Database error');
      mockCheckLocationHistoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      try {
        await controller.checkLocationHistory(poiId);
        fail('Should have thrown an error');
      } catch (e: any) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });
});
