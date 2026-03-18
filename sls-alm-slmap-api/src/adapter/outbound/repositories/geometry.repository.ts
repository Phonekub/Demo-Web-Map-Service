import { Repository, SelectQueryBuilder } from 'typeorm';
import { toCamelCase } from '../../../common/helpers/utils';

interface RawGeometryResult {
  [key: string]: unknown;
}

export abstract class GeometryRepositoryBase<T> {
  constructor(protected readonly repository: Repository<T>) {}

  protected createGeometryQuery(
    alias: string,
    geometryColumns: string | string[] = 'geometry',
  ): SelectQueryBuilder<T> {
    const queryBuilder = this.repository.createQueryBuilder(alias);

    const columns = Array.isArray(geometryColumns) ? geometryColumns : [geometryColumns];

    columns.forEach((col) => {
      queryBuilder.addSelect(`ST_AsGeoJSON(${alias}.${col})::json`, `geojson_${col}`);
    });

    return queryBuilder;
  }

  protected mapRawToObject(
    raw: RawGeometryResult,
    prefix: string,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith('geojson_')) {
        const columnName = key.replace('geojson_', '');
        result[toCamelCase(columnName)] = value;
      } else if (prefix && key.startsWith(prefix + '_')) {
        const fieldName = key.replace(prefix + '_', '');
        result[toCamelCase(fieldName)] = value;
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
