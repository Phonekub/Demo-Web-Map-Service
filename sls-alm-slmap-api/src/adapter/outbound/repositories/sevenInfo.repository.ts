import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SevenInfoRepositoryPort } from '../../../application/ports/sevenInfo.repository';
import { SevenInfo } from '../../../domain/sevenInfo';

@Injectable()
export class SevenInfoRepository implements SevenInfoRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  async findByPoiId(poiId: number): Promise<SevenInfo | null> {
    const result = await this.dataSource.query(
      `
      SELECT
        pse.storecode,
        pse.storename,
        p.location_t,
        pse.trade_area,
        pse.branch_type,
        cc.code_name                                        AS seven_type,
        TO_CHAR(pse.contract_start_date, 'DD/MM/YYYY')     AS contract_start_date,
        TO_CHAR(pse.contract_end_date,   'DD/MM/YYYY')     AS contract_end_date,
        pse.store_width,
        pse.store_length,
        pse.sale_area,
        pse.stock_area,
        pse.store_area,
        pse.store_building_type,
        pse.room_amount,
        pse.store_parking,
        pse.store_parking_motocycle,
        TO_CHAR(pse.open_date,             'DD/MM/YYYY')   AS open_date,
        TO_CHAR(pse.closed_date,           'DD/MM/YYYY')   AS close_date,
        pse.office_hours,
        TO_CHAR(pse.renovate_start_date,   'DD/MM/YYYY')   AS renovate_start_date,
        TO_CHAR(pse.renovate_end_date,     'DD/MM/YYYY')   AS renovate_end_date,
        TO_CHAR(pse.tempclose_start_date,  'DD/MM/YYYY')   AS tempclose_start_date,
        TO_CHAR(pse.tempclose_end_date,    'DD/MM/YYYY')   AS tempclose_end_date,
        pse.sale_average,
        pse.customer_average,
        pse.sale_price_person,
        pse.opentype_amount,
        pse.vault_amount,
        pse.shelf,
        pse.pos_amount,
        pse.can_sale_cigarette,
        pse.can_sale_alcohol
      FROM allmap.poi_seven_eleven pse
      INNER JOIN allmap.poi p
        ON p.poi_id = pse.poi_id
      LEFT JOIN allmap.common_code cc
        ON cc.code_type = 'SEVEN_TYPE'
        AND cc.code_value = pse.seven_type::varchar
      WHERE pse.poi_id = $1
      LIMIT 1
      `,
      [poiId],
    );

    if (!result || result.length === 0) return null;

    const row = result[0];
    return {
      storecode: row.storecode ?? null,
      storename: row.storename ?? null,
      locationT: row.location_t ?? null,
      tradeArea: row.trade_area ?? null,
      branchType: row.branch_type ?? null,
      sevenType: row.seven_type ?? null,
      contractStartDate: row.contract_start_date ?? null,
      contractEndDate: row.contract_end_date ?? null,
      storeWidth: row.store_width != null ? String(row.store_width) : null,
      storeLength: row.store_length != null ? String(row.store_length) : null,
      saleArea: row.sale_area != null ? String(row.sale_area) : null,
      stockArea: row.stock_area != null ? String(row.stock_area) : null,
      storeArea: row.store_area != null ? String(row.store_area) : null,
      storeBuildingType: row.store_building_type ?? null,
      roomAmount: row.room_amount != null ? String(row.room_amount) : null,
      storeParking: row.store_parking != null ? String(row.store_parking) : null,
      storeParkingMotocycle: row.store_parking_motocycle != null ? String(row.store_parking_motocycle) : null,
      openDate: row.open_date ?? null,
      closeDate: row.close_date ?? null,
      officeHours: row.office_hours ?? null,
      renovateStartDate: row.renovate_start_date ?? null,
      renovateEndDate: row.renovate_end_date ?? null,
      tempcloseStartDate: row.tempclose_start_date ?? null,
      tempcloseEndDate: row.tempclose_end_date ?? null,
      saleAverage: row.sale_average != null ? String(row.sale_average) : null,
      customerAverage: row.customer_average != null ? String(row.customer_average) : null,
      salePricePerson: row.sale_price_person != null ? String(row.sale_price_person) : null,
      opentypeAmount: row.opentype_amount != null ? String(row.opentype_amount) : null,
      vaultAmount: row.vault_amount != null ? String(row.vault_amount) : null,
      shelf: row.shelf != null ? String(row.shelf) : null,
      posAmount: row.pos_amount != null ? String(row.pos_amount) : null,
      canSaleCigarette: row.can_sale_cigarette ?? null,
      canSaleAlcohol: row.can_sale_alcohol ?? null,
    };
  }
}
