import { IsNotEmpty, IsString, Length } from 'class-validator';

export class GetQuotaConfigDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  year: string;

  @IsString()
  @IsNotEmpty()
  location_type: string;

  @IsString()
  @IsNotEmpty()
  quota_type: string;
}
