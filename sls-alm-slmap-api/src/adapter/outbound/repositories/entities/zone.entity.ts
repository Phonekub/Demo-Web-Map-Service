import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { SubZoneEntity } from './subzone.entity';

@Entity('zone')
export class ZoneEntity {
  @PrimaryGeneratedColumn({ name: 'zone_id' })
  id: number;

  @Column({ name: 'zone_code' })
  zoneCode: string;

  @Column({ name: 'is_active' })
  isActive: string;

  @Column({ name: 'category', nullable: true })
  category: string;

  @Column({ name: 'region', nullable: true })
  region: string;

  @Column({ name: 'org_id', nullable: true })
  orgId: string;

  @OneToMany(() => SubZoneEntity, (sz) => sz.zone)
  subzones: SubZoneEntity[];
}
