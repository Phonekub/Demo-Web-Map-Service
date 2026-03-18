import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('master_cpall_zone')
export class MasterCpallZoneEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'zone', length: 5 })
  zone: string;

  @Column({ name: 'subzone', length: 5 })
  subzone: string;

  @Column({
    name: 'shape',
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326,
    nullable: true,
  })
  shape: object;

  @Column({ name: 'created_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;

  @Column({ name: 'created_by', length: 50, nullable: true })
  createdBy: string;

  @Column({ name: 'updated_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date;
}
