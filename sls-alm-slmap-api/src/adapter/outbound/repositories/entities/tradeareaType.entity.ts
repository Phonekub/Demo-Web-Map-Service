import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TradeareaEntity } from './tradearea.entity';

@Entity('trade_area_type')
export class TradeareaTypeEntity {
  @PrimaryGeneratedColumn({ name: 'trade_area_type_id' })
  id: number;

  @Column({ name: 'trade_area_type_name' })
  name: string;

  @Column({ name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => TradeareaEntity, (tradearea) => tradearea.tradeareaType)
  tradearea: TradeareaEntity[];
}
