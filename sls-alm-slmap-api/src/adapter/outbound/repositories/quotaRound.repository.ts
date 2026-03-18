import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { QuotaRoundRepositoryPort } from '../../../application/ports/quotaRound.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { QuotaConfigEntity } from './entities/quotaConfig.entity';
import { QuotaConfig } from '../../../domain/quotaConfig';
import { MasterRepository } from './master.repository';
import { Language } from '../../../common/enums/language.enum';
import { QuotaConfigMapper } from './mappers/quotaConfig.mapper';
import { QuotaRoundEntity } from './entities/quotaRound.entity';
import { RoundWithAllocationMapper } from './mappers/roundWithAlloation.mapper';
import { QuotaRound } from '../../../domain/quotaRound';
import { QuotaQueryParams } from '../../../domain/quotaQueryParams';
import { error } from 'console';
import { QuotaAllocationEntity } from './entities/quotaAllocation.entity';
import {
  DataAccessException,
  InvalidRoundStatusException,
  QuotaNotFoundException,
} from '../../../common/exceptions/quota.exception';
import { QuotaAllocationItemEntity } from './entities/quotaAllocationItem.entity';

@Injectable()
export class QuotaRoundRepository implements QuotaRoundRepositoryPort {
  constructor(
    @InjectRepository(QuotaConfigEntity)
    private readonly quotaConfigModel: Repository<QuotaConfigEntity>,

    @InjectRepository(QuotaRoundEntity)
    private readonly quotaRoundModel: Repository<QuotaRoundEntity>,

    @InjectRepository(QuotaAllocationEntity)
    private readonly quotaAllocationModel: Repository<QuotaAllocationEntity>,

    @Inject('MasterRepository')
    private readonly masterRepo: MasterRepository,
  ) {}

  async getQuotaConfig(
    year: number,
    locationType: string,
    quotaType: string,
    language?: Language,
  ): Promise<QuotaConfig | null> {
    try {
      const yearStr = year.toString();
      const query = this.quotaConfigModel
        .createQueryBuilder('qc')
        .leftJoinAndSelect('qc.annualTargets', 'qt')
        .leftJoinAndSelect('qt.zone', 'z')
        .where('qc.year = :year', { year: yearStr })
        .andWhere('qc.locationType = :locType', { locType: locationType })
        .andWhere('qc.quotaType = :quotaType', { quotaType: quotaType });

      const entity = await query.getOne();

      if (!entity) return null;

      const [locTypeData, quotaTypeData] = await Promise.all([
        this.masterRepo.getCommonCodeName('QUOTA_LOCATION_TYPE', language, locationType),
        this.masterRepo.getCommonCodeName('QUOTA_TYPE', language, quotaType),
      ]);
      return QuotaConfigMapper.toDomain(entity, locTypeData, quotaTypeData);
    } catch (error) {
      throw new DataAccessException(`Error getting quota config: ${error.message}`);
    }
  }

  async getRoundsWithAllocations(
    year: number,
    locationType: string,
    quotaType: string,
    language?: Language,
  ): Promise<QuotaRound[]> {
    try {
      const yearStr = year.toString();
      const query = this.quotaRoundModel
        .createQueryBuilder('qr')
        .innerJoinAndSelect('qr.quotaConfig', 'qc')
        .leftJoinAndSelect('qr.allocations', 'qa')
        .leftJoinAndSelect('qr.quotaRoundStatus', 'qrs')
        .leftJoinAndSelect('qa.zone', 'z')
        .leftJoinAndSelect('qa.quotaAllocationItems', 'qai')
        .where('qc.year = :year', { year: yearStr })
        .andWhere('qc.locationType = :locType', { locType: locationType })
        .andWhere('qc.quotaType = :quotaType', { quotaType: quotaType })
        .andWhere('qr.quotaRoundStatusId != :statusId', { statusId: 4 });

      const entities = await query.getMany();

      return RoundWithAllocationMapper.toDomains(entities);
    } catch (error) {
      console.error('ERROR>>>>>>>>>: ', error);
      throw new DataAccessException(`Error getting quota rounds: ${error.message}`);
    }
  }

  async createRound(rounds: QuotaRoundEntity[]): Promise<QuotaRoundEntity[]> {
    try {
      const result = await this.quotaRoundModel.save(rounds);
      return result;
    } catch (error) {
      throw new DataAccessException(`Error creating quota round: ${error.message}`);
    }
  }

  async getLasetRoundSeq(quotaConfigId: number): Promise<number> {
    try {
      const lastSeq = await this.quotaRoundModel
        .createQueryBuilder('qr')
        .where('qr.quotaConfigId = :configId', { configId: quotaConfigId })
        .orderBy('qr.seq', 'DESC')
        .getOne();
      return lastSeq ? lastSeq.seq : 1;
    } catch (error) {
      throw new DataAccessException(`Error getting latest round seq: ${error.message}`);
    }
  }

  async updateRound(round: QuotaRound, userId?: number): Promise<number> {
    try {
      const roundEntity = await this.quotaRoundModel.findOne({
        where: { id: round.id },
        relations: ['allocations'],
      });

      if (!roundEntity) throw new NotFoundException('Quota round not found');


      roundEntity.name = round.name;
      roundEntity.startMonth = round.startMonth;
      roundEntity.endMonth = round.endMonth;
      roundEntity.dueDate = round.dueDate;
      roundEntity.updateBy = userId;
      roundEntity.updateDate = new Date();

      if (round.allocations && round.allocations.length > 0) {
        roundEntity.allocations = roundEntity.allocations.map((existing) => {
          // หาข้อมูลใหม่จาก Domain ที่ตรงกับ Zone ของ Entity ตัวนี้
          const updateInfo = round.allocations.find(
            (item) => item.zoneId === existing.zoneId,
          );


          if (updateInfo) {
            existing.assignedQuota = Number(updateInfo.assignedQuota);
            existing.reservedQuota = Number(updateInfo.reservedQuota);
            existing.updateBy = userId;
            existing.updateDate = new Date();
          }
          return existing;
        });
      }

      const result = await this.quotaRoundModel.save(roundEntity);
      return result.id;
    } catch (error) {
      console.error('ERROR>>>>>>>>>@Repo: ', error);
      if (error instanceof NotFoundException) throw error;
      throw new DataAccessException(`Error updating quota round: ${error.message}`);
    }
  }

