import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({
  name: 'user_zone',
})
export class UserZoneEntity {
  @PrimaryGeneratedColumn({
    name: 'objectid',
  })
  objectid: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    name: 'zone_code',
    length: 10,
    nullable: true,
  })
  zoneCode: string;

  @Column({
    name: 'subzone_code',
    length: 10,
    nullable: true,
  })
  subzoneCode: string;

  @ManyToOne(() => UserEntity, (user) => user.userZones)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
