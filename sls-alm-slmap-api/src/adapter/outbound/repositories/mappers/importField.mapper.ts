import { ImportFieldEntity } from '../entities/importField.entity';
import { ImportField } from '../../../../domain/importConfig';
import { Builder } from 'builder-pattern';

export class ImportFieldMapper {
  static toDomain(entity: ImportFieldEntity): ImportField {
    return Builder(ImportField)
      .afsImportFieldId(entity.afsImportId)
      .afsImportId(entity.afsImportId)
      .fieldSeq(entity.fieldSeq)
      .fieldName(entity.fieldName)
      .whereField(entity.whereField)
      .dataType(entity.dataType)
      .isRequired(entity.isRequired)
      .mappingCode(entity.mappingCode)
      .isActive(entity.isActive)
      .defaultValue(entity.defaultValue)
      .formatField(entity.formatField)
      .build();
  }
}
