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

// --- Service module mocks ---
vi.mock('@/services/master.service', () => ({
  fetchCommonCodes: (...args: unknown[]) => fetchCommonCodes(...args),
  fetchProvincesByCountryId: (...args: unknown[]) => fetchProvincesByCountryId(...args),
  fetchDistrictByProvinceId: (...args: unknown[]) => fetchDistrictByProvinceId(...args),
  fetchSubDistrictByDistrictId: (...args: unknown[]) =>
    fetchSubDistrictByDistrictId(...args),
}));

vi.mock('@/services/location.service', () => ({
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

import { FilterTradeArea } from './FilterTradeArea';

// --- Helpers ---
function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('FilterTradeArea', () => {
  let onSearchSubmit: import('vitest').Mock;
  let onClose: import('vitest').Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFilters = {};
    onSearchSubmit = vi.fn();
    onClose = vi.fn();

    fetchCommonCodes.mockImplementation((code: string) => {
      if (code === 'ALLMAP_NATION')
        return Promise.resolve([{ value: 'TH', text: 'Thailand' }]);
      if (code === 'TRADEAREA_STATUS')
        return Promise.resolve([{ value: 'Active', text: 'Active' }]);
      if (code === 'TRADEAREA_APPROVAL_TYPE')
        return Promise.resolve([{ value: 'App1', text: 'Approval 1' }]);
      if (code === 'TRADEAREA_TYPE')
        return Promise.resolve([{ value: 'Type1', text: 'Type 1' }]);
      return Promise.resolve([]);
    });

    fetchProvincesByCountryId.mockResolvedValue([]);
    fetchDistrictByProvinceId.mockResolvedValue([]);
    fetchSubDistrictByDistrictId.mockResolvedValue([]);
  });

  const renderComponent = () =>
    renderWithQuery(
      <FilterTradeArea onSearchSubmit={onSearchSubmit} onClose={onClose} />
    );

  it('renders all form inputs and action buttons', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('maps:tradearea_code_name')).toBeInTheDocument();
    expect(screen.getByText('maps:tradearea_type')).toBeInTheDocument();
    expect(screen.getByText('maps:tradearea_search_status')).toBeInTheDocument();
    expect(screen.getByText('maps:tradearea_approval_type')).toBeInTheDocument();
    expect(screen.getByText('maps:country')).toBeInTheDocument();
    expect(screen.getByText('maps:province')).toBeInTheDocument();
    expect(screen.getByText('maps:district')).toBeInTheDocument();
    expect(screen.getByText('maps:sub_district')).toBeInTheDocument();

    expect(screen.getByText('common:close')).toBeInTheDocument();
    expect(screen.getByText('common:clear')).toBeInTheDocument();
    expect(screen.getByText('common:search')).toBeInTheDocument();
  });

  it('fetches initial dropdown data on mount', async () => {
    renderComponent();

    await waitFor(() => {
      expect(fetchCommonCodes).toHaveBeenCalledWith('ALLMAP_NATION');
      expect(fetchCommonCodes).toHaveBeenCalledWith('TRADEAREA_STATUS');
      expect(fetchCommonCodes).toHaveBeenCalledWith('TRADEAREA_APPROVAL_TYPE');
      expect(fetchCommonCodes).toHaveBeenCalledWith('TRADEAREA_TYPE');
    });
  });

  it('shows required error when no filter field is filled on submit', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('common:search'));

    expect(mockSetError).toHaveBeenCalledWith('filterTradeArea', 'maps:filter_required');
  });

  it('calls resetFilter when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('common:clear'));

    expect(mockResetFilter).toHaveBeenCalledWith('filterTradeArea');
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('common:close'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSearchSubmit with results and onClose on successful search', async () => {
    const user = userEvent.setup();
    mockFilters['filterTradeArea'] = { text: 'Area1' };
    fetchLocations.mockResolvedValue({
      data: { search: [{ id: '1', name: 'Area 1' }], poi: [] },
      total: 1,
    });

    renderComponent();
    await user.click(screen.getByText('common:search'));

    await waitFor(() => {
      expect(fetchLocations).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tradearea',
          text: 'Area1',
        })
      );

      expect(onSearchSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { search: [{ id: '1', name: 'Area 1' }], poi: [] },
          total: 1,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onSearchSubmit with empty data when search returns null/undefined data', async () => {
    const user = userEvent.setup();
    mockFilters['filterTradeArea'] = { text: 'EmptyResult' };
    // Simulate API returning valid structure but empty or undefined data payload logic
    // The component checks if (locations).
    // If fetchLocations returns null/undefined entirely:
    fetchLocations.mockResolvedValue(null);

    renderComponent();
    await user.click(screen.getByText('common:search'));

    await waitFor(() => {
      // Based on the code: if (locations) ... else ...
      // If result.data is null/undefined
      expect(onSearchSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { search: [], poi: [] },
          total: 0,
        })
      );
    });
  });

  it('calls onSearchSubmit with empty data when search fails', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFilters['filterTradeArea'] = { text: 'Fail' };
    fetchLocations.mockRejectedValue(new Error('Search failed'));

    renderComponent();
    await user.click(screen.getByText('common:search'));

    await waitFor(() => {
      expect(onSearchSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { search: [], poi: [] },
          total: 0,
        })
      );
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('displays inputErrors from store when present', () => {
    mockFilters['filterTradeArea'] = { inputErrors: 'maps:filter_required' };
    renderComponent();
    expect(screen.getByText('maps:filter_required')).toBeInTheDocument();
  });

  // --- Extended Coverage Tests ---

  it('triggers cascading clears when country changes', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText('Thailand')).toBeInTheDocument());
    const countrySelect = screen.getByLabelText('maps:country');

    await user.selectOptions(countrySelect, 'TH');

    expect(mockSetField).toHaveBeenCalledWith('filterTradeArea', 'countryCode', 'TH');
    expect(mockSetField).toHaveBeenCalledWith('filterTradeArea', 'provinceCode', '');
    expect(mockSetField).toHaveBeenCalledWith('filterTradeArea', 'districtCode', '');
    expect(mockSetField).toHaveBeenCalledWith('filterTradeArea', 'subDistrictCode', '');
  });

  it('fetches provinces when countryCode is present', async () => {
    mockFilters['filterTradeArea'] = { countryCode: 'TH' };
    fetchProvincesByCountryId.mockResolvedValue([{ value: 'P1', text: 'Province 1' }]);
    renderComponent();

    await waitFor(() => {
      expect(fetchProvincesByCountryId).toHaveBeenCalledWith('TH');
    });
  });

  it('triggers cascading clears when province changes', async () => {
    const user = userEvent.setup();
    mockFilters['filterTradeArea'] = { countryCode: 'TH' };
    fetchProvincesByCountryId.mockResolvedValue([{ value: 'P1', text: 'Province 1' }]);
    renderComponent();

    await waitFor(() => expect(fetchProvincesByCountryId).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Province 1')).toBeInTheDocument());

    const select = screen.getByLabelText('maps:province');
    await user.selectOptions(select, 'P1');

    expect(mockSetField).toHaveBeenCalledWith('filterTradeArea', 'provinceCode', 'P1');
    expect(mockSetField).toHaveBeenCalledWith('filterTradeArea', 'districtCode', '');
    expect(mockSetField).toHaveBeenCalledWith('filterTradeArea', 'subDistrictCode', '');
  });

  it('fetches districts when provinceCode is present', async () => {
    mockFilters['filterTradeArea'] = { countryCode: 'TH', provinceCode: 'P1' };
    fetchDistrictByProvinceId.mockResolvedValue([{ value: 'D1', text: 'District 1' }]);
    renderComponent();

    await waitFor(() => {
      expect(fetchDistrictByProvinceId).toHaveBeenCalledWith('P1');
    });
  });

  it('triggers cascading clears when district changes', async () => {
    const user = userEvent.setup();
    mockFilters['filterTradeArea'] = { countryCode: 'TH', provinceCode: 'P1' };
    fetchDistrictByProvinceId.mockResolvedValue([{ value: 'D1', text: 'District 1' }]);
    renderComponent();

    await waitFor(() => expect(fetchDistrictByProvinceId).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('District 1')).toBeInTheDocument());

    const select = screen.getByLabelText('maps:district');
    await user.selectOptions(select, 'D1');

    expect(mockSetField).toHaveBeenCalledWith('filterTradeArea', 'districtCode', 'D1');
    expect(mockSetField).toHaveBeenCalledWith('filterTradeArea', 'subDistrictCode', '');
  });

  it('fetches sub-districts when districtCode is present', async () => {
    mockFilters['filterTradeArea'] = {
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
    mockFilters['filterTradeArea'] = {
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

    const select = screen.getByLabelText('maps:sub_district');
    await user.selectOptions(select, 'SD1');

    expect(mockSetField).toHaveBeenCalledWith(
      'filterTradeArea',
      'subDistrictCode',
      'SD1'
    );
  });

  it('handles tradeAreaType fetch failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchCommonCodes.mockImplementation(async code => {
      if (code === 'TRADEAREA_TYPE') throw new Error('API Error');
      return [];
    });

    renderComponent();

    await waitFor(() => {
      expect(fetchCommonCodes).toHaveBeenCalledWith('TRADEAREA_TYPE');
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
