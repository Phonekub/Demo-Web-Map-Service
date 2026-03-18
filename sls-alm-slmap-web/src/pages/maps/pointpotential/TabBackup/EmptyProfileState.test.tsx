import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const fetchPotentialByPoiId = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/location.service', () => ({
  fetchPotentialByPoiId: (...args: unknown[]) => fetchPotentialByPoiId(...args),
}));

import { EmptyProfileState } from './EmptyProfileState';

describe('EmptyProfileState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Direct location rendering ---
  // Shows the provided branch name immediately and invokes the create callback.
  it('renders the branch name from props and handles create clicks', async () => {
    const onCreateClick = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyProfileState
        location={{ branchName: 'Branch 101' } as any}
        onCreateClick={onCreateClick}
      />
    );

    expect(screen.getByText('backup:locationName: Branch 101')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'backup:createBackupProfile' }));

    expect(fetchPotentialByPoiId).not.toHaveBeenCalled();
    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  // --- Fallback fetch flow ---
  // Fetches the POI name when the location prop has no branch name and falls back to fetched data.
  it('fetches the poi name when branch name is missing', async () => {
    fetchPotentialByPoiId.mockResolvedValue({ poi: { name: 'Fetched POI' } });

    render(<EmptyProfileState location={null} poiId={123} />);

    await waitFor(() => {
      expect(fetchPotentialByPoiId).toHaveBeenCalledWith(123);
    });
    expect(
      await screen.findByText('backup:locationName: Fetched POI')
    ).toBeInTheDocument();
  });

  // --- Fetch failure fallback ---
  // Falls back to a dash when the POI lookup cannot provide a display name.
  it('shows a fallback dash when the poi name fetch fails', async () => {
    fetchPotentialByPoiId.mockRejectedValue(new Error('network error'));

    render(<EmptyProfileState location={null} poiId={123} />);

    expect(await screen.findByText('backup:locationName: -')).toBeInTheDocument();
  });
});
