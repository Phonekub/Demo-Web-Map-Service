import { Inject, Injectable } from '@nestjs/common';
import { FindPoisByPolygonParam, PoiRepositoryPort } from '../../ports/poi.repository';
import {
  SpatialSearchQuery,
  SpatialType,
} from '../../../adapter/inbound/dtos/search.dto';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { Tradearea } from '../../../domain/tradearea';
import { Poi } from '../../../domain/poi';
import { JwtPayload } from '@common/interfaces/jwtPayload';
import { Builder } from 'builder-pattern';

type SevenElevenResult = {
  search: Poi[];
  poi: { id: number; name: string; coordinates: number[] }[];
};

type TradeAreaSearchItem = {
  id: number;
  uid: string;
  branchName: string;
  branchCode: string;
  location: string;
  geom: {
    type: 'Point';
    coordinates: number[];
  } | null;
  area: {
    id: number;
    shape: string;
    coordinates: number[][][];
  };
  poiId?: number;
};

type TradeAreaPoiItem = {
  id: number;
  name: string;
  type: string;
  coordinates: number[][][]; // Polygon
};

type TradeAreaResult = {
  search: TradeAreaSearchItem[];
  poi: TradeAreaPoiItem[];
};

type BackupProfilePoiItem = {
  id: number;
  name: string;
  coordinates: number[];
};

type BackupProfileLayer = {
  layerId: number;
  layerName: string;
  layerTh?: string;
  layerEn?: string;
  layerKh?: string;
  pois: BackupProfilePoiItem[];
};

type BackupProfileResult = {
  layers: BackupProfileLayer[];
};

type HandlerResult = [SevenElevenResult | TradeAreaResult | BackupProfileResult, number];
// type TradeareaResult = Tradearea[];
// type HandlerResult = [SevenElevenResult | TradeareaResult, number];

