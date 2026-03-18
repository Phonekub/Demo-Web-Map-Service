import { PoiMapper } from '../mappers/poi.mapper';
import { SevenElevenMapper } from './mappers/sevenEleven.mapper';
import { SevenElevenNearbyMapper } from './mappers/sevenElevenNearby.mapper';
import { CompetitorMapper } from './mappers/competitor.mapper';
import { CompetitorNearbyMapper } from './mappers/competitorNearby.mapper';
import { CompetitorSurroundMapper } from './mappers/competitorSurround.mapper';
import { EntertainmentAreaNearbyMapper } from './mappers/entertainmentAreaNearby.mapper';
import { VendingMachineMapper } from './mappers/vendingMachine.mapper';
import { PotentialMapper } from './mappers/potential.mapper';
import { PendingApprovalPotentialMapper } from './mappers/pendingApprovalPotential.mapper';
import { OtherPlaceMapper } from '../mappers/otherPlace.mapper';
import { Poi } from '../../../domain/poi';
import { PotentialPendingApproval } from '../../../domain/potentialPendingApproval';
import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder, QueryRunner, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PoiEntity } from './entities/poi.entity';
import { AreaEntity, AreaShape } from './entities/area.entity';
import { PoiSevenElevenEntity } from './entities/sevenEleven.entity';
import { PoiCompetitorEntity } from './entities/competitor.entity';
import { PoiCompetitorSurroundEntity } from './entities/competitorSurround.entity';
import { PoiVendingMachineEntity } from './entities/vendingMachine.entity';
import { PoiPotentialEntity } from './entities/potential.entity';
import { PoiEntertainmentAreaEntity } from './entities/entertainmentArea.entity';
import { ElementSevenElevenEntity } from './entities/elementSevenEleven.entity';
import { ElementVendingMachineEntity } from './entities/elementVendingMachine.entity';
import { MasterCpallZoneEntity } from './entities/masterCpallZone.entity';
import { UserRoleEntity } from './entities/userrole.entity';
import { RoleEntity } from './entities/role.entity';
import { MasterCpallZone } from '../../../domain/masterCpallZone';
import { MasterCpallZoneMapper } from '../mappers/masterCpallZone.mapper';
import {
  PoiRepositoryPort,
  CreateAreaData,
  CreateEnvironmentPoiData,
  CreatePotentialPoiData,
  FindPoisByPolygonParam,
} from '../../../application/ports/poi.repository';
import {
  CompetitorSearchQuery,
  PotentialSearchQuery,
  SevenElevenSearchQuery,
  ClosedStoreSearchQuery,
  VendingMachineSearchQuery,
  OtherPlaceSearchQuery,
  SevenImpactCompetitorSearchQuery,
} from '../../inbound/dtos/search.dto';
import { ApproveStatus, PotentialStatus } from '../../../common/enums/potential.enum';
import { PoiType } from '../../../common/enums/poi.enum';
import { UpdatePoiDtoWithPotential } from 'src/application/usecases/locations/updatePoi.usecase';
import { Potential } from '../../../domain/potential';
import { ImageEntity } from './entities/image.entity';

