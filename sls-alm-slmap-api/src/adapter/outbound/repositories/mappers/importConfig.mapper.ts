import { ImportConfigEntity } from '../entities/importConfig.entity';
import { Dropdown } from '../../../../domain/dropdown';
import { ImportConfig } from '../../../../domain/importConfig';
import { Builder } from 'builder-pattern';

export class ImportConfigMapper {
  static toDomain(entity: ImportConfigEntity): Dropdown {
    return Builder(Dropdown)
      .text(entity.importName)
      .value(String(entity.afsImportId))
      .orgId(String(entity.afsOrgId))
      .build();
  }

  static toImportDomain(entity: ImportConfigEntity): ImportConfig {
    return Builder(ImportConfig)
      .afsImportId(entity.afsImportId)
      .afsOrgId(entity.afsOrgId)
      .importName(entity.importName)
      .importTable(entity.importTable)
      .mappingQuery(entity.mappingQuery)
      .importType(entity.importType)
      .defaultFilter(entity.defaultFilter)
      .importQuery(entity.importQuery)
      .servletName(entity.servletName)
      .dbToUse(entity.dbToUse)
      .fileExtension(entity.fileExtension)
      .fileType(entity.fileType)
      .startRow(entity.startRow)
      .startColumn(entity.startColumn)
      .exampleFilePath(entity.exampleFilePath)
      .exampleFileName(entity.exampleFileName)
      .build();
  }
}
