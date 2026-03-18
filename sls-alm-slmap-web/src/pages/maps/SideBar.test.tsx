import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

let latestSearchPanelProps: any;
let latestSearchResultProps: any;

vi.mock('./panel/SearchPanel', () => ({
  SearchPanel: (props: any) => {
    latestSearchPanelProps = props;
    return (
      <div data-testid="search-panel">
        <button
          onClick={() =>
            props.onSearchResults({
              data: {
                search: [{ id: 1, branchName: 'Branch One' }],
                poi: [{ id: 11 }],
              },
              total: 1,
            })
          }
        >
          emit-results
        </button>
        <button onClick={() => props.onSearchResults(null)}>emit-null</button>
      </div>
    );
  },
}));

vi.mock('./panel/SearchResult', () => ({
  SearchResult: (props: any) => {
    latestSearchResultProps = props;
    return (
      <div data-testid="search-result">
        <span>search-count:{props.locations.data.search.length}</span>
        <span>poi-count:{props.locations.data.poi.length}</span>
        <span>total:{props.locations.total}</span>
        <span>loading:{String(props.isLoading)}</span>
      </div>
    );
  },
}));

import { SideBar } from './SideBar';

describe('SideBar', () => {
  beforeEach(() => {
    latestSearchPanelProps = undefined;
    latestSearchResultProps = undefined;
  });

  // --- Initial render ---
  // Renders the search shell with an empty result set and the fixed child props.
  it('renders SearchPanel and passes the initial empty results into SearchResult', () => {
    render(<SideBar />);

    expect(screen.getByTestId('search-panel')).toBeInTheDocument();
    expect(screen.getByTestId('search-result')).toBeInTheDocument();
    expect(screen.getByText('search-count:0')).toBeInTheDocument();
    expect(screen.getByText('poi-count:0')).toBeInTheDocument();
    expect(screen.getByText('total:0')).toBeInTheDocument();
    expect(screen.getByText('loading:false')).toBeInTheDocument();
    expect(typeof latestSearchResultProps.onLocationSelect).toBe('function');
    expect(typeof latestSearchPanelProps.closeFilterPanel).toBe('function');
  });

  // --- Search result handoff ---
  // Stores a non-null SearchPanel payload and forwards it to SearchResult.
  it('updates the rendered result payload when SearchPanel reports search results', async () => {
    const user = userEvent.setup();

    render(<SideBar />);

    await user.click(screen.getByRole('button', { name: 'emit-results' }));

    expect(screen.getByText('search-count:1')).toBeInTheDocument();
    expect(screen.getByText('poi-count:1')).toBeInTheDocument();
    expect(screen.getByText('total:1')).toBeInTheDocument();
  });

  // --- Null result handling ---
  // Ignores null callbacks from SearchPanel and keeps the current result state intact.
  it('ignores null search results and preserves the previous state', async () => {
    const user = userEvent.setup();

    render(<SideBar />);

    await user.click(screen.getByRole('button', { name: 'emit-results' }));
    await user.click(screen.getByRole('button', { name: 'emit-null' }));

    expect(screen.getByText('search-count:1')).toBeInTheDocument();
    expect(screen.getByText('poi-count:1')).toBeInTheDocument();
    expect(screen.getByText('total:1')).toBeInTheDocument();
  });
});
