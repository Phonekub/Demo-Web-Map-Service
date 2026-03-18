import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const fetchCommonCodes = vi.fn();
const fetchLocationById = vi.fn();
const centerOnPoint = vi.fn();
const setSelectedUid = vi.fn();
const setBackupMarkPoint = vi.fn();
const addPolygonLayer = vi.fn();
const removePolygonLayer = vi.fn();
const setMainProfile = vi.fn();
const setSubProfile = vi.fn();
const backupHeaderMock = vi.fn();
const hoverDropdownMock = vi.fn();

let backupProfileStoreState: any;
let mapStoreState: any;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => options?.defaultValue ?? key,
  }),
}));

vi.mock('@/services/master.service', () => ({
  fetchCommonCodes: (...args: unknown[]) => fetchCommonCodes(...args),
}));

vi.mock('@/services/location.service', () => ({
  fetchLocationById: (...args: unknown[]) => fetchLocationById(...args),
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
        data-testid={`dropdown-${props.value || 'empty'}-${props.disabled ? 'disabled' : 'enabled'}`}
        onClick={() => props.onChange?.('changed-value')}
        disabled={props.disabled}
      >
        {String(props.value || 'empty')}
      </button>
    );
  },
}));

vi.mock('@/stores/backupProfileStore', () => ({
  useBackupProfileStore: (selector?: any) =>
    selector ? selector(backupProfileStoreState) : backupProfileStoreState,
}));

vi.mock('@/stores/useMapSelectors', () => ({
  useMapViewport: () => ({ centerOnPoint }),
}));

vi.mock('@/stores/mapStore', () => ({
  useMapStore: (selector?: any) => (selector ? selector(mapStoreState) : mapStoreState),
}));

import BackupTab, { calculateProfilesFromPois } from './BackupTab';

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('BackupTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCommonCodes.mockResolvedValue([
      { value: '1', text: 'Tier 1' },
      { value: '2', text: 'Tier 2' },
    ]);
    fetchLocationById.mockResolvedValue({
      data: {
        uid: 'uid-200',
        geom: { coordinates: [100.55, 13.77] },
      },
    });
    backupProfileStoreState = {
      shape: { coordinates: [{ lat: 13.75, lng: 100.5 }] },
      mainProfile: '1',
      subProfile: '2',
      profiles: [
        { profileLayerId: 1, profileLayerName: 'Tier 1' },
        { profileLayerId: 2, profileLayerName: 'Tier 2' },
      ],
      profilePois: [
        {
          id: 11,
          poiId: 200,
          profileLayerId: 1,
          poiNamt: 'POI A',
          populationAmount: 100,
          customerAmount: 40,
          distance: '1 km',
        },
        {
          id: 12,
          poiId: 201,
          profileLayerId: 1,
          poiNamt: 'POI B',
          populationAmount: 200,
          customerAmount: 60,
          distance: '2 km',
        },
        {
          id: 13,
          poiId: 202,
          profileLayerId: 2,
          poiNamt: 'POI C',
          populationAmount: 300,
          customerAmount: 80,
          distance: '3 km',
        },
      ],
      setMainProfile,
      setSubProfile,
    };
    mapStoreState = {
      setSelectedUid,
      setBackupMarkPoint,
      addPolygonLayer,
      removePolygonLayer,
    };
  });

  // --- Profile utility ---
  // Groups POIs by profile layer and calculates percentages from the total count.
  it('calculates layer counts and percentages from profile pois', () => {
    const result = calculateProfilesFromPois([
      { profileLayerId: 1 },
      { profileLayerId: 1 },
      { profileLayerId: 2 },
      { profileLayerId: 0 },
    ]);

    expect(result.totalPois).toBe(3);
    expect(result.countByLayer.get(1)).toBe(2);
    expect(result.countByLayer.get(2)).toBe(1);
    expect(result.percentByLayer.get(1)).toBe('66.67');
    expect(result.percentByLayer.get(2)).toBe('33.33');
  });

  // --- Table rendering and dropdown wiring ---
  // Loads profile options, renders grouped summary rows, and wires the subprofile dropdown back to the store.
  it('renders grouped backup rows and updates the subprofile selection', async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <BackupTab
        location={{ branchName: 'Branch 101' } as any}
        poiId="101"
        formLocNumber="FL-1"
      />
    );

    expect(await screen.findByTestId('backup-header')).toBeInTheDocument();
    expect(fetchCommonCodes).toHaveBeenCalledWith('LAYER_LSM');
    expect(screen.getByText('Tier 1')).toBeInTheDocument();
    expect(screen.getByText('Tier 2')).toBeInTheDocument();
    expect(screen.getByText('66.67%')).toBeInTheDocument();
    expect(screen.getByText('33.33%')).toBeInTheDocument();
    expect(screen.getByText('POI A')).toBeInTheDocument();
    expect(screen.getAllByText('300').length).toBeGreaterThan(0);

    const enabledDropdown = screen.getByTestId('dropdown-2-enabled');
    await user.click(enabledDropdown);

    expect(setSubProfile).toHaveBeenCalledWith('changed-value');
  });

  // --- Table visibility and empty state ---
  // Toggles the backup table visibility and shows the empty-state row when no data exists.
  it('toggles the backup table and shows the no-data row when there are no rows', async () => {
    const user = userEvent.setup();
    backupProfileStoreState = {
      ...backupProfileStoreState,
      profiles: [],
      profilePois: [],
    };

    renderWithQuery(<BackupTab location={null} poiId="101" />);

    expect(await screen.findByText('backup:noData')).toBeInTheDocument();
    await user.click(screen.getByText('backup:hide'));
    expect(screen.queryByText('backup:noData')).not.toBeInTheDocument();
    await user.click(screen.getByText('backup:show'));
    expect(screen.getByText('backup:noData')).toBeInTheDocument();
  });

  // --- POI navigation and polygon lifecycle ---
  // Adds the backup polygon layer, navigates to a POI, and cleans map state up on unmount.
  it('adds polygon shape, navigates to a poi, and cleans up on unmount', async () => {
    const user = userEvent.setup();

    const { unmount } = renderWithQuery(
      <BackupTab location={null} poiId="101" nation="TH" />
    );

    expect(addPolygonLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'backup-profile-shape', name: 'Backup Profile Area' })
    );

    await user.click(await screen.findByText('POI A'));

    await waitFor(() => {
      expect(fetchLocationById).toHaveBeenCalledWith(200);
      expect(centerOnPoint).toHaveBeenCalledWith(
        [100.55, 13.77],
        window.innerWidth,
        true
      );
    });
    expect(setBackupMarkPoint).toHaveBeenCalledWith({
      longitude: 100.55,
      latitude: 13.77,
    });
    expect(setSelectedUid).toHaveBeenCalledWith('uid-200');

    unmount();

    expect(removePolygonLayer).toHaveBeenCalledWith('backup-profile-shape');
    expect(setBackupMarkPoint).toHaveBeenCalledWith(null);
  });
});
