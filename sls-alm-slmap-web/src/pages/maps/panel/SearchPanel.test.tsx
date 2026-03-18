import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Hoist helper functions and mocks
const { createFilterComponent, mockStore, mockConsole } = vi.hoisted(() => {
  const mockSearchResults = {
    data: {
      search: [{ id: 1, branchName: 'Search Result' }],
      poi: [],
    },
    total: 1,
  };

  return {
    createFilterComponent: (testId: string) => {
      return function MockFilter(props: any) {
        return (
          <div data-testid={testId}>
            <span>{JSON.stringify(props.areaCoordinates)}</span>
            <button onClick={() => props.onSearchSubmit(mockSearchResults)}>
              emit-search
            </button>
            <button onClick={props.onClose}>close-filter</button>
          </div>
        );
      };
    },
    mockStore: {
      setLastFilter: vi.fn(),
      setError: vi.fn(),
      resetFilter: vi.fn(),
      setIsSevenElevenFilter: vi.fn(),
      setAreaCoordinates: vi.fn(),
      setPolygonLayers: vi.fn(),
      setPointLayers: vi.fn(),
      setDrawMode: vi.fn(),
    },
    mockConsole: vi.fn(),
  };
});

// State containers for mutable test state
const stateContainer = vi.hoisted(() => ({
  filterStoreState: {} as any,
  mapStoreState: {} as any,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

vi.mock('../../../components', () => ({
  Button: ({ children, onClick, icon, ...props }: any) => {
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
}));

vi.mock('../../../components/base/Card', () => ({
  __esModule: true,
  default: ({ children }: any) => {
    return <div>{children}</div>;
  },
}));

vi.mock('@/stores', () => ({
  useFilterStore: () => stateContainer.filterStoreState,
}));

vi.mock('@/stores/mapStore', () => ({
  useMapStore: Object.assign(() => stateContainer.mapStoreState, {
    getState: () => stateContainer.mapStoreState,
  }),
}));

vi.mock('../filter/FilterSeven', () => ({
  FilterSeven: createFilterComponent('filter-seven'),
}));

vi.mock('../filter/FilterCompetitor', () => ({
  FilterCompetitor: createFilterComponent('filter-competitor'),
}));

vi.mock('../filter/FilterPotential', () => ({
  FilterPotential: createFilterComponent('filter-potential'),
}));

vi.mock('../filter/FilterStation', () => ({
  FilterStation: createFilterComponent('filter-stationary'),
}));

vi.mock('../filter/FilterPermanentClosed', () => ({
  FilterPermanentClosed: createFilterComponent('filter-permanent-closed'),
}));

vi.mock('../filter/FilterTrainRoute', () => ({
  FilterTrainRoute: createFilterComponent('filter-train-route'),
}));

vi.mock('../filter/FilterCompetitorAnalysis', () => ({
  FilterCompetitorAnalysis: createFilterComponent('filter-competitor-analysis'),
}));

vi.mock('../filter/FilterTradeArea', () => ({
  FilterTradeArea: createFilterComponent('filter-trade-area'),
}));

import { SearchPanel } from './SearchPanel';

describe('SearchPanel', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(mockConsole);

    stateContainer.filterStoreState = {
      lastFilterIndex: 0,
      setLastFilter: mockStore.setLastFilter,
      setError: mockStore.setError,
      resetFilter: mockStore.resetFilter,
      setIsSevenElevenFilter: mockStore.setIsSevenElevenFilter,
    };
    stateContainer.mapStoreState = {
      areaCoordinates: [
        { lat: 13.75, lng: 100.5 },
        { lat: 13.76, lng: 100.51 },
      ],
      setAreaCoordinates: mockStore.setAreaCoordinates,
      setPolygonLayers: mockStore.setPolygonLayers,
      setPointLayers: mockStore.setPointLayers,
      setDrawMode: mockStore.setDrawMode,
    };
  });

  afterAll(() => {
    consoleLogSpy?.mockRestore();
  });

  // --- Initial filter load ---
  // Loads the last used filter component on mount and passes current map coordinates down.
  it('loads the initial filter from the store and passes area coordinates', async () => {
    render(<SearchPanel onSearchResults={vi.fn()} closeFilterPanel={vi.fn()} />);

    expect(await screen.findByTestId('filter-seven')).toBeInTheDocument();
    expect(
      screen.getByText(JSON.stringify(stateContainer.mapStoreState.areaCoordinates))
    ).toBeInTheDocument();
  });

  // --- Search result forwarding ---
  // Forwards submitted search results from the active filter to the parent callback.
  it('forwards search results from the active filter', async () => {
    const onSearchResults = vi.fn();
    const user = userEvent.setup();

    render(<SearchPanel onSearchResults={onSearchResults} closeFilterPanel={vi.fn()} />);

    const emitBtn = await screen.findByText('emit-search');
    await user.click(emitBtn);

    expect(onSearchResults).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          search: [{ id: 1, branchName: 'Search Result' }],
          poi: [],
        },
        total: 1,
      }),
      true
    );
  });

  // --- Filter switching ---
  // Clears persisted map state, resets the next filter, and toggles the seven-eleven flag.
  it('switches filters and resets related store state', async () => {
    const user = userEvent.setup();

    render(<SearchPanel onSearchResults={vi.fn()} closeFilterPanel={vi.fn()} />);

    await screen.findByTestId('filter-seven');
    const compBtn = screen.getByRole('button', { name: 'maps:filter_competitor' });
    await user.click(compBtn);

    expect(mockStore.setAreaCoordinates).toHaveBeenCalledWith([]);
    expect(mockStore.setPolygonLayers).toHaveBeenCalledWith([]);
    expect(mockStore.setPointLayers).toHaveBeenCalledWith([]);
    expect(mockStore.setDrawMode).toHaveBeenCalledWith(null);
    expect(mockStore.setError).toHaveBeenCalledWith('filterCompetitor', '');
    expect(mockStore.resetFilter).toHaveBeenCalledWith('filterCompetitor');
    expect(mockStore.setLastFilter).toHaveBeenCalledWith(1);
    expect(mockStore.setIsSevenElevenFilter).toHaveBeenCalledWith(false);
    expect(compBtn).toHaveClass('btn-active');
  });

  // --- Shape selection flow ---
  // Opens the shape selector and reports the chosen shape with the active filter key.
  it('opens the shape selector and enables drawing for the active filter', async () => {
    const onEnableDrawing = vi.fn();
    const user = userEvent.setup();

    render(
      <SearchPanel
        onSearchResults={vi.fn()}
        closeFilterPanel={vi.fn()}
        onEnableDrawing={onEnableDrawing}
      />
    );

    await screen.findByTestId('filter-seven');
    await user.click(screen.getByRole('button', { name: 'maps:search_by_area' }));
    await user.click(screen.getByRole('button', { name: 'วงกลม' }));

    expect(onEnableDrawing).toHaveBeenCalledWith('circle', 'sevenEleven');
    expect(mockStore.resetFilter).toHaveBeenCalledWith('sevenEleven');

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'วงกลม' })).not.toBeInTheDocument();
    });
  });
});
