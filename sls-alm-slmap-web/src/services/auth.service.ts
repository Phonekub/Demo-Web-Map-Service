import { get, post } from './httpBase.service';
import type { User } from '@/types';

interface LoginResponse {
  redirectUrl: string;
}

interface OAuth2CallbackRequest {
  code: string;
}

interface OAuth2CallbackResponse {
  success: boolean;
  message?: string;
}

interface GetMeResponse {
  data: User;
}

interface LogoutResponse {
  logoutUrl: string;
}

export const login = async (): Promise<string> => {
  const response = await post<LoginResponse>('auth/login', {});
  return response.redirectUrl;
};

export const handleOAuth2Callback = async (code: string): Promise<void> => {
  await post<OAuth2CallbackResponse, OAuth2CallbackRequest>(
    'oauth2callback',
    { code }
  );
};

export const getMe = async (): Promise<User> => {
  const response = await get<GetMeResponse>('/users/me');
  return response.data;
};

export const logout = async (): Promise<string> => {
  const response = await post<LogoutResponse>('auth/logout', {});
  return response.logoutUrl;
};
