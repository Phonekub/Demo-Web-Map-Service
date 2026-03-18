import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FilterComponentProps } from '../panel/SearchPanel';
// import { fetchTradeAreaSearch } from '../../../services/tradeArea.service'; // รอ Function นี้จาก Service
import { Button, HoverDropdown, Input } from '../../../components';
import {
  fetchProvincesByCountryId,
  fetchDistrictByProvinceId,
  fetchSubDistrictByDistrictId,
  fetchCommonCodes,
} from '@/services/master.service';
import { useFilterStore } from '@/stores';
import { fetchLocations, type LocationsResponse } from '@/services/location.service';

// 1. กำหนดค่าเริ่มต้นให้ตรงกับหน้า Trade Area
const tradeAreaDefaults = {
  text: '',
  address: '',
  countryCode: '',
  provinceCode: '',
  districtCode: '',
  subDistrictCode: '',
  status: '',
  approvalType: '',
  tradeAreaType: '',
};

export const FilterTradeArea = ({
  onSearchSubmit,
  onClose,
  // areaCoordinates ตัดออกแล้ว
}: FilterComponentProps) => {
  const { t } = useTranslation(['common', 'maps']);
  const filterKey = 'filterTradeArea';

  const { filters, setField, setError, resetFilter } = useFilterStore();

  // Load values (ดึงค่าจาก Store หรือใช้ค่า Default)
  const tradeArea = { ...tradeAreaDefaults, ...(filters[filterKey] ?? {}) };
  const {
    text,
    address,
    countryCode,
    provinceCode,
    districtCode,
    subDistrictCode,
    status,
    approvalType,
    tradeAreaType,
    inputErrors,
  } = tradeArea;

  // Fetch data on mount
  useEffect(() => {
    // โหลดข้อมูล Country เมื่อ Component ถูกเปิด
    refetchCountries();
    return () => {
      setError(filterKey, '');
    };
  }, []);

  // --- Master Data Section ---

  // Country
  const { data: countryOptionsData, refetch: refetchCountries } = useQuery({
    queryKey: ['countryCode'],
    queryFn: async () => {
      const res = await fetchCommonCodes('ALLMAP_NATION');
      return res.map(item => ({ value: item.value, label: item.text }));
    },
    enabled: false,
    staleTime: 30 * 60 * 1000,
  });

  // Province
  const { data: provinceOptionsData } = useQuery({
    queryKey: ['provinceCode', countryCode],
    queryFn: async () => {
      const res = await fetchProvincesByCountryId(countryCode);
      return res.map(item => ({ value: item.value, label: item.text }));
    },
    enabled: !!countryCode,
  });

  // District
  const { data: districtOptions } = useQuery({
    queryKey: ['districtCode', provinceCode],
    queryFn: async () => {
      const res = await fetchDistrictByProvinceId(provinceCode);
      return res.map(item => ({ value: item.value, label: item.text }));
    },
    enabled: !!provinceCode,
  });

  // 4. SubDistrict
  const { data: subDistrictOptions } = useQuery({
    queryKey: ['subDistrictCode', districtCode],
    queryFn: async () => {
      const res = await fetchSubDistrictByDistrictId(districtCode);
      return res.map(item => ({ value: item.value, label: item.text }));
    },
    enabled: !!districtCode,
  });

  //Status
  const { data: statusOptions } = useQuery({
    queryKey: ['tradeAreaStatus'],
    queryFn: async () => {
      const res = await fetchCommonCodes('TRADEAREA_STATUS');
      return res.map(item => ({ value: item.value, label: item.text }));
    },
    staleTime: 30 * 60 * 1000,
  });

  //Approval Type
  const { data: approvalOptions } = useQuery({
    queryKey: ['tradeAreaApprovalType'],
    queryFn: async () => {
      const res = await fetchCommonCodes('TRADEAREA_APPROVAL_TYPE');
      return res.map(item => ({ value: item.value, label: item.text }));
    },
    staleTime: 30 * 60 * 1000,
  });

  // 7. Trade Area Type
  const { data: tradeAreaTypeOptions } = useQuery({
    queryKey: ['tradeAreaType'],
    queryFn: async () => {
      try {
        const res = await fetchCommonCodes('TRADEAREA_TYPE');
        return res.map(item => ({ value: item.value, label: item.text }));
      } catch (error) {
        console.error('Failed to fetch trade area types:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
  });

  // --- Search Logic (Form Search) ---

  // จำลอง API Call สำหรับการค้นหาด้วย Form
  const { isFetching, refetch: refetchSearch } = useQuery({
    queryKey: [
      'tradeAreaSearch',
      text,
      address,
      countryCode,
      provinceCode,
      districtCode,
      subDistrictCode,
      status,
      approvalType,
      tradeAreaType,
    ],
    queryFn: async () => {
      const page = 1;
      const limit = 10;

      const params: Record<string, any> = {
        type: 'tradearea',
        page,
        limit,
        countryCode: countryCode || undefined,
        provinceCode: provinceCode || undefined,
        districtCode: districtCode || undefined,
        subDistrictCode: subDistrictCode || undefined,
        text: text || undefined,
        status: status || undefined,
        approvalType: approvalType || undefined,
        tradeAreaType: tradeAreaType || undefined,
      };

      return fetchLocations(params);
    },
    enabled: false,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: ต้องกรอกอย่างน้อย 1 ช่อง
    const isAnyFilterFilled =
      (text ?? '').trim() ||
      (address ?? '').trim() ||
      (countryCode ?? '').trim() ||
      (provinceCode ?? '').trim() ||
      (districtCode ?? '').trim() ||
      (subDistrictCode ?? '').trim() ||
      (status ?? '').trim() ||
      (approvalType ?? '').trim() ||
      (tradeAreaType ?? '').trim();

    if (!isAnyFilterFilled) {
      setError(filterKey, 'maps:filter_required');
      return;
    }

    setError(filterKey, '');

    try {
      const result = await refetchSearch({ throwOnError: true });

      // result.data คือ LocationsResponse จาก fetchLocations
      const locations = result.data as LocationsResponse | undefined;

      if (locations) {
        onSearchSubmit({
          data: locations.data,
          total: locations.total,
          params: {
            type: 'tradearea',
            text,
            countryCode,
            provinceCode,
            districtCode,
            subDistrictCode,
            status,
            approvalType,
            tradeAreaType,
          },
        });
        handleClear();
        onClose();
      } else {
        onSearchSubmit({
          data: { search: [], poi: [] },
          total: 0,
          params: {
            type: 'tradearea',
            text,
            countryCode,
            provinceCode,
            districtCode,
            subDistrictCode,
            status,
            approvalType,
            tradeAreaType,
          },
        });
        onClose();
      }
    } catch (error) {
      console.error('Search failed:', error);
      onSearchSubmit({
        data: { search: [], poi: [] },
        total: 0,
        params: {
          type: 'tradearea',
          text,
          countryCode,
          provinceCode,
          districtCode,
          subDistrictCode,
          status,
          approvalType,
          tradeAreaType,
        },
      });
    }
  };

  const handleClear = () => {
    resetFilter(filterKey);
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="rounded-lg bg-white p-4 space-y-4">
        {/* Error Message */}
        {inputErrors && (
          <div className="bg-red-100 text-red-700 text-xs px-3 py-2 rounded-md border border-red-300">
            {t(inputErrors)}
          </div>
        )}

        {/* 1. รหัส Trade Area */}
        <div className="w-full">
          <Input
            type="text"
            className="input"
            placeholder={t('maps:tradearea_code_name')}
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setField(filterKey, 'text', e.target.value)
            }
          />
        </div>

        {/* 2. ประเภท Trade Area */}
        <div className="w-full">
          <HoverDropdown
            options={tradeAreaTypeOptions || []}
            value={tradeAreaType ?? ''}
            onChange={value => setField(filterKey, 'tradeAreaType', value)}
            placeholder={t('maps:tradearea_type')}
            hoverBehavior="all"
          />
        </div>

        {/* 3. สถานะ */}
        <div className="w-full">
          <HoverDropdown
            options={statusOptions || []}
            value={status ?? ''}
            onChange={value => setField(filterKey, 'status', value)}
            placeholder={t('maps:tradearea_search_status')}
            hoverBehavior="all"
          />
        </div>

        {/* 4. ประเภทการอนุมัติ */}
        <div className="w-full">
          <HoverDropdown
            options={approvalOptions || []}
            value={approvalType ?? ''}
            onChange={value => setField(filterKey, 'approvalType', value)}
            placeholder={t('maps:tradearea_approval_type')}
            hoverBehavior="all"
          />
        </div>

        {/* 5. ประเทศ */}
        <div className="w-full">
          <HoverDropdown
            options={countryOptionsData || []}
            value={countryCode ?? ''}
            onChange={value => {
              setField(filterKey, 'countryCode', value);
              setField(filterKey, 'provinceCode', '');
              setField(filterKey, 'districtCode', '');
              setField(filterKey, 'subDistrictCode', '');
            }}
            placeholder={t('maps:country')}
            hoverBehavior="all"
            searchable={true}
          />
        </div>

        {/* 6. จังหวัด */}
        <div className="w-full">
          <HoverDropdown
            options={provinceOptionsData || []}
            value={provinceCode ?? ''}
            onChange={value => {
              setField(filterKey, 'provinceCode', value);
              setField(filterKey, 'districtCode', '');
              setField(filterKey, 'subDistrictCode', '');
            }}
            placeholder={t('maps:province')}
            hoverBehavior="highlight"
            searchable={true}
            disabled={!countryCode}
          />
        </div>

        {/* 7. อำเภอ */}
        <div className="w-full">
          <HoverDropdown
            options={districtOptions || []}
            value={districtCode ?? ''}
            onChange={value => {
              setField(filterKey, 'districtCode', value);
              setField(filterKey, 'subDistrictCode', '');
            }}
            placeholder={t('maps:district')}
            hoverBehavior="shadow"
            searchable={true}
            disabled={!provinceCode}
          />
        </div>

        {/* 8. ตำบล */}
        <div className="w-full">
          <HoverDropdown
            options={subDistrictOptions || []}
            value={subDistrictCode ?? ''}
            onChange={value => setField(filterKey, 'subDistrictCode', value)}
            placeholder={t('maps:sub_district')}
            hoverBehavior="shadow"
            searchable={true}
            disabled={!districtCode}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>
            {t('common:close')}
          </Button>
          <Button variant="outline" onClick={handleClear} type="button">
            {t('common:clear')}
          </Button>
          <Button
            variant="primary"
            className="shadow-none rounded-lg px-6 w-24"
            type="submit"
          >
            {isFetching ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              t('common:search')
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
