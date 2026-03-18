import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { Expose } from 'class-transformer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(cookieParser());
  app.enableCors({
    origin: new RegExp(process.env.WHITELIST_ORIGIN || ''),
    credentials: true,
  });
  app.setGlobalPrefix(process.env.API_PREFIX || '');
  app.useGlobalPipes(new ValidationPipe());
  app.useLogger(app.get(Logger));
  await app.listen(process.env.APP_PORT || 3000);
}
bootstrap();
