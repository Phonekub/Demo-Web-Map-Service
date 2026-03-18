import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { SearchPoiUseCase } from '../../../application/usecases/locations/searchPoi.usecase';
import { SpatialSearchUseCase } from '../../../application/usecases/locations/spatialSearch.usecase';
import { SearchNearbySevenUseCase } from '../../../application/usecases/locations/searchNearbySeven.usecase';
import { SearchNearbyCompetitorUseCase } from '../../../application/usecases/locations/searchNearbyCompetitor.usecase';
import { SearchNearbyEntertainmentAreaUseCase } from '../../../application/usecases/locations/searchNearbyEntertainmentArea.usecase';
import {
  UpsertPoiAreaUseCase,
  UpsertPoiAreaRequest,
} from '../../../application/usecases/locations/upsertPoiArea.usecase';
import { CreatePoiUseCase } from '../../../application/usecases/locations/createPoi.usecase';
import { UpdatePoiUseCase } from '../../../application/usecases/locations/updatePoi.usecase';
import { GetCoordinateInfoUseCase } from '../../../application/usecases/locations/getCoordinateInfo.usecase';
import { GetPoiByIdUseCase } from '../../../application/usecases/locations/getPoiById.usecase';
import { Body, Post } from '@nestjs/common';
import { DynamicValidationPipe } from '../pipes/dynamic-validation.pipe';
import {
  BaseSearchQuery,
  SpatialSearchQuery,
  NearbySearchQuery,
} from '../dtos/search.dto';
import { CoordinateLookupQuery } from '../dtos/coordinateLookup.dto';
import { CreatePoiDto } from '../dtos/createPoi.dto';
import { UpdatePoiDto } from '../dtos/updatePoi.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CustomRequest } from '../interfaces/requests/customRequest';
import { SearchCompetitorSurroundUseCase } from '../../../application/usecases/locations/searchCompetitorSurround.usecase';

@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationController {
  constructor(
    private readonly searchPoiUseCase: SearchPoiUseCase,
    private readonly spatialSearchUseCase: SpatialSearchUseCase,
    private readonly upsertPoiAreaUseCase: UpsertPoiAreaUseCase,
    private readonly createPoiUseCase: CreatePoiUseCase,
    private readonly updatePoiUseCase: UpdatePoiUseCase,
    private readonly getZoneByCoordinatesUseCase: GetCoordinateInfoUseCase,
    private readonly searchNearbySevenUseCase: SearchNearbySevenUseCase,
    private readonly searchNearbyCompetitorUseCase: SearchNearbyCompetitorUseCase,
    private readonly searchNearbyEntertainmentAreaUseCase: SearchNearbyEntertainmentAreaUseCase,
    private readonly searchCompetitorSurroundUseCase: SearchCompetitorSurroundUseCase,
    private readonly getPoiByIdUseCase: GetPoiByIdUseCase,
  ) {}

  @Get('coordinate-info')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getZoneByCoordinates(
    @Req() req: CustomRequest,
    @Query() query: CoordinateLookupQuery,
  ) {
    const result = await this.getZoneByCoordinatesUseCase.handler(
      req.user.zoneCodes,
      query.latitude,
      query.longitude,
    );

    if (!result) {
      return {
        data: null,
        message: 'No zone found for the provided coordinates',
      };
    }

    return {
      data: {
        zoneAuthorized: result.zoneAuthorized,
        zone: result.zone,
        subzone: result.subzone,
        subDistrict: result.subDistrict.text,
        district: result.district.text,
        province: result.province.text,
      },
    };
  }

  @Get()
  async searchPoi(
    @Req() req: CustomRequest,
    @Query(new DynamicValidationPipe()) query: BaseSearchQuery,
  ) {
    const [results, total] = await this.searchPoiUseCase.handler(query, req.user);
    return {
      data: results,
      total: total,
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

  @Post('area')
  async saveArea(@Body() areaDto: UpsertPoiAreaRequest) {
    const result = await this.upsertPoiAreaUseCase.handler(areaDto);
    return {
      message: 'Area saved successfully ',
      data: result,
    };
  }

  @Post('poi')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createPoi(@Req() req: CustomRequest, @Body() createPoiDto: CreatePoiDto) {
    const userId = req.user?.id;
    const userZoneCodes = req.user?.zoneCodes;
    const result = await this.createPoiUseCase.handler(
      createPoiDto,
      userId,
      userZoneCodes,
    );

    return {
      data: result,
    };
  }

  @Put('poi/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updatePoi(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: CustomRequest,
    @Body() updatePoiDto: UpdatePoiDto,
  ) {
    const userId = req.user?.id;
    const result = await this.updatePoiUseCase.handler(id, updatePoiDto, userId);
    return {
      data: result,
    };
  }

  @Get('nearby-seven')
  async searchNearbySeven(
    @Query(new ValidationPipe({ transform: true })) query: NearbySearchQuery,
  ) {
    const [results, total] = await this.searchNearbySevenUseCase.handler(query);
    return {
      data: results,
      total: total,
    };
  }

  @Get('nearby-competitor')
  async searchNearbyCompetitor(
    @Query(new ValidationPipe({ transform: true })) query: NearbySearchQuery,
  ) {
    const [results, total] = await this.searchNearbyCompetitorUseCase.handler(query);
    return {
      data: results,
      total: total,
    };
  }

  @Get('nearby-entertainment-area')
  async searchNearbyEntertainmentArea(
    @Query(new ValidationPipe({ transform: true })) query: NearbySearchQuery,
  ) {
    const [results, total] =
      await this.searchNearbyEntertainmentAreaUseCase.handler(query);
    return {
      data: results,
      total: total,
    };
  }

  @Get(':sevenPoiUid/competitors')
  async searchCompetitorSurround(@Param('sevenPoiUid') sevenPoiUid: string) {
    const [results, total] =
      await this.searchCompetitorSurroundUseCase.handler(sevenPoiUid);
    return {
      data: results,
      total: total,
    };
  }
  @Get(':id')
  async getPoiById(@Param('id', ParseIntPipe) id: number, @Req() req: CustomRequest) {
    const result = await this.getPoiByIdUseCase.handler(id, req.user.zoneCodes);
    return {
      data: result,
    };
  }
}
