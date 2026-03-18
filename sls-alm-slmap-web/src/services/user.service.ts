import { get, put } from './httpBase.service';
import type {
  UserListResponse,
  UserListParams,
  UserDetailResponse,
  UserWithZoneListResponse,
} from '@/types/user.type';
import queryString from 'query-string';
import type { DropdownOption } from './master.service';

export interface UserZoneResponse {
  data: DropdownOption[];
}

export interface UserSubZoneResponse {
  data: DropdownOption[];
}

export const getUserList = async (params: UserListParams): Promise<UserListResponse> => {
  const query = queryString.stringifyUrl(
    {
      url: '/users',
      query: {
        page: params.page,
        pageSize: params.pageSize,
        ...(params.search && { search: params.search }),
      },
    },
    { skipNull: true }
  );

  return await get<UserListResponse>(query);
};

export const getUserWithZoneList = async (
  params: UserListParams
): Promise<UserWithZoneListResponse> => {
  const query = queryString.stringifyUrl(
    {
      url: '/users/with-zones',
      query: {
        page: params.page,
        pageSize: params.pageSize,
        ...(params.search && { search: params.search }),
      },
    },
    { skipNull: true }
  );

  return await get<UserWithZoneListResponse>(query);
};

export const updateUser = async (payload: any) => {
  return await put(`users/${payload.userId}`, { ...payload });
};

export const getUserRole = async (userId: number) => {
  return await get<UserDetailResponse>(`/users/${userId}`);
};

export const fetchUserZone = async (): Promise<UserZoneResponse> => {
  return await get<UserZoneResponse>('/users/zones');
};

export const fetchUserSubZone = async (zone: string): Promise<UserSubZoneResponse> => {
  return await get<UserSubZoneResponse>(
    `/users/sub-zones?zone=${encodeURIComponent(zone)}`
  );
};
