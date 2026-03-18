import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('master_geo_location', { schema: 'allmap' })
export class GeoLocationEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'code', type: 'varchar', length: 10, nullable: true })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 240, nullable: true })
  name: string;

  @Column({ name: 'name_eng', type: 'varchar', length: 80, nullable: true })
  nameEng: string;

  @Column({ name: 'type', type: 'numeric', precision: 2, nullable: true })
  type: number;

  @Column({ name: 'pop_year', type: 'integer', nullable: true })
  popYear: number;

  @Column({ name: 'population', type: 'integer', nullable: true })
  population: number;

  @Column({ name: 'male', type: 'integer', nullable: true })
  male: number;

  @Column({ name: 'female', type: 'integer', nullable: true })
  female: number;

  @Column({ name: 'house', type: 'integer', nullable: true })
  house: number;

  @Column({ name: 'city', type: 'integer', nullable: true })
  city: number;

  @Column({ name: 'version', type: 'varchar', length: 10, nullable: true })
  version: string;

  @Column({ name: 'nation', type: 'varchar', length: 5, nullable: true })
  nation: string;

  @Column({
    name: 'shape',
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
    nullable: true,
  })
  shape: string;

  @Column({ name: 'gdb_geomattr_data', type: 'bytea', nullable: true })
  gdbGeomattrData: Buffer;

  @Column({
    name: 'point',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  point: string;

  @Column({ name: 'prov_grade', type: 'varchar', length: 1, nullable: true })
  provGrade: string;

  @Column({ name: 'prov_category', type: 'smallint', nullable: true })
  provCategory: number;
}
