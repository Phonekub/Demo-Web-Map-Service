import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ADCognitoGatewayPort,
  ADUserInfo,
} from '../../../application/ports/adCognitoGateway.repository';
import { AdLoginToken } from '../../../domain/adLoginToken';
import { GetTokenMapper } from '../mappers/getToken.mapper';
export interface AdTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export default class ADCognitoGateway implements ADCognitoGatewayPort {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getToken(authorizationCode: string): Promise<AdLoginToken> {
    const tokenURL = this.configService.get('AD_TOKEN_URL');
    const clientId = this.configService.get('AD_CLIENT_ID');
    const clientSecret = this.configService.get('AD_CLIENT_SECRET');
    const callbackURL = this.configService.get('AD_CALLBACK_URL');

    const buffer = Buffer.from(`${clientId}:${clientSecret}`);
    const base64Authorization = buffer.toString('base64');

    const body = {
      grant_type: 'authorization_code',
      client_id: clientId,
      code: authorizationCode,
      redirect_uri: callbackURL,
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${base64Authorization}`,
    };

    try {
      const { data } = await this.httpService.axiosRef.post<AdTokenResponse>(
        tokenURL,
        body,
        {
          headers,
        },
      );
      return GetTokenMapper.toDomain(data);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserInfo(accessToken: string): Promise<ADUserInfo> {
    const userInfoURL = this.configService.get('AD_GET_USER_INFO_URL');

    const headers = {
      Authorization: 'Bearer ' + accessToken,
    };

    try {
      const { data } = await this.httpService.axiosRef.get<ADUserInfo>(userInfoURL, {
        headers,
      });
      return data;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
