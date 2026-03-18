import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Hoist mocks to avoid reference errors
const serviceMocks = vi.hoisted(() => ({
  fetchCompetitorNearby: vi.fn(),
  fetchEntertainmentNearby: vi.fn(),
  fetchCommonCodes: vi.fn(),
  useQueryMock: vi.fn(),
}));

const storeMocks = vi.hoisted(() => ({
  syncStreetFoodFromApi: vi.fn(),
}));

// Mutable state container
const stateContainer = vi.hoisted(() => ({
  backupProfileStoreState: {} as any,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => serviceMocks.useQueryMock(...args),
}));

vi.mock('@/services/location.service', () => ({
  fetchCompetitorNearby: (...args: unknown[]) =>
    serviceMocks.fetchCompetitorNearby(...args),
  fetchEntertainmentNearby: (...args: unknown[]) =>
    serviceMocks.fetchEntertainmentNearby(...args),
}));

vi.mock('@/services/master.service', () => ({
  fetchCommonCodes: (...args: unknown[]) => serviceMocks.fetchCommonCodes(...args),
}));

vi.mock('@/stores/backupProfileStore', () => ({
  useBackupProfileStore: () => stateContainer.backupProfileStoreState,
}));

vi.mock('./BackupHeader', () => ({
  BackupHeader: () => {
    return <div data-testid="backup-header">backup-header</div>;
  },
}));

import CompetitorTab from './competitorTab';

describe('CompetitorTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stateContainer.backupProfileStoreState = {
      streetFood: ['A'],
      syncStreetFoodFromApi: storeMocks.syncStreetFoodFromApi,
    };

    const streetFoodData = {
      data: [
        { id: 'A', category: 'Noodle Cart' },
        { id: 'B', category: 'Drink Stall' },
      ],
      isLoading: false,
    };

    const competitors500mData = {
      data: [
        {
          id: 1,
          branchName: 'Comp A',
          competitorTypeName: 'Cafe',
          openTime: '08:00',
          closeTime: '18:00',
          saleAverage: 1200,
          grade: 'A',
          distance: 100.12,
        },
        {
          id: 2,
          branchName: 'Comp B',
          competitorTypeName: 'Cafe',
          openTime: null,
          closeTime: null,
          saleAverage: null,
          grade: null,
          distance: 250.34,
        },
      ],
      isLoading: false,
    };

    const competitors50mData = {
      data: [
        {
          id: 3,
          branchName: 'Near Shop',
          competitorTypeName: 'Convenience',
          distance: 25.5,
        },
      ],
      isLoading: false,
    };

    const entertainmentData = {
      data: [{ id: 4, branchName: 'Chain A', distance: 80.75 }],
      isLoading: false,
    };

    // State to track identical query keys in a render pass
    let competitorDataCallCount = 0;

    serviceMocks.useQueryMock.mockImplementation((args: any) => {
      const key = args?.queryKey?.[0];

      // 1. commonCodes (First call in component)
      if (key === 'commonCodes') {
        competitorDataCallCount = 0; // Reset counter for new render pass
        return streetFoodData;
      }

      // 4. entertainmentData
      if (key === 'entertainmentData') {
        return entertainmentData;
      }

      // 2 & 3. competitorData (Called twice: 500m then 50m)
      if (key === 'competitorData') {
        competitorDataCallCount++;
        if (competitorDataCallCount === 1) {
          return competitors500mData; // First call is 500m
        }
        if (competitorDataCallCount === 2) {
          return competitors50mData; // Second call is 50m
        }
      }

      return { data: undefined, isLoading: false };
    });
  });

  // --- 500m summary and tables ---
  it('renders the 500m competitor summary and tables', () => {
    render(
      <CompetitorTab
        location={{ geom: { coordinates: [100.5, 13.75] } } as any}
        formLocNumber="FL-1"
      />
    );

    expect(screen.getByTestId('backup-header')).toBeInTheDocument();
    expect(screen.getByText('Cafe 2 จุด')).toBeInTheDocument();
    expect(screen.getByText('Comp A')).toBeInTheDocument();
    expect(screen.getByText('08:00 - 18:00')).toBeInTheDocument();
    expect(screen.getByText('1,200.00')).toBeInTheDocument();
    expect(screen.getByText('Chain A')).toBeInTheDocument();
  });

  // --- Section switching ---
  it('switches to the 50m section and shows the nearby store rows', async () => {
    const user = userEvent.setup();

    render(
      <CompetitorTab
        location={{ geom: { coordinates: [100.5, 13.75] } } as any}
        formLocNumber="FL-1"
      />
    );

    const button50m = screen.getByRole('button', { name: 'backup:storesWithin50m' });
    await user.click(button50m);

    expect(screen.getByText('Near Shop')).toBeInTheDocument();
    expect(screen.getByText('Convenience')).toBeInTheDocument();
    expect(screen.getByText('25.50')).toBeInTheDocument();
  });

  // --- Street food synchronization ---
  it('switches to the streetfood section and syncs selected street food options', async () => {
    const user = userEvent.setup();

    render(
      <CompetitorTab
        location={{ geom: { coordinates: [100.5, 13.75] } } as any}
        formLocNumber="FL-1"
      />
    );

    await user.click(screen.getByRole('button', { name: 'backup:streetFood10m' }));

    // Finding checkboxes. We know Noodle Cart is first (ID 'A') and Drink Stall second (ID 'B').
    // Store has 'A' checked initially.
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);

    const noodleCheckbox = checkboxes[0];
    const drinkCheckbox = checkboxes[1];

    expect(screen.getByText('Noodle Cart')).toBeInTheDocument();
    expect(noodleCheckbox).toBeChecked();

    expect(screen.getByText('Drink Stall')).toBeInTheDocument();
    expect(drinkCheckbox).not.toBeChecked();

    // Click drink checkbox to toggle
    await user.click(drinkCheckbox);

    // Expect sync to be called with ID 'B'
    expect(storeMocks.syncStreetFoodFromApi).toHaveBeenCalledWith('B');
  });
});
