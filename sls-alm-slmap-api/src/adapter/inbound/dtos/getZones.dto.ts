import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetZonesDto {
  @IsNotEmpty()
  @IsString()
  orgId: string;

  @IsOptional()
  @IsString()
  category?: string;
}
