import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('profile_sub_code', { schema: 'allmap' })
@Index('ix_pscode_layer', ['layerId'])
@Index('ix_pscode_sub_category', ['profileSubCagetoryId'])
export class ProfileSubCodeEntity {
  @PrimaryColumn({ name: 'profile_cagetory_id', type: 'integer' })
  profileCagetoryId: number;

  @PrimaryColumn({ name: 'profile_sub_cagetory_id', type: 'integer' })
  profileSubCagetoryId: number;

  @PrimaryColumn({ name: 'layer_id', type: 'bigint' })
  layerId: number;

  @PrimaryColumn({ name: 'sub_code', type: 'varchar', length: 5 })
  subCode: string;
}
