import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('common_code')
export class CommonCodeEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'code_type' })
  codeType: string;

  @Column({ name: 'seq_no' })
  seqNo: number;

  @Column({ name: 'code_value' })
  codeValue: string;

  @Column({ name: 'code_name' })
  codeName: string;

  @Column({ name: 'is_active' })
  isActive: string;

  @Column({ name: 'code_mapping' })
  codeMapping: string;

  @Column({ name: 'is_sum' })
  isSum: string;

  @Column({ name: 'is_flow_approve' })
  isFlowApprove: string;

  @Column({ name: 'other_field_01' })
  otherField01: string;

  @Column({ name: 'code_name_th' })
  codeNameTh: string;

  @Column({ name: 'code_name_en' })
  codeNameEn: string;

  @Column({ name: 'code_name_kh' })
  codeNameKh: string;

  @Column({ name: 'code_name_la' })
  codeNameLa: string;

  @Column({ name: 'create_by' })
  createBy: string;

  @Column({ name: 'create_date', type: 'timestamp' })
  createDate: Date;

  @Column({ name: 'update_by' })
  updateBy: string;

  @Column({ name: 'update_date', type: 'timestamp' })
  updateDate: Date;
}
