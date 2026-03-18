import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('afs_import_config')
export class ImportConfigEntity {
  @PrimaryGeneratedColumn({ name: 'afs_import_id' })
  afsImportId: number;

  @Column({ name: 'afs_org_id' })
  afsOrgId: number;

  @Column({ name: 'import_seq' })
  importSeq: number;

  @Column({ name: 'import_name' })
  importName: string;

  @Column({ name: 'import_table' })
  importTable: string;

  @Column({ name: 'mapping_query' })
  mappingQuery: string;

  @Column({ name: 'import_type' })
  importType: string;

  @Column({ name: 'default_filter' })
  defaultFilter: string;

  @Column({ name: 'import_query' })
  importQuery: string;

  @Column({ name: 'servlet_name' })
  servletName: string;

  @Column({ name: 'db_to_use' })
  dbToUse: string;

  @Column({ name: 'file_extension' })
  fileExtension: string;

  @Column({ name: 'file_type' })
  fileType: string;

  @Column({ name: 'start_row' })
  startRow: number;

  @Column({ name: 'start_column' })
  startColumn: number;

  @Column({ name: 'example_file_path' })
  exampleFilePath: string;

  @Column({ name: 'example_file_name' })
  exampleFileName: string;

  @Column({ name: 'is_active' })
  isActive: string;
}
