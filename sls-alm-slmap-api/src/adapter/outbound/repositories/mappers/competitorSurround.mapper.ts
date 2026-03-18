import { Builder } from 'builder-pattern';
import { Poi } from '../../../../domain/poi';

interface CompetitorSurroundRaw {
  competitor_id: number;
  competitor_poiId: number;
  competitor_grade: string;
  competitor_type: number;
  poi_uid: string;
  poi_name: string;
  poi_namt: string;
  poi_shape: string | object;
  poi_locationT: string;
  poi_layerId: number;
  competitorTypeSeqNo: number;
  competitorTypeCodeMapping: string;
  competitorTypeName: string;
  competitorTypeNameTh: string;
  competitorTypeNameEn: string;
  competitorTypeNameKh: string;
  distance: string | number;
}

export class CompetitorSurroundMapper {
  static toDomain(raw: CompetitorSurroundRaw): Poi {
    let geom = null;
    if (raw.poi_shape) {
      try {
        geom =
          typeof raw.poi_shape === 'string' ? JSON.parse(raw.poi_shape) : raw.poi_shape;
      } catch {
        geom = null;
      }
    }

    return Builder(Poi)
      .id(raw.competitor_poiId || raw.competitor_id)
      .uid(raw.poi_uid || '')
      .branchName(raw.poi_name || raw.poi_namt || '')
      .branchCode('')
      .location(raw.poi_locationT || '')
      .geom(geom)
      .grade(raw.competitor_grade || '')
      .competitorType(raw.competitor_type || null)
      .layerId(raw.poi_layerId || null)
      .competitorTypeSeqNo(raw.competitorTypeSeqNo || null)
      .competitorTypeCodeMapping(raw.competitorTypeCodeMapping || null)
      .competitorTypeName(raw.competitorTypeName || null)
      .competitorTypeNameTh(raw.competitorTypeNameTh || null)
      .competitorTypeNameEn(raw.competitorTypeNameEn || null)
      .competitorTypeNameKh(raw.competitorTypeNameKh || null)
      .distance(raw.distance ? parseFloat(raw.distance.toString()) : 0)
      .build();
  }
}
