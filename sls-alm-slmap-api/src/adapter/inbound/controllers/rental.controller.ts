import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { GetLocationFromRentalUseCase } from '../../../application/usecases/rental/getLocationFromRental.usecase';
import { GenerateRentalLinkUseCase } from '../../../application/usecases/rental/generateRentalLink.usecase';
import { JwtAuthGuard } from '../guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('rental')
export class RentalController {
  constructor(
    private readonly getLocationFromRentalUseCase: GetLocationFromRentalUseCase,
    private readonly generateRentalLinkUseCase: GenerateRentalLinkUseCase,
  ) {}

  @Get('getLocation')
  async getLocation(@Query('fl') fl: string) {
    const location = await this.getLocationFromRentalUseCase.handler(fl);
    return location;
  }

  @Post('generate-link')
  async generateRentalLink(
    @Body()
    body: {
      formLocNumber: string;
      userId: number;
      timestamp: number;
      nation?: string;
    },
  ) {
    const result = await this.generateRentalLinkUseCase.handler(body);
    return { data: result };
  }
}
