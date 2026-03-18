import * as queryString from 'querystring';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GenerateAdURLUseCase {
  constructor(private configService: ConfigService) {}

  async handler(): Promise<string> {
    const url = this.configService.get('AD_AUTHEN_URL');
    const query = queryString.stringify({
      response_type: 'code',
      identity_provider: 'cpall.',
      client_id: this.configService.get('AD_CLIENT_ID'),
      redirect_uri: this.configService.get('AD_CALLBACK_URL'),
    });

    return `${url}?${query}`;
  }
}
