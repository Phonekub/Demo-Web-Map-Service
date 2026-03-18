import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('backup_location_profile')
export class BackupLocationProfileEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'backup_location_id', type: 'integer' })
  backupLocationId: number;

  @Column({ name: 'profile_layer_id', type: 'integer', nullable: true })
  profileLayerId: number;

  @Column({
    name: 'backup_percentage',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  backupPercentage: number;
}
