import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UsePipes,
  ValidationPipe,
  Param,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CustomRequest } from '../interfaces/requests/customRequest';
import { GetAllTradeareaUseCase } from '../../../application/usecases/tradearea/getAllTradearea.usecase';
import { GetTradeareaByIdUseCase } from '../../../application/usecases/tradearea/getTradeareaById.usecase';
import { GetTradeareaByStoreCodeUseCase } from '../../../application/usecases/tradearea/getTradeareaByStoreCode.usecase';
import { GetTradeareaByZoneUseCase } from '../../../application/usecases/tradearea/getTradeareaByZone.usecase';
import { GetTradeareaBySubzoneUseCase } from '../../../application/usecases/tradearea/getTradeareaBySubzone.usecase';
import { CheckPointInTradeareaUseCase } from '../../../application/usecases/tradearea/checkPointInTradearea.usecase';
import {
  CreateTradeareaDto,
  UpdateTradeareaDto,
  CheckOverlapDto,
} from '../dtos/tradearea.dto';
import { CheckOverlapUseCase } from '../../../application/usecases/tradearea/checkOverlap.usecase';
import { CreateTradeareaUseCase } from '../../../application/usecases/tradearea/createTradearea.usecase';
import { UpdateTradeareaUseCase } from '../../../application/usecases/tradearea/updateTradearea.usecase';
import { SpatialSearchUseCase } from '../../../application/usecases/locations/spatialSearch.usecase';

import { SpatialSearchQuery } from '../dtos/search.dto';
import { Response } from 'express';
import { SubmitTradeareaApprovalUseCase } from '../../../application/usecases/tradearea/submitTradeareaApproval.usecase';
import { GetTradeareasPendingApprovalUseCase } from '../../../application/usecases/tradearea/getTradeareasPendingApproval.usecase';
import { FindPoiTradeareaUseCase } from '../../../application/usecases/tradearea/findPoiTradearea.usecase';
import { UpdateTradeareaApproveDto } from '../dtos/tradeareaApprove.dto';
import { UpdateTradeareaApproveUseCase } from '../../../application/usecases/tradearea/updateTradeareaApprove.usecase';
import { FindTradeareaTypeUseCase } from '../../../application/usecases/tradearea/findTradeareaType.usecase';
import { DeleteTradeareaUseCase } from '../../../application/usecases/tradearea/deleteTradearea.usecase';
import { GetTradeareaByPoiUseCase } from '../../../application/usecases/tradearea/getTradeareaByPoi.usecase';
import { CreateChildTradeareaUseCase } from '../../../application/usecases/tradearea/createChildTradearea.usecase';

@UseGuards(JwtAuthGuard)
@Controller('tradearea')
export class TradeareaController {
  constructor(
    private readonly getAllTradeareaUseCase: GetAllTradeareaUseCase,
    private readonly getTradeareaByIdUseCase: GetTradeareaByIdUseCase,
    private readonly getTradeareaByStoreCodeUseCase: GetTradeareaByStoreCodeUseCase,
    private readonly getTradeareaByZoneUseCase: GetTradeareaByZoneUseCase,
    private readonly getTradeareaBySubzoneUseCase: GetTradeareaBySubzoneUseCase,
    private readonly checkPointInTradeareaUseCase: CheckPointInTradeareaUseCase,
    private readonly checkOverlapUseCase: CheckOverlapUseCase,
    private readonly createTradeareaUseCase: CreateTradeareaUseCase,
    private readonly updateTradeareaUseCase: UpdateTradeareaUseCase,
    private readonly spatialSearchUseCase: SpatialSearchUseCase,
    private readonly submitApprovalUseCase: SubmitTradeareaApprovalUseCase,
    private readonly getTradeareasPendingApprovalUseCase: GetTradeareasPendingApprovalUseCase,
    private readonly findPoiTradeareaUseCase: FindPoiTradeareaUseCase,
    private readonly updateTradeareaApproveUseCase: UpdateTradeareaApproveUseCase,
    private readonly findTradeareaTypeUseCase: FindTradeareaTypeUseCase,
    private readonly deleteTradeareaUseCase: DeleteTradeareaUseCase,
    private readonly getTradeareaByPoiUseCase: GetTradeareaByPoiUseCase,
    private readonly createChildTradeareaUseCase: CreateChildTradeareaUseCase,
  ) {}

