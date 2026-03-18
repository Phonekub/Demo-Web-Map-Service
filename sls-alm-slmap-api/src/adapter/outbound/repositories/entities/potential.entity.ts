import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PoiEntity } from './poi.entity';
import { ElementSevenElevenEntity } from './elementSevenEleven.entity';
import { ElementVendingMachineEntity } from './elementVendingMachine.entity';
import { WfTransactionEntity } from './wfTransaction.entity';

@Entity({
  name: 'potential_store',
  schema: 'allmap',
})
export class PoiPotentialEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
    type: 'integer',
  })
  id: number;

  @Column({
    name: 'uid',
    type: 'uuid',
    default: () => 'gen_random_uuid()',
    nullable: true,
  })
  uid: string;

  @Column({
    name: 'poi_id',
    type: 'integer',
    nullable: false,
  })
  poiId: number;

  @Column({
    name: 'form_loc_number',
    type: 'varchar',
    nullable: true,
  })
  formLocNumber: string;

  @Column({
    name: 'location_type',
    type: 'varchar',
    nullable: true,
  })
  locationType: string;

  @Column({
    name: 'rent_type',
    type: 'varchar',
    nullable: true,
  })
  rentType: string;

  @Column({
    name: 'is_active',
    type: 'varchar',
    length: 1,
    default: 'Y',
    nullable: true,
  })
  isActive: string;

  @Column({
    name: 'can_sale_alcohol',
    type: 'varchar',
    length: 1,
    default: 'N',
    nullable: true,
  })
  canSaleAlcohol: string;

  @Column({
    name: 'can_sale_cigarette',
    type: 'varchar',
    length: 1,
    default: 'N',
    nullable: true,
  })
  canSaleCigarette: string;

  @CreateDateColumn({
    name: 'created_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdDate: Date;

  @Column({
    name: 'created_by',
    type: 'integer',
    nullable: true,
  })
  createdBy: number;

  @UpdateDateColumn({
    name: 'updated_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedDate: Date;

  @Column({
    name: 'status',
    type: 'varchar',
    nullable: true,
  })
  status: string;

  @Column({
    name: 'area_type',
    type: 'varchar',
    nullable: true,
  })
  areaType: string;

  @Column({
    name: 'grade',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  grade: string;

  @Column({
    name: 'wf_transaction_id',
    type: 'integer',
    nullable: true,
  })
  wfTransactionId: number;

  @Column({
    name: 'approve_status',
    type: 'varchar',
    nullable: true,
  })
  approveStatus: string;

  @ManyToOne(() => PoiEntity)
  @JoinColumn({
    name: 'poi_id',
  })
  poi: PoiEntity;

  @ManyToOne(() => WfTransactionEntity, { nullable: true })
  @JoinColumn({ name: 'wf_transaction_id' })
  workflowTransaction: WfTransactionEntity;

  @OneToMany(() => ElementSevenElevenEntity, (sevenEleven) => sevenEleven.potentialStore)
  sevenElevenElements: ElementSevenElevenEntity[];

  @OneToMany(
    () => ElementVendingMachineEntity,
    (vendingMachine) => vendingMachine.potentialStore,
  )
  vendingMachineElements: ElementVendingMachineEntity[];
}
