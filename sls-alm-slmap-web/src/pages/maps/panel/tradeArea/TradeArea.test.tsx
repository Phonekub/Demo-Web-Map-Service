import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// --- Hoisted service mocks ---
// Service used by the tab shell to discover available trade-area types.
const findTradeareaTypes = vi.fn();

// --- Service module mocks ---
// Keep the shell isolated from the real trade-area service.
vi.mock('@/services/tradeArea.service', () => ({
  findTradeareaTypes: (...args: unknown[]) => findTradeareaTypes(...args),
}));

// --- i18n mock ---
// Return translation keys directly so assertions stay stable.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// --- Child component mocks ---
// Replace heavy panel components with small test doubles so the shell can be tested in isolation.
vi.mock('./DeliveryArea', () => ({
  DeliveryArea: ({ poiId }: any) => <div>{`delivery-panel-${poiId}`}</div>,
}));

vi.mock('./StoreHub', () => ({
  StoreHub: ({ poiId }: any) => <div>{`storehub-panel-${poiId}`}</div>,
}));

import { TradeArea } from './TradeArea';

const location = {
  branchCode: 'BR001',
  geom: { coordinates: [100.5, 13.7] },
} as any;

describe('TradeArea', () => {
  // Reset service mocks before each test and provide a default tab list.
  beforeEach(() => {
    vi.clearAllMocks();
    findTradeareaTypes.mockResolvedValue({
      data: [{ name: 'delivery_area' }, { name: 'store_hub' }],
    });
  });

  // Verifies the component fetches available types and renders the default delivery tab.
  it('fetches trade area types and shows the default delivery tab', async () => {
    render(<TradeArea poiId="101" location={location} />);

    await waitFor(() => {
      expect(findTradeareaTypes).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('delivery_area')).toBeInTheDocument();
    expect(screen.getByText('store_hub')).toBeInTheDocument();
    expect(screen.getByText('delivery-panel-101')).toBeInTheDocument();
    expect(screen.queryByText('storehub-panel-101')).not.toBeInTheDocument();
  });

  // Verifies clicking another tab swaps the rendered child panel.
  it('switches tabs when the user clicks a different trade area type', async () => {
    const user = userEvent.setup();
    render(<TradeArea poiId="101" location={location} />);

    await user.click(await screen.findByRole('button', { name: 'store_hub' }));

    expect(screen.getByText('storehub-panel-101')).toBeInTheDocument();
    expect(screen.queryByText('delivery-panel-101')).not.toBeInTheDocument();
  });

  // Verifies switching back to the first tab.
  it('switches back to delivery area tab', async () => {
    const user = userEvent.setup();
    render(<TradeArea poiId="101" location={location} />);

    // Switch to Store Hub
    await user.click(await screen.findByRole('button', { name: 'store_hub' }));
    expect(screen.getByText('storehub-panel-101')).toBeInTheDocument();

    // Switch back to Delivery Area
    await user.click(await screen.findByRole('button', { name: 'delivery_area' }));
    expect(screen.getByText('delivery-panel-101')).toBeInTheDocument();
  });

  // Verifies the shell handles a service failure by leaving the sidebar empty.
  it('handles trade area type fetch failures gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    findTradeareaTypes.mockRejectedValue(new Error('load failed'));

    render(<TradeArea poiId="101" location={location} />);

    await waitFor(() => {
      expect(findTradeareaTypes).toHaveBeenCalledTimes(1);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching trade area types:',
      expect.any(Error)
    );
    expect(screen.queryByText('delivery_area')).not.toBeInTheDocument();
    expect(screen.queryByText('store_hub')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  // Handles unknown types fallback label ("Other")
  it('renders "Other" for unknown trade area types', async () => {
    findTradeareaTypes.mockResolvedValue({
      data: [{ name: 'unknown_type' }],
    });

    render(<TradeArea poiId="101" location={location} />);

    await waitFor(() => {
      expect(screen.getByText('Other')).toBeInTheDocument();
    });
  });

  // Verifies that if an unknown type is active, no child panel is rendered
  it('renders nothing in content area if active tab does not match known components', async () => {
    findTradeareaTypes.mockResolvedValue({
      data: [{ name: 'unknown_type' }],
    });

    render(<TradeArea poiId="101" location={location} />);

    // Initially activeTab is 'delivery_area' (default), so DeliveryArea renders even if not in list.
    // We want to test switching to the unknown type.
    const user = userEvent.setup();
    const otherBtn = await screen.findByText('Other');
    await user.click(otherBtn);

    // activeTab is now 'unknown_type'
    expect(screen.queryByText('delivery-panel-101')).not.toBeInTheDocument();
    expect(screen.queryByText('storehub-panel-101')).not.toBeInTheDocument();
  });
});
