import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { QuotaAllocationSearchRepositoryPort } from '../../../application/ports/quotaAllocationSearch.repository';
import { QuotaSearch, QuotaSearchQuery } from '../../../domain/quotaSearch';
import * as _ from 'lodash';

@Injectable()
export class QuotaAllocationSearchRepository implements QuotaAllocationSearchRepositoryPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async searchQuotas(
    query: QuotaSearchQuery,
    userZones: string[],
    userId?: number,
    roleId?: number,
  ): Promise<[QuotaSearch[]]> {
    try {
      const queryBuilder = this.dataSource
        .createQueryBuilder()
        .select([
          'qa.id AS id',
          'qc.year AS year',
          'qc.location_type AS "locationType"',
          'qc.quota_type AS "quotaType"',
          'qr.name AS round',
          'z.zone_code AS zone',
          'COUNT(qai.id) AS keyed',
          'qa.assigned_quota AS quota',
          'wfs.status_name AS "statusName"',
          'cc_loc.code_name AS "locationTypeName"',
          'cc_quota.code_name AS "quotaTypeName"',
        ])
        .from('quota_allocation', 'qa')
        .innerJoin('quota_round', 'qr', 'qr.id = qa.quota_round_id')
        .innerJoin('quota_config', 'qc', 'qc.id = qr.quota_config_id')
        .innerJoin('zone', 'z', 'z.zone_id = qa.zone_id')
        .innerJoin(
          'wf_transaction',
          'wft',
          'wft.wf_id = 5 AND wft.ref_id = qa.id AND wft.is_active = :isActive',
          { isActive: 'Y' },
        )
        .innerJoin('wf_status', 'wfs', 'wfs.id = wft.wf_status_id')
        .innerJoin('quota_round_status', 'qrs', 'qrs.id = qr.quota_round_status_id')
        .leftJoin(
          'quota_allocation_item',
          'qai',
          "qai.quota_allocation_id = qa.id AND qai.type = 'MAIN'",
        )
        .leftJoin(
          'common_code',
          'cc_loc',
          "cc_loc.code_type = 'QUOTA_LOCATION_TYPE' AND cc_loc.code_value = qc.location_type",
        )
        .leftJoin(
          'common_code',
          'cc_quota',
          "cc_quota.code_type = 'QUOTA_TYPE' AND cc_quota.code_value = qc.quota_type",
        )
        .groupBy('qa.id')
        .addGroupBy('qc.year')
        .addGroupBy('qc.location_type')
        .addGroupBy('qc.quota_type')
        .addGroupBy('qr.name')
        .addGroupBy('qr.seq')
        .addGroupBy('z.zone_code')
        .addGroupBy('qa.assigned_quota')
        .addGroupBy('wfs.status_name')
        .addGroupBy('qrs.name')
        .addGroupBy('cc_loc.code_name')
        .addGroupBy('cc_quota.code_name');

      // User zone filter - Always apply zone authorization
      if (userZones && userZones.length > 0) {
        queryBuilder.andWhere('z.zone_code IN (:...userZones)', { userZones });
      }

      // Pending only filter - Check workflow transaction
      // approve_by อาจมีหลาย ID คั่นด้วย comma เช่น "1,2,3"
      // ใช้ string_to_array + ANY เพื่อรองรับกรณีนี้
      if (query.pendingOnly && (userId || roleId)) {
        queryBuilder.andWhere(
          `(
             (wft.approve_type = 'USER' AND :userId = ANY(string_to_array(wft.approve_by, ','))) OR
             (wft.approve_type = 'ROLE' AND :roleId = ANY(string_to_array(wft.approve_by, ',')))
           )`,
          { userId: String(userId), roleId: String(roleId) },
        );
      }

      // Filters
      if (!_.isEmpty(query.year)) {
        queryBuilder.andWhere('qc.year = :year', { year: query.year });
      }

      if (!_.isEmpty(query.locationType)) {
        queryBuilder.andWhere('qc.location_type = :locationType', {
          locationType: query.locationType,
        });
      }

      if (!_.isEmpty(query.quotaType)) {
        queryBuilder.andWhere('qc.quota_type = :quotaType', {
          quotaType: query.quotaType,
        });
      }

      if (!_.isEmpty(query.round)) {
        queryBuilder.andWhere('qr.name ILIKE :round', { round: `%${query.round}%` });
      }

      if (!_.isEmpty(query.zone)) {
        queryBuilder.andWhere('z.zone_code = :zone', { zone: query.zone });
      }

      if (!_.isEmpty(query.status)) {
        queryBuilder.andWhere('wfs.id = :statusId', { statusId: parseInt(query.status) });
      }

      // Order by
      queryBuilder
        .orderBy('qc.year', 'DESC')
        .addOrderBy('qr.seq', 'ASC')
        .addOrderBy('z.zone_code', 'ASC');

      const results = await queryBuilder.getRawMany();

      const quotas: QuotaSearch[] = results.map((row) => ({
        id: row.id,
        year: row.year,
        locationTypeName: row.locationTypeName,
        quotaTypeName: row.quotaTypeName,
        round: row.round,
        zone: row.zone,
        keyed: row.keyed,
        quota: row.quota,
        statusName: row.statusName,
      }));

      return [quotas];
    } catch (error) {
      console.error('Error in searchQuotas repository:', error);
      throw error;
    }
  }
}
