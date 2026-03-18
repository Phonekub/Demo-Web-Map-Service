import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataAccessException } from '../../../common/exceptions/quota.exception';
import { QuotaReportRepositoryPort } from '../../../application/ports/quotaReport.repository';
import { QuotaConfigEntity } from './entities/quotaConfig.entity';
import { QuotaSummaryReportResponse } from '../../../domain/quotaSummaryReport';
import { ZoneEntity } from './entities/zone.entity';
import { QuotaReportOpenPlanEntity } from './entities/quotaReportOpenPlan.entity';
import {
  QuotaReportOpenPlan,
  SaveImpactSiteReportRequest,
  SaveStoreOpeningReportRequest,
  QuotaReportImpactSite,
} from '../../../domain/quotaReport';
import { QuotaReportSiteImpactEntity } from './entities/quotaReportSiteImpact.entity';
import { InvalidReportImpactSiteStatusException } from '../../../common/exceptions/quota.exception';

@Injectable()
export class QuotaReportRepository implements QuotaReportRepositoryPort {
  constructor(
    @InjectRepository(QuotaConfigEntity)
    private readonly zoneModel: Repository<ZoneEntity>,
    @InjectRepository(QuotaReportOpenPlanEntity)
    private readonly reportOpenPlanModel: Repository<QuotaReportOpenPlanEntity>,
    @InjectRepository(QuotaReportSiteImpactEntity)
    private readonly reportSiteImpactModel: Repository<QuotaReportSiteImpactEntity>,
  ) {}

  async getSummaryReport(
    year: string,
    locationType: string,
    quotaType: string,
  ): Promise<QuotaSummaryReportResponse[]> {
    try {
      const raw = await this.zoneModel.query(
        `
      SELECT
          z.zone_code AS "zoneCode",
          COUNT(*) FILTER (WHERE qai.open_month = '01') AS "jan",
          COUNT(*) FILTER (WHERE qai.open_month = '02') AS "feb",
          COUNT(*) FILTER (WHERE qai.open_month = '03') AS "mar",
          COUNT(*) FILTER (WHERE qai.open_month = '04') AS "apr",
          COUNT(*) FILTER (WHERE qai.open_month = '05') AS "may",
          COUNT(*) FILTER (WHERE qai.open_month = '06') AS "jun",
          COUNT(*) FILTER (WHERE qai.open_month = '07') AS "jul",
          COUNT(*) FILTER (WHERE qai.open_month = '08') AS "aug",
          COUNT(*) FILTER (WHERE qai.open_month = '09') AS "sep",
          COUNT(*) FILTER (WHERE qai.open_month = '10') AS "oct",
          COUNT(*) FILTER (WHERE qai.open_month = '11') AS "nov",
          COUNT(*) FILTER (WHERE qai.open_month = '12') AS "dec",
          COUNT(*) FILTER (WHERE qai.open_month IS NOT NULL) AS "total"
      FROM allmap.zone z
      LEFT JOIN allmap.quota_allocation qa
             ON qa.zone_id = z.zone_id
      LEFT JOIN allmap.quota_round qr
             ON qa.quota_round_id = qr.id
      LEFT JOIN allmap.quota_config qc
       ON qr.quota_config_id = qc.id
      LEFT JOIN allmap.quota_allocation_item qai
             ON qa.id = qai.quota_allocation_id
      AND qc.year = $1
      AND qc.location_type = $2
      AND qc.quota_type = $3
      WHERE z.category = 'MAIN'
        AND z.is_active = 'Y'
      GROUP BY z.zone_code
      ORDER BY z.zone_code
      `,
        [year, locationType, quotaType],
      );

      return raw.map(
        (row: any): QuotaSummaryReportResponse => ({
          zoneCode: row.zoneCode,
          months: {
            jan: Number(row.jan) || 0,
            feb: Number(row.feb) || 0,
            mar: Number(row.mar) || 0,
            apr: Number(row.apr) || 0,
            may: Number(row.may) || 0,
            jun: Number(row.jun) || 0,
            jul: Number(row.jul) || 0,
            aug: Number(row.aug) || 0,
            sep: Number(row.sep) || 0,
            oct: Number(row.oct) || 0,
            nov: Number(row.nov) || 0,
            dec: Number(row.dec) || 0,
          },
          total: Number(row.total) || 0,
        }),
      );
    } catch (error) {
      throw new DataAccessException(`Failed to get summary report: ${error.message}`);
    }
  }

