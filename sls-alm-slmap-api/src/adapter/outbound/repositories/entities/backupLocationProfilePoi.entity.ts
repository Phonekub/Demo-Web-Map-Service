import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('backup_location_profile_poi')
export class BackupLocationProfilePoiEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'backup_location_profile_id', type: 'integer' })
  backupLocationProfileId: number;

  @Column({ name: 'backup_location_id', type: 'integer' })
  backupLocationId: number;

  @Column({ name: 'poi_id', type: 'integer' })
  poiId: number;

  @Column({ name: 'profile_layer_id', type: 'integer', nullable: true })
  profileLayerId: number;

  @Column({ name: 'distance', type: 'varchar', length: 50, nullable: true })
  distance: string;

  @Column({ name: 'population_amount', type: 'integer', nullable: true })
  populationAmount: number;

  @Column({ name: 'customer_amount', type: 'integer', nullable: true })
  customerAmount: number;

  @Column({
    name: 'percent_predict_customer',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  percentPredictCustomer: number;
}
