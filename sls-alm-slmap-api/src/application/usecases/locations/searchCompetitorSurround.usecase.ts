import { Inject, Injectable } from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { Poi } from '../../../domain/poi';

export interface CompetitorTypeGroup {
  seqNo: number;
  codeMapping: string;
  typeName: string;
  typeNameTh: string;
  typeNameEn: string;
  typeNameKh: string;
  count: number;
  competitors: Partial<Poi>[];
}

@Injectable()
export class SearchCompetitorSurroundUseCase {
  constructor(
    @Inject('PoiRepository') private readonly poiRepository: PoiRepositoryPort,
  ) {}

  async handler(sevenPoiUid: string): Promise<[CompetitorTypeGroup[], number]> {
    const [results] = await this.poiRepository.findCompetitorSurroundByUid(sevenPoiUid);

    const groupedMap = new Map<string, CompetitorTypeGroup>();

    for (const competitor of results) {
      const codeMapping = competitor.competitorTypeCodeMapping || '0';

      if (!groupedMap.has(codeMapping)) {
        groupedMap.set(codeMapping, {
          seqNo: competitor.competitorTypeSeqNo || 0,
          codeMapping,
          typeName: competitor.competitorTypeName || '',
          typeNameTh: competitor.competitorTypeNameTh || '',
          typeNameEn: competitor.competitorTypeNameEn || '',
          typeNameKh: competitor.competitorTypeNameKh || '',
          count: 0,
          competitors: [],
        });
      }

      const group = groupedMap.get(codeMapping);
      group.count++;
      group.competitors.push({
        id: competitor.id,
        uid: competitor.uid,
        branchName: competitor.branchName,
        location: competitor.location,
        geom: competitor.geom,
        grade: competitor.grade,
        competitorType: competitor.competitorType,
        layerId: competitor.layerId,
        distance: competitor.distance,
      });
    }

    const groupedData = Array.from(groupedMap.values());

    return [groupedData, groupedData.length];
  }
}