  async saveStoreOpeningReport(
    request: SaveStoreOpeningReportRequest,
    userId: number,
  ): Promise<void> {
    try {
      const entity = this.reportOpenPlanModel.create({
        year: request.year,
        locationTypeList: request.locationTypeList,
        quotaTypeList: request.quotaTypeList,
        zoneList: request.zoneList,
        isActive: 'Y',
        createBy: userId,
      });

      await this.reportOpenPlanModel.save(entity);
    } catch (error) {
      throw new DataAccessException(
        error.message || 'Failed to save store opening report',
      );
    }
  }

  async getAll(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: QuotaReportOpenPlan[]; total: number }> {
    const qb = this.reportOpenPlanModel
      .createQueryBuilder('qrop')
      .leftJoin('AUTH_USER', 'au', 'qrop.create_by = au."ID"')
      .select([
        'qrop.id AS "id"',
        'qrop.name AS "name"',
        'qrop.year AS "year"',
        'qrop.location_type_list AS "locationTypeList"',
        'qrop.quota_type_list AS "quotaTypeList"',
        'qrop.zone_list AS "zoneList"',
        'qrop.file_path AS "filePath"',
        `CONCAT(au."FIRST_NAME", ' ', au."LAST_NAME") AS "createBy"`,
        `TO_CHAR(qrop.create_date, 'DD/MM/YYYY') AS "createDate"`,
      ])
      .where('qrop.is_active = :isActive', { isActive: 'Y' })
      .orderBy('qrop.create_date', 'DESC');

    const total = await qb.clone().getCount();

    if (page && pageSize && pageSize > 0) {
      const skip = (page - 1) * pageSize;
      qb.offset(skip).limit(pageSize);
    }

    const data = await qb.getRawMany();

    return { data, total };
  }

  async getAllImpactSite(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: QuotaReportImpactSite[]; total: number }> {
    const qb = this.reportSiteImpactModel
      .createQueryBuilder('qrs')
      .leftJoin('AUTH_USER', 'au', 'qrs.create_by = au."ID"')
      .select([
        'qrs.id AS "id"',
        'qrs.name AS "name"',
        'qrs.year AS "year"',
        'qrs.form_no_list AS "formNoList"',
        'qrs.location_type_list AS "locationTypeList"',
        'qrs.site_type_list AS "siteTypeList"',
        'qrs.zone_list AS "zoneList"',
        'qrs.radius AS "radius"',
        'qrs.file_path AS "filePath"',
        'qrs.status AS "status"',
        `CONCAT(au."FIRST_NAME", ' ', au."LAST_NAME") AS "createBy"`,
        `TO_CHAR(qrs.create_date, 'DD/MM/YYYY') AS "createDate"`,
      ])
      .where('qrs.is_active = :isActive', { isActive: 'Y' })
      .orderBy('qrs.create_date', 'DESC');

    const total = await qb.clone().getCount();

    if (page && pageSize && pageSize > 0) {
      const skip = (page - 1) * pageSize;
      qb.offset(skip).limit(pageSize);
    }

    const data = await qb.getRawMany();

    return { data, total };
  }

  async saveImpactSiteReport(
    request: SaveImpactSiteReportRequest,
    userId: number,
  ): Promise<void> {
    try {
      const entity = this.reportSiteImpactModel.create({
        year: request.year,
        formNoList: request.formNoList,
        locationTypeList: request.locationTypeList,
        siteTypeList: request.siteTypeList,
        zoneList: request.zoneList,
        radius: request.radius,
        isActive: 'Y',
        status: 'Waiting',
        createBy: userId,
      });

      await this.reportSiteImpactModel.save(entity);
    } catch (error) {
      throw new DataAccessException(
        error.message || 'Failed to save store opening report',
      );
    }
  }

  async deleteReportImpactSite(reportId: number, userId: number): Promise<void> {
    try {
      const reportSiteImpactEntity = await this.reportSiteImpactModel.findOne({
        where: {
          id: reportId,
        },
      });

      if (!reportSiteImpactEntity)
        throw new NotFoundException('Quota report impact site not found');

      if (reportSiteImpactEntity.status !== 'Waiting') {
        throw new InvalidReportImpactSiteStatusException(
          `Cannot delete report impact site id: ${reportSiteImpactEntity.id}`,
        );
      }

      await this.reportSiteImpactModel.delete(reportId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new DataAccessException(
        `Error deleting quota report site impact: ${error.message}`,
      );
    }
  }
}
