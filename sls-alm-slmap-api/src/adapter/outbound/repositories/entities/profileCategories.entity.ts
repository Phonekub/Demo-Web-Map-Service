import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('profile_categories', { schema: 'allmap' })
export class ProfileCategoriesEntity {
  @PrimaryColumn({ name: 'id', type: 'integer' })
  id: number;

  @Column({ name: 'category', type: 'varchar', length: 50 })
  category: string;

  @Column({ name: 'seq', type: 'integer', nullable: true })
  seq: number;

  @Column({ name: 'is_active', type: 'varchar', length: 1, nullable: true })
  isActive: string;

  @Column({ name: 'category_en', type: 'varchar', length: 50, nullable: true })
  categoryEn: string;

  @Column({ name: 'category_th', type: 'varchar', length: 50, nullable: true })
  categoryTh: string;

  @Column({ name: 'category_kh', type: 'varchar', length: 50, nullable: true })
  categoryKh: string;

  @Column({ name: 'category_la', type: 'varchar', length: 50, nullable: true })
  categoryLa: string;
}
