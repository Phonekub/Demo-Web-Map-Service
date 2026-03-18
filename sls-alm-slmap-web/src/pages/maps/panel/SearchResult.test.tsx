import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const fetchLocations = vi.fn();
let intersectionCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | null =
  null;
const observe = vi.fn();
const disconnect = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'maps:search_results') {
        return `${key}:${options?.count}`;
      }
      return key;
    },
  }),
}));

vi.mock('../../../services/location.service', () => ({
  fetchLocations: (...args: unknown[]) => fetchLocations(...args),
}));

import { SearchResult } from './SearchResult';

function makeLocation(overrides: Partial<any> = {}) {
  return {
    id: 1,
    uid: 'uid-1',
    poiId: 11,
    branchName: 'Branch One',
    branchCode: 'B001',
    location: 'Bangkok',
    geom: { coordinates: [100.5, 13.75] },
    area: null,
    ...overrides,
  };
}

function makeLocations(overrides: Partial<any> = {}) {
  return {
    data: {
      search: [makeLocation()],
      poi: [{ id: 11 }],
    },
    total: 1,
    params: {},
    ...overrides,
  };
}

describe('SearchResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    intersectionCallback = null;
    (globalThis as any).IntersectionObserver = vi.fn(function (callback: any) {
      intersectionCallback = callback;
      return {
        observe,
        disconnect,
        unobserve: vi.fn(),
      };
    });
  });

  // --- Loading state ---
  // Shows the loading card while results are still being fetched.
  it('renders the loading state', () => {
    render(
      <SearchResult
        locations={makeLocations() as any}
        isLoading
        onLocationSelect={vi.fn()}
      />
    );

    expect(screen.getByText('maps:searching')).toBeInTheDocument();
    expect(screen.getByText('maps:searching_message')).toBeInTheDocument();
  });

  // --- Empty state ---
  // Shows an empty-state message and lets the user close the result card.
  it('renders the empty state and closes it', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <SearchResult
        locations={makeLocations({ data: { search: [], poi: [] }, total: 0 }) as any}
        onClose={onClose}
        onLocationSelect={vi.fn()}
      />
    );

    expect(screen.getByText('maps:no_results_found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'common:close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // --- Result selection and trade-area grouping ---
  // Deduplicates trade-area items by POI id and forwards location selection.
  it('groups trade-area items by poi id and selects a rendered item', async () => {
    const onLocationSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <SearchResult
        locations={
          makeLocations({
            data: {
              search: [
                makeLocation({
                  id: 1,
                  uid: 'uid-1',
                  poiId: 99,
                  branchName: 'Branch One',
                }),
                makeLocation({
                  id: 2,
                  uid: 'uid-2',
                  poiId: 99,
                  branchName: 'Branch Duplicate',
                  branchCode: 'B002',
                }),
              ],
              poi: [{ id: 99 }],
            },
            total: 2,
            params: { type: 'tradearea' },
          }) as any
        }
        onClose={vi.fn()}
        onLocationSelect={onLocationSelect}
      />
    );

    expect(screen.getByText('maps:search_results:1')).toBeInTheDocument();
    expect(screen.getByText('POI: 99')).toBeInTheDocument();
    expect(screen.queryByText('Branch Duplicate')).not.toBeInTheDocument();

    await user.click(screen.getByText('Branch One'));

    expect(onLocationSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, poiId: 99 })
    );
  });

  // --- Infinite scroll ---
  // Fetches the next page when the sentinel intersects and reports merged items upward.
  it('loads more results on intersection and reports updated items', async () => {
    const onItemsUpdate = vi.fn();
    fetchLocations.mockResolvedValue({
      data: {
        search: [
          makeLocation({
            id: 2,
            uid: 'uid-2',
            poiId: 22,
            branchName: 'Branch Two',
            branchCode: 'B002',
            location: 'Chiang Mai',
          }),
          makeLocation({
            id: 2,
            uid: 'uid-2b',
            poiId: 22,
            branchName: 'Branch Two Duplicate',
            branchCode: 'B002',
            location: 'Chiang Mai',
          }),
        ],
        poi: [{ id: 22 }, { id: 22 }],
      },
      total: 3,
    });

    render(
      <SearchResult
        locations={
          makeLocations({
            data: {
              search: [makeLocation()],
              poi: [{ id: 11 }],
            },
            total: 3,
            params: { page: 1, type: 'potential', keyword: 'abc' },
          }) as any
        }
        onLocationSelect={vi.fn()}
        onItemsUpdate={onItemsUpdate}
      />
    );

    await waitFor(() => {
      expect(observe).toHaveBeenCalled();
      expect(intersectionCallback).not.toBeNull();
    });

    await intersectionCallback?.([{ isIntersecting: true }]);

    await waitFor(() => {
      expect(fetchLocations).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        type: 'potential',
        keyword: 'abc',
      });
    });

    expect(await screen.findByText('Branch Two')).toBeInTheDocument();
    expect(onItemsUpdate).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 1 }), expect.objectContaining({ id: 2 })],
      [expect.objectContaining({ id: 11 }), expect.objectContaining({ id: 22 })],
      expect.objectContaining({ page: 2, type: 'potential', keyword: 'abc' })
    );
  });
});
