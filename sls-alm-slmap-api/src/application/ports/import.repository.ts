import { ImportConfig, ImportResult } from '../../domain/importConfig';

export type RowData = Record<string, unknown>;

export interface ImportRepositoryPort {
  importData(
    tableName: string,
    importQuery: string,
    data: RowData[],
    config: ImportConfig,
  ): Promise<ImportResult>;
}
