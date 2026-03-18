import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- Hoisted service mocks ---
const fetchCommonCodes = vi.fn();
const fetchProvincesByCountryId = vi.fn();
const fetchDistrictByProvinceId = vi.fn();
const fetchSubDistrictByDistrictId = vi.fn();
const fetchLocations = vi.fn();

vi.mock('@/services/master.service', () => ({
  fetchCommonCodes: (...args: unknown[]) => fetchCommonCodes(...args),
  fetchProvincesByCountryId: (...args: unknown[]) => fetchProvincesByCountryId(...args),
  fetchDistrictByProvinceId: (...args: unknown[]) => fetchDistrictByProvinceId(...args),
  fetchSubDistrictByDistrictId: (...args: unknown[]) =>
    fetchSubDistrictByDistrictId(...args),
}));

vi.mock('../../../services/location.service', () => ({
  fetchLocations: (...args: unknown[]) => fetchLocations(...args),
}));

// --- Store mock ---
const mockSetField = vi.fn();
const mockSetError = vi.fn();
const mockResetFilter = vi.fn();
let mockFilters: Record<string, any> = {};

vi.mock('@/stores', () => ({
  useFilterStore: () => ({
    filters: mockFilters,
    setField: mockSetField,
    setError: mockSetError,
    resetFilter: mockResetFilter,
  }),
}));

