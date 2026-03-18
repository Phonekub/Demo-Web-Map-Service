import { ReportConfigEntity } from '../../adapter/outbound/repositories/entities/reportConfig.entity';
import { ReportFieldEntity } from '../../adapter/outbound/repositories/entities/reportField.entity';
import { Language } from '../../common/enums/language.enum';
import { Dropdown } from '../../domain/dropdown';
import { ExportConfig } from '../../domain/reportConfig';
import { ZoneMaster } from '../../domain/zoneMaster';
import { ImportConfig, ImportField } from '../../domain/importConfig';
import { CommonCodeEntity } from '../../adapter/outbound/repositories/entities/commonCode.entity';

export interface QuerySubDistrict {
  districtCode?: string;
  coordinate?: { longitude: number; latitude: number };
}

export interface MasterRepositoryPort {
  getCommonCode(codeType: string, language: Language): Promise<Dropdown[]>;
  getProvinces(countryCode?: string): Promise<Dropdown[]>;
  getDistricts(provinceCode?: string): Promise<Dropdown[]>;
  getExportConfigs(language?: Language): Promise<ExportConfig[]>;
  getReportFields(reportId: number): Promise<ReportFieldEntity[]>;
  getReportConfig(reportId: number): Promise<ReportConfigEntity | null>;
  executeDynamicQuery(queryString: string, schemaName: string): Promise<any[]>;
  getSubDistricts(query: QuerySubDistrict): Promise<Dropdown[]>;
  getOneProvince(provinceCode: string, countryCode?: string): Promise<Dropdown>;
  getOneDistrict(districtCode: string): Promise<Dropdown>;
  getZones(orgId: string, category?: string): Promise<ZoneMaster[]>;
  getImportConfig(orgId?: string, importId?: string): Promise<Dropdown[]>;
  getImportConfigById(importId: string): Promise<ImportConfig[]>;
  getImportFields(importName: string): Promise<ImportField[]>;
  getCommonCodeName(
    codeType: string,
    language: Language,
    codeValue: string,
  ): Promise<{ id: number; name: string }>;
  getUrlByNation(codeType: string, codeValue: string, nation: string): Promise<string | null>;
}
