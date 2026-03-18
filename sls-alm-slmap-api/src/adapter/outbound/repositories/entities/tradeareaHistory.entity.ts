import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('trade_area_history')
export class TradeareaHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'trade_area_id', type: 'int' })
  TradeareaId: number;

  @Column({ name: 'action', type: 'varchar', length: 255 })
  action: string;

  @Column({ name: 'action_type', type: 'varchar', length: 100 })
  actionType: string;
}
