import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const generateRentalLink = vi.fn();
let userStoreState: any;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStoreState,
}));

vi.mock('@/services/rental.service', () => ({
  generateRentalLink: (...args: unknown[]) => generateRentalLink(...args),
}));

import { BackupHeader } from './BackupHeader';

describe('BackupHeader', () => {
  const openSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    userStoreState = { user: { id: 77 } };
    generateRentalLink.mockResolvedValue({ data: { url: 'https://example.com/rental' } });
    Object.defineProperty(window, 'open', {
      writable: true,
      value: openSpy,
    });
  });

  // --- Header content ---
  // Renders location details and fallback text when there is no usable form location number.
  it('renders the header details and plain form text when no rental link is available', () => {
    render(
      <BackupHeader
        location={{ branchName: 'Branch 101' } as any}
        formLocNumber="-"
        expectedOpenDate="2026-01-01"
      />
    );

    expect(screen.getByText('backup:locationName : Branch 101')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('2026-01-01')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '-' })).not.toBeInTheDocument();
  });

  // --- Rental link flow ---
  // Generates a rental link with user and nation context, then opens it in a new tab.
  it('generates and opens the rental link when the form location number is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BackupHeader
        location={{ branchName: 'Branch 101' } as any}
        formLocNumber="FL-123"
        nation="KH"
      />
    );

    await user.click(screen.getByRole('button', { name: 'FL-123' }));

    await waitFor(() => {
      expect(generateRentalLink).toHaveBeenCalledWith(
        expect.objectContaining({
          formLocNumber: 'FL-123',
          userId: 77,
          nation: 'KH',
        })
      );
    });
    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/rental',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
