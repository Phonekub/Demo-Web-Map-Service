import {
  Controller,
  Get,
  Put,
  Post,
  Query,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Req,
  Res,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { GetYearConfigsUseCase } from '../../../application/usecases/quota/getYearConfigs.usecase';
import { GetMailTemplateUseCase } from '../../../application/usecases/quota/getMailTemplate.usecase';
import { GetMailParametersUseCase } from '../../../application/usecases/quota/getMailParameters.usecase';
import { GetZoneAnnualTargetsByYearUseCase } from '../../../application/usecases/quota/getZoneAnnualTargetsByYear.usecase';
import { SaveAnnualQuotaUseCase } from '../../../application/usecases/quota/saveAnnualQuota.usecase';
import { ExportAnnualQuotaUseCase } from '../../../application/usecases/quota/exportAnnualQuota.usecase';
import { GetQuotaAllocationDetailUseCase } from '../../../application/usecases/quota/getQuotaAllocationDetail.usecase';
import { SaveLocationSelectionUseCase } from '../../../application/usecases/quota/saveLocationSelection.usecase';
import { GetItemHistoryUseCase } from '../../../application/usecases/quota/getItemHistory.usecase';
import { SearchQuotaAllocationUseCase } from '../../../application/usecases/quota/searchQuotaAllocation.usecase';
import { GetAllocationHistoryUseCase } from '../../../application/usecases/quota/getAllocationHistory.usecase';
import { ApproveSelectedUseCase } from '../../../application/usecases/quota/approveSelected.usecase';
import { RejectSelectedUseCase } from '../../../application/usecases/quota/rejectSelected.usecase';
import { ProcessAllocationActionUseCase } from '../../../application/usecases/quota/processAllocationAction.usecase';

import {
  SaveAnnualQuotaRequest,
  SaveAnnualQuotaResponse,
  QuotaAnnualTargetsResponse,
} from '../../../domain/quotaAnnualTarget';
import { YearConfigsResponse } from '../../../domain/quotaConfig';
import {
  QuotaAllocationDetailResponse,
  SaveLocationSelectionRequest,
  SaveLocationSelectionResponse,
  GetItemHistoryResponse,
} from '../../../domain/quotaAllocation';
import {
  QuotaSearchQuery,
  QuotaSearchResponse,
  QuotaAllocationHistoryResponse,
} from '../../../domain/quotaSearch';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CustomRequest } from '../interfaces/requests/customRequest';
import {
  InvalidYearFormatException,
  QuotaException,
} from '../../../common/exceptions/quota.exception';
import { ExtractLanguage } from '../decorators/language.decorator';
import { Language } from '../../../common/enums/language.enum';
import {
  MailTemplateResponse,
  SaveMailTemplateRequest,
  SaveMailTemplateResponse,
} from '../../../domain/quotaMailTemplate';
import { MailParametersResponse } from '../../../domain/quotaMailParameters';
import { GetQuotaRoundsUseCase } from '../../../application/usecases/quota/getQuotaRounds.usecase';
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
import { YearValidator } from '../../../common/helpers/yearValidator';
import { QuotaQueryParams } from '../../../domain/quotaQueryParams';
import { QuotaRound } from '../../../domain/quotaRound';
import { GetQuotaConfigDto } from '../dtos/getQuotaConfig.dto';
import { UpdateRoundDto } from '../dtos/updateRound.dto';
import { SaveMailTemplateUseCase } from '../../../application/usecases/quota/saveMailTemplate.usecase';
import { ProcessAllocationActionDto } from '../dtos/processAllocationAction.dto';
import { CheckLocationHistoryUseCase } from '../../../application/usecases/quota/checkLocationHistory.usecase';
import { QuotaSummaryReportResponse } from '../../../domain/quotaSummaryReport';
import { GetSummaryReportUseCase } from '../../../application/usecases/quota/getSummaryReport.usecase';
import { ExportStoreSummaryUseCase } from '../../../application/usecases/quota/exportStoreSummary.usecase';
import {
  SaveStoreOpeningReportRequest,
  SaveReportResponse,
  SaveImpactSiteReportRequest,
} from '../../../domain/quotaReport';
import { SaveStoreOpeningReportUseCase } from '../../../application/usecases/quota/saveStoreOpeningReport.usecase';
import { GetAllReportOpenPlanUseCase } from '../../../application/usecases/quota/getAllStoreOpenPlan.usecase';
import { SaveImpactSiteReportUseCase } from '../../../application/usecases/quota/saveImpactSiteReport.usecase';
import { GetAllReportImpactSiteUseCase } from '../../../application/usecases/quota/getAllImpactSite.usecase';
import { DeleteReportImpactSiteUseCase } from '../../../application/usecases/quota/deleteImpactSite.usecase';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@Controller('quotas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuotaManagementController {
  constructor(
    private readonly getYearConfigsUseCase: GetYearConfigsUseCase,
    private readonly getMailTemplateUseCase: GetMailTemplateUseCase,
    private readonly getMailParametersUseCase: GetMailParametersUseCase,
    private readonly getZoneAnnualTargetsByYearUseCase: GetZoneAnnualTargetsByYearUseCase,
    private readonly saveAnnualQuotaUseCase: SaveAnnualQuotaUseCase,
    private readonly saveMailTemplateUseCase: SaveMailTemplateUseCase,
    private readonly exportAnnualQuotaUseCase: ExportAnnualQuotaUseCase,
    private readonly exportStoreSummaryUseCase: ExportStoreSummaryUseCase,
    private readonly getQuotaAllocationDetailUseCase: GetQuotaAllocationDetailUseCase,
    private readonly saveLocationSelectionUseCase: SaveLocationSelectionUseCase,
    private readonly getItemHistoryUseCase: GetItemHistoryUseCase,
    private readonly searchQuotaAllocationUseCase: SearchQuotaAllocationUseCase,
    private readonly getAllocationHistoryUseCase: GetAllocationHistoryUseCase,
    private readonly getQuotaRoundsUseCase: GetQuotaRoundsUseCase,
    private readonly approveSelectedUseCase: ApproveSelectedUseCase,
    private readonly rejectSelectedUseCase: RejectSelectedUseCase,
    private readonly processAllocationActionUseCase: ProcessAllocationActionUseCase,
    private readonly getConfigUseCase: GetQuotaConfigUseCase,
    private readonly getRoundWithAllosUseCase: GetRoundWithAllosUseCase,
    private readonly createRoudUseCase: CreateRoundUseCase,
    private readonly updateRoundUseCase: UpdateRoundUsecase,
    private readonly deleteRoundUseCase: DeleteRoundUseCase,
    private readonly submitRoundByZoneUseCase: SubmitRoundByZoneUseCase,
    private readonly submitQuotaRoundAllZonesUseCase: SubmitQuotaRoundAllZonesUseCase,
    private readonly closeQuotaConfigUseCase: CloseQuotaConfigUseCase,
    private readonly submitReviewRoundsByZoneUseCase: SubmitReviewRoundsByZoneUseCase,
    private readonly submitReviewRoundsAllZonesUseCase: SubmitReviewRoundsAllZonesUseCase,
    private readonly checkLocationHistoryUseCase: CheckLocationHistoryUseCase,
    private readonly getSummaryReportUseCase: GetSummaryReportUseCase,
    private readonly saveStoreOpeningReportUseCase: SaveStoreOpeningReportUseCase,
    private readonly getAllReportOpenPlanUseCase: GetAllReportOpenPlanUseCase,
    private readonly saveImpactSiteReportUseCase: SaveImpactSiteReportUseCase,
    private readonly getAllReportImpactSiteUseCase: GetAllReportImpactSiteUseCase,
    private readonly deleteReportImpactSiteUseCase: DeleteReportImpactSiteUseCase,
  ) {}

  private extractUserZones(zoneCodes: any): string[] {
    if (!zoneCodes) return [];
    return Object.keys(zoneCodes);
  }

  private getStatusCodeFromErrorCode(errorCode: string): number {
    switch (errorCode) {
      case 'UNAUTHORIZED':
        return HttpStatus.UNAUTHORIZED;
      case 'PERMISSION_DENIED':
        return HttpStatus.FORBIDDEN;
      case 'DATA_ACCESS_ERROR':
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }

  private handleError(error: any): never {
    let errorCode: string;
    let errorMessage: string;

    if (error instanceof QuotaException) {
      errorCode = error.code;
      errorMessage = error.message;
    } else if (error.code) {
      errorCode = error.code;
      errorMessage = error.message || 'An error occurred';
    } else {
      errorCode = 'UNKNOWN_ERROR';
      errorMessage = error.message || 'An error occurred';
    }

    throw new HttpException(
      {
        code: errorCode,
        message: errorMessage,
      },
      this.getStatusCodeFromErrorCode(errorCode),
    );
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('configs')
  async getYearConfigs(@Query('year') year: string): Promise<YearConfigsResponse> {
    try {
      const result = await this.getYearConfigsUseCase.execute(year);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('mail-templates')
  async getMailTemplate(
    @ExtractLanguage() language: Language,
    @Query('wfId') wfId: number,
  ): Promise<MailTemplateResponse[]> {
    try {
      const result = await this.getMailTemplateUseCase.execute(wfId, language);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('mail-parameters')
  async getMailParameters(
    @ExtractLanguage() language: Language,
  ): Promise<MailParametersResponse[]> {
    try {
      const result = await this.getMailParametersUseCase.execute(language);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('annual-targets')
  async getZoneAnnualTargetsByYear(
    @Query('year') year: string,
  ): Promise<QuotaAnnualTargetsResponse> {
    try {
      const result = await this.getZoneAnnualTargetsByYearUseCase.execute(year);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Put('save-mail')
  async saveMailQuota(
    @Body() request: SaveMailTemplateRequest,
    @Req() req: CustomRequest,
  ): Promise<SaveMailTemplateResponse> {
    try {
      const result = await this.saveMailTemplateUseCase.execute(request, req.user.id);

      if (!result.success) {
        this.handleError(result.error);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('export')
  async exportAnnualQuota(
    @Query('year') year: string,
    @ExtractLanguage() language: Language,
    @Res() res: Response,
  ) {
    if (!year || isNaN(Number(year))) {
      throw new InvalidYearFormatException();
    }

    try {
      const fileStream = await this.exportAnnualQuotaUseCase.execute(year, language);
      const fileName = `quota_annual_target_${year}.xlsx`;

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });

      fileStream.pipe(res);
    } catch (error) {
      console.error('Export Error:', error);
      if (res.headersSent) {
        res.end();
        return;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('allocations/:allocationId/detail')
  async getAllocationDetail(
    @Param('allocationId') allocationId: string,
    @ExtractLanguage() language: Language,
  ): Promise<QuotaAllocationDetailResponse> {
    try {
      const id = parseInt(allocationId, 10);
      if (isNaN(id)) {
        throw new HttpException(
          {
            code: 'INVALID_ALLOCATION_ID',
            message: 'Allocation ID must be a valid number',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.getQuotaAllocationDetailUseCase.execute(id, language);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('allocations/save-selection')
  async saveLocationSelection(
    @Body() request: SaveLocationSelectionRequest,
    @Req() req: CustomRequest,
  ): Promise<SaveLocationSelectionResponse> {
    try {
      const result = await this.saveLocationSelectionUseCase.execute(
        request,
        req.user.id,
      );


      if (!result.success) {
        throw new HttpException(
          {
            code: result.error.code,
            message: result.error.message,
          },
          this.getStatusCodeFromErrorCode(result.error.code),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('items/:itemId/history')
  async getItemHistory(@Param('itemId') itemId: number): Promise<GetItemHistoryResponse> {
    try {
      return await this.getItemHistoryUseCase.execute(itemId);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('rounds')
  async getQuotaRounds(@Query('year') year: string) {
    if (!year || !/^\d{4}$/.test(year)) {
      throw new InvalidYearFormatException();
    }

    try {
      const rounds = await this.getQuotaRoundsUseCase.execute(Number(year));
      return { data: rounds };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('configs/scope')
  async getYearScopeConfigs(
    @ExtractLanguage() Language: Language,
    @Query() query: GetQuotaConfigDto,
  ) {
    console.debug(`In get config...................`);
    try {
      YearValidator.validate(query.year);
      const year = parseInt(query.year);
      const result = await this.getConfigUseCase.handler(
        year,
        query.location_type,
        query.quota_type,
        Language,
      );

      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('approve')
  async approveSelected(@Body() ids: number[], @Req() req: CustomRequest) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new HttpException(
          {
            code: 'BAD_REQUEST',
            message: 'Request body must be a non-empty array of IDs.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = req.user as any;
      const userZones = user?.zoneCodes ? Object.keys(user.zoneCodes) : [];
      const userId = user?.id;
      const roleId = user?.roleId;

      if (!userId) {
        throw new HttpException(
          {
            code: 'UNAUTHORIZED',
            message: 'User authentication required.',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (!userZones || userZones.length === 0) {
        throw new HttpException(
          {
            code: 'FORBIDDEN',
            message: 'Your role or zone permission does not allow this action.',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      const results = await this.approveSelectedUseCase.execute({
        ids,
        userId,
        userZones,
        roleId,
      });

      return results;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('rounds-with-allocations')
  async getRoundsWithAllocations(
    @Query() query: GetQuotaConfigDto,
    @ExtractLanguage() language: Language,
    @Req() req: CustomRequest,
  ) {
    console.debug('Params: ', query);
    try {
      YearValidator.validate(query.year);
      const year = parseInt(query.year);
      const result = await this.getRoundWithAllosUseCase.handler(
        year,
        query.location_type,
        query.quota_type,
        req.user?.id,
        language,
      );

      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('reject')
  async rejectSelected(
    @Body() body: { ids: number[]; reason: string },
    @Req() req: CustomRequest,
  ) {
    try {
      const { ids, reason } = body;

      // Validate input
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new HttpException(
          {
            code: 'BAD_REQUEST',
            message: 'Request body must contain a non-empty array of IDs.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        throw new HttpException(
          {
            code: 'BAD_REQUEST',
            message: 'Reason is required and must be a non-empty string.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = req.user as any;
      const userZones = user?.zoneCodes ? Object.keys(user.zoneCodes) : [];
      const userId = user?.id;
      const roleId = user?.roleId;

      if (!userId) {
        throw new HttpException(
          {
            code: 'UNAUTHORIZED',
            message: 'User authentication required.',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (!userZones || userZones.length === 0) {
        throw new HttpException(
          {
            code: 'FORBIDDEN',
            message: 'Your role or zone permission does not allow this action.',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      const results = await this.rejectSelectedUseCase.execute({
        ids,
        reason,
        userId,
        userZones,
        roleId,
      });

      return results;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('allocations/process-action')
  async processAllocationAction(
    @Body() body: ProcessAllocationActionDto,
    @Req() req: CustomRequest,
  ) {
    try {
      const user = req.user as any;
      const userZones = user?.zoneCodes ? Object.keys(user.zoneCodes) : [];
      const userId = user?.id;
      const roleId = user?.roleId;

      if (!userId) {
        throw new HttpException(
          {
            code: 'UNAUTHORIZED',
            message: 'User authentication required.',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (!userZones || userZones.length === 0) {
        throw new HttpException(
          {
            code: 'FORBIDDEN',
            message: 'Your role or zone permission does not allow this action.',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      const result = await this.processAllocationActionUseCase.execute({
        refId: body.refId,
        actionCode: body.actionCode,
        remark: body.remark,
        userId,
        userZones,
        roleId,
      });

      if (!result.success) {
        throw new HttpException(
          {
            code: 'PROCESS_FAILED',
            message: result.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('rounds')
  async saveQuotaRound(@Body() body: any, @Req() req: CustomRequest) {
    try {
      YearValidator.validate(body.year);

      const [day, month, year] = body.round.due_date.split('-');
      const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const round: QuotaRound = {
        name: body.round.name,
        startMonth: body.round.start_month,
        endMonth: body.round.end_month,
        dueDate: dueDate,
        allocations: body.allocations.map((a) => ({
          zoneId: a.zone_id,
          zoneCode: a.zone_code,
          assignedQuota: a.assigned_quota,
          reservedQuota: a.reserved_quota,
        })),
      };
      const queryParams: QuotaQueryParams = {
        year: parseInt(body.year),
        locationType: body.location_type,
        quotaType: body.quota_type,
      };

      const result = await this.createRoudUseCase.handler(
        round,
        queryParams,
        req.user?.id,
      );

      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Put('rounds/:round_id')
  async updateQuotaRound(
    @Param('round_id') roundId: string,
    @Body() body: UpdateRoundDto,
    @Req() req: CustomRequest,
  ) {
    try {
      const [day, month, year] = body.round.due_date.split('-');
      const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const updateRound: QuotaRound = {
        id: parseInt(roundId),
        name: body.round.name,
        startMonth: body.round.start_month,
        endMonth: body.round.end_month,
        dueDate: dueDate,
        allocations: body.allocations.map((a) => ({
          allocationId: a.allocation_id,
          zoneId: a.zone_id,
          zoneCode: a.zone_code,
          assignedQuota: a.assigned_quota,
          reservedQuota: a.reserved_quota,
        })),
      };

      const res = await this.updateRoundUseCase.handler(updateRound, req.user?.id);
      if (!res.success) this.handleError(res.error);
      return res;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get()
  async search(
    @Query() query: QuotaSearchQuery,
    @Req() req: CustomRequest,
  ): Promise<QuotaSearchResponse> {
    try {
      // Validate year format
      if (query.year && !/^\d{4}$/.test(query.year)) {
        throw new InvalidYearFormatException();
      }

      const user = req.user as any;
      const userId = user?.id;
      const roleId = user?.roleId;
      const userZones = user?.zoneCodes ? Object.keys(user.zoneCodes) : [];

      // Check user authentication
      if (!userId) {
        throw new QuotaException('UNAUTHORIZED', 'User authentication required.');
      }

      // Check zone permission
      if (!userZones || userZones.length === 0) {
        throw new QuotaException(
          'PERMISSION_DENIED',
          'Your role or zone permission does not allow accessing these allocations.',
        );
      }

      const result = await this.searchQuotaAllocationUseCase.search(
        query,
        userZones,
        userId,
        roleId,
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Delete('rounds/:round_id')
  async deleteQuotaRound(@Param('round_id') roundId: string, @Req() req: CustomRequest) {
    try {
      const result = await this.deleteRoundUseCase.handler(
        parseInt(roundId),
        req.user?.id,
      );
      if (!result.success) this.handleError(result.error);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get(':id/history')
  async getAllocationHistory(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: CustomRequest,
  ): Promise<QuotaAllocationHistoryResponse> {
    try {
      const userId = req.user?.id;
      const userZones = this.extractUserZones(req.user?.zoneCodes);

      const result = await this.getAllocationHistoryUseCase.execute({
        id,
        userId,
        userZones,
      });
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('rounds/:round_id/zones/:zone_id/submit')
  async submitQuotaRoundByZone(
    @Param('round_id') roundId: string,
    @Param('zone_id') zoneId: string,
    @Req() req: CustomRequest,
  ) {
    try {
      const result = await this.submitRoundByZoneUseCase.handler(
        parseInt(roundId),
        parseInt(zoneId),
        req.user?.id,
      );
      // if (!result.success) this.handleError(result.error);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Put('save')
  async saveAnnualQuota(
    @Body() request: SaveAnnualQuotaRequest,
    @Req() req: CustomRequest,
  ): Promise<SaveAnnualQuotaResponse> {
    try {
      const startController = performance.now();
      const result = await this.saveAnnualQuotaUseCase.execute(request, req.user.id);

      if (!result.success) {
        this.handleError(result.error);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('rounds/:round_id/submit-all')
  async submitQuotaRound(
    @Param('round_id') roundId: string,
    @Req() req: CustomRequest,
    @Body() body: { zoneToNotProcess: number[] },
  ) {
    try {
      // if (!Array.isArray(body.zoneToNotProcess)) {
      //   throw new QuotaException('BAD_REQUEST', 'zoneToNotProcess must be an array.');
      // }
      const result = await this.submitQuotaRoundAllZonesUseCase.handler(
        parseInt(roundId),
        req.user?.id,
        body.zoneToNotProcess || [],
      );
      if (!result.success) this.handleError(result.error);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('config/close')
  async closeQuotaConfig(@Req() req: CustomRequest, @Body() body: GetQuotaConfigDto) {
    try {
      YearValidator.validate(body.year);
      const year = parseInt(body.year);
      const result = await this.closeQuotaConfigUseCase.handler(
        year,
        body.location_type,
        body.quota_type,
        req.user?.id,
      );
      if (!result.success) this.handleError(result.error);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('review-rounds/zones/:zone_id/submit')
  async submitReviewRoundsByZone(
    @Param('zone_id') zoneId: string,
    @Body() body: GetQuotaConfigDto,
    @Req() req: CustomRequest,
  ) {
    try {
      YearValidator.validate(body.year);
      const year = parseInt(body.year);
      const result = await this.submitReviewRoundsByZoneUseCase.handler(
        year,
        body.location_type,
        body.quota_type,
        parseInt(zoneId),
        req.user?.id,
      );
      if (!result.success) this.handleError(result.error);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('review-rounds/submit-all')
  async submitReviewRoundsAllZones(
    @Body() body: GetQuotaConfigDto,
    @Req() req: CustomRequest,
  ) {
    try {
      YearValidator.validate(body.year);
      const year = parseInt(body.year);
      const result = await this.submitReviewRoundsAllZonesUseCase.handler(
        year,
        body.location_type,
        body.quota_type,
        req.user?.id,
      );
      if (!result.success) this.handleError(result.error);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('check-history/:poiId')
  async checkLocationHistory(@Param('poiId', ParseIntPipe) poiId: number) {
    try {
      return await this.checkLocationHistoryUseCase.execute(poiId);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('store-summary')
  async getSummaryReport(
    @Query('year') year: string,
    @Query('locationType') locationType: string,
    @Query('quotaType') quotaType: string,
  ): Promise<QuotaSummaryReportResponse[]> {
    try {
      const result = await this.getSummaryReportUseCase.execute(
        year,
        locationType,
        quotaType,
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('export-summary')
  async exportSummaryQuota(
    @Query('year') year: string,
    @Query('locationType') locationType: string,
    @Query('quotaType') quotaType: string,
    @ExtractLanguage() language: Language,
    @Res() res: Response,
  ) {
    if (!year || isNaN(Number(year))) {
      throw new InvalidYearFormatException();
    }

    try {
      const fileStream = await this.exportStoreSummaryUseCase.execute(
        year,
        locationType,
        quotaType,
        language,
      );
      const fileName = `store_opening_summary_${year}.xlsx`;

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });

      fileStream.pipe(res);
    } catch (error) {
      console.error('Export Error:', error);
      if (res.headersSent) {
        res.end();
        return;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('open-plan')
  async getAllReportOpenPlan(
    @Query() query: { search?: string; page?: number; pageSize?: number },
  ) {
    const { search, page, pageSize } = query;
    const result = await this.getAllReportOpenPlanUseCase.handler(
      search || '',
      page,
      pageSize,
    );
    return result;
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('save-open-plan')
  async saveReportOpenPlan(
    @Body() request: SaveStoreOpeningReportRequest,
    @Req() req: CustomRequest,
  ): Promise<SaveReportResponse> {
    try {
      const result = await this.saveStoreOpeningReportUseCase.execute(
        request,
        req.user.id,
      );

      if (!result.success) {
        throw new HttpException(
          {
            code: result.error.code,
            message: result.error.message,
          },
          this.getStatusCodeFromErrorCode(result.error.code),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Get('impact-site')
  async getAllReportImpactSite(
    @Query() query: { search?: string; page?: number; pageSize?: number },
  ) {
    const { search, page, pageSize } = query;
    const result = await this.getAllReportImpactSiteUseCase.handler(
      search || '',
      page,
      pageSize,
    );
    return result;
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Post('save-impact-site')
  async saveReportImpactSite(
    @Body() request: SaveImpactSiteReportRequest,
    @Req() req: CustomRequest,
  ): Promise<SaveReportResponse> {
    try {
      const result = await this.saveImpactSiteReportUseCase.execute(request, req.user.id);

      if (!result.success) {
        throw new HttpException(
          {
            code: result.error.code,
            message: result.error.message,
          },
          this.getStatusCodeFromErrorCode(result.error.code),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error);
    }
  }

  @Permissions(['QUOTA_MANAGEMENT'])
  @Delete('impact-site/:report_id')
  async deleteReportImpactSite(
    @Param('report_id') reportId: string,
    @Req() req: CustomRequest,
  ) {
    try {
      const result = await this.deleteReportImpactSiteUseCase.handler(
        parseInt(reportId),
        req.user?.id,
      );
      if (!result.success) this.handleError(result.error);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }
}
