import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('afs_import_field')
export class ImportFieldEntity {
  @PrimaryGeneratedColumn({ name: 'afs_import_field_id' })
  afsImportFieldId: number;

  @Column({ name: 'afs_import_id' })
  afsImportId: number;

  @Column({ name: 'field_seq' })
  fieldSeq: string;

  @Column({ name: 'field_name' })
  fieldName: string;

  @Column({ name: 'where_field' })
  whereField: string;

  @Column({ name: 'data_type' })
  dataType: string;

  @Column({ name: 'is_required' })
  isRequired: string;

  @Column({ name: 'mapping_code' })
  mappingCode: string;

  @Column({ name: 'is_active' })
  isActive: string;

  @Column({ name: 'default_value' })
  defaultValue: string;

  @Column({ name: 'format_field' })
  formatField: string;
}
