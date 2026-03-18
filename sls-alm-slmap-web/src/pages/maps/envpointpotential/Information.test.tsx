import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const fetchLayers = vi.fn();
const createPoiPotential = vi.fn();

vi.mock('../../../components', () => ({
  Input: ({ value, onChange, placeholder, className, type = 'text' }: any) => (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

vi.mock('../../../components/base/PopupAlert', () => ({
  __esModule: true,
  default: ({ open, type, message, onClose }: any) =>
    open ? (
      <div data-testid="popup-alert">
        <span data-testid="popup-type">{type}</span>
        <span data-testid="popup-message">{message}</span>
        <button onClick={onClose}>close-alert</button>
      </div>
    ) : null,
}));

vi.mock('../../../services/master.service', () => ({
  fetchLayers: (...args: unknown[]) => fetchLayers(...args),
}));

vi.mock('../../../services/location.service', () => ({
  createPoiPotential: (...args: unknown[]) => createPoiPotential(...args),
}));

import EnvInformation from './Information';

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const coordinateBasicInfo = {
  latitude: 13.7563,
  longitude: 100.5018,
  zone: 'Z1',
  subzone: 'SZ1',
} as any;

describe('EnvInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchLayers.mockResolvedValue([
      { value: 1, text: 'School' },
      { value: 2, text: 'Hospital' },
    ]);
  });

  it('renders nothing when type is not env', () => {
    const { container } = renderWithQuery(
      <EnvInformation
        type="default"
        poiId="123"
        coordinateBasicInfo={coordinateBasicInfo}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('fetches layers on mount and renders category options', async () => {
    renderWithQuery(
      <EnvInformation type="env" poiId="123" coordinateBasicInfo={coordinateBasicInfo} />
    );

    expect(fetchLayers).toHaveBeenCalledTimes(1);
    await screen.findByRole('option', { name: 'School' });
    expect(screen.getByRole('option', { name: 'Hospital' })).toBeInTheDocument();
    expect(screen.getByText('-กรุณาเลือก-')).toBeInTheDocument();
  });

  it('shows required validation errors when saving with missing fields', async () => {
    const ref = React.createRef<{ handleSave: () => Promise<void> }>();

    renderWithQuery(
      <EnvInformation
        ref={ref}
        type="env"
        poiId="123"
        coordinateBasicInfo={coordinateBasicInfo}
      />
    );

    await waitFor(() => expect(ref.current).toBeTruthy());
    await act(async () => {
      await ref.current?.handleSave();
    });

    expect(await screen.findByTestId('popup-alert')).toBeInTheDocument();
    expect(screen.getByTestId('popup-type')).toHaveTextContent('error');
    expect(screen.getByTestId('popup-message')).toHaveTextContent(
      'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน'
    );
    expect(screen.getByText('*กรุณาเลือกประเภท')).toBeInTheDocument();
    expect(screen.getByText('*กรุณากรอกชื่อสถานที่')).toBeInTheDocument();
    expect(screen.getByText('*กรุณากรอกที่ตั้ง')).toBeInTheDocument();
    expect(createPoiPotential).not.toHaveBeenCalled();
  });

  it('saves successfully with the expected payload', async () => {
    const ref = React.createRef<{ handleSave: () => Promise<void> }>();
    createPoiPotential.mockResolvedValueOnce({ success: true });

    renderWithQuery(
      <EnvInformation
        ref={ref}
        type="env"
        poiId="123"
        coordinateBasicInfo={coordinateBasicInfo}
      />
    );

    await screen.findByRole('option', { name: 'School' });
    await userEvent.selectOptions(screen.getByRole('combobox'), '1');
    await userEvent.type(screen.getByPlaceholderText('ชื่อสถานที่'), 'Central School');
    await userEvent.type(screen.getByPlaceholderText('ที่ตั้ง'), 'Bangkok');

    await act(async () => {
      await ref.current?.handleSave();
    });

    await waitFor(() => expect(createPoiPotential).toHaveBeenCalledTimes(1));
    expect(createPoiPotential).toHaveBeenCalledWith({
      type: 'ENVIRONMENT',
      latitude: 13.7563,
      longitude: 100.5018,
      zone: 'Z1',
      subzone: 'SZ1',
      environment: {
        name: 'Central School',
        address: 'Bangkok',
        category: 1,
      },
    });
    expect(await screen.findByTestId('popup-message')).toHaveTextContent(
      'บันทึกข้อมูลเรียบร้อย!'
    );
    expect(screen.getByTestId('popup-type')).toHaveTextContent('success');
  });

  it('shows error popup when save API fails', async () => {
    const ref = React.createRef<{ handleSave: () => Promise<void> }>();
    createPoiPotential.mockRejectedValueOnce(new Error('save failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithQuery(
      <EnvInformation
        ref={ref}
        type="env"
        poiId="123"
        coordinateBasicInfo={coordinateBasicInfo}
      />
    );

    await screen.findByRole('option', { name: 'School' });
    await userEvent.selectOptions(screen.getByRole('combobox'), '2');
    await userEvent.type(screen.getByPlaceholderText('ชื่อสถานที่'), 'City Hospital');
    await userEvent.type(screen.getByPlaceholderText('ที่ตั้ง'), 'Chiang Mai');

    await act(async () => {
      await ref.current?.handleSave();
    });

    expect(await screen.findByTestId('popup-message')).toHaveTextContent(
      'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    );
    expect(screen.getByTestId('popup-type')).toHaveTextContent('error');
    consoleErrorSpy.mockRestore();
  });
});
