import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import {
  ImportRepositoryPort,
  RowData,
} from '../../../application/ports/import.repository';
import { ImportConfig, ImportResult } from '../../../domain/importConfig';
import { dbSchema } from '../../../config/configuration';

interface QueryWithParams {
  query: string;
  params: unknown[];
}

@Injectable()
export class ImportRepository implements ImportRepositoryPort {
  private static readonly DEFAULT_SCHEMA = dbSchema;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async importData(
    tableName: string,
    importQuery: string,
    data: RowData[],
    config: ImportConfig,
  ): Promise<ImportResult> {
    if (!data.length) {
      return this.createResult(tableName, 0, config.importType);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fullTableName = this.getFullTableName(tableName, config.dbToUse);
      const importType = config.importType.toUpperCase();
      const types = importType.split('|').map((t) => t.trim().toUpperCase());

      // // Delete phase for DELETE|INSERT
      // if (importType === 'DELETE|INSERT') {
      //   await this.deleteExistingData(
      //     queryRunner,
      //     fullTableName,
      //     config.defaultFilter,
      //     data[0],
      //   );
      // }

      // // Insert/Update phase
      // const count = await this.processRows(
      //   queryRunner,
      //   importType,
      //   fullTableName,
      //   importQuery,
      //   data,
      //   config.defaultFilter,
      // );
      // console.log('Importing data with types:', types);
      let totalCount = 0;
      for (const type of types) {
        if (type === 'DELETE') {
          await this.deleteExistingData(
            queryRunner,
            fullTableName,
            config.defaultFilter,
            data[0],
          );
        }
        for (const opType of ['INSERT', 'UPDATE']) {
          if (type === opType) {
            totalCount += await this.processRows(
              queryRunner,
              opType,
              fullTableName,
              importQuery,
              data,
              config.defaultFilter,
            );
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.createResult(fullTableName, totalCount, importType);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private getFullTableName(tableName: string, dbToUse?: string): string {
    if (tableName.includes('.')) return tableName;
    const schema = dbToUse || ImportRepository.DEFAULT_SCHEMA;
    return `${schema}.${tableName}`;
  }

  private async deleteExistingData(
    queryRunner: QueryRunner,
    tableName: string,
    defaultFilter: string,
    row: RowData,
  ): Promise<void> {
    const whereClause = this.buildWhereClause(defaultFilter);
    const { query, params } = this.replaceFilterParams(whereClause, row);
    await queryRunner.query(`DELETE FROM ${tableName} WHERE ${query}`, params);
  }

  private async processRows(
    queryRunner: QueryRunner,
    importType: string,
    tableName: string,
    importQuery: string,
    data: RowData[],
    defaultFilter: string,
  ): Promise<number> {
    for (const row of data) {
      const { query, params } = this.buildQuery(
        importType,
        tableName,
        importQuery,
        row,
        defaultFilter,
      );
      await queryRunner.query(query, params);
    }
    return data.length;
  }

  private buildQuery(
    importType: string,
    tableName: string,
    importQuery: string,
    row: RowData,
    defaultFilter: string,
  ): QueryWithParams {
    switch (importType) {
      case 'UPDATE':
        return this.buildUpdateQuery(tableName, row, defaultFilter);
      // case 'DELETE|INSERT':
      case 'INSERT':
        return this.buildInsertQuery(tableName, this.mergeFilters(row, defaultFilter));
      default:
        return { query: importQuery, params: Object.values(row) };
    }
  }

  private buildUpdateQuery(
    tableName: string,
    row: RowData,
    defaultFilter: string,
  ): QueryWithParams {
    const fields = Object.keys(row);
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const whereClause = this.buildWhereClause(defaultFilter);

    return {
      query: `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`,
      params: Object.values(row),
    };
  }

  private buildInsertQuery(tableName: string, row: RowData): QueryWithParams {
    const fields = Object.keys(row);
    const columns = fields.join(', ');
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    return {
      query: `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
      params: Object.values(row),
    };
  }

  private buildWhereClause(filter: string): string {
    return filter?.trim().replace(/^AND\s+/i, '') || '1=1';
  }

  private replaceFilterParams(whereClause: string, row: RowData): QueryWithParams {
    let query = whereClause;
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(row).forEach(([field, value]) => {
      const pattern = new RegExp(`${field}\\s*=\\s*'[^']*'`, 'gi');
      if (query.match(pattern)) {
        query = query.replace(pattern, `${field} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    return { query, params };
  }

  private mergeFilters(row: RowData, defaultFilter: string): RowData {
    if (!defaultFilter) return { ...row };

    const merged: RowData = { ...row };
    const pattern = /(\w+)\s*=\s*'([^']*)'/gi;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(defaultFilter)) !== null) {
      const [, field, value] = match;
      if (!(field in merged)) {
        merged[field] = value;
      }
    }

    return merged;
  }

  private createResult(
    tableName: string,
    count: number,
    importType: string,
  ): ImportResult {
    return {
      success: true,
      recordsProcessed: count,
      importTable: tableName,
      importType,
    };
  }
}
