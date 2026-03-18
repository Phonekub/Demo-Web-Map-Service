import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { WorkflowAction } from '../../../common/enums/action.enum';

export class ApprovePotentialDto {
  @IsNotEmpty()
  @IsEnum(WorkflowAction)
  status: WorkflowAction;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  remark: string;
}

export class SendApprovePotentialDto {
  @IsNotEmpty()
  @IsNumber()
  poiId: number;
}
