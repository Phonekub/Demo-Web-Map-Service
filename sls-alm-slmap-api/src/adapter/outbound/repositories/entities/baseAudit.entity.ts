import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseAuditEntity {
  @Column({ name: 'create_by', nullable: true })
  createBy: number;

  @CreateDateColumn({ name: 'create_date', type: 'timestamptz' })
  createDate: Date;

  @Column({ name: 'update_by', nullable: true })
  updateBy: number;

  @UpdateDateColumn({ name: 'update_date', type: 'timestamptz' })
  updateDate: Date;
}
