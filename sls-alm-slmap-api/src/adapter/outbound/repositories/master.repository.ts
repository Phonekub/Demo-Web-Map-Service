import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MasterRepositoryPort,
  QuerySubDistrict,
} from '../../../application/ports/master.repository';
import { CommonCodeEntity } from './entities/commonCode.entity';
import { CommonCodeMapper } from './mappers/commonCode.mapper';
import { Dropdown } from '../../../domain/dropdown';
import { GeoLocationEntity } from './entities/geoLocation.entity';
import { GeoLocationMapper } from './mappers/geoLocation.mapper';
import { Language } from '../../../common/enums/language.enum';
import { ReportConfigEntity } from './entities/reportConfig.entity';
import { ReportFieldEntity } from './entities/reportField.entity';
import { ExportConfig } from '../../../domain/reportConfig';
import { RawReportConfig, ReportConfigMapper } from './mappers/reportConfig.mapper';
import { ZoneEntity } from './entities/zone.entity';
import { ZoneMaster } from '../../../domain/zoneMaster';
import { ImportConfig, ImportField } from '../../../domain/importConfig';
import { ImportConfigEntity } from './entities/importConfig.entity';
import { ImportConfigMapper } from './mappers/importConfig.mapper';
import { ImportFieldEntity } from './entities/importField.entity';
import { ImportFieldMapper } from './mappers/importField.mapper';

@Injectable()
export class MasterRepository implements MasterRepositoryPort {
  constructor(
    @InjectRepository(CommonCodeEntity)
    private readonly commonCodeModel: Repository<CommonCodeEntity>,
    @InjectRepository(GeoLocationEntity)
    private readonly geoLocation: Repository<GeoLocationEntity>,
    @InjectRepository(ReportConfigEntity)
    private readonly reportConfigModel: Repository<ReportConfigEntity>,
    @InjectRepository(ReportFieldEntity)
    private readonly reportFieldModel: Repository<ReportFieldEntity>,
    @InjectRepository(ZoneEntity)
    private readonly zoneModel: Repository<ZoneEntity>,
    @InjectRepository(ImportConfigEntity)
    private readonly importConfigModel: Repository<ImportConfigEntity>,
    @InjectRepository(ImportFieldEntity)
    private readonly importFieldModel: Repository<ImportFieldEntity>,
  ) {}

  async getCommonCode(codeType?: string, language?: Language): Promise<Dropdown[]> {
    const mapping = {
      [Language.TH]: `cc.codeNameTh`,
      [Language.EN]: `cc.codeNameEn`,
      [Language.KM]: `cc.codeNameKh`,
      [Language.LA]: `cc.codeNameLa`,
    };
    const codeNameColumn = mapping[language] || 'cc.codeName';

    const queryBuilder = this.commonCodeModel
      .createQueryBuilder('cc')
      .select([
        'cc.codeValue as "codeValue"',
        `${codeNameColumn} AS "codeName"`,
        'cc.codeMapping as "codeMapping"',
      ])
      .where('cc.isActive = :isActive', { isActive: 'Y' })
      .andWhere('cc.codeType = :codeType', { codeType })
      .orderBy('cc.seqNo', 'ASC');

    const results = await queryBuilder.orderBy('cc.seqNo', 'ASC').getRawMany();
    return results.map((entity) => CommonCodeMapper.toDomain(entity));
  }

  async getProvinces(countryCode?: string): Promise<Dropdown[]> {
    const queryBuilder = this.geoLocation
      .createQueryBuilder('geoLocation')
      .select(['geoLocation.code', 'geoLocation.name'])
      .where('geoLocation.type = :type', { type: 1 });

    if (countryCode) {
      queryBuilder.andWhere('geoLocation.nation = :countryCode', {
        countryCode: countryCode.toUpperCase(),
      });
    }

    const results = await queryBuilder.orderBy('geoLocation.name', 'ASC').getMany();
    return results.map((entity) => GeoLocationMapper.toDomain(entity));
  }

