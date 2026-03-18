import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PoiEntity } from './poi.entity';

@Entity({
  name: 'poi_competitor',
})
export class PoiCompetitorEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
    type: 'integer',
  })
  id: number;

  @Column({
    name: 'poi_id',
    type: 'integer',
    nullable: true,
  })
  poiId: number;

  @Column({
    name: 'grade',
    type: 'varchar',
    nullable: true,
  })
  grade: string;

  @Column({
    name: 'sale_average',
    type: 'numeric',
    nullable: true,
  })
  saleAverage: number;

  @Column({
    name: 'open_time',
    type: 'time',
    nullable: true,
  })
  openTime: string;

  @Column({
    name: 'close_time',
    type: 'time',
    nullable: true,
  })
  closeTime: string;

  @Column({
    name: 'type',
    type: 'integer',
    nullable: true,
  })
  type: number;

  @Column({
    name: 'closed_date',
    type: 'date',
    nullable: true,
  })
  closedDate: Date;

  // @Column({
  //   name: 'text_other_brand',
  //   type: 'varchar',
  //   nullable: true,
  // })
  // textOtherBrand: string;

  @ManyToOne(() => PoiEntity)
  @JoinColumn({
    name: 'poi_id',
  })
  poi: PoiEntity;
}
