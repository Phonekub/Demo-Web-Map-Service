import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { PoiEntity } from './poi.entity';
import { SevenProfileEntity } from './sevenProfile.entity';

@Entity({
  name: 'poi_seven_eleven',
})
export class PoiSevenElevenEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
    type: 'integer',
  })
  id: number;

  @Column({
    name: 'uid',
    type: 'varchar',
    nullable: true,
  })
  uid: string;

  @Column({
    name: 'poi_id',
    type: 'integer',
    nullable: true,
  })
  poiId: number;

  @Column({
    name: 'storecode',
    type: 'varchar',
    nullable: true,
  })
  storecode: string;

  @Column({
    name: 'storename',
    type: 'varchar',
    nullable: true,
  })
  storename: string;

  @Column({
    name: 'form_loc_number',
    type: 'varchar',
    nullable: true,
  })
  formLocNumber: string;

  @Column({
    name: 'seven_type',
    type: 'integer',
    nullable: true,
  })
  sevenType: number;

  @Column({
    name: 'sale_average',
    type: 'integer',
    nullable: true,
  })
  saleAverage: number;

  @Column({
    name: 'location_type',
    type: 'varchar',
    nullable: true,
  })
  locationType: string;

  @Column({
    name: 'symbol',
    type: 'varchar',
    nullable: true,
  })
  symbol: string;

  @Column({
    name: 'is_active',
    type: 'varchar',
    nullable: true,
  })
  isActive: string;

  @ManyToOne(() => PoiEntity, (poi) => poi.sevenElevenStores)
  @JoinColumn({
    name: 'poi_id',
  })
  poi: PoiEntity;

  totalCompetitor?: number;

  @OneToOne(() => SevenProfileEntity, (sevenProfile) => sevenProfile.poiSevenElevens)
  @JoinColumn({
    name: 'storecode',
    referencedColumnName: 'storecode',
  })
  sevenProfile: SevenProfileEntity;
}
