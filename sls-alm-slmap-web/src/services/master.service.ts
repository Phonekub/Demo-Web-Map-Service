import { get } from './httpBase.service';

export interface DropdownOption {
  text: string;
  value: string;
  spatialType?: string;
}

export interface RoleResponse {
  data: DropdownOption[];
}

export interface PermissionResponse {
  data: DropdownOption[];
}

export const fetchCountries = async (): Promise<DropdownOption[]> => {
  return (await get<{ data: DropdownOption[] }>('/master/countries')).data;
};

export const fetchCommonCodes = async (codeType: string): Promise<DropdownOption[]> => {
  return (
    await get<{ data: DropdownOption[] }>(`/master/common-codes?codeType=${codeType}`)
  ).data;
};

export const fetchProvincesByCountryId = async (
  countryId: string
): Promise<DropdownOption[]> => {
  return (
    await get<{ data: DropdownOption[] }>(
      `/master/provinces?countryCode=${encodeURIComponent(countryId)}`
    )
  ).data;
};

export const fetchDistrictByProvinceId = async (
  provinceId: string
): Promise<DropdownOption[]> => {
  return (
    await get<{ data: DropdownOption[] }>(
      `/master/districts?provinceCode=${encodeURIComponent(provinceId)}`
    )
  ).data;
};

export const fetchSubDistrictByDistrictId = async (
  districtId: string
): Promise<DropdownOption[]> => {
  return (
    await get<{ data: DropdownOption[] }>(
      `/master/sub-districts?districtCode=${encodeURIComponent(districtId)}`
    )
  ).data;
};

export const fetchRentType = async (): Promise<DropdownOption[]> => {
  const mockRentTypes: DropdownOption[] = [
    { value: 'monthly', text: 'Monthly' },
    { value: 'quarterly', text: 'Quarterly' },
    { value: 'yearly', text: 'Yearly' },
    { value: 'daily', text: 'Daily' },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockRentTypes), 200);
  });
};

export const fetchLocationStatus = async (): Promise<DropdownOption[]> => {
  const mockLocationStatus: DropdownOption[] = [
    { value: '01', text: 'เตรียมศักยภาพ' },
    { value: '02', text: 'เตรียมศักยภาพที่ไม่อนุมัติ' },
    { value: '03', text: 'ศักยภาพ - อนุมัติ' },
    { value: '04', text: 'ศักยภาพ - ไม่อนุมัติ' },
    { value: '05', text: 'ศักยภาพ - รอพิจารณา' },
    { value: '06', text: 'Network Opinion' },
    { value: '07', text: 'เช็คคำมั่น' },
    { value: '08', text: 'ทำสัญญาเช่า' },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockLocationStatus), 200);
  });
};

export const fetchLayers = async (
  params?: Record<string, string>
): Promise<DropdownOption[]> => {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return (await get<{ data: DropdownOption[] }>(`/master/layers${queryString}`)).data;
};

interface Zone {
  zoneId: number;
  zoneCode: string;
  category: string;
  region: string;
}

export const fetchZones = async (
  orgId: number,
  category: string
): Promise<DropdownOption[]> => {
  const response = await get<{ data: Zone[] }>(
    `/master/zones?orgId=${orgId}&category=${encodeURIComponent(category)}`
  );

  return response.data.map(zone => ({
    value: zone.zoneCode,
    text: zone.zoneCode,
  }));
};

export const fetchCloseType = async (): Promise<DropdownOption[]> => {
  const mockCloseTypes: DropdownOption[] = [
    { value: 'all', text: 'ทั้งหมด' },
    { value: 'seveneleven', text: '7-11 ร้านปิด' },
    { value: 'competitor', text: 'คู่แข่งปิด' },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockCloseTypes), 200);
  });
};

export const fetchTrainLine = async (): Promise<DropdownOption[]> => {
  const mockTrainLine: DropdownOption[] = [
    { value: 'GR', text: 'BTS สายสีเขียว' },
    { value: 'PI', text: 'BTS สายสีชมพู' },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockTrainLine), 200);
  });
};

export const fetchShowExitGate = async (): Promise<DropdownOption[]> => {
  const mockShowExitGate: DropdownOption[] = [{ value: 'EG', text: 'แสดงประตูทางออก' }];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockShowExitGate), 200);
  });
};

export const fetchRadiusType = async (): Promise<DropdownOption[]> => {
  const mockRadiusType: DropdownOption[] = [{ value: 'FR', text: 'ตามเส้นถนน' }];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockRadiusType), 200);
  });
};

export const fetchdistanceTime = async (): Promise<DropdownOption[]> => {
  const mockDistanceTime: DropdownOption[] = [
    { value: 'DS', text: 'ระยะทาง' },
    { value: 'TM', text: 'เวลาที่ใช้' },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockDistanceTime), 200);
  });
};

export const fetchlocationType = async (): Promise<DropdownOption[]> => {
  const mockLocationType: DropdownOption[] = [
    { value: 'All', text: 'ทั้งหมด' },
    { value: 'NL', text: 'ทำเลปกติ' },
    { value: 'SL', text: 'ทำเลพิเศษ' },
    { value: 'PT', text: 'ทำเล ปตท.' },
    { value: 'BS', text: 'BSP' },
    { value: 'TD', text: 'TYPE D' },
    { value: 'SD', text: 'ทำเลพิเศษประมูล' },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockLocationType), 200);
  });
};

export const fetchRegionId = async (): Promise<DropdownOption[]> => {
  const mockRegionId: DropdownOption[] = [
    { value: 'NO', text: 'ภาคเหนือ' },
    { value: 'SO', text: 'ภาคใต้' },
    { value: 'EA', text: 'ภาคตะวันออก' },
    { value: 'WE', text: 'ภาคตะวันตก' },
    { value: 'NE', text: 'ภาคตะวันออกเฉียงเหนือ' },
    { value: 'CE', text: 'ภาคกลาง' },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockRegionId), 200);
  });
};

export const fetchAreaId = async (): Promise<DropdownOption[]> => {
  const mockAreaId: DropdownOption[] = [
    { value: 'A1', text: 'พื้นที่ A1' },
    { value: 'A2', text: 'พื้นที่ A2' },
    { value: 'A3', text: 'พื้นที่ A3' },
    { value: 'A4', text: 'พื้นที่ A4' },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockAreaId), 200);
  });
};

export const fetchVendingStatus = async (): Promise<DropdownOption[]> => {
  const mockVendingStatus: DropdownOption[] = [
    { value: 'รอส่งยืนยันทำเล', text: 'รอส่งยืนยันทำเล' },
    { value: 'สร้างแบบฟอร์มแล้ว', text: 'สร้างแบบฟอร์มแล้ว' },
    { value: 'ทำสัญญาแล้ว', text: 'ทำสัญญาแล้ว' },
    { value: 'สิ้นสุดสัญญา', text: 'สิ้นสุดสัญญา' },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve(mockVendingStatus), 200);
  });
};

export const getAllRoles = async (): Promise<RoleResponse> => {
  const response = await get<RoleResponse>('/master/roles');
  return response;
};

export const getAllPermissions = async (): Promise<PermissionResponse> => {
  const response = await get<PermissionResponse>('/master/permissions');
  return response;
};
