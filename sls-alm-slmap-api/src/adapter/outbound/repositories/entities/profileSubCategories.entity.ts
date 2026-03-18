import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('profile_sub_categories', { schema: 'allmap' })
export class ProfileSubCategoriesEntity {
  @PrimaryColumn({ name: 'id', type: 'integer' })
  id: number;

  @Column({ name: 'profile_cagetory_id', type: 'integer' })
  profileCagetoryId: number;

  @Column({ name: 'sub_category', type: 'varchar', length: 50 })
  subCategory: string;

  @Column({ name: 'form_config_id', type: 'integer', nullable: true })
  formConfigId: number;

  @Column({ name: 'seq', type: 'integer', nullable: true })
  seq: number;

  @Column({ name: 'is_active', type: 'varchar', length: 1, nullable: true })
  isActive: string;

  @Column({ name: 'sub_category_en', type: 'varchar', length: 50, nullable: true })
  subCategoryEn: string;

  @Column({ name: 'sub_category_th', type: 'varchar', length: 50, nullable: true })
  subCategoryTh: string;

  @Column({ name: 'sub_category_kh', type: 'varchar', length: 50, nullable: true })
  subCategoryKh: string;

  @Column({ name: 'sub_category_la', type: 'varchar', length: 50, nullable: true })
  subCategoryLa: string;
}
