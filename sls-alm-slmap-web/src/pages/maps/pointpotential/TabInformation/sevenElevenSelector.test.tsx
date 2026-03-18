import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const fetchSevenNearby = vi.fn();
const fetchLocations = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/location.service', () => ({
  fetchSevenNearby: (...args: unknown[]) => fetchSevenNearby(...args),
  fetchLocations: (...args: unknown[]) => fetchLocations(...args),
}));

vi.mock('@/components', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: (props: any) => <input {...props} />,
  Modal: ({ isOpen, title, children, actions }: any) =>
    isOpen ? (
      <div data-testid="seven-modal">
        <h1>{title}</h1>
        {children}
        {actions}
      </div>
    ) : null,
}));

import SevenElevenSelector from './sevenElevenSelector';

describe('SevenElevenSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Initial load and choose flow ---
  // Loads nearby stores on open, lets the user select a row, and sends the selected store through the choose action.
  it('loads nearby seven-eleven stores and returns the chosen row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const nearbyRows = [
      { id: 1, branchCode: '7001', branchName: 'Seven Rama 9', distance: 120 },
      { id: 2, branchCode: '7002', branchName: 'Seven Asoke', distance: 250 },
    ];
    fetchSevenNearby.mockResolvedValue(nearbyRows);

    render(
      <SevenElevenSelector
        isOpen={true}
        onClose={onClose}
        onSelect={onSelect}
        lat={13.7}
        long={100.5}
      />
    );

    await waitFor(() => expect(fetchSevenNearby).toHaveBeenCalledWith(13.7, 100.5, 1000));
    expect(await screen.findByText('Seven Rama 9')).toBeInTheDocument();

    await user.click(screen.getByText('Seven Rama 9'));
    await user.click(screen.getByRole('button', { name: 'common:choose' }));

    expect(onSelect).toHaveBeenCalledWith(nearbyRows[0]);
    expect(onClose).toHaveBeenCalled();
  });

  // --- Search mapping and input reset ---
  // Searches by branch code, maps the location response into selector rows, and clears both search inputs.
  it('searches seven-eleven locations by text and clears the search fields', async () => {
    const user = userEvent.setup();
    fetchSevenNearby.mockResolvedValue([]);
    fetchLocations.mockResolvedValue({
      data: {
        search: [
          {
            id: 10,
            branchCode: '7999',
            branchName: 'Seven Search Result',
            distance: 88,
          },
        ],
      },
    });

    render(
      <SevenElevenSelector
        isOpen={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        lat={13.7}
        long={100.5}
      />
    );

    const codeInput = screen.getByPlaceholderText('maps:seven_selector_enter_store_code');
    const nameInput = screen.getByPlaceholderText('maps:seven_selector_enter_store_name');

    await user.type(codeInput, '7999');
    await user.click(screen.getByRole('button', { name: 'common:search' }));

    await waitFor(() =>
      expect(fetchLocations).toHaveBeenCalledWith({
        type: 'sevenEleven',
        text: '7999',
        lat: 13.7,
        long: 100.5,
        displayOnMap: false,
      })
    );

    expect(await screen.findByText('Seven Search Result')).toBeInTheDocument();
    expect(codeInput).toHaveValue('');
    expect(nameInput).toHaveValue('');
  });

  // --- Empty search fallback and selection toggle ---
  // Reloads nearby stores when the search text is blank and allows selecting the same row twice to clear the choice.
  it('reloads nearby data for blank search and clears the selection when clicking the same row twice', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    fetchSevenNearby
      .mockResolvedValueOnce([
        { id: 1, branchCode: '7001', branchName: 'Seven A', distance: 100 },
      ])
      .mockResolvedValueOnce([
        { id: 2, branchCode: '7002', branchName: 'Seven B', distance: 150 },
      ]);

    render(
      <SevenElevenSelector
        isOpen={true}
        onClose={vi.fn()}
        onSelect={onSelect}
        lat={13.7}
        long={100.5}
      />
    );

    expect(await screen.findByText('Seven A')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('maps:seven_selector_enter_store_name');
    fireEvent.change(nameInput, { target: { value: '   ' } });
    await user.click(screen.getByRole('button', { name: 'common:search' }));

    await waitFor(() => expect(fetchSevenNearby).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Seven B')).toBeInTheDocument();

    await user.click(screen.getByText('Seven B'));
    await user.click(screen.getByText('Seven B'));
    await user.click(screen.getByRole('button', { name: 'common:choose' }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