  async deleteRound(roundId: number, userId: number): Promise<void> {
    try {
      const roundEntity = await this.quotaRoundModel.findOne({
        where: {
          id: roundId,
        },
        relations: ['quotaRoundStatus', 'allocations'],
      });

      if (!roundEntity) throw new NotFoundException('Quota round not found');

      if (roundEntity.quotaRoundStatus?.id !== 1) {
        throw new InvalidRoundStatusException(
          `Cannot delete ${roundEntity.quotaRoundStatus?.name} quota round`,
        );
      }

      // await this.quotaRoundModel.remove(roundEntity);
      await this.quotaRoundModel.update(roundId, {
        quotaRoundStatusId: 4,
        updateDate: new Date(),
        updateBy: userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new DataAccessException(`Error deleting quota round: ${error.message}`);
    }
  }

  async submitQuotaRoundByZone(
    roundId: number,
    zoneId: number,
    userId: number,
  ): Promise<QuotaAllocationEntity> {
    try {
      const allocationEntity = await this.quotaAllocationModel.findOne({
        where: {
          quotaRoundId: roundId,
          zoneId: zoneId,
        },
      });

      if (!allocationEntity) throw new NotFoundException('Quota round not found');

      await this.quotaRoundModel.update(roundId, {
        quotaRoundStatusId: 2,
        updateDate: new Date(),
        updateBy: userId,
      });

      return allocationEntity;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new DataAccessException(`Error Submit quota round by zone: ${error.message}`);
    }
  }

  async getAllocationsByRoundId(roundId: number): Promise<QuotaAllocationEntity[]> {
    try {
      const allocationEntities = await this.quotaAllocationModel.find({
        where: {
          quotaRoundId: roundId,
        },
      });

      return allocationEntities;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new DataAccessException(
        `Error Get Allocations By Round Id: ${error.message}`,
      );
    }
  }

  async submitQuotaRoundAllZones(
    roundId: number,
    userId: number,
  ): Promise<QuotaAllocationEntity[]> {
    try {
      await this.quotaRoundModel.update(roundId, {
        quotaRoundStatusId: 2,
        updateDate: new Date(),
        updateBy: userId,
      });

      const allocationEntities = await this.quotaAllocationModel.find({
        where: {
          quotaRoundId: roundId,
        },
      });

      return allocationEntities;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new DataAccessException(
        `Error Submit quota round all zones: ${error.message}`,
      );
    }
  }

  async closeQuotaConfig(
    year: number,
    locationType: string,
    quotaType: string,
    userId: number,
  ): Promise<void> {
    try {
      const quotaConfigEntity = await this.quotaConfigModel.findOne({
        where: {
          year: year.toString(),
          locationType: locationType,
          quotaType: quotaType,
        },
      });


      if (!quotaConfigEntity) throw new NotFoundException('Quota config not found');

      await this.quotaConfigModel.update(quotaConfigEntity.id, {
        isClosed: 'Y',
        updateDate: new Date(),
        updateBy: userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new DataAccessException(`Error close quota config: ${error.message}`);
    }
  }

  async getRoundsByConfigIdAndZone(
    quotaConfigId: number,
    zoneId: number,
  ): Promise<QuotaRoundEntity[]> {
    try {
      const query = this.quotaRoundModel
        .createQueryBuilder('qr')
        .innerJoin('qr.quotaConfig', 'qc')
        .leftJoinAndSelect('qr.allocations', 'qa', 'qa.zoneId = :zoneId', { zoneId })
        .leftJoinAndSelect('qa.quotaAllocationItems', 'qai')
        .where('qc.id = :quotaConfigId', { quotaConfigId })
        .andWhere('qr.quotaRoundStatusId != :statusId', { statusId: 4 });

      return await query.getMany();
    } catch (error) {
      throw new DataAccessException(`Error getting quota rounds: ${error.message}`);
    }
  }

  async getRoundsByConfigId(quotaConfigId: number): Promise<QuotaRoundEntity[]> {
    try {
      const query = this.quotaRoundModel
        .createQueryBuilder('qr')
        .innerJoin('qr.quotaConfig', 'qc')
        .leftJoinAndSelect('qr.allocations', 'qa')
        .leftJoinAndSelect('qa.quotaAllocationItems', 'qai')
        .where('qc.id = :quotaConfigId', { quotaConfigId })
        .andWhere('qr.quotaRoundStatusId != :statusId', { statusId: 4 });

      return await query.getMany();
    } catch (error) {
      throw new DataAccessException(`Error getting quota rounds: ${error.message}`);
    }
  }

  async getQuotaConfigByRoundId(roundId: number): Promise<QuotaConfigEntity> {
    try {
      const round = await this.quotaRoundModel.findOne({
        where: {
          id: roundId,
        },
        relations: ['quotaConfig'],
      });

      return round.quotaConfig;
    } catch (error) {
      throw new DataAccessException(`Error getting quota rounds: ${error.message}`);
    }
  }
}
