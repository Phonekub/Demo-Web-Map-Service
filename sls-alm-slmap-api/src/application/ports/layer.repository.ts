import { Dropdown } from '../../domain/dropdown';

export interface LayerRepositoryPort {
  getLayersByUserId(
    userId: number,
    query: { isLandmark?: boolean; canCreatePoi: boolean },
  ): Promise<Dropdown[]>;
}
