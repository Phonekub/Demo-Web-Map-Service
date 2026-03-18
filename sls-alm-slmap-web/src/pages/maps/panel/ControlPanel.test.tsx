import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const fetchSpatialLocations = vi.fn();
const resetAll = vi.fn();

const buttonMock = vi.fn();
const searchResultMock = vi.fn();
const searchPanelMock = vi.fn();
const infoPanelMock = vi.fn();
const competitorPopupMock = vi.fn();
const createBackupProfileMock = vi.fn();

let filterStoreState = { resetAll };
let mapState: any;
let mapDrawingState: any;

// --- Child component mocks ---
// Replace nested panels with lightweight doubles so the tests can focus on ControlPanel orchestration.
vi.mock('../../../components', () => ({
  Button: ({ children, onClick, ...props }: any) => {
    buttonMock({ children, ...props });
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
}));

vi.mock('./SearchResult', () => ({
  SearchResult: (props: any) => {
    searchResultMock(props);
    return (
      <div data-testid="search-result">
        <button onClick={() => props.onLocationSelect(props.locations.data.search[0])}>
          select-first-location
        </button>
        <button onClick={props.onClose}>close-results</button>
      </div>
    );
  },
}));

vi.mock('./SearchPanel', () => ({
  SearchPanel: (props: any) => {
    searchPanelMock(props);
    return (
      <div data-testid="search-panel">
        <button
          onClick={() =>
            props.onSearchResults(
              {
                data: {
                  search: [
                    {
                      id: '101',
                      uid: 'uid-101',
                      branchCode: 'B101',
                      branchName: 'Branch 101',
                      poiId: 555,
                      geom: { coordinates: [100.5, 13.7] },
                    },
                  ],
                  poi: [{ id: 101, radius: 600 }],
                },
                total: 1,
                params: { type: 'sevenImpactCompetitor' },
              },
              true
            )
          }
        >
          emit-search-results
        </button>
        <button onClick={() => props.onEnableDrawing('polygon', 'filterTradeArea')}>
          enable-drawing
        </button>
        <button onClick={props.closeFilterPanel}>close-search-panel</button>
      </div>
    );
  },
}));

vi.mock('./InfoPanel', () => ({
  InfoPanel: (props: any) => {
    infoPanelMock(props);
    return (
      <div data-testid="info-panel">
        <span>{props.poiId}</span>
        <span>{props.uid}</span>
        <button onClick={props.onClose}>close-info-panel</button>
      </div>
    );
  },
}));

vi.mock('./CompetitorPopup', () => ({
  CompetitorPopup: (props: any) => {
    competitorPopupMock(props);
    return (
      <div data-testid="competitor-popup">
        <span>{props.uid}</span>
        <button onClick={props.onClose}>close-competitor-popup</button>
      </div>
    );
  },
}));

vi.mock('../pointpotential/CreateBackupProfile', () => ({
  CreateBackupProfile: (props: any) => {
    createBackupProfileMock(props);
    return (
      <div data-testid="create-backup-profile">
        <span>{String(props.poiId)}</span>
        <span>{props.locationName}</span>
        <button onClick={props.onCancel}>cancel-backup</button>
        <button onClick={props.onClearArea}>clear-backup-area</button>
        <button onClick={props.onSave}>save-backup</button>
      </div>
    );
  },
}));

// --- Store and service mocks ---
// Keep store-driven state deterministic and observable.
vi.mock('../../../services/location.service', () => ({
  fetchSpatialLocations: (...args: unknown[]) => fetchSpatialLocations(...args),
}));

vi.mock('@/stores', () => ({
  useFilterStore: Object.assign(
    vi.fn(() => filterStoreState),
    { getState: () => filterStoreState }
  ),
}));

vi.mock('@/stores/mapStore', () => ({
  useMapStore: Object.assign(
    (selector?: any) => {
      if (!selector) return mapState;
      return selector(mapState);
    },
    {
      getState: () => mapState,
      setState: (value: any) => {
        mapState = { ...mapState, ...value };
      },
    }
  ),
}));

vi.mock('../../../stores/useMapSelectors', () => ({
  useMapDrawing: () => mapDrawingState,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { ControlPanel } from './ControlPanel';

describe('ControlPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filterStoreState = { resetAll };
    mapState = {
      handleSearchResults: vi.fn(),
      displayPoiCircleWithStores: vi.fn(),
      setZoom: vi.fn(),
      setDrawMode: vi.fn(),
      centerOnPoint: vi.fn(),
      areaCoordinates: [],
      setSelectedUid: vi.fn(),
      selectedUid: 'initial-uid',
      createdPoiId: null,
      setCreatedPoiId: vi.fn(),
      isCreatingBackupProfile: false,
      isEditing: false,
      isCreatingArea: false,
      setIsCreatingArea: vi.fn(),
      setAreaCoordinates: vi.fn(),
      cancelCreatingArea: vi.fn(),
      setIsCreatingBackupProfile: vi.fn(),
      radiusArea: null,
      setRadiusArea: vi.fn(),
    };
    mapDrawingState = { clearAllObjectOnMap: false };
    fetchSpatialLocations.mockResolvedValue({ data: { search: [], poi: [] }, total: 0 });
  });

  // --- Filter button flow ---
  // Opens the search panel from the main filter button.
  it('opens the search panel when the filter button is clicked', async () => {
    const user = userEvent.setup();
    render(<ControlPanel locationData={null} />);

    await user.click(screen.getByRole('button', { name: 'maps:search_filter' }));

    expect(screen.getByTestId('search-panel')).toBeInTheDocument();
    expect(searchPanelMock).toHaveBeenCalled();
  });

  // --- Search result flow ---
  // Receives search results, renders the results panel, and opens the info and competitor panels on selection.
  it('shows results and opens detail panels when a location is selected', async () => {
    const user = userEvent.setup();
    render(<ControlPanel locationData={null} />);

    await user.click(screen.getByRole('button', { name: 'maps:search_filter' }));
    await user.click(screen.getByRole('button', { name: 'emit-search-results' }));

    expect(await screen.findByTestId('search-result')).toBeInTheDocument();
    expect(mapState.handleSearchResults).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'select-first-location' }));

    expect(mapState.setSelectedUid).toHaveBeenCalledWith('uid-101');
    expect(mapState.displayPoiCircleWithStores).toHaveBeenCalledWith(
      101,
      [100.5, 13.7],
      600,
      'sevenEleven',
      true
    );
    expect(await screen.findByTestId('info-panel')).toBeInTheDocument();
    expect(screen.getByTestId('competitor-popup')).toBeInTheDocument();
    expect(infoPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({ poiId: '101', uid: 'initial-uid', storeCode: 'B101' })
    );
    expect(competitorPopupMock).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'uid-101', branchCode: 'B101' })
    );
  });

  // --- Created POI flow ---
  // Opens the info panel automatically when a new POI id is pushed from the store.
  it('opens the info panel when a newly created poi id is available', async () => {
    mapState.createdPoiId = 'NEW-POI';
    render(<ControlPanel locationData={null} />);

    await waitFor(() => {
      expect(screen.getByTestId('info-panel')).toBeInTheDocument();
    });

    expect(mapState.setCreatedPoiId).toHaveBeenCalledWith(null);
    expect(infoPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({ poiId: 'NEW-POI', isUpdateForm: true })
    );
  });

  // --- Backup profile flow ---
  // Converts area coordinates for backup mode and wires the backup action callbacks.
  it('renders the backup profile panel and handles backup actions', async () => {
    const user = userEvent.setup();
    mapState.isCreatingBackupProfile = true;
    mapState.areaCoordinates = [
      { lng: 100.5, lat: 13.7 },
      { lng: 100.6, lat: 13.8 },
      { lng: 100.7, lat: 13.9 },
    ];

    render(
      <ControlPanel
        locationData={
          {
            id: '50',
            uid: 'uid-50',
            branchCode: 'B050',
            branchName: 'Branch 50',
            geom: { coordinates: [100.5, 13.7] },
          } as any
        }
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('create-backup-profile')).toBeInTheDocument();
    });

    expect(createBackupProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        poiId: '50',
        locationName: 'Branch 50',
        coordinates: [
          [100.5, 13.7],
          [100.6, 13.8],
          [100.7, 13.9],
          [100.5, 13.7],
        ],
      })
    );

    await user.click(screen.getByRole('button', { name: 'clear-backup-area' }));
    expect(mapState.setAreaCoordinates).toHaveBeenCalledWith([]);
    expect(mapState.setIsCreatingBackupProfile).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'cancel-backup' }));
    expect(mapState.cancelCreatingArea).toHaveBeenCalled();
    expect(mapState.setIsCreatingBackupProfile).toHaveBeenCalledWith(false);
  });

  // --- Clear-map effect ---
  // Resets search results and filter inputs when the drawing selector requests a full clear.
  it('resets filter inputs when clearAllObjectOnMap becomes true', () => {
    mapDrawingState = { clearAllObjectOnMap: true };

    render(<ControlPanel locationData={null} />);

    expect(resetAll).toHaveBeenCalledTimes(1);
  });
});