@Injectable()
export class SpatialSearchUseCase {
  constructor(
    @Inject('PoiRepository') private readonly poiRepository: PoiRepositoryPort,
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(query: SpatialSearchQuery, payload: JwtPayload): Promise<HandlerResult> {
    const accessArea = payload.zoneCodes;
    const zoneCodes = Object.keys(accessArea || {});
    if (zoneCodes.length === 0) {
      return [{ search: [], poi: [] }, 0];
    }

    const boundaryArea: [string, string][] = zoneCodes.flatMap((zoneCode) =>
      accessArea[zoneCode].map((code) => [zoneCode, code] as [string, string]),
    );

    const spatialQuery = query;
    // const spatialTypes = Array.isArray(spatialQuery.spatialType)
    //   ? spatialQuery.spatialType
    //   : [spatialQuery.spatialType];

    const store = payload.storeCode;
    const searchTypeMap = new Map<SpatialType, () => Promise<HandlerResult>>([
      [
        SpatialType.SEVEN_ELEVEN,
        () => this.searchSevenElevenSpatial(spatialQuery, boundaryArea, store),
      ],
      [
        SpatialType.TRADE_AREA,
        () => this.searchTradeareaSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.FILTER_COMPETITOR,
        () => this.searchCompetitorSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.FILTER_POTENTIAL,
        () => this.searchPotentialSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.FILTER_STATION,
        () => this.searchStationSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.FILTER_VENDING,
        () => this.searchVendingSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.FILTER_PERMANENT_CLOSED,
        () => this.searchPermanentClosedSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.BACKUP_PROFILE,
        () => this.searchBackupProfileSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.SEVEN_IMPACT_COMPETITOR,
        () => this.searchSevenImpactCompetitorSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.DELIVERY_AREA,
        () => this.searchDeliveryAreaSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.DELIVERY_AREA_DRAFT,
        () => this.searchDeliveryAreaDraftSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.DELIVERY_AREA_SCHEDULED,
        () => this.searchDeliveryAreaScheduledSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.STORE_HUB,
        () => this.searchStoreHubSpatial(spatialQuery, boundaryArea),
      ],
      [
        SpatialType.STORE_HUB_DRAFT,
        () => this.searchStoreHubDraftSpatial(spatialQuery, boundaryArea),
      ],
    ]);

    const searchHandler = searchTypeMap.get(spatialQuery.spatialType);
    if (!searchHandler) {
      throw new Error(
        `Spatial search type ${spatialQuery.spatialType} is not implemented yet`,
      );
    }
    return await searchHandler();
  }

  private async searchTradeareaSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    const [tradeareas, total] = await this.TradeareaRepository.findTradeareasByPolygon(
      query.coordinates,
      boundaryArea,
    );

    const resultFormatted: TradeAreaResult = {
      search: tradeareas.map((t) => ({
        id: t.id,
        uid: t.globalId,
        branchName: t.storeName || '',
        branchCode: t.storeCode || '',
        location: t.locationT || '',
        geom:
          t.lat && t.lng
            ? {
                type: 'Point',
                coordinates: [t.lng, t.lat],
              }
            : null,
        area: {
          id: t.id,
          shape: 'polygon',
          coordinates: [],
        },
        poiId: t.poiId ? Number(t.poiId) : undefined,
      })),

      poi: tradeareas.map((t: Tradearea) => ({
        id: t.id,
        name: t.storeName || '',
        type: (t.shape as { type?: string })?.type || 'Polygon',
        coordinates: (t.shape as { coordinates?: number[][][] })?.coordinates || [],
        areaColor: t.areaColor || undefined,
      })),
    };

    return [resultFormatted, total];
  }
  private async searchSevenElevenSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
    store: string[] | null,
  ): Promise<HandlerResult> {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(query.coordinates)
      .boundaryArea(boundaryArea)
      .store(store)
      .storeType('sevenEleven')
      .build();

    const [resultSearch, total] = await this.poiRepository.findPoisByPolygon(params);

    const allPoi = await this.searchAllPoiSevenEleven(
      query.coordinates,
      boundaryArea,
      store,
    );
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiSevenEleven(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
    store: string[] | null,
  ) {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(coordinates)
      .boundaryArea(boundaryArea)
      .store(store)
      .storeType('sevenEleven')
      .limit(1000)
      .build();

    const [allStores] = await this.poiRepository.findPoisByPolygon(params);

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      symbol: poi.layer?.symbol || '',
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchCompetitorSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(query.coordinates)
      .boundaryArea(boundaryArea)
      .storeType('competitor')
      .build();
    const [resultSearch, total] = await this.poiRepository.findPoisByPolygon(params);

    const allPoi = await this.searchAllPoiCompetitor(query.coordinates, boundaryArea);
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiCompetitor(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
  ) {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(coordinates)
      .boundaryArea(boundaryArea)
      .storeType('competitor')
      .limit(1000)
      .build();

    const [allStores] = await this.poiRepository.findPoisByPolygon(params);

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchPotentialSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(query.coordinates)
      .boundaryArea(boundaryArea)
      .storeType('potential')
      .build();
    const [resultSearch, total] = await this.poiRepository.findPoisByPolygon(params);

    const allPoi = await this.searchAllPoiPotential(query.coordinates, boundaryArea);
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiPotential(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
  ) {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(coordinates)
      .boundaryArea(boundaryArea)
      .storeType('potential')
      .limit(1000)
      .build();
    const [allStores] = await this.poiRepository.findPoisByPolygon(params);

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      symbol: poi.layer.symbol ? `${poi.layer.symbol}-${poi.status}.png` : '',
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchStationSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(query.coordinates)
      .boundaryArea(boundaryArea)
      .storeType('otherPlace')
      .build();
    const [resultSearch, total] = await this.poiRepository.findPoisByPolygon(params);

    const allPoi = await this.searchAllPoiStation(query.coordinates, boundaryArea);
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiStation(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
  ) {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(coordinates)
      .boundaryArea(boundaryArea)
      .storeType('otherPlace')
      .limit(1000)
      .build();
    const [allStores] = await this.poiRepository.findPoisByPolygon(params);

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchVendingSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(query.coordinates)
      .boundaryArea(boundaryArea)
      .storeType('vending')
      .build();
    const [resultSearch, total] = await this.poiRepository.findPoisByPolygon(params);

    const allPoi = await this.searchAllPoiVending(query.coordinates, boundaryArea);
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiVending(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
  ) {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(coordinates)
      .boundaryArea(boundaryArea)
      .storeType('vending')
      .limit(1000)
      .build();
    const [allStores] = await this.poiRepository.findPoisByPolygon(params);

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchPermanentClosedSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(query.coordinates)
      .boundaryArea(boundaryArea)
      .storeType('permanentClosed')
      .build();
    const [resultSearch, total] = await this.poiRepository.findPoisByPolygon(params);

    const allPoi = await this.searchAllPoiPermanentClosed(
      query.coordinates,
      boundaryArea,
    );
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiPermanentClosed(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
  ) {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(coordinates)
      .boundaryArea(boundaryArea)
      .storeType('permanentClosed')
      .limit(1000)
      .build();
    const [allStores] = await this.poiRepository.findPoisByPolygon(params);

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchSevenImpactCompetitorSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(query.coordinates)
      .boundaryArea(boundaryArea)
      .storeType('sevenImpactCompetitor')
      .build();
    const [resultSearch, total] = await this.poiRepository.findPoisByPolygon(params);

    const allPoi = await this.searchAllPoiSevenImpactCompetitor(
      query.coordinates,
      boundaryArea,
    );
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiSevenImpactCompetitor(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
  ) {
    const params = Builder<FindPoisByPolygonParam>()
      .coordinates(coordinates)
      .boundaryArea(boundaryArea)
      .storeType('sevenImpactCompetitor')
      .limit(1000)
      .build();
    const [allStores] = await this.poiRepository.findPoisByPolygon(params);

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchBackupProfileSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<[any, number]> {
    const [pois, total] = await this.poiRepository.findPoisByPolygonGroupByLayer(
      query.coordinates,
      boundaryArea,
      1000,
      0,
    );

    const categoryMap = new Map<
      number,
      {
        layerName: string;
        layerTh?: string;
        layerEn?: string;
        layerKh?: string;
        subCategories: Map<number, { formConfigId: number | null; pois: Poi[] }>;
      }
    >();

    for (const poi of pois) {
      if (!poi.layerId || !poi.subCode) continue;

      const categoryId = poi.layerId;
      const categoryName = poi.layerName ?? 'Unknown';
      const categoryTh = poi.layerTh ?? '';
      const categoryEn = poi.layerEn ?? '';
      const categoryKh = poi.layerKh ?? '';

      const subCategoryId = (poi as any).profileSubCategoryId;
      const formConfigId = (poi as any).formConfigId ?? null;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          layerName: categoryName,
          layerTh: categoryTh,
          layerEn: categoryEn,
          layerKh: categoryKh,
          subCategories: new Map(),
        });
      }

      const cat = categoryMap.get(categoryId)!;

      if (!cat.subCategories.has(subCategoryId)) {
        cat.subCategories.set(subCategoryId, {
          formConfigId,
          pois: [],
        });
      }

      cat.subCategories.get(subCategoryId)!.pois.push(poi);
    }

    const layers = Array.from(categoryMap.entries()).map(([layerId, cat]) => ({
      layerId,
      layerName: cat.layerName,
      layerTh: cat.layerTh,
      layerEn: cat.layerEn,
      layerKh: cat.layerKh,
      subCategories: Array.from(cat.subCategories.entries()).map(
        ([profileSubCategoryId, sub]) => ({
          profileSubCategoryId,
          formConfigId: sub.formConfigId,
          pois: sub.pois,
        }),
      ),
    }));

    return [{ layers }, total];
  }

  private async searchDeliveryAreaSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    return this.searchTradeareaByType(query, boundaryArea, 1, 'ACTIVE');
  }

  private async searchDeliveryAreaDraftSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    return this.searchTradeareaByType(query, boundaryArea, 1, 'DRAFT');
  }

  private async searchDeliveryAreaScheduledSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    return this.searchTradeareaByType(query, boundaryArea, 1, 'SCHEDULED');
  }

  private async searchStoreHubSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    return this.searchTradeareaByType(query, boundaryArea, 2, 'ACTIVE');
  }

  private async searchStoreHubDraftSpatial(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
  ): Promise<HandlerResult> {
    return this.searchTradeareaByType(query, boundaryArea, 2, 'DRAFT');
  }

  private async searchTradeareaByType(
    query: SpatialSearchQuery,
    boundaryArea: [string, string][],
    tradeareaTypeId: number,
    status: string,
  ): Promise<HandlerResult> {
    const [resultSearch, total] = await this.TradeareaRepository.findTradeareasByPolygon(
      query.coordinates,
      boundaryArea,
      tradeareaTypeId,
      status,
    );

    const result: TradeAreaResult = {
      search: resultSearch.map((t) => ({
        id: t.id,
        uid: t.globalId,
        branchName: t.storeName || '',
        branchCode: t.storeCode || '',
        location: t.locationT || '',
        geom:
          t.lat && t.lng
            ? {
                type: 'Point',
                coordinates: [t.lng, t.lat],
              }
            : null,
        area: {
          id: t.id,
          shape: 'polygon',
          coordinates: [],
        },
        poiId: t.poiId ? Number(t.poiId) : undefined,
      })),
      poi: resultSearch.map((t: Tradearea) => ({
        id: t.id,
        name: t.storeName || '',
        type: (t.shape as { type?: string })?.type || 'Polygon',
        coordinates: (t.shape as { coordinates?: number[][][] })?.coordinates || [],
        areaColor: t.areaColor || undefined,
      })),
    };

    return [result, total];
  }
}