  async getDistricts(provinceCode?: string): Promise<Dropdown[]> {
    const queryBuilder = this.geoLocation
      .createQueryBuilder('geoLocation')
      .select(['geoLocation.code', 'geoLocation.name'])
      .where('geoLocation.type = :type', { type: 2 });

    if (provinceCode) {
      queryBuilder.andWhere('geoLocation.code LIKE :provinceCode', {
        provinceCode: `${provinceCode}%`,
      });
    }

    const results = await queryBuilder.orderBy('geoLocation.name', 'ASC').getMany();
    return results.map((entity) => GeoLocationMapper.toDomain(entity));
  }

  async getOneProvince(provinceCode: string, countryCode?: string): Promise<Dropdown> {
    const queryBuilder = this.geoLocation
      .createQueryBuilder('geoLocation')
      .select(['geoLocation.code', 'geoLocation.name'])
      .where('geoLocation.type = :type', { type: 1 })
      .andWhere('geoLocation.code = :provinceCode', { provinceCode });

    if (countryCode) {
      queryBuilder.andWhere('geoLocation.nation = :countryCode', {
        countryCode: countryCode.toUpperCase(),
      });
    }

    const result = await queryBuilder.getOne();
    return _.isNull(result) ? null : GeoLocationMapper.toDomain(result);
  }

  async getOneDistrict(districtCode: string): Promise<Dropdown> {
    const queryBuilder = this.geoLocation
      .createQueryBuilder('geoLocation')
      .select(['geoLocation.code', 'geoLocation.name'])
      .where('geoLocation.type = :type', { type: 2 })
      .andWhere('geoLocation.code = :districtCode', { districtCode });

    const result = await queryBuilder.getOne();
    return _.isNull(result) ? null : GeoLocationMapper.toDomain(result);
  }

  async getSubDistricts(query: QuerySubDistrict): Promise<Dropdown[]> {
    const queryBuilder = this.geoLocation
      .createQueryBuilder('geoLocation')
      .select(['geoLocation.code', 'geoLocation.name'])
      .where('geoLocation.type = :type', { type: 3 });

    if (query.districtCode) {
      queryBuilder.andWhere('geoLocation.code LIKE :districtCode', {
        districtCode: `${query.districtCode}%`,
      });
    }

    if (query.coordinate?.latitude && query.coordinate?.longitude) {
      queryBuilder.andWhere(
        'ST_Intersects(shape, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))',
        {
          longitude: query.coordinate.longitude,
          latitude: query.coordinate.latitude,
        },
      );
    }

    const results = await queryBuilder.orderBy('geoLocation.name', 'ASC').getMany();
    return results.map((entity) => GeoLocationMapper.toDomain(entity));
  }

  async getExportConfigs(language?: Language): Promise<ExportConfig[]> {
    const mapping = {
      [Language.TH]: `rq.report_name`,
      [Language.EN]: `rq.report_name_en`,
      [Language.KM]: `rq.report_name_kh`,
    };
    // const reportNameColumn = mapping[language] || 'rq.report_name';
    const reportNameColumn = 'rq.report_name';
    const queryBuilder = this.reportConfigModel
      .createQueryBuilder('rq')
      .select(['rq.afs_report_id as afsReportId', `${reportNameColumn} as reportName`])
      .where('rq.is_active = :isActive', { isActive: 'Y' });

    const results = await queryBuilder.getRawMany<RawReportConfig>();
    return results.map((row) => ReportConfigMapper.toDomain(row));
  }

  async getReportFields(reportId: number): Promise<ReportFieldEntity[]> {
    return await this.reportFieldModel.find({
      where: { afsReportId: reportId },
      order: { fieldSeq: 'ASC' },
    });
  }

  async getReportConfig(reportId: number): Promise<ReportConfigEntity | null> {
    return await this.reportConfigModel.findOne({
      where: { afsReportId: reportId, isActive: 'Y' },
    });
  }

  async executeDynamicQuery(queryString: string, schemaName: string): Promise<any[]> {
    if (schemaName) {
      await this.commonCodeModel.query(`SET search_path TO ${schemaName}, public`);
    }
    return await this.commonCodeModel.query(queryString);
  }

