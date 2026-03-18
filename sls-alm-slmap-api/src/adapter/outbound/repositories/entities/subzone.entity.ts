import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ZoneEntity } from './zone.entity';

@Entity('subzone')
export class SubZoneEntity {
  @PrimaryGeneratedColumn({ name: 'subzone_id' })
  subZoneId: number;

  @Column({ name: 'subzone_code' })
  subZoneCode: string;

  @Column({ name: 'is_active' })
  isActive: string;

  @ManyToOne(() => ZoneEntity, (zone) => zone.subzones)
  @JoinColumn({ name: 'zone_id' })
  zone: ZoneEntity;
}
