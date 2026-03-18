import { Builder } from 'builder-pattern';
import { PoiCompetitorEntity } from '../entities/competitor.entity';
import { Poi, AreaShape } from '../../../../domain/poi';
import { convertArrayStringToArray } from '../../../../common/helpers/utils';

export class CompetitorMapper {
  static toDomain(entity: PoiCompetitorEntity): Poi {
    // Get geom from poi table (Point geometry)
    let geom = null;
    if (entity.poi?.shape) {
      try {
        geom =
          typeof entity.poi.shape === 'string'
            ? JSON.parse(entity.poi.shape)
            : entity.poi.shape;
      } catch {
        geom = null;
      }
    }

    const poiBuilder = Builder(Poi)
      .id(entity.poiId || entity.id)
      .uid(entity.poi?.uid || '')
      .branchName(entity.poi?.name || entity.poi?.namt || '')
      .branchCode('')
      .location(entity.poi?.locationT || '')
      .layerProperties(
        convertArrayStringToArray(entity.poi?.layer?.availableTabs || '[]'),
      )
      .layer({
        id: entity.poi?.layer?.id || 0,
        symbol: entity.poi?.layer?.symbol || '',
      })
      .geom(geom);

    // Get area from poi_competitor table (using id as area identifier)
    if (entity.id) {
      poiBuilder.area({
        id: entity.id,
        coordinates: [],
        shape: AreaShape.Polygon,
      });
    }

    return poiBuilder.build();
  }
}
