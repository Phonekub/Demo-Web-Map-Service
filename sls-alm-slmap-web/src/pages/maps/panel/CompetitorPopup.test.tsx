import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const fetchCompetitorStores = vi.fn();
const useMapStore = vi.fn();
const fromLonLat = vi.fn((coords: [number, number]) => coords);

// --- Service and dependency mocks ---
// Keep map math and remote data fully deterministic in the tests.
vi.mock('../../../services/location.service', () => ({
  fetchCompetitorStores: (...args: unknown[]) => fetchCompetitorStores(...args),
}));

vi.mock('@/stores/mapStore', () => ({
  useMapStore: (selector: any) => useMapStore(selector),
}));

vi.mock('ol/proj', () => ({
  fromLonLat: (coords: [number, number]) => fromLonLat(coords),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'maps:competitor_popup_title') {
        return `${key}:${options?.branchCode}:${options?.total}`;
      }
      return key;
    },
  }),
}));

import { CompetitorPopup } from './CompetitorPopup';

const createMapInstance = () => {
  const listeners: Record<string, Function[]> = {};
  return {
    once: vi.fn((event: string, callback: Function) => {
      listeners[event] = [...(listeners[event] || []), callback];
    }),
    on: vi.fn((event: string, callback: Function) => {
      listeners[event] = [...(listeners[event] || []), callback];
    }),
    un: vi.fn((event: string, callback: Function) => {
      listeners[event] = (listeners[event] || []).filter(fn => fn !== callback);
    }),
    getTargetElement: vi.fn(() => ({
      getBoundingClientRect: () => ({ left: 50, top: 80 }),
    })),
    getPixelFromCoordinate: vi.fn(() => [100, 120]),
    emit: (event: string) => {
      (listeners[event] || []).forEach(callback => callback());
    },
  };
};

describe('CompetitorPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 900,
    });
  });

  const renderPopup = (
    props: Partial<React.ComponentProps<typeof CompetitorPopup>> = {}
  ) => {
    const onClose = vi.fn();
    render(
      <CompetitorPopup
        uid="uid-1"
        branchCode="BR001"
        coordinates={[100.5, 13.7]}
        onClose={onClose}
        {...props}
      />
    );
    return { onClose };
  };

  // --- Loading state ---
  // Shows the spinner while competitor data is still loading.
  it('renders a loading spinner before the competitor request resolves', () => {
    const mapInstance = createMapInstance();
    fetchCompetitorStores.mockReturnValue(new Promise(() => {}));
    useMapStore.mockImplementation(selector => selector({ mapInstance }));

    renderPopup();

    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    expect(fetchCompetitorStores).toHaveBeenCalledWith('uid-1');
  });

  // --- Empty state ---
  // Renders the empty-state message when no competitor stores are returned.
  it('shows an empty state when no competitor stores are available', async () => {
    vi.useFakeTimers();
    const mapInstance = createMapInstance();
    fetchCompetitorStores.mockResolvedValue({ total: 0, stores: [] });
    useMapStore.mockImplementation(selector => selector({ mapInstance }));

    renderPopup();

    act(() => {
      mapInstance.emit('moveend');
      vi.advanceTimersByTime(100);
    });
    vi.useRealTimers();

    expect(await screen.findByText('maps:no_options_found')).toBeInTheDocument();
    expect(screen.getByText('maps:competitor_popup_title:BR001:0')).toBeInTheDocument();
  });

  // --- Data rendering ---
  // Renders fetched store rows and prefers the Thai type name when present.
  it('renders competitor store rows after loading completes', async () => {
    vi.useFakeTimers();
    const mapInstance = createMapInstance();
    fetchCompetitorStores.mockResolvedValue({
      total: 3,
      stores: [
        { typeNameTh: 'ร้านสะดวกซื้อ', typeName: 'Convenience Store', count: 2 },
        { typeName: 'Coffee Shop', count: 1 },
      ],
    });
    useMapStore.mockImplementation(selector => selector({ mapInstance }));

    renderPopup();

    act(() => {
      mapInstance.emit('moveend');
      vi.advanceTimersByTime(100);
    });
    vi.useRealTimers();

    expect(await screen.findByText('ร้านสะดวกซื้อ')).toBeInTheDocument();
    expect(screen.getByText('Coffee Shop')).toBeInTheDocument();
    expect(screen.getAllByText(/maps:store_unit/, { selector: 'span' })).toHaveLength(2);
    expect(screen.getByText('maps:competitor_popup_title:BR001:3')).toBeInTheDocument();
    expect(fromLonLat).toHaveBeenCalledWith([100.5, 13.7]);
  });

  // --- Fallback positioning ---
  // Keeps the popup hidden at its initial position when the map instance is unavailable.
  it('keeps the initial position when there is no map instance', async () => {
    vi.useFakeTimers();
    fetchCompetitorStores.mockResolvedValue({ total: 0, stores: [] });
    useMapStore.mockImplementation(selector => selector({ mapInstance: null }));

    const { container } = render(
      <CompetitorPopup
        uid="uid-1"
        branchCode="BR001"
        coordinates={[100.5, 13.7]}
        onClose={vi.fn()}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });
    vi.useRealTimers();

    await screen.findByText('maps:no_options_found');

    const popup = container.querySelector('div[style*="opacity"]') as HTMLElement;
    expect(popup.style.left).toBe('0px');
    expect(popup.style.top).toBe('0px');
    expect(popup.style.opacity).toBe('0');
  });

  // --- Close interaction ---
  // Invokes the close callback when the header close button is clicked.
  it('calls onClose when the close button is clicked', async () => {
    vi.useFakeTimers();
    const mapInstance = createMapInstance();
    fetchCompetitorStores.mockResolvedValue({ total: 0, stores: [] });
    useMapStore.mockImplementation(selector => selector({ mapInstance }));

    const { onClose } = renderPopup();

    act(() => {
      mapInstance.emit('moveend');
      vi.advanceTimersByTime(100);
    });
    vi.useRealTimers();

    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
