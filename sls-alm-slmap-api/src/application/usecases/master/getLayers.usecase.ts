import { Inject, Injectable } from '@nestjs/common';
import { LayerRepositoryPort } from 'src/application/ports/layer.repository';
import { Dropdown } from '../../../domain/dropdown';

@Injectable()
export class GetLayersUseCase {
  constructor(
    @Inject('LayerRepository')
    private readonly layerRepository: LayerRepositoryPort,
  ) {}

  async handler(
    userId: number,
    query: { isLandmark: boolean; canCreatePoi: boolean },
  ): Promise<Dropdown[]> {
    return await this.layerRepository.getLayersByUserId(userId, query);
  }
}
