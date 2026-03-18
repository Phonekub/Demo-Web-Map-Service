import { Builder } from 'builder-pattern';
import { PoiEntity } from '../repositories/entities/poi.entity';
import { Poi, AreaShape } from '../../../domain/poi';
import { convertArrayStringToArray } from '../../../common/helpers/utils';

export class OtherPlaceMapper {
  static toDomain(entity: PoiEntity): Poi {
    // Get geom from poi table (Point geometry)
    let geom = null;
    if (entity.shape) {
      try {
        geom = typeof entity.shape === 'string' ? JSON.parse(entity.shape) : entity.shape;
      } catch {
        geom = null;
      }
    }

    const poiBuilder = Builder(Poi)
      .id(entity.poiId || 0)
      .uid(entity.uid || '')
      .branchName(entity.name || entity.namt || '')
      .branchCode('')
      .location(entity.locationT || '')
      .layerProperties(convertArrayStringToArray(entity.layer?.availableTabs || '[]'))
      .layer({
        id: entity.layer?.id || 0,
        symbol: entity.layer?.symbol || '',
      })
      .geom(geom);

    // Get area from poi table if available
    if (entity.areas && entity.areas.length > 0) {
      const areaEntity = entity.areas[0];
      const areaGeom =
        typeof areaEntity.geom === 'string'
          ? JSON.parse(areaEntity.geom)
          : areaEntity.geom;
      poiBuilder.area({
        id: areaEntity.id,
        shape: areaEntity.shape as unknown as AreaShape,
        coordinates: areaGeom?.coordinates || [],
      });
    }

    return poiBuilder.build();
  }
}
