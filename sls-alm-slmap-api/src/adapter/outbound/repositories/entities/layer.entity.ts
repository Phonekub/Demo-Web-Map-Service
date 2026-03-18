import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { PoiEntity } from './poi.entity';

@Entity('layer')
export class LayerEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'is_landmark' })
  isLandmark: string;

  @Column({ name: 'can_create_poi' })
  canCreatePoi: string;

  @Column({ name: 'available_tabs' })
  availableTabs: string;

  @Column({ name: 'symbol' })
  symbol: string;

  @Column({ name: 'created_date', type: 'timestamp' })
  createdDate: Date;

  @Column({ name: 'spatial_type' })
  spatialType: string;

  @OneToMany(() => PoiEntity, (poi) => poi.layer)
  pois?: PoiEntity[];

  @ManyToMany(() => RoleEntity)
  @JoinTable({
    name: 'role_layer',
    schema: 'allmap',
    joinColumn: { name: 'layer_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles?: RoleEntity[];
}
