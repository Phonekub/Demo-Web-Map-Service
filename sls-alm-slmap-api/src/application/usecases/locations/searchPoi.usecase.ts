import { Inject, Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import {
  BaseSearchQuery,
  ClosedStoreSearchQuery,
  CompetitorSearchQuery,
  OtherPlaceSearchQuery,
  PotentialSearchQuery,
  SearchType,
  SevenElevenSearchQuery,
  SevenImpactCompetitorSearchQuery,
  TradeAreaSearchQuery,
  VendingMachineSearchQuery,
} from '../../../adapter/inbound/dtos/search.dto';
import { JwtPayload } from '@common/interfaces/jwtPayload';

@Injectable()
export class SearchPoiUseCase {
  constructor(
    @Inject('PoiRepository') private readonly poiRepository: PoiRepositoryPort,
    @Inject('TradeareaRepository')
    private readonly tradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(query: BaseSearchQuery, payload: JwtPayload) {
    const accessArea = payload.zoneCodes;

    const zoneCodes = Object.keys(accessArea);
    if (zoneCodes.length === 0) {
      return [[], 0];
    }

    const boundaryArea: [string, string][] = zoneCodes.flatMap((zoneCode) =>
      accessArea[zoneCode].map((code) => [zoneCode, code] as [string, string]),
    );

    const store = payload.storeCode;
    const searchTypeMap = new Map([
      [SearchType.SEVEN_ELEVEN, () => this.searchSevenEleven(query, boundaryArea, store)],
      [SearchType.COMPETITOR, () => this.searchCompetitor(query, boundaryArea)],
      [SearchType.CLOSED_STORE, () => this.searchClosedStore(query, boundaryArea)],
      [
        SearchType.VENDING_MACHINE,
        () => this.searchVendingMachine(query, boundaryArea, store),
      ],
      [
        SearchType.SEVEN_IMPACT_COMPETITOR,
        () => this.searchSevenImpactCompetitor(query, boundaryArea),
      ],
      [SearchType.POTENTIAL, () => this.searchPotential(query, boundaryArea)],
      [SearchType.OTHER_PLACE, () => this.searchOtherPlace(query, boundaryArea)],
      [SearchType.TRADE_AREA, () => this.searchTradeArea(query, boundaryArea)],
    ]);

    const searchHandler = searchTypeMap.get(query.type);
    if (!searchHandler) {
      throw new Error(`Search type ${query.type} is not implemented yet`);
    }
    return await searchHandler();
  }

  private async searchSevenEleven(
    query: BaseSearchQuery,
    boundaryArea: [string, string][],
    store: string[],
  ) {
    const sevenElevenQuery = query as SevenElevenSearchQuery;
    const params = Builder(SevenElevenSearchQuery)
      .text(sevenElevenQuery.text)
      .address(sevenElevenQuery.address)
      .countryCode(sevenElevenQuery.countryCode)
      .provinceCode(sevenElevenQuery.provinceCode)
      .districtCode(sevenElevenQuery.districtCode)
      .subDistrictCode(sevenElevenQuery.subDistrictCode)
      .zoneCode(sevenElevenQuery.zoneCode)
      .radius(sevenElevenQuery.radius)
      .lat(sevenElevenQuery.lat)
      .long(sevenElevenQuery.long)
      .displayOnMap(sevenElevenQuery.displayOnMap)
      .sevenType(sevenElevenQuery.sevenType)
      .limit(sevenElevenQuery.limit)
      .page(sevenElevenQuery.page)
      .build();

    const limit = params.limit || 10;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    const [resultSearch, total] = await this.poiRepository.findSevenStore(
      params,
      boundaryArea,
      store,
      limit,
      offset,
    );

    const shouldFetchPoi = params.displayOnMap !== false;
    const allPoi = shouldFetchPoi
      ? await this.searchAllPoiSevenEleven(params, boundaryArea, store)
      : [];

    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiSevenEleven(
    params,
    boundaryArea: [string, string][],
    store: string[],
  ) {
    const [allStores] = await this.poiRepository.findSevenStore(
      params,
      boundaryArea,
      store,
      1000,
    );

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      radius: params.radius,
      symbol: poi.layer.symbol ? `${poi.layer.symbol}.png` : '',
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchCompetitor(
    query: BaseSearchQuery,
    boundaryArea: [string, string][],
  ) {
    const competitorQuery = query as CompetitorSearchQuery;
    const params = Builder(CompetitorSearchQuery)
      .text(competitorQuery.text)
      .address(competitorQuery.address)
      .countryCode(competitorQuery.countryCode)
      .provinceCode(competitorQuery.provinceCode)
      .districtCode(competitorQuery.districtCode)
      .subDistrictCode(competitorQuery.subDistrictCode)
      .radius(competitorQuery.radius)
      .textOtherBrand(competitorQuery.textOtherBrand)
      .limit(competitorQuery.limit)
      .page(competitorQuery.page)
      .build();

    const limit = params.limit || 10;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    const [resultSearch, total] = await this.poiRepository.findCompetitorStore(
      params,
      boundaryArea,
      limit,
      offset,
    );
    const allPoi = await this.searchAllPoiCompetitor(params, boundaryArea);
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiCompetitor(params, boundaryArea: [string, string][]) {
    const [allStores] = await this.poiRepository.findCompetitorStore(
      params,
      boundaryArea,
      1000,
    );

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      radius: params.radius,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchPotential(
    query: BaseSearchQuery,
    boundaryArea: [string, string][],
  ) {
    const potentialQuery = query as PotentialSearchQuery;
    const params = Builder(PotentialSearchQuery)
      .text(potentialQuery.text)
      .address(potentialQuery.address)
      .countryCode(potentialQuery.countryCode)
      .provinceCode(potentialQuery.provinceCode)
      .districtCode(potentialQuery.districtCode)
      .subDistrictCode(potentialQuery.subDistrictCode)
      .radius(potentialQuery.radius)
      .status(potentialQuery.status)
      .rent_type(potentialQuery.rent_type)
      .limit(potentialQuery.limit)
      .page(potentialQuery.page)
      .build();

    if (query.forcedZone) {
      params.forcedZone = query.forcedZone;
    }

    const limit = params.limit || 10;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    const [resultSearch, total] = await this.poiRepository.findPotentialStore(
      params,
      boundaryArea,
      limit,
      offset,
    );
    const allPoi = await this.searchAllPoiPotential(params, boundaryArea);
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiPotential(params, boundaryArea: [string, string][]) {
    const [allStores] = await this.poiRepository.findPotentialStore(
      params,
      boundaryArea,
      1000,
    );

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      radius: params.radius,
      symbol: poi.layer.symbol ? `${poi.layer.symbol}-${poi.status}.png` : '',
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchOtherPlace(
    query: BaseSearchQuery,
    boundaryArea: [string, string][],
  ) {
    const otherPlaceQuery = query as OtherPlaceSearchQuery;
    const params = Builder(OtherPlaceSearchQuery)
      .text(otherPlaceQuery.text)
      .address(otherPlaceQuery.address)
      .countryCode(otherPlaceQuery.countryCode)
      .provinceCode(otherPlaceQuery.provinceCode)
      .districtCode(otherPlaceQuery.districtCode)
      .subDistrictCode(otherPlaceQuery.subDistrictCode)
      .radius(otherPlaceQuery.radius)
      .layerId(otherPlaceQuery.layerId)
      .limit(otherPlaceQuery.limit)
      .page(otherPlaceQuery.page)
      .build();

    const limit = params.limit || 10;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    const [resultSearch, total] = await this.poiRepository.findOtherPlace(
      params,
      boundaryArea,
      limit,
      offset,
    );
    const allPoi = await this.searchAllPoiOtherPlace(params, boundaryArea);
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiOtherPlace(params, boundaryArea: [string, string][]) {
    const [allOtherPlaces] = await this.poiRepository.findOtherPlace(
      params,
      boundaryArea,
      1000,
    );

    return allOtherPlaces.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      radius: params.radius,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchClosedStore(
    query: BaseSearchQuery,
    boundaryArea: [string, string][],
  ) {
    const closedStoreQuery = query as ClosedStoreSearchQuery;
    const params = Builder(ClosedStoreSearchQuery)
      .text(closedStoreQuery.text)
      .address(closedStoreQuery.address)
      .countryCode(closedStoreQuery.countryCode)
      .provinceCode(closedStoreQuery.provinceCode)
      .districtCode(closedStoreQuery.districtCode)
      .subDistrictCode(closedStoreQuery.subDistrictCode)
      .radius(closedStoreQuery.radius)
      .close_type(closedStoreQuery.close_type)
      .limit(closedStoreQuery.limit)
      .page(closedStoreQuery.page)
      .build();

    const limit = params.limit || 10;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    // Determine which table to query based on close_type
    const closeType = params.close_type?.toLowerCase().trim();
    const isSeven = closeType === 'seveneleven';
    const isCompetitor = closeType === 'competitor';
    const isAll = closeType === 'all';

    // If close_type is invalid (not sevenEleven or competitor or null), return empty result
    if (closeType && !isSeven && !isCompetitor && !isAll) {
      return [{ search: [], poi: [] }, 0];
    }

    // If close_type is not specified or null, query both tables
    if (isAll || !closeType) {
      const [sevenResults] = await this.poiRepository.findClosedSevenEleven(
        params,
        boundaryArea,
        limit,
        offset,
      );
      const [competitorResults] = await this.poiRepository.findClosedCompetitor(
        params,
        boundaryArea,
        limit,
        offset,
      );

      const combined = [...sevenResults, ...competitorResults];
      const sorted = combined.sort((a, b) => a.id - b.id);
      const paginated = sorted.slice(offset, offset + limit);

      const allPoi = await this.searchAllPoiClosedStore(params, boundaryArea);
      return [{ search: paginated, poi: allPoi }, combined.length];
    }

    // Query specific type
    let resultSearch, total;
    if (isSeven) {
      [resultSearch, total] = await this.poiRepository.findClosedSevenEleven(
        params,
        boundaryArea,
        limit,
        offset,
      );
    } else {
      [resultSearch, total] = await this.poiRepository.findClosedCompetitor(
        params,
        boundaryArea,
        limit,
        offset,
      );
    }

    const allPoi = await this.searchAllPoiClosedStore(params, boundaryArea);
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiClosedStore(params, boundaryArea: [string, string][]) {
    const closeType = params.close_type?.toLowerCase().trim();
    const isSeven = closeType === 'seveneleven';
    const isCompetitor = closeType === 'competitor';
    const isAll = closeType === 'all';

    let allStores = [];

    if (!closeType || isAll) {
      const [sevenStores] = await this.poiRepository.findClosedSevenEleven(
        params,
        boundaryArea,
        1000,
      );
      const [competitorStores] = await this.poiRepository.findClosedCompetitor(
        params,
        boundaryArea,
        1000,
      );
      allStores = [...sevenStores, ...competitorStores];
    } else if (isSeven) {
      [allStores] = await this.poiRepository.findClosedSevenEleven(
        params,
        boundaryArea,
        1000,
      );
    } else if (isCompetitor) {
      [allStores] = await this.poiRepository.findClosedCompetitor(
        params,
        boundaryArea,
        1000,
      );
    }

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      radius: params.radius,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchVendingMachine(
    query: BaseSearchQuery,
    boundaryArea: [string, string][],
    store: string[],
  ) {
    const vendingMachineQuery = query as VendingMachineSearchQuery;

    const limit = vendingMachineQuery.limit || 10;
    const page = vendingMachineQuery.page || 1;
    const offset = (page - 1) * limit;

    const [resultSearch, total] = await this.poiRepository.findVendingMachineStore(
      vendingMachineQuery,
      boundaryArea,
      store,
      limit,
      offset,
    );
    const allPoi = await this.searchAllPoiVendingMachine(
      vendingMachineQuery,
      boundaryArea,
      store,
    );
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiVendingMachine(
    params,
    boundaryArea: [string, string][],
    store: string[],
  ) {
    const [allStores] = await this.poiRepository.findVendingMachineStore(
      params,
      boundaryArea,
      store,
      1000,
    );

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      radius: params.radius,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchSevenImpactCompetitor(
    query: BaseSearchQuery,
    boundaryArea: [string, string][],
  ) {
    const sevenImpactQuery = query as SevenImpactCompetitorSearchQuery;

    const limit = sevenImpactQuery.limit || 10;
    const page = sevenImpactQuery.page || 1;
    const offset = (page - 1) * limit;

    const [resultSearch, total] = await this.poiRepository.findSevenImpactCompetitor(
      sevenImpactQuery,
      boundaryArea,
      limit,
      offset,
    );
    const allPoi = await this.searchAllPoiSevenImpactCompetitor(
      sevenImpactQuery,
      boundaryArea,
    );
    return [{ search: resultSearch, poi: allPoi }, total];
  }

  private async searchAllPoiSevenImpactCompetitor(
    params,
    boundaryArea: [string, string][],
  ) {
    const [allStores] = await this.poiRepository.findSevenImpactCompetitor(
      params,
      boundaryArea,
      1000,
    );

    return allStores.map((poi) => ({
      id: poi.id,
      name: poi.branchName,
      coordinates: poi.geom.coordinates,
      radius: params.radius,
      layerProperties: poi.layerProperties,
    }));
  }

  private async searchTradeArea(
    query: BaseSearchQuery,
    boundaryArea: [string, string][],
  ) {
    const limit = query.limit || 10;
    const page = query.page || 1;
    const offset = (page - 1) * limit;
    const tradeAreaQuery = query as TradeAreaSearchQuery;

    const params = {
      nation: tradeAreaQuery.countryCode,
      provCode: tradeAreaQuery.provinceCode,
      ampCode: tradeAreaQuery.districtCode,
      tamCode: tradeAreaQuery.subDistrictCode,
      status: tradeAreaQuery.status,
      approvalType: tradeAreaQuery.approvalType,
      tradeAreaType: tradeAreaQuery.tradeAreaType,
      searchKey: tradeAreaQuery.text,
      // อนาคตถ้าแบบฟอร์มมีเพิ่มก็ส่งมาเพิ่มได้
      // storeCode: tradeAreaQuery.storeCode,
      // zoneCode: tradeAreaQuery.zoneCode,
    };

    // 1) ชุดสำหรับ LIST (ซ้าย) — ยัง paginate ตามปกติ
    const [pageTradeareas, total] =
      await this.tradeareaRepository.findTradeareasForSearch(
        params,
        boundaryArea,
        limit,
        offset,
      );

    const search = pageTradeareas.map((t) => {
      const shape =
        typeof t.shape === 'string'
          ? JSON.parse(t.shape)
          : (t.shape as { type?: string; coordinates?: number[][][] } | null);

      return {
        id: t.id,
        uid: t.globalId,
        branchName: t.storeName || '',
        branchCode: t.storeCode || '',
        location: t.locationT || '',
        geom: t.lat && t.lng ? { type: 'Point', coordinates: [t.lng, t.lat] } : null,
        area: {
          id: t.id,
          shape: shape?.type || 'Polygon',
          coordinates: shape?.coordinates || [],
        },
        // เก็บ poiId ไว้ถ้าจะใช้ในอนาคต แต่อย่าใช้ยิง /locations/:id ตรง ๆ
        poiId: t.poiId ? Number(t.poiId) : undefined,
      };
    });

    const ALL_LIMIT = 1000;
    const [allTradeareas] = await this.tradeareaRepository.findTradeareasForSearch(
      params,
      boundaryArea,
      ALL_LIMIT,
      0,
    );

    const poi = allTradeareas.map((t) => {
      const shape =
        typeof t.shape === 'string'
          ? JSON.parse(t.shape)
          : (t.shape as { type?: string; coordinates?: number[][][] } | null);

      return {
        id: t.id,
        name: t.storeName || '',
        type: 'Polygon',
        coordinates: shape?.coordinates || [],
        radius: query.radius,
        areaColor: (t as any).areaColor ?? undefined,
      };
    });

    return [{ search, poi }, total];
  }
}
