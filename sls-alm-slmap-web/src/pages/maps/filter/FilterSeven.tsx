import { useQuery } from '@tanstack/react-query';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FilterComponentProps } from '../panel/SearchPanel';
import { fetchLocations } from '../../../services/location.service';
import { Button, HoverDropdown, Input } from '../../../components';
import type { DropdownOption } from '../../../components';
import {
  fetchProvincesByCountryId,
  fetchDistrictByProvinceId,
  fetchSubDistrictByDistrictId,
  fetchCommonCodes,
} from '@/services/master.service';
import { useFilterStore } from '@/stores';

const sevenDefaults = {
  type: 'sevenEleven',
  layerId: '',
  areaScope: '',
  address: '',
  countryCode: '',
  provinceCode: '',
  districtCode: '',
  subDistrictCode: '',
  radius: '',
  radiusUnit: 'm',
  text: '',
  inputErrors: '',
  sevenType: '',
};

export const FilterSeven = ({ onSearchSubmit, onClose }: FilterComponentProps) => {
  const { t } = useTranslation(['common', 'maps']);
  const filterKey = 'sevenEleven';

  const { filters, setField, setError, resetFilter } = useFilterStore();

  // Load values (fallback to default)
  const seven = { ...sevenDefaults, ...(filters[filterKey] ?? {}) };
  const {
    type,
    layerId,
    areaScope,
    address,
    countryCode,
    provinceCode,
    districtCode,
    subDistrictCode,
    radius,
    radiusUnit,
    text,
    inputErrors,
    sevenType,
    radiusError,
  } = seven;

  // Fetch countries on mount
  useEffect(() => {
    refetchCountries();
    refetchSevenType();

    return () => {
      setError(filterKey, '');
    };
  }, []);

  const handleSevenTypeFetch = async (): Promise<DropdownOption[]> => {
    try {
      const result = await fetchCommonCodes('SEVEN_TYPE');
      return result.map<DropdownOption>(sevenType => ({
        value: sevenType.value,
        label: sevenType.text,
      }));
    } catch (error) {
      console.error('Failed to fetch sevenType:', error);
      return [];
    }
  };
  const { data: sevenTypeOptionsData, refetch: refetchSevenType } = useQuery({
    queryKey: ['sevenType'],
    queryFn: handleSevenTypeFetch,
    enabled: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const handleCountryFetch = async (): Promise<DropdownOption[]> => {
    try {
      const result = await fetchCommonCodes('ALLMAP_NATION');
      return result.map<DropdownOption>(country => ({
        value: country.value,
        label: country.text,
      }));
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      return [];
    }
  };
  const { data: countryOptionsData, refetch: refetchCountries } = useQuery({
    queryKey: ['countryCode'],
    queryFn: handleCountryFetch,
    enabled: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const handleProvinceFetch = async (countryId: string): Promise<DropdownOption[]> => {
    // Implement province fetch based on countryId
    setField(filterKey, 'countryCode', countryId);
    try {
      const result = await fetchProvincesByCountryId(countryId);
      return result.map<DropdownOption>(province => ({
        value: province.value,
        label: province.text,
      }));
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
      return [];
    }
  };
  const { data: provinceOptionsData } = useQuery({
    queryKey: ['provinceCode', countryCode],
    queryFn: () => handleProvinceFetch(countryCode),
    enabled: !!countryCode,
  });

  const handleDistrictFetch = async (provinceId: string): Promise<DropdownOption[]> => {
    // Implement district fetch based on provinceId
    setField(filterKey, 'provinceCode', provinceId);
    try {
      const result = await fetchDistrictByProvinceId(provinceId);
      return result.map<DropdownOption>(district => ({
        value: district.value,
        label: district.text,
      }));
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
      return [];
    }
  };
  const { data: districtOptions } = useQuery({
    queryKey: ['districtCode', provinceCode],
    queryFn: () => handleDistrictFetch(provinceCode),
    enabled: !!provinceCode,
  });

  const handleSubDistrictFetch = async (
    districtId: string
  ): Promise<DropdownOption[]> => {
    // Implement district fetch based on provinceId
    setField(filterKey, 'districtCode', districtId);
    try {
      const result = await fetchSubDistrictByDistrictId(districtId);
      return result.map<DropdownOption>(subDistrict => ({
        value: subDistrict.value,
        label: subDistrict.text,
      }));
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
      return [];
    }
  };
  const { data: subDistrictOptions } = useQuery({
    queryKey: ['subDistrictCode', districtCode],
    queryFn: () => handleSubDistrictFetch(districtCode),
    enabled: !!districtCode,
  });

  // API query for location search
  const { isFetching, refetch: refetchLocations } = useQuery({
    queryKey: [
      type,
      layerId,
      areaScope,
      address,
      countryCode,
      provinceCode,
      districtCode,
      subDistrictCode,
      radius,
      radiusUnit,
      text,
      sevenType,
    ],
    queryFn: () => {
      // Convert radius to kilometers for API
      const radiusValue = parseFloat(radius);
      const radiusInKm =
        radius && !isNaN(radiusValue)
          ? radiusUnit === 'km'
            ? radiusValue
            : radiusValue / 1000
          : undefined;

      return fetchLocations({
        type,
        layerId,
        areaScope,
        address,
        countryCode,
        provinceCode,
        districtCode,
        subDistrictCode,
        radius: radiusInKm,
        text,
        sevenType,
        page: 1,
        limit: 10,
      });
    },
    enabled: false,
  });
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // At least ONE must be filled
    const isAnyFilterFilled =
      (text ?? '').trim() ||
      (address ?? '').trim() ||
      (areaScope ?? '').trim() ||
      (provinceCode ?? '').trim() ||
      (districtCode ?? '').trim() ||
      (subDistrictCode ?? '').trim() ||
      (sevenType ?? '').trim();

    // Validate radius
    const numValue = parseFloat(radius) || 0;
    const maxValue = radiusUnit === 'km' ? 2 : 2000;
    const hasRadiusError = radius && numValue > maxValue;

    const hasErrors = !isAnyFilterFilled || hasRadiusError;

    if (!isAnyFilterFilled) {
      setError(filterKey, 'maps:filter_required');
    } else {
      setError(filterKey, '');
    }

    if (hasRadiusError) {
      setField(filterKey, 'radiusError', 'maps:radius_max_error');
    } else {
      setField(filterKey, 'radiusError', '');
    }

    if (hasErrors) {
      return;
    }

    // Clear errors
    setError(filterKey, '');

    try {
      const result = await refetchLocations({ throwOnError: true });

      if (result.data?.data?.search) {
        const searchResults = {
          data: {
            search: result.data.data.search,
            poi: result.data.data.poi,
          },
          total: result.data.total,
          params: {
            type,
            address,
            text,
            countryCode,
            provinceCode,
            districtCode,
            subDistrictCode,
            sevenType,
            radius,
            page: 1,
            limit: 10,
          },
        };

        onSearchSubmit(searchResults);
        onClose();
      } else {
        onSearchSubmit({
          data: { search: [], poi: [] },
          total: 0,
        });
        onClose();
      }
    } catch (error) {
      console.error('Search failed:', error);
      onSearchSubmit({
        data: { search: [], poi: [] },
        total: 0,
      });
      onClose();
    }
  };

  const handleClear = () => {
    resetFilter(filterKey);
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="rounded-lg bg-white p-4 space-y-4">
        {/* input error message */}
        {inputErrors && (
          <div className="bg-red-100 text-red-700 text-xs px-3 py-2 rounded-md border border-red-300">
            {t(inputErrors)}
          </div>
        )}
        {/* radius error message */}
        {radiusError && (
          <div className="bg-red-100 text-red-700 text-xs px-3 py-2 rounded-md border border-red-300">
            {t(radiusError)}
          </div>
        )}
        {/* Branch Input */}
        <div className="w-full">
          <Input
            type="text"
            className="input"
            placeholder={t('maps:branch_code_name')}
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setField(filterKey, 'text', e.target.value)
            }
          />
        </div>

        {/* Address Input */}
        <div className="w-full">
          <Input
            type="text"
            className="input"
            placeholder={t('maps:location')}
            value={address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setField(filterKey, 'address', e.target.value)
            }
          />
        </div>

        {/* Radius Input */}
        <div className="w-full flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              className="input w-full"
              placeholder={t('maps:radius')}
              value={radius}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  setField(filterKey, 'radius', value);
                }
              }}
            />
          </div>
          <div className="w-28">
            <HoverDropdown
              options={[
                { value: 'm', label: t('maps:unit_meter') },
                { value: 'km', label: t('maps:unit_kilometer') },
              ]}
              value={radiusUnit || 'm'}
              onChange={value => setField(filterKey, 'radiusUnit', value)}
              hoverBehavior="border"
              showClearButton={false}
              className="w-full"
            />
          </div>
        </div>

        {/* Country Dropdown */}
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
            tooltip={t('maps:select_country')}
            searchable={true}
            showIcons={true}
          />
        </div>

        {/* Province Dropdown */}
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
            tooltip={t('maps:select_province')}
            searchable={true}
            showIcons={true}
            disabled={!countryCode}
          />
        </div>

        {/* District Dropdown */}
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
            tooltip={t('maps:select_district')}
            maxHeight="200px"
            searchable={true}
            disabled={!provinceCode}
          />
        </div>
        {/* Sub District Dropdown */}
        <div className="w-full">
          <HoverDropdown
            options={subDistrictOptions || []}
            value={subDistrictCode ?? ''}
            onChange={value => setField(filterKey, 'subDistrictCode', value)}
            placeholder={t('maps:sub_district')}
            hoverBehavior="shadow"
            tooltip={t('maps:select_sub_district')}
            searchable={true}
            maxHeight="200px"
            disabled={!districtCode}
          />
        </div>

        {/* sevenType Dropdown */}
        <div className="w-full">
          <HoverDropdown
            options={sevenTypeOptionsData || []}
            value={sevenType ?? ''}
            onChange={value => {
              setField(filterKey, 'sevenType', value);
            }}
            placeholder={t('maps:sevenType')}
            hoverBehavior="all"
            tooltip={t('maps:select_sevenType')}
            searchable={true}
            showIcons={true}
          />
        </div>

        {/* Action Buttons */}
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
