import { Controller, Get, Query, UseGuards, Param, Req } from '@nestjs/common';
import { GetProvincesUseCase } from '../../../application/usecases/master/getProvinces.usecase';
import { GetDistrictsUseCase } from '../../../application/usecases/master/getDistricts.usecase';
import { GetSubDistrictsUseCase } from '../../../application/usecases/master/getSubDistricts.usecase';
import { GetCommonCodeUseCase } from '../../../application/usecases/master/getCommonCode.usecase';
import { GetLayersUseCase } from '../../../application/usecases/master/getLayers.usecase';
import { GetImportConfigUseCase } from '../../../application/usecases/master/getImportConfig.usecase';
import { GetAllRolesUseCase } from '../../../application/usecases/role/getAllRoles.usecase';
import { GetPermissionsUseCase } from '../../../application/usecases/master/getPermissions.usecase';
import { GetZonesUseCase } from '../../../application/usecases/master/getZones.usecase';
import { GetCommonCodeDto } from '../dtos/getCommonCode.dto';
import { GetZonesDto } from '../dtos/getZones.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { ExtractLanguage } from '../decorators/language.decorator';
import { CustomRequest } from '../interfaces/requests/customRequest';
import { Language } from '../../../common/enums/language.enum';
import { GetTradeareaConfigsUseCase } from '../../../application/usecases/master/getExportConfigs.usecase';

@UseGuards(JwtAuthGuard)
@Controller('master')
export class MasterController {
  constructor(
    private readonly getProvincesUseCase: GetProvincesUseCase,
    private readonly getDistrictsUseCase: GetDistrictsUseCase,
    private readonly getSubDistrictsUseCase: GetSubDistrictsUseCase,
    private readonly getCommonCodeUseCase: GetCommonCodeUseCase,
    private readonly getLayersUseCase: GetLayersUseCase,
    private readonly getTradeareaConfigsUseCase: GetTradeareaConfigsUseCase,
    private readonly getImportConfigUseCase: GetImportConfigUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly getPermissionsUseCase: GetPermissionsUseCase,
    private readonly getZonesUseCase: GetZonesUseCase,
  ) {}

  @Get('common-codes')
  async getCommonCode(
    @ExtractLanguage() language: Language,
    @Query() query: GetCommonCodeDto,
  ) {
    const results = await this.getCommonCodeUseCase.handler(query.codeType, language);
    return { data: results };
  }

  @Get('provinces')
  async getProvinces(@Query('countryCode') countryCode?: string) {
    const results = await this.getProvincesUseCase.handler(countryCode);
    return { data: results };
  }

  @Get('districts')
  async getDistricts(@Query('provinceCode') provinceCode?: string) {
    const results = await this.getDistrictsUseCase.handler(provinceCode);
    return { data: results };
  }

  @Get('sub-districts')
  async getSubDistricts(@Query('districtCode') districtCode?: string) {
    const results = await this.getSubDistrictsUseCase.handler(districtCode);
    return { data: results };
  }

  @Get('layers')
  async getLayers(
    @Req() req: CustomRequest,
    @Query('isLandmark') isLandmark?: string,
    @Query('canCreatePoi') canCreatePoi?: string,
  ) {
    const userId = req.user?.id;
    const results = await this.getLayersUseCase.handler(userId, {
      isLandmark: isLandmark?.toUpperCase() === 'Y' || false,
      canCreatePoi: canCreatePoi?.toUpperCase() === 'Y' || false,
    });
    return { data: results };
  }

  @Get('roles')
  async getRoles() {
    const results = await this.getAllRolesUseCase.handler();
    return { data: results };
  }

  @Get('permissions')
  async getPermissions(@ExtractLanguage() language: Language) {
    const results = await this.getPermissionsUseCase.handler(language);
    return { data: results };
  }

  @Get('zones')
  async getZones(@Query() query: GetZonesDto) {
    const results = await this.getZonesUseCase.handler(query.orgId, query.category);
    return { data: results };
  }

  @Get('import-configs')
  async getImportConfigs(
    @Query('orgId') orgId?: string,
    @Query('importId') importId?: string,
  ) {
    const results = await this.getImportConfigUseCase.handler(orgId, importId);
    return { data: results };
  }

  @Get('import-configs/:id')
  async getImportConfigDetail(@Param('id') importId: string) {
    const results = await this.getImportConfigUseCase.getImportConfigById(importId);
    return { data: results };
  }

  @Get('import-configs/:id/fields')
  async getImportFields(@Param('id') importId: string) {
    const results = await this.getImportConfigUseCase.getImportConfigByFields(importId);
    return { data: results };
  }

  @Get('/export-configs')
  async getTradeareaConfigs(@ExtractLanguage() language: Language) {
    const result = await this.getTradeareaConfigsUseCase.handler(language);
    return {
      data: result,
    };
  }
}
