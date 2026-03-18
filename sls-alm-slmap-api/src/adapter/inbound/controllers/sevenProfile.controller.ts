import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { GetSevenInfoByStorecodeUseCase } from '../../../application/usecases/locations/getSevenInfoByStorecode.usecase';
import { JwtAuthGuard } from '../guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('seven-profile')
export class SevenProfileController {
  constructor(
    private readonly getSevenInfoByStorecodeUseCase: GetSevenInfoByStorecodeUseCase,
  ) {}

  @Get('poi/:poiId')
  async getSevenProfileByPoiId(@Param('poiId', ParseIntPipe) poiId: number) {
    const data = await this.getSevenInfoByStorecodeUseCase.handler(poiId);
    return { data };
  }
}
