export class ImportConfig {
  afsImportId: number;
  afsOrgId: number;
  importName: string;
  importTable: string;
  mappingQuery: string;
  importType: string;
  defaultFilter: string;
  importQuery: string;
  servletName: string;
  dbToUse: string;
  fileExtension: string;
  fileType: string;
  startRow: number;
  startColumn: number;
  exampleFilePath: string;
  exampleFileName: string;
}

export class ImportField {
  afsImportFieldId: number;
  afsImportId: number;
  fieldSeq: string;
  fieldName: string;
  whereField: string;
  dataType: string;
  isRequired: string;
  mappingCode: string;
  isActive: string;
  defaultValue: string;
  formatField: string;
}

export class ImportResult {
  success: boolean;
  recordsProcessed: number;
  importTable: string;
  importType: string;
  result?: unknown;
}
