import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { MapTypeControl } from './MapTypeControl';

describe('MapTypeControl', () => {
  // --- Toggle button state ---
  // Renders the current map type label on the toggle button tooltip.
  it('renders the current map type label on the toggle button', () => {
    render(<MapTypeControl currentType="terrain" onToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'terrain_map' })).toHaveAttribute(
      'title',
      'terrain_map'
    );
  });

  // --- Menu open and selection ---
  // Opens the menu and calls back with the selected map type.
  it('opens the menu and selects a different map type', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(<MapTypeControl currentType="street" onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: 'street_map' }));
    const hybridOptionLabel = await screen.findByText('hybrid_map');
    const hybridOptionButton = hybridOptionLabel.closest('button');

    if (!hybridOptionButton) {
      throw new Error('Expected hybrid_map option button');
    }

    await user.click(hybridOptionButton);

    expect(onToggle).toHaveBeenCalledWith('hybrid');
    await waitFor(() => {
      expect(screen.queryByText('hybrid_map')).not.toBeInTheDocument();
    });
  });

  // --- Active option indicator ---
  // Highlights the current map type inside the open dropdown.
  it('marks the current map type as active when the menu is open', async () => {
    const user = userEvent.setup();
    render(<MapTypeControl currentType="outdoors" onToggle={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'outdoor_map' }));

    const activeButton = (
      await screen.findAllByRole('button', { name: 'outdoor_map' })
    ).find(button => button.className.includes('ring-2'));
    if (!activeButton) {
      throw new Error('Expected an active outdoor_map button');
    }
    expect(activeButton.className).toContain('ring-2');
    expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
  });

  // --- Outside click handling ---
  // Closes the menu when the user clicks outside the dropdown.
  it('closes the menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button>outside-target</button>
        <MapTypeControl currentType="street" onToggle={vi.fn()} />
      </div>
    );

    await user.click(screen.getAllByRole('button')[1]);
    expect(
      await screen.findByRole('button', { name: 'terrain_map' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'outside-target' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'terrain_map' })
      ).not.toBeInTheDocument();
    });
  });
});
