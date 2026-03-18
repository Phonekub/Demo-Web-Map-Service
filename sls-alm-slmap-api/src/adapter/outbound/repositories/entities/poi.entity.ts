import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { AreaEntity } from './area.entity';
import { PoiSevenElevenEntity } from './sevenEleven.entity';
import { PoiCompetitorSurroundEntity } from './competitorSurround.entity';
import { TradeareaEntity } from './tradearea.entity';
import { LayerEntity } from './layer.entity';
import { PoiPotentialEntity } from './potential.entity';
import { ImageEntity } from './image.entity';

@Entity({
  name: 'poi',
})
export class PoiEntity {
  @PrimaryGeneratedColumn({
    name: 'poi_id',
    type: 'integer',
  })
  poiId: number;

  @Column({
    name: 'uid',
    type: 'varchar',
    nullable: true,
  })
  uid: string;

  @Column({
    name: 'layer_id',
    type: 'integer',
    nullable: true,
  })
  layerId: number;

  @ManyToOne(() => LayerEntity)
  @JoinColumn({
    name: 'layer_id',
  })
  layer: LayerEntity;

  @Column({
    name: 'namt',
    type: 'varchar',
    nullable: true,
  })
  namt: string;

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: true,
  })
  name: string;

  @Column({
    name: 'location_t',
    type: 'varchar',
    nullable: true,
  })
  locationT: string;

  @Column({
    name: 'location_e',
    type: 'varchar',
    nullable: true,
  })
  locationE: string;

  @Column({
    name: 'zone_code',
    type: 'varchar',
    nullable: true,
  })
  zoneCode: string;

  @Column({
    name: 'subzone_code',
    type: 'varchar',
    nullable: true,
  })
  subzoneCode: string;

  @Column({
    name: 'nation',
    type: 'varchar',
    nullable: true,
  })
  nation: string;

  @Column({
    name: 'prov_code',
    type: 'varchar',
    nullable: true,
  })
  provCode: string;

  @Column({
    name: 'amp_code',
    type: 'varchar',
    nullable: true,
  })
  ampCode: string;

  @Column({
    name: 'tam_code',
    type: 'varchar',
    nullable: true,
  })
  tamCode: string;

  @Column({
    name: 'type',
    type: 'varchar',
    nullable: true,
  })
  type: string;

  @Column({
    name: 'shape',
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  shape: object;

  @Column({
    name: 'is_active',
    type: 'varchar',
    nullable: true,
  })
  isActive: string;

  @Column({
    name: 'created_user',
    type: 'varchar',
    nullable: true,
  })
  createdUser: string;

  @Column({
    name: 'created_date',
    type: 'timestamp',
    nullable: true,
  })
  createdDate: Date;

  @Column({
    name: 'last_edited_user',
    type: 'varchar',
    nullable: true,
  })
  lastEditedUser: string;

  @Column({
    name: 'last_edited_date',
    type: 'timestamp',
    nullable: true,
  })
  lastEditedDate: Date;

  @OneToMany(() => AreaEntity, (area) => area.ownerPoi)
  areas: AreaEntity[];

  @OneToMany(() => PoiSevenElevenEntity, (sevenEleven) => sevenEleven.poi)
  sevenElevenStores: PoiSevenElevenEntity[];

  @OneToMany(() => PoiPotentialEntity, (potential) => potential.poi)
  potentialStores: PoiPotentialEntity[];

  @OneToMany(() => PoiCompetitorSurroundEntity, (sevenEleven) => sevenEleven.poi)
  @JoinColumn({
    name: 'uid',
  })
  competitorSurround: PoiCompetitorSurroundEntity[];

  @OneToMany(() => PoiCompetitorSurroundEntity, (sevenEleven) => sevenEleven.poiComp)
  @JoinColumn({
    name: 'uid',
  })
  competitorSurroundCom: PoiCompetitorSurroundEntity[];

  @OneToMany(() => TradeareaEntity, (Tradearea) => Tradearea.poi)
  tradearea: TradeareaEntity[];

  @OneToMany(() => ImageEntity, (image) => image.poi)
  images: ImageEntity[];
}
