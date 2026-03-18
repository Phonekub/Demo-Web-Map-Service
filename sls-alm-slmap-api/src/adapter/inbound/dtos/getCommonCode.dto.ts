import { IsNotEmpty, IsString } from 'class-validator';

export class GetCommonCodeDto {
  @IsNotEmpty()
  @IsString()
  codeType: string;
}
