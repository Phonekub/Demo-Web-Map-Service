import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DformVersionEntity } from './dformVersion.entity';

@Entity('dform', { schema: 'allmap' })
@Index('idx_dform_reference_obj_reference_key', ['referenceObj', 'referenceKey'])
export class DformEntity {
  @PrimaryColumn({ name: 'form_id', type: 'integer' })
  formId: number;

  @Column({ name: 'form_version_id', type: 'integer', nullable: true })
  formVersionId: number;

  @Column({ name: 'reference_obj', type: 'varchar', length: 255, nullable: true })
  referenceObj: string;

  @Column({ name: 'reference_key', type: 'integer', nullable: true })
  referenceKey: number;

  @Column({ name: 'created_date', type: 'timestamp', nullable: true })
  createdDate: Date;

  @Column({ name: 'created_user', type: 'varchar', length: 255, nullable: true })
  createdUser: string;

  @Column({ name: 'last_edited_date', type: 'timestamp', nullable: true })
  lastEditedDate: Date;

  @Column({ name: 'last_edited_user', type: 'varchar', length: 255, nullable: true })
  lastEditedUser: string;

  @ManyToOne(() => DformVersionEntity)
  @JoinColumn({ name: 'form_version_id' })
  formVersion: DformVersionEntity;
}
