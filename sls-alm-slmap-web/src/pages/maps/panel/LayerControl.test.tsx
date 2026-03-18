import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const fetchLayers = vi.fn();
const setLayerVisibility = vi.fn();
let mapStoreState: {
  layerVisibility: Record<string, boolean>;
  setLayerVisibility: typeof setLayerVisibility;
};

// --- Service and store mocks ---
// Keep query data and persisted layer visibility fully under test control.
vi.mock('@/services/master.service', () => ({
  fetchLayers: (...args: unknown[]) => fetchLayers(...args),
}));

vi.mock('@/stores', () => ({
  useMapStore: Object.assign(
    (selector?: any) => {
      if (!selector) return mapStoreState;
      return selector(mapStoreState);
    },
    {
      getState: () => mapStoreState,
    }
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { LayerControl } from './LayerControl';

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('LayerControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapStoreState = {
      layerVisibility: {},
      setLayerVisibility,
    };
  });

  // --- Loading state ---
  // Shows the loading text while the layer query is still pending.
  it('shows the loading state while layers are being fetched', async () => {
    fetchLayers.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    renderWithQuery(<LayerControl />);
    await user.click(screen.getByRole('button', { name: 'maps:layer' }));

    expect(screen.getByText('Loading layers...')).toBeInTheDocument();
  });

  // --- Empty state ---
  // Shows a friendly empty message when no layer options are available.
  it('shows an empty state when the layer list is empty', async () => {
    fetchLayers.mockResolvedValue([]);
    const user = userEvent.setup();

    renderWithQuery(<LayerControl />);
    await user.click(screen.getByRole('button', { name: 'maps:layer' }));

    expect(await screen.findByText('No layers available')).toBeInTheDocument();
  });

  // --- Layer toggle flow ---
  // Toggles a layer, persists visibility in the store, and sends visible ids with spatial types.
  it('toggles a layer and reports the visible layers to the parent', async () => {
    fetchLayers.mockResolvedValue([
      { value: 'layer-1', text: 'Layer One', spatialType: 'competitor' },
      { value: 'layer-2', text: 'Layer Two', spatialType: 'deliveryArea' },
    ]);
    mapStoreState.layerVisibility = { 'layer-1': false, 'layer-2': true };
    const onLayersChange = vi.fn();
    const user = userEvent.setup();

    renderWithQuery(<LayerControl onLayersChange={onLayersChange} />);
    await user.click(screen.getByRole('button', { name: 'maps:layer' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Layer One' }));

    expect(setLayerVisibility).toHaveBeenCalledWith({ 'layer-1': true, 'layer-2': true });
    expect(onLayersChange).toHaveBeenCalledWith(['layer-1', 'layer-2'], {
      'layer-1': 'competitor',
      'layer-2': 'deliveryArea',
    });
  });

  // --- Clear all flow ---
  // Clears every persisted layer flag and notifies the parent that nothing is selected.
  it('clears all visible layers when Clear is clicked', async () => {
    fetchLayers.mockResolvedValue([{ value: 'layer-1', text: 'Layer One' }]);
    mapStoreState.layerVisibility = { 'layer-1': true, 'layer-2': true };
    const onLayersChange = vi.fn();
    const user = userEvent.setup();

    renderWithQuery(<LayerControl onLayersChange={onLayersChange} />);
    await user.click(screen.getByRole('button', { name: 'maps:layer' }));
    await user.click(await screen.findByRole('button', { name: 'Clear' }));

    expect(setLayerVisibility).toHaveBeenCalledWith({
      'layer-1': false,
      'layer-2': false,
    });
    expect(onLayersChange).toHaveBeenCalledWith([], {});
  });

  // --- Backdrop close ---
  // Closes the dropdown when the backdrop is clicked.
  it('closes the dropdown when the backdrop is clicked', async () => {
    fetchLayers.mockResolvedValue([{ value: 'layer-1', text: 'Layer One' }]);
    const user = userEvent.setup();

    const { container } = renderWithQuery(<LayerControl />);
    await user.click(screen.getByRole('button', { name: 'maps:layer' }));
    expect(await screen.findByText('Layer One')).toBeInTheDocument();

    const backdrop = container.querySelector('.fixed.inset-0.z-10') as HTMLElement;
    await user.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByText('Layer One')).not.toBeInTheDocument();
    });
  });
});
