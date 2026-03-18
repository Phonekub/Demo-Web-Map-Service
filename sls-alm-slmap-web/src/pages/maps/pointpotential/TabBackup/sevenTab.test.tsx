import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const fetchSevenNearby = vi.fn();
const useQueryMock = vi.fn();
const backupHeaderMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock('@/services/location.service', () => ({
  fetchSevenNearby: (...args: unknown[]) => fetchSevenNearby(...args),
}));

vi.mock('./BackupHeader', () => ({
  BackupHeader: (props: any) => {
    backupHeaderMock(props);
    return <div data-testid="backup-header">backup-header</div>;
  },
}));

import SevenTab from './sevenTab';

describe('SevenTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Query configuration and populated table ---
  // Requests nearby 7-Eleven data using the current coordinates and renders formatted table rows.
  it('configures the nearby query and renders the seven-eleven rows', async () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          branchCode: 'SEV-001',
          branchName: 'Seven Sukhumvit',
          sevenTypeName: 'Standalone',
          saleAverage: 15000,
          distance: 123.456,
          formLocNumber: 'FL-700',
        },
        {
          id: 2,
          branchCode: 'SEV-002',
          branchName: 'Seven Asoke',
          sevenTypeName: 'Plaza',
          saleAverage: null,
          distance: null,
          formLocNumber: 'FL-701',
        },
      ],
    });

    render(
      <SevenTab
        location={{ geom: { coordinates: [100.5, 13.75] } } as any}
        formLocNumber="FL-100"
        nation="TH"
        backupData={{ poiId: 'POI-9' } as any}
      />
    );

    expect(screen.getByTestId('backup-header')).toBeInTheDocument();
    expect(backupHeaderMock).toHaveBeenCalledWith(
      expect.objectContaining({ formLocNumber: 'FL-100', nation: 'TH' })
    );
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['sevenData', 'POI-9'],
        enabled: true,
      })
    );

    const queryConfig = useQueryMock.mock.calls[0][0] as any;
    await queryConfig.queryFn();
    expect(fetchSevenNearby).toHaveBeenCalledWith(13.75, 100.5, 500);

    expect(screen.getByText('SEV-001')).toBeInTheDocument();
    expect(screen.getByText('Seven Sukhumvit')).toBeInTheDocument();
    expect(screen.getByText('15,000.00')).toBeInTheDocument();
    expect(screen.getByText('123.46')).toBeInTheDocument();
    expect(screen.getByText('FL-700')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  // --- Empty state ---
  // Shows the empty-state row when there is no nearby 7-Eleven data.
  it('renders the empty table state when no seven-eleven data is available', () => {
    useQueryMock.mockReturnValue({ data: [] });

    render(<SevenTab location={null} formLocNumber="FL-100" />);

    expect(screen.getByText('ไม่มีข้อมูล 7-Eleven')).toBeInTheDocument();
  });
});
