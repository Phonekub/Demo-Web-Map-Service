import { Builder } from 'builder-pattern';
import { PoiSevenElevenEntity } from '../entities/sevenEleven.entity';
import { Poi, AreaShape } from '../../../../domain/poi';
import { convertArrayStringToArray } from '../../../../common/helpers/utils';

export class SevenElevenMapper {
  static toDomain(entity: PoiSevenElevenEntity): Poi {
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
      .uid(entity.poi?.uid || entity.uid || '')
      .branchName(entity.storename || '')
      .branchCode(entity.storecode || '')
      .location(entity.poi?.locationT || '')
      .layerProperties(
        convertArrayStringToArray(entity.poi?.layer?.availableTabs || '[]'),
      )
      .layer({
        id: entity.poi.layer?.id || 0,
        symbol: entity.poi.layer?.symbol || '',
      })
      .geom(geom);

    if (entity.id) {
      poiBuilder.area({
        id: entity.id,
        coordinates: [], // Area coordinates from poi_seven_eleven if available
        shape: AreaShape.Polygon,
      });
    }

    return poiBuilder.build();
  }
}