  @Get('')
  async getAllTradeareas(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.getAllTradeareaUseCase.handler(
      search || '',
      page,
      sortBy,
      order,
      limit,
      status,
    );
  }

  @Get('pending-approval')
  async getPendingApproval(
    @Req() req: CustomRequest,
    @Query('wfId') wfId?: number,
    //@Query() query: GetPendingApprovalDto, // ✅ Use DTO for validation
  ) {
    const result = await this.getTradeareasPendingApprovalUseCase.handler(
      wfId,
      req.user.roleId,
    );
    return {
      data: result,
    };
  }

  @Get('types')
  async getTradeareaTypes() {
    const result = await this.findTradeareaTypeUseCase.handler();
    return {
      data: result,
    };
  }

  @Get('poi/:id')
  async getByPoi(@Param('id', ParseIntPipe) poiId: number) {
    const result = await this.getTradeareaByPoiUseCase.handler(poiId);
    return {
      data: result,
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.getTradeareaByIdUseCase.handler(id);
    return {
      data: result,
    };
  }

  @Get('store/:storeCode')
  async getByStoreCode(
    @Param('storeCode') storeCode: string,
    @Query('type') type: string,
  ) {
    const results = await this.getTradeareaByStoreCodeUseCase.handler(storeCode, type);
    return {
      data: results,
      total: results.length,
    };
  }

  @Get('zone/:zoneCode')
  async getByZone(@Param('zoneCode') zoneCode: string) {
    const results = await this.getTradeareaByZoneUseCase.handler(zoneCode);
    return {
      data: results,
      total: results.length,
    };
  }

  @Get('zone/:zoneCode/subzone/:subzoneCode')
  async getBySubzone(
    @Param('zoneCode') zoneCode: string,
    @Param('subzoneCode') subzoneCode: string,
  ) {
    const results = await this.getTradeareaBySubzoneUseCase.handler(
      zoneCode,
      subzoneCode,
    );
    return {
      data: results,
      total: results.length,
    };
  }

  @Post('spatial')
  async spatialSearch(@Req() req: CustomRequest, @Body() query: SpatialSearchQuery) {
    const [results, total] = await this.spatialSearchUseCase.handler(query, req.user);
    return {
      data: results,
      total: total,
    };
  }

  @Get('check-point')
  async checkPoint(
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('lat', ParseFloatPipe) lat: number,
  ) {
    const result = await this.checkPointInTradeareaUseCase.handler(lng, lat);
    return {
      data: result,
    };
  }

  @Post('check-overlap')
  async checkOverlap(@Body() dto: CheckOverlapDto) {
    return this.checkOverlapUseCase.handler(dto);
  }

  @Post('')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Req() req: CustomRequest, @Body() dto: CreateTradeareaDto) {
    const result = await this.createTradeareaUseCase.handler(dto, req.user.id);
    return {
      message: 'Trade area created successfully',
      data: result,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTradeareaDto,
  ) {
    const payload = { ...updateDto, id };
    return this.updateTradeareaUseCase.handler(payload);
  }

  @Post(':id/submit-approval')
  async submitApproval(@Req() req: CustomRequest, @Param('id', ParseIntPipe) id: number) {
    return await this.submitApprovalUseCase.handler(id, req.user.id);
  }

  @Get(':id/poi')
  async getTradeareaByPoiId(@Param('id', ParseIntPipe) id: number) {
    const result = await this.findPoiTradeareaUseCase.handler(id);
    return {
      data: result,
    };
  }

  @Post(':id/approve')
  async updateApprove(
    @Req() req: CustomRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: UpdateTradeareaApproveDto,
  ) {
    return await this.updateTradeareaApproveUseCase.handler(
      id,
      body.action,
      req.user.id,
      body.remark,
    );
  }

  @Delete(':id')
  async deleteTradeArea(@Req() req: CustomRequest, @Param('id') id: number) {
    return await this.deleteTradeareaUseCase.handler(id, req.user.id);
  }

  @Post(':id/child')
  async createChild(
    @Req() req: CustomRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeareaDto,
  ) {
    return await this.createChildTradeareaUseCase.handler(id, dto, req.user.id);
  }
}
