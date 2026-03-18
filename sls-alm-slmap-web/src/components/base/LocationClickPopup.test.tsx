import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocationClickPopup } from './LocationClickPopup';
import { fetchCoordinateInfo } from '../../services/location.service';

vi.mock('@/stores/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}));

vi.mock('../../services/location.service', () => ({
  fetchCoordinateInfo: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        ({
          sub_district: 'Sub-district ',
          district: 'District ',
          province: 'Province ',
          location_popup_loading: 'Loading location...',
          location_popup_not_found: 'Location not found',
          location_popup_zone: 'Zone',
          location_popup_subzone: 'Subzone',
          location_popup_coordinates: 'Coordinates',
          not_authorized: 'Not authorized',
          location_popup_create_potential: 'Create potential',
          location_popup_create_envdata: 'Create env data',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  XMarkIcon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="close-icon" {...props} />
  ),
}));

vi.mock('./Button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, className }: any) => (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

const mockedFetchCoordinateInfo = vi.mocked(fetchCoordinateInfo);

describe('LocationClickPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Section: successful fetch and action callbacks
  it('loads coordinate details, formats values, and forwards close and action clicks', async () => {
    const handleClose = vi.fn();
    const handleCreatePotential = vi.fn();
    const handleCreateEnvData = vi.fn();

    mockedFetchCoordinateInfo.mockResolvedValue({
      data: {
        zoneAuthorized: true,
        zone: 'Z-01',
        subzone: 'SZ-99',
        subDistrict: 'Central',
        district: 'Metro',
        province: 'Bangkok',
      },
    });

    render(
      <LocationClickPopup
        latitude={13.1234567}
        longitude={100.7654321}
        onClose={handleClose}
        onCreatePotential={handleCreatePotential}
        onCreateEnvData={handleCreateEnvData}
      />
    );

    expect(screen.getByText('Loading location...')).toBeInTheDocument();
    expect(mockedFetchCoordinateInfo).toHaveBeenCalledWith(13.1234567, 100.7654321);

    expect(
      await screen.findByText('Sub-district Central District Metro Province Bangkok')
    ).toBeInTheDocument();
    expect(screen.getByText('Zone: Z-01 Subzone: SZ-99')).toBeInTheDocument();
    expect(screen.getByText('Coordinates: 13.123457, 100.765432')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create potential' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create env data' }));

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleCreatePotential).toHaveBeenCalledWith({
      latitude: 13.1234567,
      longitude: 100.7654321,
      zone: 'Z-01',
      subzone: 'SZ-99',
    });
    expect(handleCreateEnvData).toHaveBeenCalledWith({
      latitude: 13.1234567,
      longitude: 100.7654321,
      zone: 'Z-01',
      subzone: 'SZ-99',
    });
  });

  // Section: unauthorized actions
  it('renders disabled action buttons and tooltip metadata when the zone is unauthorized', async () => {
    mockedFetchCoordinateInfo.mockResolvedValue({
      data: {
        zoneAuthorized: false,
        zone: 'Z-02',
        subzone: 'SZ-10',
        subDistrict: 'North',
        district: 'City',
        province: 'Phuket',
      },
    });

    render(<LocationClickPopup latitude={12.5} longitude={99.5} onClose={vi.fn()} />);

    const potentialButton = await screen.findByRole('button', {
      name: 'Create potential',
    });
    const envButton = screen.getByRole('button', { name: 'Create env data' });

    expect(potentialButton).toBeDisabled();
    expect(envButton).toBeDisabled();
    expect(potentialButton.parentElement).toHaveClass('tooltip', 'w-full');
    expect(potentialButton.parentElement).toHaveAttribute('data-tip', 'Not authorized');
    expect(envButton.parentElement).toHaveClass('tooltip', 'w-full');
    expect(envButton.parentElement).toHaveAttribute('data-tip', 'Not authorized');
  });

  // Section: failed fetch handling
  it('shows the not-found state when coordinate lookup fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedFetchCoordinateInfo.mockRejectedValue(new Error('lookup failed'));

    render(<LocationClickPopup latitude={10} longitude={20} onClose={vi.fn()} />);

    expect(await screen.findByText('Location not found')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Create potential' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Create env data' })
      ).not.toBeInTheDocument();
    });
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
