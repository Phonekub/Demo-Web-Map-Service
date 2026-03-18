import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const useQueryMock = vi.fn();
const fetchCommonCodes = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock('../../../../services/master.service', () => ({
  fetchCommonCodes: (...args: unknown[]) => fetchCommonCodes(...args),
}));

vi.mock('../../../../components', () => ({
  Input: ({ title, children, ...props }: any) => (
    <label>
      <span>{title}</span>
      <input {...props} />
      {children}
    </label>
  ),
  Select: ({ title, options = [], placeholder, ...props }: any) => (
    <label>
      <span>{title}</span>
      <select {...props}>
        <option value="">{placeholder}</option>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

import Potential from './Potential';

describe('Potential', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCommonCodes.mockImplementation(async (code: string) => {
      if (code === 'LOCATION_TYPE') {
        return [{ value: 'LOC1', text: 'Community Mall' }];
      }

      return [{ value: 'BLD1', text: 'Commercial Building' }];
    });
    useQueryMock.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'locationType') {
        return { data: [{ value: 'LOC1', label: 'Community Mall' }] };
      }

      if (queryKey[0] === 'areaType') {
        return { data: [{ value: 'BLD1', label: 'Commercial Building' }] };
      }

      return { data: [] };
    });
  });

  // --- Status, query configuration, and derived display fields ---
  // Renders readonly status fields, configures both common-code queries, and prefers coordinate info over fallback form values.
  it('renders status fields and configures dropdown queries with derived coordinate values', async () => {
    render(
      <Potential
        poiId="POI-1"
        formData={
          {
            name: 'Potential A',
            address: 'สุขุมวิท',
            status: 'Draft',
            approveStatus: 'Pending',
            zoneCode: 'Fallback Zone',
            subZoneCode: 'Fallback Subzone',
          } as any
        }
        invalidFields={['name', 'cigaretteSale']}
        coordinateBasicInfo={{ zone: 'Zone 5', subzone: 'Subzone 2' } as any}
      />
    );

    expect(useQueryMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ queryKey: ['locationType'], enabled: true })
    );
    expect(useQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ queryKey: ['areaType'], enabled: true })
    );

    await useQueryMock.mock.calls[0][0].queryFn();
    await useQueryMock.mock.calls[1][0].queryFn();
    expect(fetchCommonCodes).toHaveBeenCalledWith('LOCATION_TYPE');
    expect(fetchCommonCodes).toHaveBeenCalledWith('BUILDING_TYPE');

    expect(screen.getByDisplayValue('Draft')).toBeDisabled();
    expect(screen.getByDisplayValue('Pending')).toBeDisabled();
    expect(screen.getByDisplayValue('Zone 5')).toBeDisabled();
    expect(screen.getByDisplayValue('Subzone 2')).toBeDisabled();
    expect(screen.getByText('potential_name_required')).toBeInTheDocument();
    expect(screen.getByText('potential_field_required')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchCommonCodes.mockRejectedValue(new Error('API Error'));

    let locationTypeFetcher: any;
    let areaTypeFetcher: any;

    useQueryMock.mockImplementation(({ queryKey, queryFn }: any) => {
      if (queryKey[0] === 'locationType') locationTypeFetcher = queryFn;
      if (queryKey[0] === 'areaType') areaTypeFetcher = queryFn;
      return { data: [] };
    });

    render(<Potential poiId="POI-1" formData={{} as any} />);

    expect(locationTypeFetcher).toBeDefined();
    expect(areaTypeFetcher).toBeDefined();

    await locationTypeFetcher();
    await areaTypeFetcher();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch locationType:',
      expect.any(Error)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch areaType:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('hides status fields when status and approveStatus are missing', () => {
    render(
      <Potential poiId="POI-1" formData={{ status: '', approveStatus: '' } as any} />
    );

    expect(screen.queryByText('potential_location_status')).not.toBeInTheDocument();
    expect(screen.queryByText('potential_approve_status')).not.toBeInTheDocument();
  });

  it('shows only status field when approveStatus is missing', () => {
    render(
      <Potential poiId="POI-1" formData={{ status: 'Draft', approveStatus: '' } as any} />
    );

    expect(screen.getByText('potential_location_status')).toBeInTheDocument();
    expect(screen.queryByText('potential_approve_status')).not.toBeInTheDocument();
  });

  it('shows only approveStatus field when status is missing', () => {
    render(
      <Potential
        poiId="POI-1"
        formData={{ status: '', approveStatus: 'Pending' } as any}
      />
    );

    expect(screen.queryByText('potential_location_status')).not.toBeInTheDocument();
    expect(screen.getByText('potential_approve_status')).toBeInTheDocument();
  });

  it('does not crash when onDataChange is undefined', () => {
    render(<Potential poiId="POI-1" formData={{ name: 'Test' } as any} />);

    fireEvent.change(screen.getByPlaceholderText('potential_name_placeholder'), {
      target: { value: 'New Name' },
    });
  });

  it('shows validation error for alcoholSale', () => {
    render(
      <Potential
        poiId="POI-1"
        formData={{ status: '', approveStatus: '' } as any}
        invalidFields={['alcoholSale']}
      />
    );

    expect(screen.getByText('potential_field_required')).toBeInTheDocument();
  });

  // --- Form updates and numeric radio values ---
  // Updates text, select, and radio-backed values and sends the correctly shaped payload to onDataChange.
  it('updates editable fields and preserves numeric yes-no values', () => {
    const onDataChange = vi.fn();

    render(
      <Potential
        poiId="POI-1"
        onDataChange={onDataChange}
        formData={
          {
            name: 'Potential A',
            address: 'สุขุมวิท',
            locationType: '',
            areaType: '',
            grade: '',
            cigaretteSale: undefined,
            alcoholSale: undefined,
            zoneCode: 'Z1',
            subZoneCode: 'SZ1',
          } as any
        }
      />
    );

    fireEvent.change(screen.getByPlaceholderText('potential_name_placeholder'), {
      target: { value: 'Potential B' },
    });
    fireEvent.change(screen.getByPlaceholderText('potential_address_placeholder'), {
      target: { value: 'New Address' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'LOC1' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[1], {
      target: { value: 'BLD1' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[2], {
      target: { value: 'A' },
    });

    // Click all radio options to cover all handlers
    fireEvent.click(screen.getAllByText('potential_yes')[0]); // Cigarette Yes
    fireEvent.click(screen.getAllByText('potential_no')[0]); // Cigarette No

    fireEvent.click(screen.getAllByText('potential_yes')[1]); // Alcohol Yes
    fireEvent.click(screen.getAllByText('potential_no')[1]); // Alcohol No

    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Potential B' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ address: 'New Address' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ locationType: 'LOC1' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ areaType: 'BLD1' })
    );
    expect(onDataChange).toHaveBeenCalledWith(expect.objectContaining({ grade: 'A' }));
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ cigaretteSale: 1 })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ cigaretteSale: 0 })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ alcoholSale: 1 })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ alcoholSale: 0 })
    );
  });
});
