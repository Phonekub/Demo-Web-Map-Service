import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PoiEntity } from './poi.entity';

@Entity({ name: 'image', schema: 'allmap' })
export class ImageEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
    type: 'integer',
  })
  id: number;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  name: string;

  @Column({
    name: 'poi_id',
    type: 'integer',
  })
  poiId: number;

  @Column({
    name: 'created_date',
    type: 'timestamptz',
    nullable: true,
  })
  createdDate: Date;

  @Column({
    name: 'deleted_date',
    type: 'timestamptz',
    nullable: true,
  })
  deletedDate: Date;

  @Column({
    name: 'updated_by',
    type: 'integer',
    nullable: true,
  })
  updatedBy: number;

  @ManyToOne(() => PoiEntity, (poi) => poi.images)
  @JoinColumn({ name: 'poi_id' })
  poi: PoiEntity;
}
