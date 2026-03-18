import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PoiEntity } from './poi.entity';

@Entity({
  name: 'poi_entertainment_area',
})
export class PoiEntertainmentAreaEntity {
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
    name: 'symbol',
    type: 'smallint',
    nullable: true,
  })
  symbol: number;

  @Column({
    name: 'sub_code',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  subCode: string;

  @Column({
    name: 'master',
    type: 'varchar',
    length: 1,
    nullable: true,
  })
  master: string;

  @Column({
    name: 'namt',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  namt: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  name: string;

  @Column({
    name: 'location_t',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  locationT: string;

  @Column({
    name: 'location_e',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  locationE: string;

  @Column({
    name: 'person_amount',
    type: 'integer',
    nullable: true,
  })
  personAmount: number;

  @Column({
    name: 'parking_amount',
    type: 'integer',
    nullable: true,
  })
  parkingAmount: number;

  @Column({
    name: 'วันทำการ',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  workingDay: string;

  @Column({
    name: 'เวลาเปิด',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  openTime: string;

  @Column({
    name: 'เวลาปิด',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  closeTime: string;

  @Column({
    name: 'is_active',
    type: 'varchar',
    length: 1,
    nullable: true,
  })
  isActive: string;

  @ManyToOne(() => PoiEntity)
  @JoinColumn({
    name: 'poi_id',
  })
  poi: PoiEntity;
}
