import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AnnounceEntity } from './announce.entity';

@Entity({ name: 'announce_role' })
export class AnnounceRoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AnnounceEntity, (announce) => announce.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'announce_id' })
  announce: AnnounceEntity;

  @Column({ name: 'bs_role_id', type: 'int', nullable: true })
  bs_role_id: number;

  @Column({ name: 'bs_dept_id', type: 'int', nullable: true })
  bs_dept_id: number;

  @Column({ name: 'bs_level_id', type: 'int', nullable: true })
  bs_level_id: number;
}
