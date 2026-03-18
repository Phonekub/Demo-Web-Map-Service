import { Builder } from 'builder-pattern';
import { PoiTradearea } from '../../../../domain/poiTradearea';
import { TradeareaEntity } from '../entities/tradearea.entity';

export class TradeareaPoiMapper {
  static toDomain(entity: TradeareaEntity): PoiTradearea {
    const builder = Builder(PoiTradearea).tradeareaId(entity.id).poiId(entity.poiId);

    if (entity?.shape) {
      let geom = null;
      try {
        geom = typeof entity.shape === 'string' ? JSON.parse(entity.shape) : entity.shape;
      } catch {
        geom = null;
      } finally {
        builder.areaGeom(geom);
      }
    }

    if (entity.poi?.shape) {
      let geom = null;
      try {
        geom =
          typeof entity.poi.shape === 'string'
            ? JSON.parse(entity.poi.shape)
            : entity.poi.shape;
      } catch {
        geom = null;
      } finally {
        builder.poiGeom(geom);
      }
    }

    return builder.build();
  }
}
