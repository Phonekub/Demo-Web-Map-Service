import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('backup_location_competitor')
export class BackupLocationCompetitorEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'backup_location_id', type: 'integer' })
  backupLocationId: number;

  @Column({ name: 'competitor_layer_id', type: 'integer', nullable: true })
  competitorLayerId: number;

  @Column({ name: 'competitor_id', type: 'integer', nullable: true })
  competitorId: number;

  @Column({ name: 'distance', type: 'numeric', precision: 15, scale: 5, nullable: true })
  distance: number;

  @Column({ name: 'competitor_type', type: 'integer', nullable: true })
  competitorType: number;
}