@Injectable()
export default class PoiRepository implements PoiRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PoiEntity)
    private readonly poiModel: Repository<PoiEntity>,
    @InjectRepository(AreaEntity)
    private readonly areaModel: Repository<AreaEntity>,
    @InjectRepository(PoiSevenElevenEntity)
    private readonly sevenElevenModel: Repository<PoiSevenElevenEntity>,
    @InjectRepository(PoiCompetitorEntity)
    private readonly competitorModel: Repository<PoiCompetitorEntity>,
    @InjectRepository(PoiCompetitorSurroundEntity)
    private readonly competitorSurroundModel: Repository<PoiCompetitorSurroundEntity>,
    @InjectRepository(PoiVendingMachineEntity)
    private readonly vendingMachineModel: Repository<PoiVendingMachineEntity>,
    @InjectRepository(PoiPotentialEntity)
    private readonly potentialModel: Repository<PoiPotentialEntity>,
    @InjectRepository(ElementSevenElevenEntity)
    private readonly elementSevenElevenModel: Repository<ElementSevenElevenEntity>,
    @InjectRepository(ElementVendingMachineEntity)
    private readonly elementVendingMachineModel: Repository<ElementVendingMachineEntity>,
    @InjectRepository(MasterCpallZoneEntity)
    private readonly masterCpallZoneRepository: Repository<MasterCpallZoneEntity>,
    @InjectRepository(PoiEntertainmentAreaEntity)
    private readonly entertainmentAreaModel: Repository<PoiEntertainmentAreaEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleModel: Repository<UserRoleEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleModel: Repository<RoleEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageModel: Repository<ImageEntity>,
  ) {}

  private buildBoundaryAreaPlaceholders(boundaryArea: [string, string][]): {
    placeholders: string;
    parameters: Record<string, string>;
  } {
    const parameters: Record<string, string> = {};
    const placeholders = boundaryArea
      .map((pair, index) => {
        const zoneParam = `zone${index}`;
        const subzoneParam = `subzone${index}`;

        parameters[zoneParam] = pair[0];
        parameters[subzoneParam] = pair[1];

        return `(:${zoneParam}, :${subzoneParam})`;
      })
      .join(',');

    return { placeholders, parameters };
  }

  private buildPolygonWKT(coordinates: [number, number][]): string {
    const polygonCoords = coordinates
      .map((coord) => `${coord[0]} ${coord[1]}`)
      .join(', ');
    return `POLYGON((${polygonCoords}))`;
  }

  async findPoiLocationByQuery(query: string): Promise<[Poi[], number]> {
    const queryBuilder = this.poiModel
      .createQueryBuilder('poi')
      .innerJoinAndSelect('poi.branch', 'branch')
      .leftJoinAndSelect('poi.areas', 'area')
      .select([
        'poi.id',
        'poi.geom',
        'branch.name',
        'branch.code',
        'area.id',
        'area.geom',
        'area.shape',
      ]);

    if (!_.isEmpty(query)) {
      queryBuilder.andWhere('branch.name ILIKE :query', {
        query: `%${query}%`,
      });
    }

    queryBuilder.orderBy('poi.id').limit(20);
    const [result, total] = await queryBuilder.getManyAndCount();
    return _.isEmpty(result) ? [[], total] : [result.map(PoiMapper.toDomain), total];
  }

  async findById(poiId: number): Promise<Poi | null> {
    const poiEntity = await this.poiModel.findOne({
      where: { poiId },
    });
    return poiEntity ? PoiMapper.toDomain(poiEntity) : null;
  }

  async findOverlappingAreas(
    polygonWkt: string,
    excludePoiId: number,
  ): Promise<AreaEntity[]> {
    return await this.areaModel
      .createQueryBuilder('area')
      .where('ST_Intersects(area.geom, ST_GeomFromText(:polygon, 4326))', {
        polygon: polygonWkt,
      })
      .andWhere('area.owner_poi_id != :excludePoiId', { excludePoiId })
      .getMany();
  }
  async findAreaByPoiId(poiId: number): Promise<AreaEntity | null> {
    return await this.areaModel.findOne({
      where: { ownerPoiId: poiId },
    });
  }

  async createArea(areaData: CreateAreaData): Promise<AreaEntity> {
    // Use raw query to insert area with geometry in one step
    const result = await this.areaModel.query(
      `INSERT INTO area (name, shape, geom, owner_poi_id, props, created_at, updated_at)
        VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING area_id`,
      [
        areaData.name,
        areaData.shape === 'polygon' ? 'polygon' : 'circle',
        areaData.geom,
        areaData.ownerPoiId,
        JSON.stringify(areaData.props || {}),
      ],
    );

    const areaId = result[0].area_id;

    // Fetch the created area
    const createdArea = await this.areaModel.findOne({
      where: { id: areaId },
    });

    if (!createdArea) {
      throw new Error(`Failed to create area`);
    }

    return createdArea;
  }

  async updateArea(
    areaId: number,
    areaData: Partial<CreateAreaData>,
  ): Promise<AreaEntity> {
    const updateData: Partial<AreaEntity> = {};

    if (areaData.name) updateData.name = areaData.name;
    if (areaData.shape) {
      updateData.shape =
        areaData.shape === 'polygon' ? AreaShape.POLYGON : AreaShape.CIRCLE;
    }
    if (areaData.ownerPoiId) updateData.ownerPoiId = areaData.ownerPoiId;
    if (areaData.props) updateData.props = areaData.props;

    // Handle geometry separately with raw query to avoid GeoJSON type error
    if (areaData.geom) {
      await this.areaModel.query(
        'UPDATE area SET geom = ST_GeomFromText($1, 4326), updated_at = CURRENT_TIMESTAMP WHERE area_id = $2',
        [areaData.geom, areaId],
      );
    }

    // Update other fields if any
    if (Object.keys(updateData).length > 0) {
      await this.areaModel.update(areaId, updateData);
    }

    const updatedArea = await this.areaModel.findOne({
      where: { id: areaId },
    });

    if (!updatedArea) {
      throw new Error(`Area with ID ${areaId} not found after update`);
    }

    return updatedArea;
  }

  async findSevenElevenNearby(
    lat: number,
    long: number,
    distance: number,
    boundaryArea: [string, string][],
    limit: number = 100,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const point = `POINT(${long} ${lat})`;

    const queryBuilder = this.sevenElevenModel
      .createQueryBuilder('seven')
      .innerJoinAndSelect('seven.poi', 'poi')
      .leftJoin(
        'common_code',
        'cc',
        "cc.code_type = 'SEVEN_TYPE' AND CAST(cc.code_value AS INTEGER) = seven.sevenType",
      )
      .select([
        'seven.id',
        'seven.uid',
        'seven.poiId',
        'seven.storecode',
        'seven.storename',
        'seven.formLocNumber',
        'seven.sevenType',
        'seven.saleAverage',
        'poi.locationT',
        'poi.layerId',
      ])
      .addSelect('cc.code_name', 'sevenTypeName')
      .addSelect(
        'ST_Distance(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography)',
        'distance',
      )
      .where('seven.isActive = :isActive', { isActive: 'Y' })
      .andWhere(
        'ST_DWithin(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography, :distance)',
        {
          point: point,
          distance: distance,
        },
      )
      .orderBy(
        'ST_Distance(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography)',
      )
      .limit(limit)
      .offset(offset);

    const result = await queryBuilder.getRawAndEntities();
    const total = await queryBuilder.getCount();

    const mappedResults = result.entities.map((entity, index) => {
      const mapped = SevenElevenNearbyMapper.toDomain(entity);
      mapped.sevenTypeName = result.raw[index].sevenTypeName || null;
      mapped.distance = parseFloat(result.raw[index].distance) || 0;
      return mapped;
    });

    return _.isEmpty(mappedResults) ? [[], total] : [mappedResults, total];
  }

  async findCompetitorNearby(
    lat: number,
    long: number,
    distance: number,
    boundaryArea: [string, string][],
    limit: number = 100,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const point = `POINT(${long} ${lat})`;

    const queryBuilder = this.competitorModel
      .createQueryBuilder('competitor')
      .innerJoinAndSelect('competitor.poi', 'poi')
      .leftJoin(
        'common_code',
        'cc',
        // "cc.code_type = 'COMPETITOR_TYPE' AND cc.code_value IS NOT NULL AND CAST(cc.code_value AS INTEGER) = competitor.type",
        "cc.code_type = 'COMPETITOR_TYPE' AND cc.code_mapping = CAST(competitor.type AS VARCHAR)",
      )
      .select([
        'competitor.id',
        'competitor.poiId',
        'competitor.grade',
        'competitor.saleAverage',
        'competitor.openTime',
        'competitor.closeTime',
        'competitor.type',
        'poi.uid',
        'poi.name',
        'poi.namt',
        'poi.locationT',
        'poi.layerId',
      ])
      .addSelect('cc.code_name', 'competitorTypeName')
      .addSelect('poi.layerId', 'competitorLayerId')
      .addSelect(
        'ST_Distance(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography)',
        'distance',
      )
      .where('poi.isActive = :isActive', { isActive: 'Y' })
      .andWhere(
        'ST_DWithin(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography, :distance)',
        {
          point: point,
          distance: distance,
        },
      )
      .orderBy(
        'ST_Distance(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography)',
      )
      .limit(limit)
      .offset(offset);

    const result = await queryBuilder.getRawAndEntities();
    const total = await queryBuilder.getCount();

    const mappedResults = result.entities.map((entity, index) => {
      const mapped = CompetitorNearbyMapper.toDomain(entity);
      mapped.competitorTypeName = result.raw[index].competitorTypeName || null;
      mapped.competitorLayerId = result.raw[index].competitorLayerId || 6; //6 is competitor layer
      mapped.distance = parseFloat(result.raw[index].distance) || 0;
      return mapped;
    });

    return _.isEmpty(mappedResults) ? [[], total] : [mappedResults, total];
  }

  async findEntertainmentAreaNearby(
    lat: number,
    long: number,
    distance: number,
    boundaryArea: [string, string][],
    limit: number = 100,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const point = `POINT(${long} ${lat})`;

    const queryBuilder = this.entertainmentAreaModel
      .createQueryBuilder('entertainment')
      .innerJoinAndSelect('entertainment.poi', 'poi')
      .leftJoin(
        'common_code',
        'cc',
        "cc.code_type = 'CHAIN_STORE' AND cc.code_value = entertainment.subCode",
      )
      .select([
        'entertainment.id',
        'entertainment.poiId',
        'entertainment.subCode',
        'entertainment.name',
        'entertainment.namt',
        'entertainment.locationT',
        'entertainment.personAmount',
        'entertainment.parkingAmount',
        'entertainment.workingDay',
        'entertainment.openTime',
        'entertainment.closeTime',
        'poi.uid',
        'poi.locationT',
        'poi.layerId',
      ])
      .addSelect('cc.code_name', 'storeType')
      .addSelect("CASE WHEN poi.layerId = 2 THEN 'Food' ELSE 'Non-Food' END", 'goodsType')
      .addSelect(
        'ST_Distance(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography)',
        'distance',
      )
      .where('entertainment.isActive = :isActive', { isActive: 'Y' })
      .andWhere(
        'ST_DWithin(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography, :distance)',
        {
          point: point,
          distance: distance,
        },
      )
      .orderBy(
        'ST_Distance(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography)',
      )
      .limit(limit)
      .offset(offset);

    const result = await queryBuilder.getRawAndEntities();
    const total = await queryBuilder.getCount();

    const mappedResults = result.entities.map((entity, index) => {
      const mapped = EntertainmentAreaNearbyMapper.toDomain(entity);
      mapped.storeType = result.raw[index].storeType || null;
      mapped.goodsType = result.raw[index].goodsType || null;
      mapped.distance = parseFloat(result.raw[index].distance) || 0;
      return mapped;
    });

    return _.isEmpty(mappedResults) ? [[], total] : [mappedResults, total];
  }

  async findSevenStore(
    params: SevenElevenSearchQuery,
    boundaryArea: [string, string][],
    store: string[],
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);

    const queryBuilder = this.sevenElevenModel
      .createQueryBuilder('seven')
      .innerJoinAndSelect('seven.poi', 'poi')
      .innerJoinAndSelect('poi.layer', 'layer')
      .select([
        'seven.id',
        'seven.uid',
        'seven.poiId',
        'seven.storecode',
        'seven.storename',
        'seven.sevenType',
        'poi.shape',
        'poi.locationT',
        'layer.id',
        'layer.availableTabs',
        'layer.symbol',
      ])
      .where('seven.isActive = :isActive', { isActive: 'Y' })
      .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters);

    // Add distance calculation if lat/long provided and not 0,0
    if (
      params.lat != null &&
      params.long != null &&
      params.lat !== 0 &&
      params.long !== 0
    ) {
      const point = `POINT(${params.long} ${params.lat})`;
      queryBuilder.addSelect(
        'ST_Distance(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography)',
        'distance',
      );
      queryBuilder.setParameter('point', point);
    }

    if (!_.isEmpty(params.text)) {
      queryBuilder.andWhere(
        '(seven.storename ILIKE :text OR seven.storecode ILIKE :text)',
        { text: `%${params.text}%` },
      );
    }

    if (!_.isNil(params.countryCode)) {
      queryBuilder.andWhere('poi.nation = :countryCode', {
        countryCode: params.countryCode,
      });
    }

    if (!_.isNil(params.provinceCode)) {
      queryBuilder.andWhere('poi.provCode = :provCode', {
        provCode: params.provinceCode,
      });
    }

    if (params.districtCode) {
      queryBuilder.andWhere('poi.ampCode = :ampCode', {
        ampCode: params.districtCode,
      });
    }

    if (params.subDistrictCode) {
      queryBuilder.andWhere('poi.tamCode = :tamCode', {
        tamCode: params.subDistrictCode,
      });
    }

    if (!_.isEmpty(params.address)) {
      queryBuilder.andWhere(
        '(poi.locationT ILIKE :address OR poi.locationE ILIKE :address)',
        { address: `%${params.address}%` },
      );
    }

    if (!_.isEmpty(params.sevenType)) {
      queryBuilder.andWhere('(seven.sevenType = :sevenType)', {
        sevenType: params.sevenType,
      });
    }

    // Order by distance if lat/long provided and not 0,0, otherwise by storeCode
    if (
      params.lat != null &&
      params.long != null &&
      params.lat !== 0 &&
      params.long !== 0
    ) {
      queryBuilder.orderBy(
        'ST_Distance(poi.shape::geography, ST_GeomFromText(:point, 4326)::geography)',
        'ASC',
      );
    } else {
      queryBuilder.orderBy('seven.storeCode');
    }

    if (!_.isNil(store)) {
      // queryBuilder
      //   .innerJoin('seven.sevenProfile', 'sevenProfile')
      //   .orWhere('sevenProfile.mnEmployeeId IS NULL')
      //   .orWhere('sevenProfile.dvEmployeeId IS NULL')
      //   .orWhere('sevenProfile.gmEmployeeId IS NULL')
      //   .orWhere('sevenProfile.avpEmployeeId IS NULL');

      if (!_.isEmpty(store)) {
        queryBuilder.andWhere('seven.storecode IN (:...store)', { store });
      }
    }

    queryBuilder.limit(limit).offset(offset);

    // If distance is calculated, use getRawAndEntities to get both entities and raw distance
    if (
      params.lat != null &&
      params.long != null &&
      params.lat !== 0 &&
      params.long !== 0
    ) {
      const { entities, raw } = await queryBuilder.getRawAndEntities();
      const total = await queryBuilder.getCount();

      if (_.isEmpty(entities)) {
        return [[], total];
      }

      // Map entities and attach distance from raw results
      const result = entities.map((entity, index) => {
        const poi = SevenElevenMapper.toDomain(entity);
        const rawRow = raw[index];
        const distance = parseFloat(rawRow?.distance ?? '0');

        return {
          ...poi,
          distance,
        };
      });

      return [result, total];
    }

    const [result, total] = await queryBuilder.getManyAndCount();
    return _.isEmpty(result)
      ? [[], total]
      : [result.map(SevenElevenMapper.toDomain), total];
  }

  async findPoisByPolygon(params: FindPoisByPolygonParam): Promise<[Poi[], number]> {
    const { coordinates, boundaryArea, store, storeType, limit, offset } = params;
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);
    const polygonWKT = this.buildPolygonWKT(coordinates);

    let queryBuilder: SelectQueryBuilder<any>;
    let mapper: any;

    switch (storeType) {
      case 'sevenEleven':
        queryBuilder = this.sevenElevenModel
          .createQueryBuilder('seven')
          .innerJoinAndSelect('seven.poi', 'poi')
          .innerJoinAndSelect('poi.layer', 'layer')
          .select([
            'seven.id',
            'seven.uid',
            'seven.poiId',
            'seven.storecode',
            'seven.storename',
            'seven.sevenType',
            'poi.shape',
            'poi.locationT',
            'layer.id',
            'layer.availableTabs',
            'layer.symbol',
          ])
          .where('seven.isActive = :isActive', { isActive: 'Y' })
          .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters)
          .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
            polygon: polygonWKT,
          });
        mapper = SevenElevenMapper;
        break;

      case 'competitor':
        queryBuilder = this.competitorModel
          .createQueryBuilder('competitor')
          .innerJoinAndSelect('competitor.poi', 'poi')
          .innerJoinAndSelect('poi.layer', 'layer')
          .select([
            'competitor.id',
            'competitor.poiId',
            'poi.uid',
            'poi.name',
            'poi.namt',
            'poi.shape',
            'poi.locationT',
            'layer.id',
            'layer.availableTabs',
            'layer.symbol',
          ])
          .where('poi.isActive = :isActive', { isActive: 'Y' })
          .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters)
          .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
            polygon: polygonWKT,
          });
        mapper = CompetitorMapper;
        break;

      case 'potential':
        queryBuilder = this.potentialModel
          .createQueryBuilder('potential')
          .innerJoinAndSelect('potential.poi', 'poi')
          .innerJoinAndSelect('poi.layer', 'layer')
          .select([
            'potential.id',
            'potential.uid',
            'potential.poiId',
            'potential.status',
            'potential.rentType',
            'poi.name',
            'poi.namt',
            'poi.shape',
            'poi.locationT',
            'layer.id',
            'layer.availableTabs',
            'layer.symbol',
          ])
          .where('poi.isActive = :isActive', { isActive: 'Y' })
          .andWhere(
            `((poi.zoneCode, poi.subzoneCode) IN (${placeholders}) OR poi.subzoneCode IS NULL)`,
            parameters,
          )
          .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
            polygon: polygonWKT,
          });
        mapper = PotentialMapper;
        break;

      case 'otherPlace':
        queryBuilder = this.poiModel
          .createQueryBuilder('poi')
          .innerJoinAndSelect('poi.layer', 'layer')
          .select([
            'poi.poiId',
            'poi.uid',
            'poi.layerId',
            'poi.name',
            'poi.namt',
            'poi.locationT',
            'poi.locationE',
            'poi.shape',
            'layer.availableTabs',
            'layer.symbol',
          ])
          .where('poi.isActive = :isActive', { isActive: 'Y' })
          .andWhere('layer.isLandmark = :isLandmark', { isLandmark: 'Y' })
          .andWhere(
            `((poi.zoneCode, poi.subzoneCode) IN (${placeholders}) OR poi.subzoneCode IS NULL)`,
            parameters,
          )
          .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
            polygon: polygonWKT,
          });
        mapper = OtherPlaceMapper;
        break;

      case 'vending':
        queryBuilder = this.vendingMachineModel
          .createQueryBuilder('vending')
          .innerJoinAndSelect('vending.poi', 'poi')
          .innerJoinAndSelect('poi.layer', 'layer')
          .select([
            'vending.id',
            'vending.uid',
            'vending.poiId',
            'vending.mainStorecode',
            'vending.mainStorename',
            'vending.machineId',
            'vending.locationTypeCode',
            'vending.serialNumber',
            'vending.type',
            'vending.model',
            'vending.flowStatus',
            'poi.shape',
            'poi.locationT',
            'layer.availableTabs',
            'layer.symbol',
          ])
          .where('vending.isActive = :isActive', { isActive: 'Y' })
          .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters)
          .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
            polygon: polygonWKT,
          });
        mapper = VendingMachineMapper;
        break;

      case 'permanentClosed': {
        // Query closed seven-eleven stores
        const sevenElevenQuery = this.sevenElevenModel
          .createQueryBuilder('seven')
          .innerJoinAndSelect('seven.poi', 'poi')
          .innerJoinAndSelect('poi.layer', 'layer')
          .select([
            'seven.id',
            'seven.uid',
            'seven.poiId',
            'seven.storecode',
            'seven.storename',
            'seven.sevenType',
            'poi.shape',
            'poi.locationT',
            'layer.id',
            'layer.availableTabs',
            'layer.symbol',
          ])
          .where('poi.isActive = :isActive', { isActive: 'N' })
          .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters)
          .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
            polygon: polygonWKT,
          })
          .limit(Math.ceil(limit / 2))
          .offset(offset);

        // Query closed competitor stores
        const competitorQuery = this.competitorModel
          .createQueryBuilder('competitor')
          .innerJoinAndSelect('competitor.poi', 'poi')
          .innerJoinAndSelect('poi.layer', 'layer')
          .select([
            'competitor.id',
            'competitor.poiId',
            'poi.uid',
            'poi.name',
            'poi.namt',
            'poi.shape',
            'poi.locationT',
            'layer.availableTabs',
            'layer.symbol',
          ])
          .where('poi.isActive = :isActive', { isActive: 'N' })
          .andWhere(
            `((poi.zoneCode, poi.subzoneCode) IN (${placeholders}) OR poi.subzoneCode IS NULL)`,
            parameters,
          )
          .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
            polygon: polygonWKT,
          })
          .limit(Math.ceil(limit / 2))
          .offset(offset);

        // Execute both queries
        const [sevenElevenResult, sevenElevenTotal] =
          await sevenElevenQuery.getManyAndCount();
        const [competitorResult, competitorTotal] =
          await competitorQuery.getManyAndCount();

        // Combine results
        const combinedResult = [
          ...sevenElevenResult.map(SevenElevenMapper.toDomain),
          ...competitorResult.map(CompetitorMapper.toDomain),
        ];
        const combinedTotal = sevenElevenTotal + competitorTotal;

        return [combinedResult, combinedTotal];
      }

      case 'sevenImpactCompetitor':
        //query seven impect competitor
        queryBuilder = this.sevenElevenModel
          .createQueryBuilder('seven')
          .innerJoinAndSelect('seven.poi', 'poi')
          .innerJoinAndSelect('poi.layer', 'layer')
          .innerJoin('poi_competitor_surround', 'pcs', 'pcs.seven_poi_uid = poi.uid')
          .select([
            'seven.id',
            'seven.poiId',
            'seven.storecode',
            'seven.storename',
            'seven.sevenType',
            'poi.uid',
            'poi.shape',
            'poi.locationT',
            'layer.id',
            'layer.availableTabs',
            'layer.symbol',
          ])
          .addSelect('COUNT(*)', 'totalCompetitor')
          .where('seven.isActive = :active', { active: 'Y' })
          .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters)
          .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
            polygon: polygonWKT,
          })
          .groupBy('seven.id')
          .addGroupBy('seven.poiId')
          .addGroupBy('seven.storeCode')
          .addGroupBy('seven.storeName')
          .addGroupBy('seven.sevenType')
          .addGroupBy('poi.uid')
          .addGroupBy('poi.poiId')
          .addGroupBy('poi.shape')
          .addGroupBy('poi.name')
          .addGroupBy('poi.locationT')
          .addGroupBy('layer.id')
          .addGroupBy('layer.availableTabs')
          .addGroupBy('layer.symbol')
          .orderBy('seven.storeCode');

        // Special handling for sevenImpactCompetitor with GROUP BY
        const { entities, raw } = await queryBuilder.getRawAndEntities();
        const total = await queryBuilder.getCount();

        const result = entities.map((entity, index) => {
          const mapped = SevenElevenMapper.toDomain(entity);
          mapped.totalCompetitor = parseInt(raw[index].totalCompetitor, 10);
          return mapped;
        });

        return _.isEmpty(result) ? [[], total] : [result, total];

      default:
        throw new Error(`Unsupported store type: ${storeType}`);
    }

    if (!_.isNil(store)) {
      queryBuilder
        .innerJoin('seven.sevenProfile', 'sevenProfile')
        .orWhere('sevenProfile.mnEmployeeId IS NULL')
        .orWhere('sevenProfile.dvEmployeeId IS NULL')
        .orWhere('sevenProfile.gmEmployeeId IS NULL')
        .orWhere('sevenProfile.avpEmployeeId IS NULL');

      if (!_.isEmpty(store)) {
        queryBuilder.orWhere('seven.storecode IN (:...store)', { store });
      }
    }

    queryBuilder.limit(limit).offset(offset);

    const [result, total] = await queryBuilder.getManyAndCount();
    return _.isEmpty(result) ? [[], total] : [result.map(mapper.toDomain), total];
  }

  async findPoisByPolygonGroupByLayer(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
    limit: number = 100,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);

    const polygonWKT = this.buildPolygonWKT(coordinates);
    const queryBuilder = this.poiModel
      .createQueryBuilder('poi')
      .leftJoin('profile_sub_code', 'psc', 'psc.sub_code = poi.sub_code')
      .leftJoin('profile_categories', 'pc', 'pc.id = psc.profile_cagetory_id')
      .leftJoin(
        'profile_sub_categories',
        'pscat',
        'pscat.id = psc.profile_sub_cagetory_id',
      )
      .leftJoin(
        'dform',
        'df',
        "df.reference_obj = 'poi' AND df.reference_key = poi.poi_id",
      )
      .leftJoin(
        'dform_field',
        'dff_pop',
        "dff_pop.field_name = 'TOTAL_POPULATION' AND dff_pop.form_version_id = df.form_version_id",
      )
      .leftJoin(
        'dform_value',
        'dfv_pop',
        'dfv_pop.form_id = df.form_id AND dfv_pop.field_id = dff_pop.field_id',
      )
      .leftJoin(
        'dform_field',
        'dff_pct',
        "dff_pct.field_name = 'EXPECTED_CUSTOMER_PCT' AND dff_pct.form_version_id = df.form_version_id",
      )
      .leftJoin(
        'dform_value',
        'dfv_pct',
        'dfv_pct.form_id = df.form_id AND dfv_pct.field_id = dff_pct.field_id',
      )
      .leftJoin('master_geo_location', 'mgeo', 'mgeo.code = poi.prov_code')
      .select([
        'poi.poi_id AS "poiId"',
        'poi.uid AS "uid"',
        'poi.name AS "name"',
        'poi.namt AS "namt"',
        'poi.location_t AS "locationT"',
        'poi.location_e AS "locationE"',
        'poi.shape AS "shape"',
        'poi.sub_code AS "subCode"',
        'poi.prov_code AS "provCode"',
        'poi.amp_code AS "ampCode"',
        'poi.tam_code AS "tamCode"',

        'psc.profile_cagetory_id AS "layerId"',
        'pc.category AS "layerName"',
        'pc.category_th AS "categoryTh"',
        'pc.category_en AS "categoryEn"',
        'pc.category_kh AS "categoryKh"',
        'mgeo.prov_grade AS "provGrade"',
        'mgeo.prov_category AS "provCategory"',

        'psc.profile_sub_cagetory_id AS "profileSubCategoryId"',
        'pscat.form_config_id AS "formConfigId"',

        'COALESCE(dfv_pop.value, \'0\') AS "populationAmount"',
        'COALESCE(dfv_pct.value, \'0\') AS "percentPredictCustomer"',
      ])
      .where('poi.is_active = :isActive', { isActive: 'Y' })
      .andWhere(
        `((poi.zone_code, poi.subzone_code) IN (${placeholders}) OR poi.subzone_code IS NULL)`,
        parameters,
      )
      .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
        polygon: polygonWKT,
      })
      .orderBy('psc.profile_cagetory_id', 'ASC')
      .limit(limit)
      .offset(offset);

    const result = await queryBuilder.getRawMany();

    const total = await this.poiModel
      .createQueryBuilder('poi')
      .where('poi.is_active = :isActive', { isActive: 'Y' })
      .andWhere(
        `((poi.zone_code, poi.subzone_code) IN (${placeholders}) OR poi.subzone_code IS NULL)`,
        parameters,
      )
      .andWhere('ST_Within(poi.shape, ST_GeomFromText(:polygon, 4326))', {
        polygon: polygonWKT,
      })
      .getCount();

    if (_.isEmpty(result)) {
      return [[], total];
    }

    const mappedResults = result.map((result) => {
      let geom = null;
      if (result.shape) {
        try {
          geom =
            typeof result.shape === 'string' ? JSON.parse(result.shape) : result.shape;
        } catch {
          geom = null;
        }
      }

      return {
        id: result.poiId?.toString() || '',
        uid: result.uid || '',
        branchName: result.name || result.namt || '',
        name: result.name || '',
        namt: result.namt || '',
        branchCode: '',
        location: result.locationT || result.locationE || '',
        layerId: result.layerId,
        layerName: result.layerName || '',
        layerTh: result.categoryTh || '',
        layerEn: result.categoryEn || '',
        layerKh: result.categoryKh || '',
        subCode: result.subCode || '',
        geom: geom,
        area: null,
        profileSubCategoryId: result.profileSubCategoryId ?? null,
        formConfigId: result.formConfigId ?? null,
        populationAmount: result.populationAmount || '0',
        percentPredictCustomer: result.percentPredictCustomer || '0',
        provCode: result.provCode || null,
        ampCode: result.ampCode || null,
        tamCode: result.tamCode || null,
        provGrade: result.provGrade || null,
        provCategory: result.provCategory || null,
      } as Poi;
    });

    return [mappedResults, total];
  }

  async findCompetitorStore(
    params: CompetitorSearchQuery,
    boundaryArea: [string, string][],
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);

    const queryBuilder = this.competitorModel
      .createQueryBuilder('competitor')
      .innerJoinAndSelect('competitor.poi', 'poi')
      .innerJoinAndSelect('poi.layer', 'layer')
      .select([
        'competitor.id',
        'competitor.poiId',
        'poi.uid',
        'poi.name',
        'poi.namt',
        'poi.shape',
        'poi.locationT',
        'layer.id',
        'layer.availableTabs',
        'layer.symbol',
      ])
      .where('poi.isActive = :isActive', { isActive: 'Y' })
      .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters);

    if (!_.isEmpty(params.text)) {
      queryBuilder.andWhere('(poi.name ILIKE :text OR poi.namt ILIKE :text)', {
        text: `%${params.text}%`,
      });
    }

    if (!_.isNil(params.countryCode)) {
      queryBuilder.andWhere('poi.nation = :countryCode', {
        countryCode: params.countryCode,
      });
    }

    if (!_.isNil(params.provinceCode)) {
      queryBuilder.andWhere('poi.provCode = :provCode', {
        provCode: params.provinceCode,
      });
    }

    if (params.districtCode) {
      queryBuilder.andWhere('poi.ampCode = :ampCode', {
        ampCode: params.districtCode,
      });
    }

    if (params.subDistrictCode) {
      queryBuilder.andWhere('poi.tamCode = :tamCode', {
        tamCode: params.subDistrictCode,
      });
    }

    if (!_.isEmpty(params.address)) {
      queryBuilder.andWhere(
        '(poi.locationT ILIKE :address OR poi.locationE ILIKE :address)',
        { address: `%${params.address}%` },
      );
    }

    if (!_.isEmpty(params.textOtherBrand)) {
      queryBuilder.andWhere(
        'poi.namt ILIKE :textOtherBrand OR poi.name ILIKE :textOtherBrand',
        {
          textOtherBrand: `%${params.textOtherBrand}%`,
        },
      );
    }

    queryBuilder.orderBy('competitor.id').limit(limit).offset(offset);

    const [result, total] = await queryBuilder.getManyAndCount();
    return _.isEmpty(result)
      ? [[], total]
      : [result.map(CompetitorMapper.toDomain), total];
  }

  async findPotentialStore(
    params: PotentialSearchQuery,
    boundaryArea: [string, string][],
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);

    const queryBuilder = this.potentialModel
      .createQueryBuilder('potential')
      .innerJoinAndSelect('potential.poi', 'poi')
      .innerJoinAndSelect('poi.layer', 'layer')
      .select([
        'potential.id',
        'potential.uid',
        'potential.poiId',
        'potential.status',
        'potential.rentType',
        'poi.name',
        'poi.namt',
        'poi.shape',
        'poi.locationT',
        'layer.id',
        'layer.availableTabs',
        'layer.symbol',
      ])
      .where('poi.isActive = :isActive', { isActive: 'Y' });

    // Apply boundary area filter, handling NULL subzone codes
    if (boundaryArea.length > 0) {
      queryBuilder.andWhere(
        `((poi.zoneCode, poi.subzoneCode) IN (${placeholders}) OR poi.subzoneCode IS NULL)`,
        parameters,
      );
    }

    if (!_.isEmpty(params.text)) {
      queryBuilder.andWhere(
        '(poi.name ILIKE :text OR poi.namt ILIKE :text OR potential.form_loc_number ILIKE :text)',
        {
          text: `%${params.text}%`,
        },
      );
    }

    if (!_.isNil(params.countryCode)) {
      queryBuilder.andWhere('poi.nation = :countryCode', {
        countryCode: params.countryCode,
      });
    }

    if (!_.isNil(params.provinceCode)) {
      queryBuilder.andWhere('poi.provCode = :provCode', {
        provCode: params.provinceCode,
      });
    }

    if (params.districtCode) {
      queryBuilder.andWhere('poi.ampCode = :ampCode', {
        ampCode: params.districtCode,
      });
    }

    if (params.subDistrictCode) {
      queryBuilder.andWhere('poi.tamCode = :tamCode', {
        tamCode: params.subDistrictCode,
      });
    }

    if (!_.isEmpty(params.address)) {
      queryBuilder.andWhere(
        '(poi.locationT ILIKE :address OR poi.locationE ILIKE :address)',
        { address: `%${params.address}%` },
      );
    }

    if (!_.isEmpty(params.status)) {
      const statuses = params.status.split(',').map((s) => s.trim());
      queryBuilder.andWhere('potential.status IN (:...statuses)', {
        statuses,
      });
    }

    if (!_.isEmpty(params.rent_type)) {
      queryBuilder.andWhere('potential.rentType = :rentType', {
        rentType: params.rent_type,
      });
    }

    if (params.forcedZone) {
      queryBuilder.andWhere('poi.zoneCode = :zoneCode', {
        zoneCode: params.forcedZone,
      });
    }

    queryBuilder.orderBy('potential.id').limit(limit).offset(offset);

    const [result, total] = await queryBuilder.getManyAndCount();
    return _.isEmpty(result)
      ? [[], total]
      : [result.map(PotentialMapper.toDomain), total];
  }

  async findOtherPlace(
    params: OtherPlaceSearchQuery,
    boundaryArea: [string, string][],
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);

    const queryBuilder = this.poiModel
      .createQueryBuilder('poi')
      .innerJoinAndSelect('poi.layer', 'layer')
      .select([
        'poi.poiId',
        'poi.uid',
        'poi.layerId',
        'poi.name',
        'poi.namt',
        'poi.locationT',
        'poi.locationE',
        'poi.shape',
        'layer.availableTabs',
        'layer.symbol',
      ])
      .where('poi.isActive = :isActive', { isActive: 'Y' })
      .andWhere('layer.isLandmark = :isLandmark', { isLandmark: 'Y' });

    // Apply boundary area filter, handling NULL subzone codes
    if (boundaryArea.length > 0) {
      queryBuilder.andWhere(
        `((poi.zoneCode, poi.subzoneCode) IN (${placeholders}) OR poi.subzoneCode IS NULL)`,
        parameters,
      );
    }

    if (!_.isEmpty(params.text)) {
      queryBuilder.andWhere('(poi.name ILIKE :text OR poi.namt ILIKE :text)', {
        text: `%${params.text}%`,
      });
    }

    if (!_.isNil(params.layerId)) {
      queryBuilder.andWhere('poi.layerId = :layerId', {
        layerId: params.layerId,
      });
    }

    if (!_.isNil(params.countryCode)) {
      queryBuilder.andWhere('poi.nation = :countryCode', {
        countryCode: params.countryCode,
      });
    }

    if (!_.isNil(params.provinceCode)) {
      queryBuilder.andWhere('poi.provCode = :provCode', {
        provCode: params.provinceCode,
      });
    }

    if (params.districtCode) {
      queryBuilder.andWhere('poi.ampCode = :ampCode', {
        ampCode: params.districtCode,
      });
    }

    if (params.subDistrictCode) {
      queryBuilder.andWhere('poi.tamCode = :tamCode', {
        tamCode: params.subDistrictCode,
      });
    }

    if (!_.isEmpty(params.address)) {
      queryBuilder.andWhere(
        '(poi.locationT ILIKE :address OR poi.locationE ILIKE :address)',
        { address: `%${params.address}%` },
      );
    }

    if (params.forcedZone) {
      queryBuilder.andWhere('poi.zoneCode = :zoneCode', {
        zoneCode: params.forcedZone,
      });
    }

    queryBuilder.orderBy('poi.poiId').limit(limit).offset(offset);

    const [result, total] = await queryBuilder.getManyAndCount();
    return _.isEmpty(result)
      ? [[], total]
      : [result.map(OtherPlaceMapper.toDomain), total];
  }

  async findClosedSevenEleven(
    params: ClosedStoreSearchQuery,
    boundaryArea: [string, string][],
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);

    const queryBuilder = this.sevenElevenModel
      .createQueryBuilder('seven')
      .innerJoinAndSelect('seven.poi', 'poi')
      .innerJoinAndSelect('poi.layer', 'layer')
      .select([
        'seven.id',
        'seven.uid',
        'seven.poiId',
        'seven.storecode',
        'seven.storename',
        'seven.sevenType',
        'poi.shape',
        'poi.locationT',
        'layer.id',
        'layer.availableTabs',
        'layer.symbol',
      ])
      .where('poi.isActive = :isActive', { isActive: 'N' })
      .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters);

    if (!_.isEmpty(params.text)) {
      queryBuilder.andWhere(
        '(seven.storename ILIKE :text OR seven.storecode ILIKE :text)',
        { text: `%${params.text}%` },
      );
    }

    if (!_.isNil(params.countryCode)) {
      queryBuilder.andWhere('poi.nation = :countryCode', {
        countryCode: params.countryCode,
      });
    }

    if (!_.isNil(params.provinceCode)) {
      queryBuilder.andWhere('poi.provCode = :provCode', {
        provCode: params.provinceCode,
      });
    }

    if (params.districtCode) {
      queryBuilder.andWhere('poi.ampCode = :ampCode', {
        ampCode: params.districtCode,
      });
    }

    if (params.subDistrictCode) {
      queryBuilder.andWhere('poi.tamCode = :tamCode', {
        tamCode: params.subDistrictCode,
      });
    }

    if (!_.isEmpty(params.address)) {
      queryBuilder.andWhere(
        '(poi.locationT ILIKE :address OR poi.locationE ILIKE :address)',
        { address: `%${params.address}%` },
      );
    }

    queryBuilder.orderBy('seven.id').limit(limit).offset(offset);

    const [result, total] = await queryBuilder.getManyAndCount();
    return _.isEmpty(result)
      ? [[], total]
      : [result.map(SevenElevenMapper.toDomain), total];
  }

  async findClosedCompetitor(
    params: ClosedStoreSearchQuery,
    boundaryArea: [string, string][],
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);

    const queryBuilder = this.competitorModel
      .createQueryBuilder('competitor')
      .innerJoinAndSelect('competitor.poi', 'poi')
      .innerJoinAndSelect('poi.layer', 'layer')
      .select([
        'competitor.id',
        'competitor.poiId',
        'poi.uid',
        'poi.name',
        'poi.namt',
        'poi.shape',
        'poi.locationT',
        'layer.id',
        'layer.availableTabs',
        'layer.symbol',
      ])
      .where('poi.isActive = :isActive', { isActive: 'N' });

    // Apply boundary area filter, handling NULL subzone codes
    if (boundaryArea.length > 0) {
      queryBuilder.andWhere(
        `((poi.zoneCode, poi.subzoneCode) IN (${placeholders}) OR poi.subzoneCode IS NULL)`,
        parameters,
      );
    }

    if (!_.isEmpty(params.text)) {
      queryBuilder.andWhere('(poi.name ILIKE :text OR poi.namt ILIKE :text)', {
        text: `%${params.text}%`,
      });
    }

    if (!_.isNil(params.countryCode)) {
      queryBuilder.andWhere('poi.nation = :countryCode', {
        countryCode: params.countryCode,
      });
    }

    if (!_.isNil(params.provinceCode)) {
      queryBuilder.andWhere('poi.provCode = :provCode', {
        provCode: params.provinceCode,
      });
    }

    if (params.districtCode) {
      queryBuilder.andWhere('poi.ampCode = :ampCode', {
        ampCode: params.districtCode,
      });
    }

    if (params.subDistrictCode) {
      queryBuilder.andWhere('poi.tamCode = :tamCode', {
        tamCode: params.subDistrictCode,
      });
    }

    if (!_.isEmpty(params.address)) {
      queryBuilder.andWhere(
        '(poi.locationT ILIKE :address OR poi.locationE ILIKE :address)',
        { address: `%${params.address}%` },
      );
    }

    queryBuilder.orderBy('competitor.id').limit(limit).offset(offset);

    const [result, total] = await queryBuilder.getManyAndCount();
    return _.isEmpty(result)
      ? [[], total]
      : [result.map(CompetitorMapper.toDomain), total];
  }

  async findVendingMachineStore(
    params: VendingMachineSearchQuery,
    boundaryArea: [string, string][],
    store: string[],
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Poi[], number]> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);

    const queryBuilder = this.vendingMachineModel
      .createQueryBuilder('vending')
      .innerJoinAndSelect('vending.poi', 'poi')
      .innerJoinAndSelect('poi.layer', 'layer')
      .innerJoin('seven_eleven', 'seven', 'vending.main_storecode = seven.storecode')
      .select([
        'vending.id',
        'vending.uid',
        'vending.poiId',
        'vending.mainStorecode',
        'vending.mainStorename',
        'vending.machineId',
        'vending.locationTypeCode',
        'vending.serialNumber',
        'vending.type',
        'vending.model',
        'vending.flowStatus',
        'poi.shape',
        'poi.locationT',
        'layer.availableTabs',
        'layer.symbol',
      ])
      .where('vending.isActive = :isActive', { isActive: 'Y' })
      .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters);

    if (!_.isEmpty(params.text)) {
      queryBuilder.andWhere(
        '(vending.machineId ILIKE :text OR vending.serialNumber ILIKE :text)',
        { text: `%${params.text}%` },
      );
    }

    if (!_.isNil(params.countryCode)) {
      queryBuilder.andWhere('poi.nation = :countryCode', {
        countryCode: params.countryCode,
      });
    }

    if (!_.isNil(params.provinceCode)) {
      queryBuilder.andWhere('poi.provCode = :provCode', {
        provCode: params.provinceCode,
      });
    }

    if (params.districtCode) {
      queryBuilder.andWhere('poi.ampCode = :ampCode', {
        ampCode: params.districtCode,
      });
    }

    if (params.subDistrictCode) {
      queryBuilder.andWhere('poi.tamCode = :tamCode', {
        tamCode: params.subDistrictCode,
      });
    }

    if (!_.isEmpty(params.address)) {
      queryBuilder.andWhere(
        '(poi.locationT ILIKE :address OR poi.locationE ILIKE :address)',
        { address: `%${params.address}%` },
      );
    }

    if (!_.isEmpty(params.mainSevenStore)) {
      queryBuilder.andWhere(
        '(seven.storecode ILIKE :mainSevenStore OR seven.storename ILIKE :mainSevenStore)',
        { mainSevenStore: `%${params.mainSevenStore}%` },
      );
    }

    if (!_.isEmpty(params.locationType)) {
      queryBuilder.andWhere('vending.locationTypeCode = :locationType', {
        locationType: params.locationType,
      });
    }

    if (!_.isEmpty(params.model)) {
      queryBuilder.andWhere('vending.model = :model', {
        model: params.model,
      });
    }

    if (!_.isEmpty(params.status)) {
      queryBuilder.andWhere('vending.flowStatus IN (:...status)', {
        status: params.status.split(',').map((s) => s.trim()),
      });
    }

    if (!_.isEmpty(store)) {
      queryBuilder.andWhere('vending.mainStorecode IN (:...store)', { store });
    }

    queryBuilder.orderBy('vending.id').limit(limit).offset(offset);

    const [result, total] = await queryBuilder.getManyAndCount();
    return _.isEmpty(result)
      ? [[], total]
      : [result.map(VendingMachineMapper.toDomain), total];
  }

  async findSevenImpactCompetitor(
    params: SevenImpactCompetitorSearchQuery,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);

    const queryBuilder = this.sevenElevenModel
      .createQueryBuilder('seven')
      .innerJoin('seven.poi', 'poi')
      .innerJoin('poi.competitorSurround', 'pcs')
      .select([
        'seven.id',
        'seven.poiId',
        'seven.storecode',
        'seven.storename',
        'seven.sevenType',
        'poi.uid',
        'poi.shape',
        'poi.locationT',
      ])
      .addSelect('COUNT(*)', 'totalCompetitor')
      .where('seven.isActive = :active', { active: 'Y' });

    if (_.isEmpty(params.zone) && _.isEmpty(params.subZone)) {
      queryBuilder.andWhere(
        `(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`,
        parameters,
      );
    } else {
      if (!_.isEmpty(params.zone)) {
        queryBuilder.andWhere('poi.zoneCode = :zone', { zone: params.zone });
      }

      if (!_.isEmpty(params.subZone)) {
        queryBuilder.andWhere('poi.subzoneCode = :subZone', {
          subZone: params.subZone,
        });
      }
    }

    if (!_.isEmpty(params.text)) {
      queryBuilder.andWhere(
        '(seven.storename ILIKE :text OR seven.storecode ILIKE :text)',
        { text: `%${params.text}%` },
      );
    }

    if (!_.isNil(params.countryCode)) {
      queryBuilder.andWhere('poi.nation = :countryCode', {
        countryCode: params.countryCode,
      });
    }

    if (!_.isNil(params.provinceCode)) {
      queryBuilder.andWhere('poi.provCode = :provCode', {
        provCode: params.provinceCode,
      });
    }

    if (params.districtCode) {
      queryBuilder.andWhere('poi.ampCode = :ampCode', {
        ampCode: params.districtCode,
      });
    }

    if (params.subDistrictCode) {
      queryBuilder.andWhere('poi.tamCode = :tamCode', {
        tamCode: params.subDistrictCode,
      });
    }

    if (!_.isEmpty(params.address)) {
      queryBuilder.andWhere(
        '(poi.locationT ILIKE :address OR poi.locationE ILIKE :address)',
        { address: `%${params.address}%` },
      );
    }

    if (!_.isEmpty(params.competitorBrand)) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM allmap.poi_competitor_surround pcs_filter
          INNER JOIN allmap.poi competitor_filter ON pcs_filter.competitor_poi_uid = competitor_filter.uid
          WHERE pcs_filter.seven_poi_uid = poi.uid
          AND pcs_filter.is_active = 'Y'
          AND (competitor_filter.name ILIKE :competitorBrand OR competitor_filter.namt ILIKE :competitorBrand)
        )`,
        { competitorBrand: `%${params.competitorBrand}%` },
      );
    }

    if (!_.isEmpty(params.locationType)) {
      queryBuilder.andWhere('(seven.locationType = :locationType)', {
        locationType: params.locationType,
      });
    }

    queryBuilder
      .groupBy('seven.id')
      .addGroupBy('seven.poiId')
      .addGroupBy('seven.storeCode')
      .addGroupBy('seven.storeName')
      .addGroupBy('seven.sevenType')
      .addGroupBy('poi.uid')
      .addGroupBy('poi.poiId')
      .addGroupBy('poi.shape')
      .addGroupBy('poi.name')
      .addGroupBy('poi.locationT')
      .orderBy('seven.storeCode')
      .limit(limit)
      .offset(offset);

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const total = await queryBuilder.getCount();

    const result = entities.map((entity, index) => {
      const mapped = SevenElevenMapper.toDomain(entity);
      mapped.totalCompetitor = parseInt(raw[index].totalCompetitor, 10);
      return mapped;
    });

    return _.isEmpty(result) ? [[], total] : [result, total];
  }

  async createEnvironmentPoi(data: CreateEnvironmentPoiData): Promise<number> {
    const shapePoint = { type: 'Point', coordinates: [data.longitude, data.latitude] };
    const poiEntity = this.poiModel.create({
      namt: data.name,
      name: data.name,
      locationT: data.address,
      layerId: data.category,
      zoneCode: data.zoneCode,
      subzoneCode: data.subzoneCode,
      ampCode: data.ampCode,
      tamCode: data.tamCode,
      provCode: data.provCode,
      nation: data.nation,
      shape: shapePoint,
      isActive: 'Y',
      createdUser: data.createdBy?.toString(),
      createdDate: new Date(),
      type: PoiType.ENVIRONMENT,
    });

    const { raw } = await this.poiModel.insert(poiEntity);
    return raw.insertId as number;
  }

  async createPotentialPoi(
    data: CreatePotentialPoiData,
    queryRunner?: QueryRunner,
  ): Promise<{ poiId: number; potentialStoreId: number }> {
    const useExternalTransaction = !_.isNil(queryRunner);
    if (!useExternalTransaction) {
      queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }

    try {
      const shapePoint = { type: 'Point', coordinates: [data.longitude, data.latitude] };
      const poiEntity = queryRunner.manager.create(PoiEntity, {
        layerId: data.layerId,
        namt: data.potential.name,
        name: data.potential.name,
        locationT: data.potential.address,
        isActive: 'Y',
        zoneCode: data.potential.zoneCode,
        subzoneCode: data.potential.subzoneCode,
        ampCode: data.potential.ampCode,
        tamCode: data.potential.tamCode,
        provCode: data.potential.provCode,
        nation: data.potential.nation,
        shape: shapePoint,
        createdUser: data.createdBy?.toString(),
        createdDate: new Date(),
        type: PoiType.POTENTIAL,
        approveStatus: ApproveStatus.WAITING_TO_SEND_APPROVE,
      });
      const poiResult = await queryRunner.manager.insert(PoiEntity, poiEntity);
      poiEntity.poiId = poiResult.identifiers[0].poiId as number;

      const potentialEntity = queryRunner.manager.create(PoiPotentialEntity, {
        poiId: poiEntity.poiId,
        locationType: data.potential.locationType?.toString(),
        areaType: data.potential.areaType?.toString(),
        grade: data.potential.grade,
        status: PotentialStatus.PRE_POTENTIAL,
        canSaleAlcohol: data.potential.alcoholSale === 1 ? 'Y' : 'N',
        canSaleCigarette: data.potential.cigaretteSale === 1 ? 'Y' : 'N',
        isActive: 'Y',
        createdBy: data.createdBy,
        createdDate: new Date(),
        updatedDate: new Date(),
      });
      const poiPotentialResult = await queryRunner.manager.insert(
        PoiPotentialEntity,
        potentialEntity,
      );
      potentialEntity.id = poiPotentialResult.identifiers[0].id as number;

      if (data.seven) {
        const sevenEntity = queryRunner.manager.create(ElementSevenElevenEntity, {
          potentialStoreId: potentialEntity.id,
          name: data.seven.name,
          storeCode: data.seven.storeCode,
          impactTypeSite: data.seven.impactTypeSite,
          impactDetail: data.seven.impactDetail,
          estimateDateOpen: data.seven.estimateDateOpen,
          storeWidth: data.seven.storeWidth,
          storeLength: data.seven.storeLength,
          saleArea: data.seven.saleArea,
          stockArea: data.seven.stockArea,
          storeArea: data.seven.storeArea,
          parkingCount: data.seven.parkingCount,
          storeBuildingType: data.seven.storeBuildingType,
          storeFranchise: data.seven.storeFranchise,
          standardLayout: data.seven.standardLayout,
        });
        await queryRunner.manager.insert(ElementSevenElevenEntity, sevenEntity);
      }

      if (data.vending) {
        const vendingEntity = queryRunner.manager.create(ElementVendingMachineEntity, {
          potentialStoreId: potentialEntity.id,
          storecode: data.vending.storecode,
          machineId: data.vending.machineId,
          name: data.vending.name,
          vendingModel: data.vending.vendingModel,
          serialNumber: data.vending.serialNumber,
          vendingType: data.vending.vendingType,
          locationAddress: data.vending.locationAddress,
          floor: data.vending.floor,
          contractStartDate: data.vending.contractStartDate
            ? new Date(data.vending.contractStartDate)
            : undefined,
          contractFinishDate: data.vending.contractFinishDate
            ? new Date(data.vending.contractFinishDate)
            : undefined,
          contractCancelDate: data.vending.contractCancelDate
            ? new Date(data.vending.contractCancelDate)
            : undefined,
          openDate: data.vending.openDate ? new Date(data.vending.openDate) : undefined,
          closeDate: data.vending.closeDate
            ? new Date(data.vending.closeDate)
            : undefined,
          isActive: 'Y',
          targetPoint: data.vending.targetPoint,
          createdBy: data.createdBy,
          createdDate: new Date(),
          updatedDate: new Date(),
        });
        await queryRunner.manager.insert(ElementVendingMachineEntity, vendingEntity);
      }

      if (!useExternalTransaction) {
        await queryRunner.commitTransaction();
      }

      return { poiId: poiEntity.poiId, potentialStoreId: potentialEntity.id };
    } catch (error) {
      if (!useExternalTransaction) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      if (!useExternalTransaction) {
        await queryRunner.release();
      }
    }
  }

  async updateEnvironmentPoi(
    poiId: number,
    data: Partial<CreateEnvironmentPoiData>,
  ): Promise<PoiEntity> {
    const poiEntity = await this.poiModel.findOne({ where: { poiId } });
    if (!poiEntity) {
      throw new Error(`POI with ID ${poiId} not found`);
    }

    // Update fields if provided
    if (data.name) {
      poiEntity.namt = data.name;
      poiEntity.name = data.name;
    }
    if (data.address) {
      poiEntity.locationT = data.address;
    }
    if (data.category) {
      poiEntity.layerId = data.category;
    }
    poiEntity.lastEditedDate = new Date();

    return await this.poiModel.save(poiEntity);
  }

  async updatePotentialStore(
    potentialStoreId: number,
    data: Potential,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const updateData: Record<string, string | number | undefined> = {
      status: data.status,
      areaType: data.areaType,
      locationType: data.locationType,
      grade: data.grade,
      canSaleAlcohol: data.canSaleAlcohol,
      canSaleCigarette: data.canSaleCigarette,
    };

    // Allow updating wfTransactionId if provided
    const potentialData = data as Partial<Potential>;
    if (potentialData.wfTransactionId !== undefined) {
      updateData.wfTransactionId = potentialData.wfTransactionId;
    }

    if (queryRunner) {
      await queryRunner.manager.update(PoiPotentialEntity, potentialStoreId, updateData);
    } else {
      await this.potentialModel.update(potentialStoreId, updateData);
    }
  }

  async updateSevenElement(data: UpdatePoiDtoWithPotential): Promise<void> {
    await this.elementSevenElevenModel.upsert(data, {
      conflictPaths: ['potentialStoreId', 'isActive'],
    });
  }

  async updateVendingElement(
    potentialId: number,
    data: Partial<CreatePotentialPoiData['vending']>,
  ): Promise<ElementVendingMachineEntity> {
    const existingVending = await this.elementVendingMachineModel.findOne({
      where: { potentialStoreId: potentialId },
    });

    const vendingEntity = existingVending || this.elementVendingMachineModel.create();

    vendingEntity.potentialStoreId = potentialId;

    // Update fields if provided
    if (data.storecode !== undefined) vendingEntity.storecode = data.storecode;
    if (data.machineId !== undefined) vendingEntity.machineId = data.machineId;
    if (data.serialNumber !== undefined) vendingEntity.serialNumber = data.serialNumber;
    if (data.name !== undefined) vendingEntity.name = data.name;
    if (data.vendingModel !== undefined) vendingEntity.vendingModel = data.vendingModel;
    if (data.vendingType !== undefined) vendingEntity.vendingType = data.vendingType;
    if (data.locationAddress !== undefined)
      vendingEntity.locationAddress = data.locationAddress;

    if (data.contractStartDate !== undefined) {
      vendingEntity.contractStartDate = data.contractStartDate
        ? new Date(data.contractStartDate)
        : null;
    }
    if (data.contractFinishDate !== undefined) {
      vendingEntity.contractFinishDate = data.contractFinishDate
        ? new Date(data.contractFinishDate)
        : null;
    }
    if (data.contractCancelDate !== undefined) {
      vendingEntity.contractCancelDate = data.contractCancelDate
        ? new Date(data.contractCancelDate)
        : null;
    }
    if (data.openDate !== undefined) {
      vendingEntity.openDate = data.openDate ? new Date(data.openDate) : null;
    }
    if (data.closeDate !== undefined) {
      vendingEntity.closeDate = data.closeDate ? new Date(data.closeDate) : null;
    }

    if (data.targetPoint !== undefined) vendingEntity.targetPoint = data.targetPoint;
    if (data.floor !== undefined) vendingEntity.floor = data.floor;
    if (data.businessTypeCode !== undefined)
      vendingEntity.businessTypeCode = data.businessTypeCode;

    // --- ส่วนการบันทึกข้อมูลที่ปรับปรุงใหม่ ---
    if (!existingVending) {
      // ถ้าไม่มีข้อมูลเดิม ให้ทำการ INSERT
      return await this.elementVendingMachineModel.save(vendingEntity);
    }

    // ถ้ามีข้อมูลเดิม ให้ทำการ UPDATE
    const updateData = { ...vendingEntity };
    delete (updateData as any).id;
    delete (updateData as any).potentialStoreId;

    await this.elementVendingMachineModel.update(
      { potentialStoreId: potentialId },
      updateData as any,
    );

    // คืนค่าข้อมูลล่าสุดที่อัปเดตแล้ว
    return await this.elementVendingMachineModel.findOne({
      where: { potentialStoreId: potentialId },
    });
  }

  async findPoiDetailById(poiId: number): Promise<{
    poi: PoiEntity;
    potentialStore?: PoiPotentialEntity;
    sevenEleven?: ElementSevenElevenEntity;
    vendingMachine?: ElementVendingMachineEntity;
  } | null> {
    // Find the POI
    const poi = await this.poiModel.findOne({ where: { poiId } });
    if (!poi) {
      return null;
    }

    // Try to find potential store data
    const potentialStore = await this.potentialModel.findOne({
      where: { poiId },
    });

    if (!potentialStore) {
      // It's an environment POI
      return { poi };
    }

    // It's a potential POI - fetch related elements
    const sevenEleven = await this.elementSevenElevenModel.findOne({
      where: { potentialStoreId: potentialStore.id },
    });

    const vendingData = await this.elementVendingMachineModel
      .createQueryBuilder('vending')
      .leftJoin('poi_seven_eleven', 'seven', 'vending.storecode = seven.storecode')
      .select(['vending', 'seven.storename AS vending_motherStoreName'])
      .where('vending.potentialStoreId = :potentialId', {
        potentialId: potentialStore.id,
      })
      .getRawAndEntities();

    let vendingMachine = null;
    if (vendingData.entities.length > 0) {
      vendingMachine = vendingData.entities[0];
      // แปะค่าที่ Join ได้เข้าไปใน Object
      vendingMachine.motherStoreName = vendingData.raw[0].vending_motherstorename;
    }
    return {
      poi,
      potentialStore,
      sevenEleven,
      vendingMachine,
    };
  }

  async findZoneAndSubZoneByCoordinate(
    latitude: number,
    longitude: number,
  ): Promise<MasterCpallZone | null> {
    const result = await this.masterCpallZoneRepository
      .createQueryBuilder('cpallZone')
      .select(['cpallZone.id', 'cpallZone.zone', 'cpallZone.subzone'])
      .where(
        'ST_Intersects(cpallZone.shape, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))',
        {
          longitude,
          latitude,
        },
      )
      .getOne();

    return _.isNull(result) ? null : MasterCpallZoneMapper.toDomain(result);
  }

  findPotentialStoreById(poiId: number): Promise<PoiPotentialEntity> {
    return this.potentialModel.findOne({
      where: {
        poiId,
      },
    });
  }

  async findCompetitorSurroundByUid(sevenPoiUid: string): Promise<[Poi[], number]> {
    const queryBuilder = this.competitorSurroundModel
      .createQueryBuilder('pcs')
      .innerJoin('pcs.poiComp', 'poi')
      .innerJoin('poi_competitor', 'competitor', 'competitor.poi_id = poi.poi_id')
      .leftJoin(
        'common_code',
        'cc',
        "cc.code_type = 'COMPETITOR_TYPE' AND cc.code_mapping = CAST(competitor.type AS VARCHAR)",
      )
      .select([
        'competitor.id AS "competitor_id"',
        'competitor.poi_id AS "competitor_poiId"',
        'competitor.grade AS "competitor_grade"',
        'competitor.type AS "competitor_type"',
        'poi.uid AS "poi_uid"',
        'poi.name AS "poi_name"',
        'poi.namt AS "poi_namt"',
        'poi.shape AS "poi_shape"',
        'poi.location_t AS "poi_locationT"',
        'poi.layer_id AS "poi_layerId"',
        'cc.seq_no AS "competitorTypeSeqNo"',
        'cc.code_mapping AS "competitorTypeCodeMapping"',
        'cc.code_name AS "competitorTypeName"',
        'cc.code_name_th AS "competitorTypeNameTh"',
        'cc.code_name_en AS "competitorTypeNameEn"',
        'cc.code_name_kh AS "competitorTypeNameKh"',
        'pcs.distance AS "distance"',
      ])
      .where('pcs.sevenPoiUid = :sevenPoiUid', { sevenPoiUid })
      .andWhere('pcs.isActive = :isActive', { isActive: 'Y' })
      .andWhere('poi.is_active = :isActive', { isActive: 'Y' })
      .orderBy('pcs.distance', 'ASC')
      .addOrderBy('competitor.type', 'ASC')
      .addOrderBy('poi.name', 'ASC');

    const results = await queryBuilder.getRawMany();
    const total = results.length;

    return _.isEmpty(results)
      ? [[], 0]
      : [results.map(CompetitorSurroundMapper.toDomain), total];
  }

  async findPotentialsPendingApproval(
    wfId?: number,
    userId?: number,
    poiId?: number,
  ): Promise<PotentialPendingApproval[]> {
    try {
      const query = this.potentialModel
        .createQueryBuilder('ps')
        .leftJoinAndSelect('ps.workflowTransaction', 'wt')
        .leftJoinAndSelect('wt.workflowStatus', 'ws')
        .leftJoinAndSelect('wt.workflow', 'wf')
        .select([
          'ps.id',
          'ps.uid',
          'ps.poiId',
          'ps.wfTransactionId',
          'ps.createdDate',
          'wt.wfStatusId',
          'wt.wfId',
          'wt.approveBy',
          'wt.approveType',
          'ws.statusNameTh',
          'wf.wfName',
          'poi.namt',
          'poi.locationT',
        ])
        .leftJoinAndSelect('ps.poi', 'poi')
        .where('wt.wfStatusId IN (:...pendingStatusIds)', {
          pendingStatusIds: [402, 403],
        });

      if (wfId) {
        query.andWhere('wt.wfId = :wfId', { wfId });
      }

      if (poiId) {
        query.andWhere('ps.poiId = :poiId', { poiId });
      }

      const results = await query.orderBy('ps.created_date', 'DESC').getMany();

      // Filter by userId if provided - check user role against approveBy
      if (userId) {
        // Get user's roleId
        const userRoleQuery = this.userRoleModel
          .createQueryBuilder('userRole')
          .select('role.id', 'roleId')
          .where('userRole.userId = :userId', { userId: userId.toString() })
          .innerJoin(
            RoleEntity,
            'role',
            'userRole.levelId = role.levelId AND userRole.deptId = role.departmentId',
          );

        const userRole = await userRoleQuery.getRawOne<{ roleId: number }>();

        if (!userRole) {
          return [];
        }

        const filteredResults = results.filter((potential) => {
          const approveBy = String(potential.workflowTransaction?.approveBy ?? '');
          const approveType = String(potential.workflowTransaction?.approveType ?? '');

          if (approveType === 'USER') {
            return userRole.roleId === Number(approveBy);
          } else if (approveType === 'ROLE') {
            const allowedRoleIds = approveBy
              .split(',')
              .map((id) => id.trim())
              .filter((id) => id !== '');

            return allowedRoleIds.includes(String(userRole.roleId));
          }

          return false;
        });

        return PendingApprovalPotentialMapper.toDomains(filteredResults);
      }

      return PendingApprovalPotentialMapper.toDomains(results);
    } catch (error) {
      console.error('findPotentialsPendingApproval error:', error);
      throw error;
    }
  }

  async getPopulationByPoiId(poiId: number): Promise<any> {
    const result = await this.poiModel
      .createQueryBuilder('p')
      .select('sd_prov.population', 'populationProvince')
      .addSelect('sd_prov.male', 'maleProvince')
      .addSelect('sd_prov.female', 'femaleProvince')
      .addSelect('sd_prov.name', 'provName')
      .addSelect('sd_amp.population', 'populationAmphur')
      .addSelect('sd_amp.male', 'maleAmphur')
      .addSelect('sd_amp.female', 'femaleAmphur')
      .addSelect('sd_amp.name', 'ampName')
      .addSelect('sd_tam.population', 'populationTambol')
      .addSelect('sd_tam.male', 'maleTambol')
      .addSelect('sd_tam.female', 'femaleTambol')
      .addSelect('sd_tam.name', 'tamName')
      .leftJoin('master_geo_location', 'sd_prov', 'p.prov_code = sd_prov.code')
      .leftJoin('master_geo_location', 'sd_amp', 'p.amp_code = sd_amp.code')
      .leftJoin('master_geo_location', 'sd_tam', 'p.tam_code = sd_tam.code')
      .where('p.poi_id = :poiId', { poiId })
      .limit(1)
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      populationProvince: parseInt(result.populationProvince) || 0,
      maleProvince: parseInt(result.maleProvince) || 0,
      femaleProvince: parseInt(result.femaleProvince) || 0,
      populationAmphur: parseInt(result.populationAmphur) || 0,
      maleAmphur: parseInt(result.maleAmphur) || 0,
      femaleAmphur: parseInt(result.femaleAmphur) || 0,
      populationTambol: parseInt(result.populationTambol) || 0,
      maleTambol: parseInt(result.maleTambol) || 0,
      femaleTambol: parseInt(result.femaleTambol) || 0,
      tamName: result.tamName || '',
      ampName: result.ampName || '',
      provName: result.provName || '',
    };
  }

  async updatePotentialStoreFormLocNumber(
    poiId: number,
    status: string,
    formLocNumber: string,
  ): Promise<void> {
    await this.potentialModel
      .createQueryBuilder()
      .update(PoiPotentialEntity)
      .set({
        formLocNumber: formLocNumber,
        status: status,
        updatedDate: new Date(),
      })
      .where('poi_id = :poiId', { poiId })
      .execute();
  }

  async updateSevenElevenElementNumber(
    potentialStoreId: number,
    elementNumber: string,
  ): Promise<void> {
    await this.elementSevenElevenModel
      .createQueryBuilder()
      .update(ElementSevenElevenEntity)
      .set({
        elementNumber: elementNumber,
        updatedDate: new Date(),
      })
      .where('potential_store_id = :potentialStoreId', { potentialStoreId })
      .execute();
  }

  async updateVendingMachineElementNumber(
    potentialStoreId: number,
    elementNumber: string,
  ): Promise<void> {
    await this.elementVendingMachineModel
      .createQueryBuilder()
      .update(ElementVendingMachineEntity)
      .set({
        elementNumber: elementNumber,
        updatedDate: new Date(),
      })
      .where('potential_store_id = :potentialStoreId', { potentialStoreId })
      .execute();
  }

  async findPoiById(
    poiId: number,
    boundaryArea: [string, string][],
  ): Promise<Poi | null> {
    const { placeholders, parameters } = this.buildBoundaryAreaPlaceholders(boundaryArea);
    const query = this.poiModel
      .createQueryBuilder('poi')
      .innerJoinAndSelect('poi.layer', 'layer')
      .where('poi.poiId = :poiId', { poiId })
      .andWhere(`(poi.zoneCode, poi.subzoneCode) IN (${placeholders})`, parameters);

    const result = await query.getOne();

    return _.isNull(result) ? null : PoiMapper.toDomain(result);
  }

  async update(id: number, poi: PoiEntity): Promise<void> {
    await this.poiModel.update(id, poi);
  }

  async saveImages(poiId: number, imageNames: string[], userId: number): Promise<void> {
    const images = imageNames.map((name) =>
      this.imageModel.create({
        name,
        poiId,
        updatedBy: userId,
        createdDate: new Date(),
      }),
    );

    await this.imageModel.insert(images);
  }

  async findImagesByPoiId(poiId: number): Promise<ImageEntity[]> {
    const images = await this.imageModel.find({
      where: { poiId: poiId, deletedDate: IsNull() },
    });

    return images;
  }

  async findImageById(imageId: number): Promise<ImageEntity | null> {
    return await this.imageModel.findOne({
      where: { id: imageId },
    });
  }

  async deleteImage(imageId: number, userId: number): Promise<void> {
    const result = await this.imageModel
      .createQueryBuilder()
      .update(ImageEntity)
      .set({
        deletedDate: new Date(),
        updatedBy: userId,
      })
      .where('id = :imageId', { imageId })
      .andWhere('deleted_date IS NULL')
      .execute();

    if (result.affected === 0) {
      throw new Error('Image not found or already deleted');
    }
  }
}
