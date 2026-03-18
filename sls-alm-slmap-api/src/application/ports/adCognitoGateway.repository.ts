import { AdLoginToken } from '../../domain/adLoginToken';

export type GetTokenSource = 'desktop' | 'mobile';

export interface ADUserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  username?: string;
  [key: string]: unknown;
}

export interface ADCognitoGatewayPort {
  getToken(authorizationCode: string): Promise<AdLoginToken>;
  getUserInfo(accessToken: string): Promise<ADUserInfo>;
}
