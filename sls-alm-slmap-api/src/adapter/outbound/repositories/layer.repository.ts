import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayerEntity } from './entities/layer.entity';
import { LayerRepositoryPort } from 'src/application/ports/layer.repository';
import { LayerMapper } from '../mappers/layer.mapper';
import { Dropdown } from '../../../domain/dropdown';

@Injectable()
export class LayerRepository implements LayerRepositoryPort {
  constructor(
    @InjectRepository(LayerEntity)
    private readonly layerModel: Repository<LayerEntity>,
  ) {}

  async getLayersByUserId(
    userId: number,
    query: { isLandmark?: boolean; canCreatePoi?: boolean },
  ): Promise<Dropdown[]> {
    if (!userId) return [];

    const queryBuilder = this.layerModel
      .createQueryBuilder('layer')
      .select(['layer.id', 'layer.name', 'layer.spatialType'])
      .innerJoin('layer.roles', 'role')
      .innerJoin('role.users', 'auth_user', 'auth_user.role_id = role.id')
      .where('auth_user.id = :userId', { userId })
      .andWhere('layer_role.is_active = :isActive', { isActive: 'Y' })
      .orderBy('layer.created_date', 'ASC');

    if (query.isLandmark) {
      queryBuilder.andWhere('layer.isLandmark = :isLandmark', { isLandmark: 'Y' });
    }

    if (query.canCreatePoi) {
      queryBuilder.andWhere('layer.canCreatePoi = :canCreatePoi', {
        canCreatePoi: 'Y',
      });
    }

    const results = await queryBuilder.getMany();
    return results.map(LayerMapper.toDomain);
  }
}
