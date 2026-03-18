import { Builder } from 'builder-pattern';
import { Poi, AreaShape } from '../../../domain/poi';
import { PoiEntity } from '../repositories/entities/poi.entity';
import { convertArrayStringToArray } from '../../../common/helpers/utils';

export class PoiMapper {
  static toDomain(poiEntity: PoiEntity): Poi {
    const poiBuilder = Builder(Poi)
      .id(poiEntity.poiId)
      .uid(poiEntity.uid || '')
      .layerId(poiEntity.layerId)
      .layerProperties(convertArrayStringToArray(poiEntity.layer?.availableTabs || '[]'))
      .geom(
        typeof poiEntity.shape === 'string'
          ? JSON.parse(poiEntity.shape)
          : poiEntity.shape,
      );

    if (poiEntity.areas && poiEntity.areas.length > 0) {
      const areaEntity = poiEntity.areas[0];
      const areaGeom =
        typeof areaEntity.geom === 'string'
          ? JSON.parse(areaEntity.geom)
          : areaEntity.geom;
      poiBuilder.area({
        id: areaEntity.id,
        shape: areaEntity.shape as unknown as AreaShape,
        coordinates: areaGeom.coordinates,
      });
    }

    return poiBuilder.build();
  }
}
