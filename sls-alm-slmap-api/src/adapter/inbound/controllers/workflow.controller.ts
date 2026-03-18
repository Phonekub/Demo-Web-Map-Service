import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { GetCurrentWorkflowStepUseCase } from '../../../application/usecases/workflow/getCurrentWorkflowStep.usecase';
import { GetWorkflowHistoryUseCase } from '../../../application/usecases/workflow/getWorkflowHistory.usecase';
import { CustomRequest } from '../interfaces/requests/customRequest';
import { Language } from '../../../common/enums/language.enum';
import { ExtractLanguage } from '../decorators/language.decorator';
import { GetWorkflowStatusesUseCase } from '../../../application/usecases/workflow/getWorkflowStatuses.usecase';
import { GetWorkflowStepsUseCase } from '../../../application/usecases/workflow/getWorkflowSteps.usecase';
import { UpdateWfStepOwnerUseCase } from '../../../application/usecases/workflow/updateWfStepOwner.usecase';

class UpdateWfStepOwnerRequest {
  stepId: number;
  stepOwnerType: string;
  stepOwnerRole: string;
  stepOwnerUser: string;
}

@UseGuards(JwtAuthGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
    private readonly getWorkflowHistoryUseCase: GetWorkflowHistoryUseCase,
    private readonly getWorkflowStatusesUseCase: GetWorkflowStatusesUseCase,
    private readonly getWorkflowStepsUseCase: GetWorkflowStepsUseCase,
    private readonly updateWfStepOwnerUseCase: UpdateWfStepOwnerUseCase,
  ) {}

  @Get('statuses')
  async getWorkflowStatuses(
    @ExtractLanguage() language: Language,
    @Query('wfId', ParseIntPipe) wfId: number,
  ) {
    const results = await this.getWorkflowStatusesUseCase.handler(wfId, language);
    return { data: results };
  }

  @Get('steps')
  async getWorkflowSteps(
    @ExtractLanguage() language: Language,
    @Query('wfId', ParseIntPipe) wfId: number,
  ) {
    const results = await this.getWorkflowStepsUseCase.handler(wfId, language);
    return { data: results };
  }

  @Get(':refId/:wfId/current-step')
  async getCurrentStep(
    @ExtractLanguage() language: Language,
    @Req() req: CustomRequest,
    @Param('refId', ParseIntPipe) refId: number,
    @Param('wfId', ParseIntPipe) wfId: number,
  ) {
    return await this.getCurrentWorkflowStepUseCase.handler(
      refId,
      [wfId],
      req.user.id,
      language,
    );
  }

  @Get(':refId/history')
  async getAllWorkflowHistory(
    @ExtractLanguage() language: Language,
    @Param('refId', ParseIntPipe) refId: number,
  ) {
    return await this.getWorkflowHistoryUseCase.handler(refId, undefined, language);
  }

  @Get(':refId/:wfId/history')
  async getWorkflowHistory(
    @ExtractLanguage() language: Language,
    @Param('refId', ParseIntPipe) refId: number,
    @Param('wfId', ParseIntPipe) wfId: number,
  ) {
    return await this.getWorkflowHistoryUseCase.handler(refId, wfId, language);
  }

  @Get('transaction/:wfTransactionId')
  async getWorkflowTransaction(
    @Param('wfTransactionId', ParseIntPipe) wfTransactionId: number,
  ) {
    const transaction =
      await this.getCurrentWorkflowStepUseCase.getWorkflowTransaction(wfTransactionId);
    if (!transaction) {
      return { data: null, message: 'Workflow transaction not found' };
    }
    return { data: transaction };
  }

  @Put('step-owner')
  async updateWfStepOwner(
    @Body() request: UpdateWfStepOwnerRequest,
    @Req() req: CustomRequest,
  ) {
    try {
      await this.updateWfStepOwnerUseCase.handler(
        request.stepId,
        request.stepOwnerType,
        request.stepOwnerRole,
        request.stepOwnerUser,
        req.user.id,
      );
      return { status: HttpStatus.OK, message: 'Updated successfully' };
    } catch (error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to update step owner',
      };
    }
  }
}
