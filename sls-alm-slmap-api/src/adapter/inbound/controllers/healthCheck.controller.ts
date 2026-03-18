import { Controller, Get, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class HealthCheckController {
  @Get()
  healthCheck(@Res() res: Response) {
    res.status(HttpStatus.OK).send('Health check is ok.');
  }
}
