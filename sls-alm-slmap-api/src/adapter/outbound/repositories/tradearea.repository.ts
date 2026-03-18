import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { TradeareaEntity } from './entities/tradearea.entity';
import { Tradearea, TradeareaPendingApproval } from '../../../domain/tradearea';
import { TradeareaRepositoryPort } from '../../../application/ports/tradearea.repository';
import { GeometryRepositoryBase } from './geometry.repository';
import { TradeareaMapper } from './mappers/tradearea.mapper';
import { TradeareaStatus } from '../../../common/enums/tradearea.enum';
import { TradeareaHistoryEntity } from './entities/tradeareaHistory.entity';
import { PendingApprovalMapper } from './mappers/pendingApproval.mapper';
import { PoiTradearea } from '../../../domain/poiTradearea';
import { TradeareaPoiMapper } from './mappers/treadAreaPoi.mapper';
import { TradeareaTypeEntity } from './entities/tradeareaType.entity';
import { Builder } from 'builder-pattern';
import { PoiEntity } from './entities/poi.entity';
import * as _ from 'lodash';
@Injectable()
export class TradeareaRepository
  extends GeometryRepositoryBase<TradeareaEntity>
  implements TradeareaRepositoryPort
{
  constructor(
    @InjectRepository(TradeareaEntity)
    private readonly tradeareaModel: Repository<TradeareaEntity>,
    @InjectRepository(TradeareaHistoryEntity)
    private readonly tradeareaHistoryModel: Repository<TradeareaHistoryEntity>,
    @InjectRepository(TradeareaTypeEntity)
    private readonly tradeareaTypeModel: Repository<TradeareaTypeEntity>,
    @InjectRepository(PoiEntity)
    private readonly poiModel: Repository<PoiEntity>,
  ) {
    super(tradeareaModel);
  }

  async findAll(
    search: string,
    page?: number,
    sortBy?: string,
    order?: 'asc' | 'desc',
    limit?: number,
    status?: string,
  ): Promise<{
    data: Array<Record<string, unknown>>;
    total: number;
  }> {
    const queryBuilder = this.createGeometryQuery('trade_area', 'shape')
      .orderBy('trade_area.id', 'ASC')
      .andWhere('trade_area.status <> :status', {
        status: TradeareaStatus.INACTIVE,
      });

    if (status) {
      queryBuilder.andWhere('trade_area.status = :status', {
        status: status,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(trade_area.ref_storecode ILIKE :search OR trade_area.zone_code ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count before applying pagination
    const total = await queryBuilder.getCount();

    if (page) {
      const pageSize = limit || 100;
      queryBuilder.skip((page - 1) * pageSize).take(pageSize);
    }

    if (sortBy && order) {
      queryBuilder.orderBy(`trade_area.${sortBy}`, order.toUpperCase() as 'ASC' | 'DESC');
    }

    const rawResults = await queryBuilder.getRawMany();

    return {
      data: rawResults.map((raw) => this.mapRawToObject(raw, 'trade_area')),
      total,
    };
  }

  async findById(id: number): Promise<Tradearea | null> {
    const results = await this.createGeometryQuery('trade_area', 'shape')
      .where('trade_area.id = :id', { id })
      .leftJoinAndSelect('trade_area.poi', 'poi')
      .leftJoinAndSelect('poi.sevenElevenStores', 'seven')
      .innerJoinAndSelect('trade_area.tradeareaType', 'tradeareaType')
      .andWhere('trade_area.status <> :status', {
        status: TradeareaStatus.INACTIVE,
      })
      .getOne();

    return TradeareaMapper.toDomain(results);
  }

  async findByStoreCode(
    storeCode: string,
    tradeareaTypeId: number,
  ): Promise<Tradearea[]> {
    const queryBuilder = this.createGeometryQuery('trade_area', 'shape')
      .innerJoinAndSelect('trade_area.poi', 'poi')
      .leftJoinAndSelect('poi.sevenElevenStores', 'seven')
      .innerJoinAndSelect('trade_area.tradeareaType', 'tradeareaType')
      .innerJoinAndSelect('trade_area.workflowTransaction', 'wfTransaction')
      .where('seven.storecode = :storeCode', { storeCode })
      .andWhere('trade_area.status <> :status', {
        status: TradeareaStatus.INACTIVE,
      })
      .andWhere('trade_area.tradeareaTypeId = :tradeareaTypeId', { tradeareaTypeId });

    const result = await queryBuilder
      .orderBy(`CASE WHEN trade_area.status = 'ACTIVE' THEN 1 ELSE 2 END`, 'ASC')
      .getMany();

    return result.map((entity) => {
      return TradeareaMapper.toDomain(entity);
    });
  }

  async findByZone(zoneCode: string): Promise<Tradearea[]> {
    const queryBuilder = this.createGeometryQuery('trade_area', 'shape')
      .where('trade_area.zone_code = :zoneCode', { zoneCode })
      .andWhere('trade_area.status <> :status', {
        status: TradeareaStatus.INACTIVE,
      });

    const result = await queryBuilder.orderBy('trade_area.id', 'ASC').getMany();

    return result.map((entity) => {
      return TradeareaMapper.toDomain(entity);
    });
  }

  async findBySubzone(zoneCode: string, subzoneCode: string): Promise<Tradearea[]> {
    const queryBuilder = this.createGeometryQuery('trade_area', 'shape')
      .where('trade_area.zone_code = :zoneCode', { zoneCode })
      .andWhere('trade_area.subzone_code = :subzoneCode', { subzoneCode })
      .andWhere('trade_area.status <> :status', {
        status: TradeareaStatus.INACTIVE,
      });

    const result = await queryBuilder.orderBy('trade_area.id', 'ASC').getMany();

    return result.map((entity) => {
      return TradeareaMapper.toDomain(entity);
    });
  }

  async findByPoint(lng: number, lat: number): Promise<Tradearea | null> {
    const queryBuilder = this.createGeometryQuery('trade_area')
      .where('trade_area.ref_point_x = :lat', { lat })
      .andWhere('trade_area.ref_point_y = :lng', { lng });

    const result = await queryBuilder.orderBy('trade_area.id', 'ASC').getOne();

    return TradeareaMapper.toDomain(result);
  }

  async create(data: Partial<Tradearea>): Promise<Tradearea> {
    const result = await this.tradeareaModel
      .createQueryBuilder()
      .insert()
      .into(TradeareaEntity)
      .values({
        poiId: data.poiId,
        shape: () => `ST_GeomFromGeoJSON('${JSON.stringify(data.shape)}')`,
        areaColor: data.areaColor,
        comment: data.comment,
        warning: data.warning,
        createUser: 'ADMIN',
        createdAt: new Date(),
        status: data.status,
        tradeareaTypeId: data.tradeareaTypeId,
        parentId: data.parentId,
        effectiveDate: data.effectiveDate,
      })
      .returning('*')
      .execute();

    // Get the inserted ID
    const insertedId = result.identifiers[0].id;

    // Return the full entity with geometry
    return this.findById(insertedId);
  }

  async update(id: number, data: Partial<Tradearea>): Promise<Tradearea | null> {
    const queryBuilder = this.tradeareaModel
      .createQueryBuilder()
      .update(TradeareaEntity)
      .where('id = :id', { id })
      .andWhere('status <> :status', { status: TradeareaStatus.INACTIVE });

    const setClause: Partial<TradeareaEntity> = {};
    if (data.refStoreCode !== undefined) {
      setClause.refStoreCode = data.refStoreCode;
    }
    if (data.zoneCode !== undefined) {
      setClause.zoneCode = data.zoneCode;
    }
    if (data.subzoneCode !== undefined) {
      setClause.subzoneCode = data.subzoneCode;
    }

    if (data.status !== undefined) {
      setClause.status = data.status;
    }
    if (data.wfTransactionId !== undefined) {
      setClause.wfTransactionId = data.wfTransactionId;
    }
    if (data.effectiveDate !== undefined) {
      setClause.effectiveDate = data.effectiveDate;
    }
    if (data.storeName !== undefined) {
      setClause.storeName = data.storeName;
    }
    if (data.areaColor !== undefined) {
      setClause.areaColor = data.areaColor;
    }
    if (data.comment !== undefined) {
      setClause.comment = data.comment;
    }
    if (data.warning !== undefined) {
      setClause.warning = data.warning;
    }
    if (data.updateUser !== undefined) {
      setClause.updateUser = data.updateUser;
    }
    setClause.updatedAt = new Date();
    // ✅ Handle Geometry separately
    if (data.shape !== undefined) {
      queryBuilder.set({
        ...setClause,
        shape: () => `ST_GeomFromGeoJSON('${JSON.stringify(data.shape)}')`,
      });
    } else {
      queryBuilder.set(setClause);
    }
    await queryBuilder.execute();
    // Return updated entity
    return this.findById(id);
  }

  async findOverlapping(
    shape: object,
    excludeId?: number[],
    tradeareaTypeName?: string,
    minAreaSqMeters: number = 1,
  ): Promise<Tradearea[]> {
    const queryBuilder = this.createGeometryQuery('trade_area', 'shape')
      .innerJoinAndSelect('trade_area.tradeareaType', 'tradeareaType')
      .where('trade_area.status <> :status', { status: TradeareaStatus.INACTIVE })
      //.andWhere('trade_area.deletedAt IS NULL')
      .andWhere(
        `ST_Dimension(
          ST_Intersection(
            trade_area.shape,
            ST_SetSRID(ST_GeomFromGeoJSON(:geoJson), 4326)
          )
        ) = 2
        AND ST_Area(
          ST_Intersection(
            trade_area.shape,
            ST_SetSRID(ST_GeomFromGeoJSON(:geoJson), 4326)
          )::geography
        ) > :minArea
        AND NOT ST_Touches(
          trade_area.shape,
          ST_SetSRID(ST_GeomFromGeoJSON(:geoJson), 4326)
        )`,
        { geoJson: JSON.stringify(shape), minArea: minAreaSqMeters },
      );

    if (!_.isEmpty(excludeId)) {
      queryBuilder.andWhere('trade_area.id NOT IN (:...excludeId)', { excludeId });
    }

    if (tradeareaTypeName) {
      queryBuilder.andWhere('tradeareaType.name = :tradeareaTypeName', {
        tradeareaTypeName,
      });
    }

    const results = await queryBuilder.getMany();
    return results.map((result) => {
      return TradeareaMapper.toDomain(result);
    });
  }

  // async deleteTradearea(id: number, deleteUser?: string): Promise<boolean> {
  //   const result = await this.tradeareaModel
  //     .createQueryBuilder()
  //     .update(TradeareaEntity)
  //     .set({
  //       deletedAt: new Date(),
  //       deleteUser: deleteUser || 'SYSTEM',
  //       status: TradeareaStatus.INACTIVE,
  //     })
  //     .where('id = :id', { id })
  //     .andWhere('deleted_at IS NULL')
  //     .execute();
  //   return result.affected > 0;
  // }

  async findTradeareasByPolygon(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
    tradeareaTypeId?: number,
    status?: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<[Tradearea[], number]> {
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

    const polygonCoords = coordinates
      .map((coord) => `${coord[0]} ${coord[1]}`)
      .join(', ');
    const polygonWKT = `POLYGON((${polygonCoords}))`;

    const baseQuery = this.tradeareaModel
      .createQueryBuilder('trade_area')
      .where('trade_area.status <> :status', {
        status: TradeareaStatus.INACTIVE,
      })
      .leftJoinAndSelect('trade_area.poi', 'poi')
      //  .andWhere(`(poi.zone_code, poi.subzone_code) IN (${placeholders})`, parameters);
      .andWhere('ST_Within(trade_area.shape, ST_GeomFromText(:polygon, 4326))', {
        polygon: polygonWKT,
      });

    if (boundaryArea && boundaryArea.length > 0) {
      baseQuery.andWhere(
        `(poi.zone_code, poi.subzone_code) IN (${placeholders})`,
        parameters,
      );
    }

    const total = await baseQuery.getCount();

    if (total === 0) return [[], 0];

    const entities = await baseQuery
      .orderBy('trade_area.id')
      .limit(limit)
      .offset(offset)
      .getMany();

    return [TradeareaMapper.toDomains(entities), total];
  }

  async insertTradeareaHistory(
    TradeareaId: number,
    userId: string,
    action: string,
    actionType: string,
  ): Promise<void> {
    await this.tradeareaHistoryModel.insert({
      TradeareaId: TradeareaId,
      action,
      actionType,
    });
  }

  async findTradeareasPendingApproval(
    wfId?: number,
    roleId?: number,
  ): Promise<TradeareaPendingApproval[]> {
    try {
      const query = this.tradeareaModel
        .createQueryBuilder('ta')
        .leftJoinAndSelect('ta.workflowTransaction', 'wt')
        .leftJoinAndSelect('wt.workflowStatus', 'ws')
        .leftJoinAndSelect('wt.workflow', 'wf')
        .select([
          'ta.id',
          'ta.refStoreCode',
          'ta.storeName',
          'ta.wfTransactionId',
          'ta.poiId',
          'wt.wfStatusId',
          'ws.statusNameTh',
          'wt.wfId',
          'wf.wfName',
          'ta.created_at',
          'poi.poiId',
          'seven.storeCode',
          'seven.storeName',
        ])
        .leftJoinAndSelect('ta.poi', 'poi')
        .leftJoinAndSelect('poi.sevenElevenStores', 'seven')
        .where('wt.wfStatusId IN (:...pendingStatusIds)', {
          pendingStatusIds: [102, 103, 202, 203, 302, 303],
        });
      // .andWhere('seven.isActive = :isActive', { isActive: 'Y' });

      //  Filter by wfId
      if (wfId) {
        query.andWhere('wt.wfId = :wfId', { wfId });
      }

      // Filter by roleId
      if (roleId) {
        //query.andWhere('wf.roleId = :roleId', { roleId });
      }

      const result = await query.orderBy('ta.created_at', 'DESC').getMany();
      return PendingApprovalMapper.toDomains(result);
    } catch (error) {
      console.error('getTradeareasPendingApproval error:', error);
      throw error;
    }
  }

  async findPoiTradeareaById(tradeareaId: number): Promise<PoiTradearea | null> {
    const queryBuilder = this.tradeareaModel
      .createQueryBuilder('tradearea')
      .select([
        `tradearea.id`,
        `poi.shape`,
        `poi.locationT`,
        `seven.storeCode`,
        `seven.storeName`,
        `tradearea.shape`,
      ])
      .innerJoinAndSelect('tradearea.poi', 'poi')
      .innerJoinAndSelect('poi.sevenElevenStores', 'seven')
      .where('tradearea.id = :tradeareaId', { tradeareaId });
    // .andWhere('seven.isActive = :isActive', { isActive: 'Y' });

    const result = await queryBuilder.getOne();

    return TradeareaPoiMapper.toDomain(result);
  }

  async findTradeareaTypes(): Promise<TradeareaTypeEntity[] | null> {
    return await this.tradeareaTypeModel.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findTradeareaTypeByName(name: string): Promise<TradeareaTypeEntity | null> {
    return await this.tradeareaTypeModel.findOne({
      where: {
        name: name,
      },
    });
  }

  async deleteTradearea(tradeareaId: number, userId: number): Promise<void> {
    await this.tradeareaModel.update(
      { id: tradeareaId },
      {
        deletedAt: new Date(),
        deleteBy: userId,
        status: TradeareaStatus.INACTIVE,
      },
    );
  }

  async findByPoi(poiId: number): Promise<Tradearea | null> {
    const result = await this.poiModel.findOne({
      where: {
        poiId,
      },
      select: {
        sevenElevenStores: true,
      },
      relations: {
        sevenElevenStores: true,
      },
    });

    const tradearea = Builder<TradeareaEntity>().poi(result).build();

    return TradeareaMapper.toDomain(tradearea);
  }

  async findTradeareasForSearch(
    params: {
      nation?: string;
      provCode?: string;
      ampCode?: string;
      tamCode?: string;
      status?: string;
      approvalType?: string;
      tradeAreaType?: string;
      searchKey?: string;
    },
    boundaryArea: [string, string][],
    limit: number,
    offset: number,
  ): Promise<[Tradearea[], number]> {
    const qb = this.tradeareaModel
      .createQueryBuilder('trade_area')
      .innerJoinAndSelect('trade_area.poi', 'poi')
      .innerJoinAndSelect('poi.sevenElevenStores', 'seven')
      .leftJoinAndSelect('trade_area.workflowTransaction', 'wf_tx')
      .where('trade_area.status <> :status', { status: TradeareaStatus.INACTIVE });

    if (params.status) {
      qb.andWhere('trade_area.status = :taStatus', {
        taStatus: params.status,
      });
    }

    if (params.nation) {
      qb.andWhere('poi.nation = :nation', { nation: params.nation });
    }

    if (params.provCode) {
      qb.andWhere('poi.prov_code = :provCode', { provCode: params.provCode });
    }

    if (params.ampCode) {
      qb.andWhere('poi.amp_code = :ampCode', { ampCode: params.ampCode });
    }

    if (params.tamCode) {
      qb.andWhere('poi.tam_code = :tamCode', { tamCode: params.tamCode });
    }
    //  APPROVAL TYPE: ใช้ wf_transaction.approve_type = TRADEAREA_APPROVAL_TYPE.value
    if (params.approvalType) {
      qb.andWhere('wf_tx.wf_step_id = :approvalType', {
        approvalType: params.approvalType,
      });
    }

    //  TRADE AREA TYPE: ใช้ trade_area.trade_area_type_id = Number(TRADEAREA_TYPE.value)
    if (params.tradeAreaType) {
      qb.andWhere('trade_area.trade_area_type_id = :tradeAreaTypeId', {
        tradeAreaTypeId: Number(params.tradeAreaType),
      });
    }

    //  text — ถ้ายังไม่มี column tradearea_code/tradearea_name จริง ให้ใช้ field ที่มีอยู่ไปก่อน เช่น store_name
    if (params.searchKey) {
      const searchText = `%${params.searchKey}%`;
      qb.andWhere(
        new Brackets((innerQb) => {
          innerQb
            .where('seven.storecode ILIKE :searchText', { searchText })
            .orWhere('seven.storename ILIKE :searchText', { searchText });
        }),
      );
    }

    qb.orderBy('trade_area.id', 'ASC').limit(limit).offset(offset);

    const [entities, total] = await qb.getManyAndCount();
    return [TradeareaMapper.toDomains(entities), total];
  }
}
