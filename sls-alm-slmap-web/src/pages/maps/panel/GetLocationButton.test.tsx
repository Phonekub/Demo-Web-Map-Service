import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { GetLocationButton } from './GetLocationButton';

describe('GetLocationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Unsupported browser handling ---
  // Shows an error message when geolocation is not available.
  it('shows an error when the browser does not support geolocation', async () => {
    const originalGeolocation = navigator.geolocation;
    const onLocationFound = vi.fn();

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    });

    const user = userEvent.setup();
    render(<GetLocationButton onLocationFound={onLocationFound} />);

    await user.click(screen.getByRole('button', { name: 'ระบุตำแหน่งปัจจุบัน' }));

    expect(screen.getByText('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง')).toBeInTheDocument();
    expect(onLocationFound).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: originalGeolocation,
    });
  });

  // --- Successful lookup ---
  // Calls the callback with the current coordinates and leaves the error area empty.
  it('returns the current coordinates when geolocation succeeds', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: 13.75, longitude: 100.5 } } as GeolocationPosition);
    });
    const onLocationFound = vi.fn();

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    const user = userEvent.setup();
    render(<GetLocationButton onLocationFound={onLocationFound} />);

    await user.click(screen.getByRole('button', { name: 'ระบุตำแหน่งปัจจุบัน' }));

    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
    expect(onLocationFound).toHaveBeenCalledWith(13.75, 100.5);
    expect(screen.queryByText('กรุณาอนุญาตการเข้าถึงตำแหน่ง')).not.toBeInTheDocument();
  });

  // --- Error handling ---
  // Shows the correct translated message for permission errors and clears it after 3 seconds.
  it('shows and clears the permission error message', async () => {
    vi.useFakeTimers();
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError);
      }
    );

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<GetLocationButton onLocationFound={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'ระบุตำแหน่งปัจจุบัน' }));

    expect(screen.getByText('กรุณาอนุญาตการเข้าถึงตำแหน่ง')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('กรุณาอนุญาตการเข้าถึงตำแหน่ง')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  // --- Loading state ---
  // Disables the button while a location request is still in flight.
  it('disables the button while waiting for geolocation', async () => {
    let capturedSuccess: PositionCallback | undefined;
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      capturedSuccess = success;
    });

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    const user = userEvent.setup();
    render(<GetLocationButton onLocationFound={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'ระบุตำแหน่งปัจจุบัน' });
    await user.click(button);

    expect(button).toBeDisabled();

    act(() => {
      capturedSuccess?.({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition);
    });

    expect(button).not.toBeDisabled();
  });
});
