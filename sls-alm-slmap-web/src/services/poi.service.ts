import { get, post, postFile } from './httpBase.service';

export interface PendingApprovalPOI {
  potentialId: number;
  poiId: number;
  uid: string;
  namt: string;
  locationT: string;
  wfId: number;
  wfName: string;
  statusNameTh: string;
  wfTransactionId: number;
  wfStatusId: number;
  createDate: string;
}

export interface POIDetailResponse {
  data: {
    poi: {
      poiId: number;
      uid: string;
      layerId: number;
      namt: string;
      name: string;
      locationT: string | null;
      locationE: string | null;
      zoneCode: string;
      subzoneCode: string;
      nation: string;
      provCode: string;
      ampCode: string;
      tamCode: string;
      type: string | null;
      shape: {
        type: string;
        coordinates: [number, number];
      };
      isActive: string;
      createdUser: string;
      createdDate: string;
      lastEditedUser: string | null;
      lastEditedDate: string | null;
    };
    potentialStore: {
      id: string;
      uid: string;
      poiId: number;
      formLocNumber: string | null;
      locationType: string | null;
      rentType: string | null;
      isActive: string;
      canSaleAlcohol: string;
      canSaleCigarette: string;
      createdDate: string;
      createdBy: number;
      updatedDate: string;
      status: string;
      areaType: string | null;
      wfTransactionId: number;
    } | null;
    sevenEleven: any | null;
    vendingMachine: any | null;
  };
}

export const getPendingApprovalPOIs = async (
  wfId?: number
): Promise<PendingApprovalPOI[]> => {
  try {
    const params = new URLSearchParams();
    if (wfId) params.append('wfId', String(wfId));
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await get<{ data: PendingApprovalPOI[] }>(
      `/potentials/pending-approval${queryString}`
    );

    if (!response.data) {
      console.warn('getPendingApprovalPOIs: No data returned');
      return [];
    }
    return response.data;
  } catch (error) {
    console.error('getPendingApprovalPOIs error:', error);
    return [];
  }
};

export const checkPOIHasPendingApproval = async (poiId: number): Promise<boolean> => {
  try {
    const params = new URLSearchParams();
    params.append('poiId', String(poiId));
    const queryString = `${params.toString()}`;

    const response = await get<{ data: PendingApprovalPOI[] }>(
      `/potentials/pending-approval?${queryString}`
    );

    return response?.data && response.data.length > 0;
  } catch (error) {
    console.error('checkPOIHasPendingApproval error:', error);
    return false;
  }
};

export const getPOIDetail = async (poiId: number): Promise<POIDetailResponse | null> => {
  return get<POIDetailResponse | null>(`/potentials/${poiId}/detail`);
};

export interface UpdatePOIApproveRequest {
  status: string;
  message?: string;
  error?: string;
}
export const updatePOIApprove = async (
  poiId: number,
  action: string,
  remark?: string
): Promise<UpdatePOIApproveRequest> => {
  return post<UpdatePOIApproveRequest>(`potentials/${poiId}/approve`, {
    status: action,
    remark,
  });
};

export interface getPoiImageResponse {
  id: number;
  name: string;
  url: string;
}

export interface resultResponse {
  status: 'success' | 'error';
  message?: string;
  error?: any;
}

export const getPoiImages = async (poiId: number): Promise<getPoiImageResponse[]> => {
  try {
    const response = await get<{ data: getPoiImageResponse[] }>(
      `/potentials/images/${poiId}`
    );

    if (!response) {
      console.warn('getPoiImages: No data returned');
      return [];
    }

    return response.data;
  } catch (error) {
    return [];
  }
};

export const uploadPoiImages = async (poiId: number, files: File[]): Promise<boolean> => {
  try {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    const res = await postFile<resultResponse>(`potentials/images/${poiId}`, formData);

    if (res.status === 'error') {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const deletePoiImage = async (imageId: number): Promise<boolean> => {
  try {
    const res = await post<resultResponse>(`potentials/images/${imageId}/delete`, {});

    if (res.status === 'error') {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};
