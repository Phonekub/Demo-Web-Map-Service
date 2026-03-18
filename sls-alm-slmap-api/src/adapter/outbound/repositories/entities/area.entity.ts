import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PoiEntity } from './poi.entity';

export enum AreaShape {
  POLYGON = 'polygon',
  CIRCLE = 'circle',
}

@Entity({
  name: 'area',
})
export class AreaEntity {
  @PrimaryGeneratedColumn({
    name: 'area_id',
    type: 'bigint',
  })
  id: number;

  @Column({
    name: 'name',
    type: 'text',
    nullable: false,
  })
  name: string;

  @Column({
    name: 'shape',
    type: 'enum',
    enum: AreaShape,
    nullable: false,
  })
  shape: AreaShape;

  @Column({
    name: 'props',
    type: 'jsonb',
    default: '{}',
  })
  props: Record<string, unknown>;

  @Column({
    name: 'geom',
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: false,
  })
  geom: string; // This will store the geometry as WKT or use a proper geometry type

  @Column({
    name: 'owner_poi_id',
    type: 'bigint',
    nullable: true,
  })
  ownerPoiId: number;

  @ManyToOne(() => PoiEntity)
  @JoinColumn({
    name: 'owner_poi_id',
  })
  ownerPoi: PoiEntity;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