// --- i18n mock ---
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// --- Component mocks ---
vi.mock('../../../components', () => ({
  Input: ({ value, onChange, placeholder, type = 'text', className }: any) => (
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      aria-label={placeholder}
    />
  ),
  Button: ({ children, onClick, type }: any) => (
    <button onClick={onClick} type={type ?? 'button'}>
      {children}
    </button>
  ),
  HoverDropdown: ({ options, value, onChange, placeholder, disabled }: any) => (
    <select
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      disabled={disabled}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

import { FilterSeven } from './FilterSeven';

// --- Helpers ---
function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('FilterSeven', () => {
  let onSearchSubmit: import('vitest').Mock;
  let onClose: import('vitest').Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFilters = {};
    onSearchSubmit = vi.fn();
    onClose = vi.fn();
    fetchCommonCodes.mockImplementation((code: string) => {
      if (code === 'ALLMAP_NATION') {
        return Promise.resolve([
          { value: 'TH', text: 'Thailand' },
          { value: 'LA', text: 'Laos' },
        ]);
      }
      if (code === 'SEVEN_TYPE') {
        return Promise.resolve([
          { value: 'TYPE_A', text: 'Type A' },
          { value: 'TYPE_B', text: 'Type B' },
        ]);
      }
      return Promise.resolve([]);
    });
    fetchProvincesByCountryId.mockResolvedValue([]);
    fetchDistrictByProvinceId.mockResolvedValue([]);
    fetchSubDistrictByDistrictId.mockResolvedValue([]);
  });

  const renderComponent = () =>
    renderWithQuery(<FilterSeven onSearchSubmit={onSearchSubmit} onClose={onClose} />);

  it('renders all form inputs and action buttons', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('maps:branch_code_name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('maps:location')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('maps:radius')).toBeInTheDocument();
    expect(screen.getByLabelText('maps:country')).toBeInTheDocument();
    expect(screen.getByLabelText('maps:province')).toBeInTheDocument();
    expect(screen.getByLabelText('maps:district')).toBeInTheDocument();
    expect(screen.getByLabelText('maps:sub_district')).toBeInTheDocument();
    expect(screen.getByLabelText('maps:sevenType')).toBeInTheDocument();
    expect(screen.getByText('common:close')).toBeInTheDocument();
    expect(screen.getByText('common:clear')).toBeInTheDocument();
    expect(screen.getByText('common:search')).toBeInTheDocument();
  });

  it('fetches countries and seven types on mount', async () => {
    renderComponent();

    await waitFor(() => {
      expect(fetchCommonCodes).toHaveBeenCalledWith('ALLMAP_NATION');
      expect(fetchCommonCodes).toHaveBeenCalledWith('SEVEN_TYPE');
    });
  });

  it('shows required error when no filter field is filled on submit', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('common:search'));

    expect(mockSetError).toHaveBeenCalledWith('sevenEleven', 'maps:filter_required');
  });

  it('shows radius max error when radius exceeds 2 km', async () => {
    const user = userEvent.setup();
    mockFilters['sevenEleven'] = { text: 'BranchA', radiusUnit: 'km', radius: '3' };
    renderComponent();

    await user.click(screen.getByText('common:search'));

    expect(mockSetField).toHaveBeenCalledWith(
      'sevenEleven',
      'radiusError',
      'maps:radius_max_error'
    );
  });

  it('shows radius max error when radius exceeds 2000 m', async () => {
    const user = userEvent.setup();
    mockFilters['sevenEleven'] = {
      text: 'BranchA',
      radiusUnit: 'm',
      radius: '2500',
    };
    renderComponent();

    await user.click(screen.getByText('common:search'));

    expect(mockSetField).toHaveBeenCalledWith(
      'sevenEleven',
      'radiusError',
      'maps:radius_max_error'
    );
  });

  it('calls resetFilter when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('common:clear'));

    expect(mockResetFilter).toHaveBeenCalledWith('sevenEleven');
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('common:close'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSearchSubmit with results and onClose on successful search', async () => {
    const user = userEvent.setup();
    mockFilters['sevenEleven'] = { text: 'BranchA' };
    fetchLocations.mockResolvedValue({
      data: {
        search: [{ id: '1', name: '7-Eleven A', type: 'sevenEleven' }],
        poi: [],
      },
      total: 1,
    });
    renderComponent();

    await user.click(screen.getByText('common:search'));

    await waitFor(() => {
      expect(onSearchSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            search: [{ id: '1', name: '7-Eleven A', type: 'sevenEleven' }],
            poi: [],
          }),
          total: 1,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onSearchSubmit with empty data when search returns no results', async () => {
    const user = userEvent.setup();
    mockFilters['sevenEleven'] = { text: 'NoMatch' };
    fetchLocations.mockResolvedValue({
      data: { search: null, poi: null },
      total: 0,
    });
    renderComponent();

    await user.click(screen.getByText('common:search'));

    await waitFor(() => {
      expect(onSearchSubmit).toHaveBeenCalledWith({
        data: { search: [], poi: [] },
        total: 0,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays inputErrors from store when present', () => {
    mockFilters['sevenEleven'] = { inputErrors: 'maps:filter_required' };
    renderComponent();

    expect(screen.getByText('maps:filter_required')).toBeInTheDocument();
  });

  // --- Extended Coverage Tests ---

  it('handles radius input validation (only allows numbers)', async () => {
    const user = userEvent.setup();
    renderComponent();
    const radiusInput = screen.getByPlaceholderText('maps:radius');

    // Type number
    await user.type(radiusInput, '1');
    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'radius', '1');

    mockSetField.mockClear();

    // Type non-number
    await user.type(radiusInput, 'a');
    expect(mockSetField).not.toHaveBeenCalled();
  });

  it('triggers cascading clears when country changes', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText('Thailand')).toBeInTheDocument());
    const countrySelect = screen.getByLabelText('maps:country');

    await user.selectOptions(countrySelect, 'TH');

    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'countryCode', 'TH');
    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'provinceCode', '');
    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'districtCode', '');
    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'subDistrictCode', '');
  });

  it('fetches provinces when countryCode is present', async () => {
    mockFilters['sevenEleven'] = { countryCode: 'TH' };
    fetchProvincesByCountryId.mockResolvedValue([{ value: 'P1', text: 'Province 1' }]);
    renderComponent();

    await waitFor(() => {
      expect(fetchProvincesByCountryId).toHaveBeenCalledWith('TH');
    });
  });

  it('triggers cascading clears when province changes', async () => {
    const user = userEvent.setup();
    // Pre-select country so province is enabled
    mockFilters['sevenEleven'] = { countryCode: 'TH' };
    fetchProvincesByCountryId.mockResolvedValue([{ value: 'P1', text: 'Province 1' }]);
    renderComponent();

    await waitFor(() => expect(fetchProvincesByCountryId).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Province 1')).toBeInTheDocument());

    const provinceSelect = screen.getByLabelText('maps:province');
    await user.selectOptions(provinceSelect, 'P1');

    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'provinceCode', 'P1');
    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'districtCode', '');
    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'subDistrictCode', '');
  });

  it('fetches districts when provinceCode is present', async () => {
    mockFilters['sevenEleven'] = { countryCode: 'TH', provinceCode: 'P1' };
    fetchDistrictByProvinceId.mockResolvedValue([{ value: 'D1', text: 'District 1' }]);
    renderComponent();

    await waitFor(() => {
      expect(fetchDistrictByProvinceId).toHaveBeenCalledWith('P1');
    });
  });

  it('triggers cascading clears when district changes', async () => {
    const user = userEvent.setup();
    mockFilters['sevenEleven'] = { countryCode: 'TH', provinceCode: 'P1' };
    fetchDistrictByProvinceId.mockResolvedValue([{ value: 'D1', text: 'District 1' }]);
    renderComponent();

    await waitFor(() => expect(fetchDistrictByProvinceId).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('District 1')).toBeInTheDocument());

    const districtSelect = screen.getByLabelText('maps:district');
    await user.selectOptions(districtSelect, 'D1');

    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'districtCode', 'D1');
    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'subDistrictCode', '');
  });

  it('fetches sub-districts when districtCode is present', async () => {
    mockFilters['sevenEleven'] = {
      countryCode: 'TH',
      provinceCode: 'P1',
      districtCode: 'D1',
    };
    fetchSubDistrictByDistrictId.mockResolvedValue([
      { value: 'SD1', text: 'SubDistrict 1' },
    ]);
    renderComponent();

    await waitFor(() => {
      expect(fetchSubDistrictByDistrictId).toHaveBeenCalledWith('D1');
    });
  });

  it('handles sub-district selection', async () => {
    const user = userEvent.setup();
    mockFilters['sevenEleven'] = {
      countryCode: 'TH',
      provinceCode: 'P1',
      districtCode: 'D1',
    };
    fetchSubDistrictByDistrictId.mockResolvedValue([
      { value: 'SD1', text: 'SubDistrict 1' },
    ]);
    renderComponent();

    await waitFor(() => expect(fetchSubDistrictByDistrictId).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('SubDistrict 1')).toBeInTheDocument());

    const subDistrictSelect = screen.getByLabelText('maps:sub_district');
    await user.selectOptions(subDistrictSelect, 'SD1');

    expect(mockSetField).toHaveBeenCalledWith('sevenEleven', 'subDistrictCode', 'SD1');
  });

  it('handles fetch errors gracefully for SevenTypes', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchCommonCodes.mockImplementation(async code => {
      if (code === 'SEVEN_TYPE') throw new Error('API Error');
      return [];
    });

    renderComponent();

    await waitFor(() => {
      expect(fetchCommonCodes).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch sevenType:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('handles fetch errors gracefully for countries', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchCommonCodes.mockImplementation(async code => {
      if (code === 'ALLMAP_NATION') throw new Error('API Error');
      return [];
    });
    renderComponent();

    await waitFor(() => {
      // wait for effect
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch countries:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('handles fetch errors gracefully for provinces', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFilters['sevenEleven'] = { countryCode: 'TH' };
    fetchProvincesByCountryId.mockRejectedValue(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(fetchProvincesByCountryId).toHaveBeenCalled();
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch provinces:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('handles fetch errors gracefully for districts', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFilters['sevenEleven'] = { countryCode: 'TH', provinceCode: 'P1' };
    fetchDistrictByProvinceId.mockRejectedValue(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(fetchDistrictByProvinceId).toHaveBeenCalled();
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch provinces:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('handles fetch errors gracefully for sub-districts', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFilters['sevenEleven'] = {
      countryCode: 'TH',
      provinceCode: 'P1',
      districtCode: 'D1',
    };
    fetchSubDistrictByDistrictId.mockRejectedValue(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(fetchSubDistrictByDistrictId).toHaveBeenCalled();
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch provinces:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('handles search API failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    mockFilters['sevenEleven'] = { text: 'Fail' };
    fetchLocations.mockRejectedValue(new Error('Search Error'));

    renderComponent();
    await user.click(screen.getByText('common:search'));

    await waitFor(() => {
      expect(onSearchSubmit).toHaveBeenCalledWith({
        data: { search: [], poi: [] },
        total: 0,
      });
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
