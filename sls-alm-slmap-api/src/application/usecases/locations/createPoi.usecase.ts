import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  PoiRepositoryPort,
  CreatePotentialPoiData,
} from '../../../application/ports/poi.repository';
import { CreatePoiDto } from '../../../adapter/inbound/dtos/createPoi.dto';
import {
  GetCoordinateInfoResult,
  GetCoordinateInfoUseCase,
} from './getCoordinateInfo.usecase';
import { CreateWorkflowTransactionUseCase } from '../workflow/createWorkflowTransaction.usecase';
import { PoiType } from '../../../common/enums/poi.enum';
import { Layer } from '../../../common/enums/layer.enum';
import { Builder } from 'builder-pattern';
import { Potential } from 'src/domain/potential';
import { PotentialStatus } from '@common/enums/potential.enum';
import { DataSource } from 'typeorm';

export interface CreatePoiResult {
  poiId: number;
}

@Injectable()
export class CreatePoiUseCase {
  constructor(
    private readonly getCoordinateInfoUseCase: GetCoordinateInfoUseCase,
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
    private readonly createWorkflowTransactionUseCase: CreateWorkflowTransactionUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async handler(
    dto: CreatePoiDto,
    userId: number,
    userZoneCodes: Record<string, string[]>,
  ): Promise<CreatePoiResult> {
    const coordinateInfo = await this.getCoordinateInfoUseCase.handler(
      userZoneCodes,
      dto.latitude,
      dto.longitude,
    );

    if (!coordinateInfo) {
      throw new BadRequestException(
        'The provided coordinates are outside your authorized zones',
      );
    }

    if (coordinateInfo.zoneAuthorized === false) {
      throw new BadRequestException('You are not authorized to create POIs');
    }

    const nation = coordinateInfo.subDistrict.code.slice(0, 2) || '';
    coordinateInfo.province.code = coordinateInfo.province.code.slice(0, 4);
    coordinateInfo.district.code = coordinateInfo.district.code.slice(0, 6);

    const extendedCoordinateInfo = {
      ...coordinateInfo,
      nation,
    };

    if (dto.type === PoiType.ENVIRONMENT) {
      return this.createEnvironmentPoi(dto, extendedCoordinateInfo, userId);
    } else if (dto.type === PoiType.POTENTIAL) {
      return this.createPotentialPoi(dto, extendedCoordinateInfo, userId);
    }

    throw new BadRequestException(`Invalid POI type: ${dto.type}`);
  }

  private async createEnvironmentPoi(
    dto: CreatePoiDto,
    coordinateInfo: GetCoordinateInfoResult & { nation: string },
    userId?: number,
  ): Promise<CreatePoiResult> {
    if (!dto.environment) {
      throw new BadRequestException(
        'Environment data is required for environment type POI',
      );
    }

    const insertedId = await this.poiRepository.createEnvironmentPoi({
      latitude: dto.latitude,
      longitude: dto.longitude,
      name: dto.environment.name,
      address: dto.environment.address,
      category: dto.environment.category,
      zoneCode: coordinateInfo.zone,
      subzoneCode: coordinateInfo.subzone,
      tamCode: coordinateInfo.subDistrict.code,
      ampCode: coordinateInfo.district.code,
      provCode: coordinateInfo.province.code,
      nation: coordinateInfo.subDistrict.code.slice(0, 2) || '',
      createdBy: userId,
    });

    return { poiId: insertedId };
  }

  private async createPotentialPoi(
    dto: CreatePoiDto,
    coordinateInfo: GetCoordinateInfoResult & { nation: string },
    userId?: number,
  ): Promise<CreatePoiResult> {
    if (!dto.potential) {
      throw new BadRequestException('Potential data is required for potential type POI');
    }

    const potentialData = Builder<CreatePotentialPoiData['potential']>()
      .name(dto.potential.name)
      .address(dto.potential.address)
      .locationType(dto.potential.locationType)
      .areaType(dto.potential.areaType)
      .alcoholSale(dto.potential.alcoholSale)
      .cigaretteSale(dto.potential.cigaretteSale)
      .grade(dto.potential.grade)
      .zoneCode(coordinateInfo.zone)
      .subzoneCode(coordinateInfo.subzone)
      .tamCode(coordinateInfo.subDistrict.code)
      .ampCode(coordinateInfo.district.code)
      .provCode(coordinateInfo.province.code)
      .nation(coordinateInfo.subDistrict.code.slice(0, 2) || '')
      .build();

    const sevenData = dto.seven
      ? Builder<CreatePotentialPoiData['seven']>()
          .name(dto.seven.name)
          .storeCode(dto.seven.storeCode)
          .impactTypeSite(dto.seven.impactType ? Number(dto.seven.impactType) : undefined)
          .impactDetail(dto.seven.impactDetail)
          .estimateDateOpen(dto.seven.estimateDateOpen ?? dto.seven.openMonth)
          .investmentType(dto.seven.investmentType)
          .openMonth(dto.seven.openMonth)
          .storeWidth(
            dto.seven.dimension?.width ? Number(dto.seven.dimension.width) : undefined,
          )
          .storeLength(
            dto.seven.dimension?.length ? Number(dto.seven.dimension.length) : undefined,
          )
          .saleArea(
            dto.seven.dimension?.saleArea
              ? Number(dto.seven.dimension.saleArea)
              : undefined,
          )
          .stockArea(
            dto.seven.dimension?.stockArea
              ? Number(dto.seven.dimension.stockArea)
              : undefined,
          )
          .storeArea(
            dto.seven.dimension?.storeArea
              ? Number(dto.seven.dimension.storeArea)
              : undefined,
          )
          .parkingCount(
            dto.seven.parkingCount ? Number(dto.seven.parkingCount) : undefined,
          )
          .storeBuildingType(
            dto.seven.storeBuildingType ? Number(dto.seven.storeBuildingType) : undefined,
          )
          .storeFranchise(
            dto.seven.investmentType ? Number(dto.seven.investmentType) : undefined,
          )
          .standardLayout(dto.seven.standardLayout)
          .build()
      : undefined;

    const vendingData = dto.vending
      ? Builder<CreatePotentialPoiData['vending']>()
          .storecode(dto.vending.parentBranchCode)
          .machineId(dto.vending.machineId || dto.vending.vendingCode)
          .name(dto.vending.name)
          .serialNumber(dto.vending.serialNumber)
          .vendingModel(dto.vending.model)
          .vendingType(
            dto.vending.vendingType !== undefined
              ? Number(dto.vending.vendingType)
              : Number((dto.vending as any).installationType),
          )
          .locationAddress(dto.vending.address ?? dto.vending.locationAddress)
          .contractStartDate(dto.vending.contractStartDate)
          .contractFinishDate(dto.vending.contractEndDate)
          .contractCancelDate(dto.vending.contractCancelDate)
          .openDate(dto.vending.serviceStartDate)
          .closeDate(dto.vending.serviceEndDate)
          .targetPoint(dto.vending.position ?? dto.vending.targetPoint)
          .businessTypeCode(dto.vending.businessTypeCode)
          .floor(
            dto.vending.floor && !isNaN(Number(dto.vending.floor))
              ? Number(dto.vending.floor)
              : 0, // หรือใช้ null ถ้า DB รองรับ
          )
          .build()
      : undefined;

    const createPotential: CreatePotentialPoiData = {
      layerId: Layer.POTENTIAL,
      latitude: dto.latitude,
      longitude: dto.longitude,
      potential: potentialData,
      seven: sevenData,
      vending: vendingData,
      createdBy: userId,
    };

    // Create transaction to rollback POI creation if workflow transaction fails
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { poiId, potentialStoreId } = await this.poiRepository.createPotentialPoi(
        createPotential,
        queryRunner,
      );

      const workflowTransaction = await this.createWorkflowTransactionUseCase.handler(
        4,
        potentialStoreId,
        userId,
      );

      if (!workflowTransaction.success) {
        throw new BadRequestException(workflowTransaction.error?.message);
      }

      const wfTransactionId = workflowTransaction.data?.wfTransactionId;
      if (!wfTransactionId) {
        throw new BadRequestException(
          'Workflow transaction ID not returned from workflow service',
        );
      }

      const updatePotentialData = Builder<Potential>()
        .wfTransactionId(wfTransactionId)
        .status(PotentialStatus.PRE_POTENTIAL)
        .build();

      await this.poiRepository.updatePotentialStore(
        potentialStoreId,
        updatePotentialData,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      return { poiId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
