import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { WorkflowAction } from '../../../common/enums/action.enum';

export class UpdateTradeareaApproveDto {
  @IsEnum(WorkflowAction)
  @IsNotEmpty()
  action: WorkflowAction;

  @IsString()
  @IsOptional()
  remark?: string;
}
