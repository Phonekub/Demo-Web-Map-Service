import { AdLoginToken } from '../../../domain/adLoginToken';
import { AdTokenResponse } from '../gateways/adCognito.gateway';

export class GetTokenMapper {
  static toDomain(adToken: AdTokenResponse): AdLoginToken {
    return {
      idToken: adToken.id_token || null,
      accessToken: adToken.access_token || null,
      expiresIn: adToken.expires_in || null,
      refreshToken: adToken.refresh_token || null,
      tokenType: adToken.token_type || null,
    };
  }
}
