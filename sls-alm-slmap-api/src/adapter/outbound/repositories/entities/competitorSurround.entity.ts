import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { PoiSevenElevenEntity } from './sevenEleven.entity';
import { PoiEntity } from './poi.entity';

@Entity({
  name: 'poi_competitor_surround',
})
export class PoiCompetitorSurroundEntity {
  @PrimaryColumn({
    name: 'seven_poi_uid',
    type: 'uuid',
  })
  sevenPoiUid: string;

  @PrimaryColumn({
    name: 'competitor_poi_uid',
    type: 'uuid',
  })
  competitorPoiUid: string;

  @Column({
    name: 'layer_id',
    type: 'integer',
  })
  layerId: number;

  @Column({
    name: 'distance',
    type: 'numeric',
    precision: 16,
    scale: 2,
    nullable: true,
  })
  distance: number;

  @Column({
    name: 'is_active',
    type: 'varchar',
    nullable: true,
    default: 'Y',
  })
  isActive: string;

  @Column({
    name: 'created_by',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  createdBy: string;

  @Column({
    name: 'created_date',
    type: 'timestamp',
    nullable: true,
  })
  createdDate: Date;

  @ManyToOne(() => PoiSevenElevenEntity)
  @JoinColumn({
    name: 'seven_poi_uid',
    referencedColumnName: 'uid',
  })
  sevenEleven: PoiSevenElevenEntity;

  @ManyToOne(() => PoiEntity)
  @JoinColumn({
    name: 'competitor_poi_uid',
    referencedColumnName: 'uid',
  })
  competitor: PoiEntity;

  @ManyToOne(() => PoiEntity, (poi) => poi.competitorSurround)
  @JoinColumn({
    name: 'seven_poi_uid',
    referencedColumnName: 'uid',
  })
  poi: PoiEntity;

  @ManyToOne(() => PoiEntity, (poi) => poi.competitorSurround)
  @JoinColumn({
    name: 'competitor_poi_uid',
    referencedColumnName: 'uid',
  })
  poiComp: PoiEntity;
}
