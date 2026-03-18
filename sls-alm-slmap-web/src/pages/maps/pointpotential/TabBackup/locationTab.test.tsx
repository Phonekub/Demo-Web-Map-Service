import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const fetchRentalLocation = vi.fn();
const useQueryMock = vi.fn();
const backupHeaderMock = vi.fn();
const hoverDropdownMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock('@/services/backup.service', () => ({
  fetchRentalLocation: (...args: unknown[]) => fetchRentalLocation(...args),
}));

vi.mock('./BackupHeader', () => ({
  BackupHeader: (props: any) => {
    backupHeaderMock(props);
    return <div data-testid="backup-header">backup-header</div>;
  },
}));

vi.mock('@/components/base/HoverDropdown', () => ({
  HoverDropdown: (props: any) => {
    hoverDropdownMock(props);
    return (
      <button
        data-testid={`dropdown-${props.value}`}
        onClick={() => props.onChange?.(props.value === '1' ? '2' : '1')}
      >
        {props.value}
      </button>
    );
  },
}));

import LocationTab from './locationTab';

describe('locationTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockReturnValue({
      data: {
        locTarget: 'สุขุมวิท',
        deedNumber: 'D-100',
        deedPropNo: 'P-200',
        deedFrontSurvey: 'FS-9',
        addrNo: '12/1',
        addrMoo: '5',
        addrSoi: 'สุขุมวิท 10',
        addrRoad: 'สุขุมวิท',
        addrSubDistrict: 'คลองเตย',
        districtName: 'คลองเตย',
        provinceName: 'กรุงเทพ',
        addrPostCode: '10110',
        oldBusiness: 'Mini mart',
        isBuilding: '1',
        bldFloor: '3',
        bldWidth: '8',
        bldDepth: '20',
        bldTotalArea: '160',
        bldBack: '1',
        bldBackWidth: '6',
        bldBackDepth: '10',
        isLand: '1',
        landWidth: '12',
        landDepth: '30',
      },
    });
  });

  // --- Query configuration and location tab ---
  // Requests rental data for the current form number and renders the location fields.
  it('configures the rental query and renders location details', async () => {
    render(
      <LocationTab
        location={{ branchName: 'Branch 101' } as any}
        formLocNumber="FL-100"
        nation="TH"
      />
    );

    expect(screen.getByTestId('backup-header')).toBeInTheDocument();
    expect(backupHeaderMock).toHaveBeenCalledWith(
      expect.objectContaining({ formLocNumber: 'FL-100', nation: 'TH' })
    );
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rentalLocation', 'FL-100'],
        enabled: true,
      })
    );

    const queryConfig = useQueryMock.mock.calls[0][0] as any;
    await queryConfig.queryFn();
    expect(fetchRentalLocation).toHaveBeenCalledWith('FL-100');

    expect(screen.getAllByDisplayValue('สุขุมวิท').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('D-100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10110')).toBeInTheDocument();
  });

  // --- Feature tab content ---
  // Switches to the feature tab and renders building, back-building, and land sections from query data.
  it('switches to the feature tab and shows the feature fields', async () => {
    const user = userEvent.setup();

    render(
      <LocationTab
        location={{ branchName: 'Branch 101' } as any}
        formLocNumber="FL-100"
      />
    );

    await user.click(screen.getByRole('button', { name: 'backup:feature' }));

    expect(
      screen.getByRole('checkbox', { name: 'backup:buildingFeature' })
    ).toBeChecked();
    expect(screen.getAllByDisplayValue('160').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('checkbox', { name: 'backup:have' })).toHaveLength(2);
    screen
      .getAllByRole('checkbox', { name: 'backup:have' })
      .forEach(checkbox => expect(checkbox).toBeChecked());
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  // --- Area unit dropdowns ---
  // Updates local area-unit state for both building sections through the dropdown callbacks.
  it('updates building area unit dropdown state in the feature tab', async () => {
    const user = userEvent.setup();

    render(<LocationTab location={null} formLocNumber="FL-100" />);

    await user.click(screen.getByRole('button', { name: 'backup:feature' }));
    const dropdowns = screen.getAllByTestId('dropdown-1');

    await user.click(dropdowns[0]);
    expect(screen.getByTestId('dropdown-2')).toBeInTheDocument();

    await user.click(dropdowns[1]);
    expect(screen.getAllByTestId('dropdown-2').length).toBeGreaterThan(0);
  });
});