  async getZones(orgId: string, category?: string): Promise<ZoneMaster[]> {
    const queryBuilder = this.zoneModel
      .createQueryBuilder('zone')
      .select([
        'zone.zone_id as "zoneId"',
        'zone.zone_code as "zoneCode"',
        'zone.category as "category"',
        'zone.region as "region"',
      ])
      .where('zone.org_id = :orgId', { orgId })
      .andWhere('zone.is_active = :isActive', { isActive: 'Y' });

    if (category) {
      queryBuilder.andWhere('zone.category = :category', { category });
    }

    const results = await queryBuilder.orderBy('zone.zone_code', 'ASC').getRawMany();

    return results as ZoneMaster[];
  }

  async getImportConfig(orgId?: string, importId?: string): Promise<Dropdown[]> {
    const queryBuilder = this.importConfigModel
      .createQueryBuilder('import')
      .select(['import.afsImportId', 'import.afsOrgId', 'import.importName'])
      .where('import.isActive = :isActive', { isActive: 'Y' });

    if (orgId) {
      queryBuilder.andWhere('import.afsOrgId = :orgId', { orgId });
    }
    if (importId) {
      queryBuilder.andWhere('import.afsImportId = :importId', { importId });
    }

    const results = await queryBuilder.orderBy('import.importSeq', 'ASC').getMany();
    return results.map((entity) => ImportConfigMapper.toDomain(entity));
  }

  async getImportConfigById(importId: string): Promise<ImportConfig[]> {
    const queryBuilder = this.importConfigModel
      .createQueryBuilder('import')
      .where('import.isActive = :isActive', { isActive: 'Y' })
      .andWhere('import.afsImportId = :importId', { importId });
    const results = await queryBuilder.getMany();
    return results.map((entity) => ImportConfigMapper.toImportDomain(entity));
  }

  async getImportFields(importId: string): Promise<ImportField[]> {
    const queryBuilder = this.importFieldModel
      .createQueryBuilder('importField')
      .where('importField.isActive = :isActive', { isActive: 'Y' })
      .andWhere('importField.afsImportId = :importId', { importId });
    const results = await queryBuilder.getMany();
    return results.map((entity) => ImportFieldMapper.toDomain(entity));
  }

  async getCommonCodeName(
    codeType: string,
    language: Language,
    codeValue: string,
  ): Promise<{ id: number; name: string } | null> {
    const mapping = {
      [Language.TH]: 'cc.codeNameTh',
      [Language.EN]: 'cc.codeNameEn',
      [Language.KM]: 'cc.codeNameKh',
      [Language.LA]: 'cc.codeNameLa',
    };
    const codeNameColumn = mapping[language] || 'cc.codeName';

    const result = await this.commonCodeModel
      .createQueryBuilder('cc')
      .select(['cc.id as "id"', `${codeNameColumn} as "name"`])
      .where('cc.codeType = :codeType', { codeType })
      .andWhere('cc.codeValue = :codeValue', { codeValue })
      .andWhere('cc.isActive = :isActive', { isActive: 'Y' })
      .getRawOne();

    return result;
  }

  async getUrlByNation(
    codeType: string,
    codeValue: string,
    nation: string,
  ): Promise<string | null> {
    // Determine the column name based on nation
    const nationColumnMap: Record<string, string> = {
      TH: 'cc.codeNameTh',
      EN: 'cc.codeNameEn',
      KM: 'cc.codeNameKh',
      LA: 'cc.codeNameLa',
    };

    const codeNameColumn = nationColumnMap[nation?.toUpperCase()] || 'cc.codeName';

    const result = await this.commonCodeModel
      .createQueryBuilder('cc')
      .select([`${codeNameColumn} as "url"`])
      .where('cc.codeType = :codeType', { codeType })
      .andWhere('cc.codeValue = :codeValue', { codeValue })
      .andWhere('cc.isActive = :isActive', { isActive: 'Y' })
      .getRawOne();

    return result?.url || null;
  }
}
