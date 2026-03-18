import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StorePlanStandardEntity } from './entities/storePlanStandard.entity';

@Injectable()
export class StorePlanStandardRepository {
  constructor(
    @InjectRepository(StorePlanStandardEntity)
    private readonly storeplanstandardRepository: Repository<StorePlanStandardEntity>,
  ) {}

  async findById(file_id: number): Promise<StorePlanStandardEntity | null> {
    return await this.storeplanstandardRepository.findOne({ where: { file_id } });
  }

  async findAll(): Promise<StorePlanStandardEntity[]> {
    return await this.storeplanstandardRepository
      .createQueryBuilder('store')
      .where('store.is_deleted = :isDeleted', { isDeleted: 'N' })
      .orderBy('store.file_id', 'ASC')
      .getMany();
  }
  async create(
    entity: Partial<StorePlanStandardEntity>,
  ): Promise<StorePlanStandardEntity> {
    return await this.storeplanstandardRepository.save(entity);
  }
  async updateCanLoad(
    file_id: number,
    can_load: string,
  ): Promise<StorePlanStandardEntity | null> {
    const response = await this.storeplanstandardRepository.findOne({
      where: { file_id },
    });
    if (!response) return null;
    response.can_load = can_load;
    return await this.storeplanstandardRepository.save(response);
  }
}
