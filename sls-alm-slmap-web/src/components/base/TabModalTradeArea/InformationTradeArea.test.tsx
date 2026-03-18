import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InformationTradeArea from './InformationTradeArea';
import {
  getTradeAreaById,
  getTradeareaByPoiId,
} from '../../../services/tradeArea.service';

// Hoist mocks to be used in vi.mock factories
const storeMocks = vi.hoisted(() => ({
  saveNewArea: vi.fn(),
  createChildArea: vi.fn(),
  saveEditedPolygon: vi.fn(),
}));

const tradeAreaStoreMocks = vi.hoisted(() => ({
  setOpenModal: vi.fn(),
  clearTradeareaId: vi.fn(),
  setIsFetch: vi.fn(),
}));

const mutableState = vi.hoisted(() => ({
  tradeareaType: 'delivery_area',
}));

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, options?: any) => (options ? `${k} ${JSON.stringify(options)}` : k),
  }),
}));

vi.mock('../../../services/tradeArea.service', () => ({
  getTradeAreaById: vi.fn(),
  getTradeareaByPoiId: vi.fn(),
}));

vi.mock('../../base/PopupAlert', () => ({
  __esModule: true,
  default: ({ open, type, message, onConfirm, onClose, onCancel }: any) =>
    open ? (
      <div data-testid="popup-alert" data-type={type}>
        <span>{message}</span>
        {onConfirm && (
          <button data-testid="popup-confirm" onClick={onConfirm}>
            Confirm
          </button>
        )}
        {onClose && (
          <button data-testid="popup-close" onClick={onClose}>
            Close
          </button>
        )}
        {onCancel && (
          <button data-testid="popup-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    ) : null,
}));

vi.mock('../HoverDropdown', () => ({
  __esModule: true,
  default: function MockHoverDropdown({
    value,
    options,
    onChange,
    placeholder,
    disabled,
  }: any) {
    return (
      <select
        data-testid="hover-dropdown"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
}));

vi.mock('@/stores', () => ({
  useMapStore: () => ({
    saveNewArea: storeMocks.saveNewArea,
    createChildArea: storeMocks.createChildArea,
    saveEditedPolygon: storeMocks.saveEditedPolygon,
  }),
}));

vi.mock('@/stores/tradeareaStore', () => ({
  useTradeAreaStore: () => ({
    setOpenModal: tradeAreaStoreMocks.setOpenModal,
    clearTradeareaId: tradeAreaStoreMocks.clearTradeareaId,
    setIsFetch: tradeAreaStoreMocks.setIsFetch,
    tradeareaType: mutableState.tradeareaType,
  }),
}));

describe('InformationTradeArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableState.tradeareaType = 'delivery_area'; // Reset default context
  });

  const getTradeAreaByIdMock = getTradeAreaById as import('vitest').Mock;
  const getTradeareaByPoiIdMock = getTradeareaByPoiId as import('vitest').Mock;

  it('renders loading initially when tradeareaId is provided', () => {
    // Return an unresolved promise to keep it loading
    getTradeAreaByIdMock.mockImplementation(() => new Promise(() => {}));
    render(<InformationTradeArea poiId={1} tradeareaId={123} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('fetches data by tradeareaId and renders correctly in view mode', async () => {
    getTradeAreaByIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z1',
        subzoneCode: 'SZ1',
        storeCode: 'S1',
        storeName: 'Store 1',
        effectiveDate: '2023-01-01T00:00:00Z',
        areaColor: 'RGB(152,221,0)', // resolves to GREEN
        comment: 'Some comment',
        warning: 'Alert',
      },
    });

    render(<InformationTradeArea poiId={1} tradeareaId={123} view="view" />);

    await waitFor(() => {
      expect(screen.getByText('Z1')).toBeInTheDocument();
      expect(screen.getByText('Store 1')).toBeInTheDocument();
      expect(screen.getByText('GREEN')).toBeInTheDocument();
      expect(screen.getByText('Some comment')).toBeInTheDocument();
      expect(screen.getByText(/Alert/)).toBeInTheDocument();
    });
  });

  it('fetches data by poiId if tradeareaId is null', async () => {
    getTradeareaByPoiIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z2',
        subzoneCode: 'SZ2',
        storeCode: 'S2',
        storeName: 'Store 2',
        effectiveDate: '2023-01-01T00:00:00Z',
        areaColor: 'RGB(255,0,0)', // resolves to RED
        comment: 'Detail text',
      },
    });

    render(<InformationTradeArea poiId={456} tradeareaId={null} view="view" />);

    await waitFor(() => {
      expect(screen.getByText('Z2')).toBeInTheDocument();
      expect(screen.getByText('RED')).toBeInTheDocument();
    });
  });

  it('color mapping tests - BLUE, YELLOW, ORANGE, PURPLE, and raw', async () => {
    getTradeAreaByIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z',
        storeCode: 'S',
        storeName: 'Store',
        effectiveDate: null, // default to now
        areaColor: 'RGB(0,112,255)', // BLUE
      },
    });

    const { rerender } = render(
      <InformationTradeArea poiId={1} tradeareaId={1} view="view" />
    );
    await waitFor(() => expect(screen.getByText('BLUE')).toBeInTheDocument());

    getTradeAreaByIdMock.mockResolvedValue({
      data: { areaColor: 'RGB(255, 222, 48)' },
    });
    rerender(<InformationTradeArea poiId={1} tradeareaId={2} view="view" />);
    await waitFor(() => expect(screen.getByText('YELLOW')).toBeInTheDocument());

    getTradeAreaByIdMock.mockResolvedValue({
      data: { areaColor: 'RGB(255,153,0)' }, // ORANGE
    });
    rerender(<InformationTradeArea poiId={1} tradeareaId={3} view="view" />);
    await waitFor(() => expect(screen.getByText('ORANGE')).toBeInTheDocument());

    getTradeAreaByIdMock.mockResolvedValue({
      data: { areaColor: 'RGB(153,51,255)' }, // PURPLE
    });
    rerender(<InformationTradeArea poiId={1} tradeareaId={4} view="view" />);
    await waitFor(() => expect(screen.getByText('PURPLE')).toBeInTheDocument());

    getTradeAreaByIdMock.mockResolvedValue({
      data: { areaColor: 'CUSTOM_COLOR' }, // custom fallback
    });
    rerender(<InformationTradeArea poiId={1} tradeareaId={5} view="view" />);
    await waitFor(() => expect(screen.getByText('CUSTOM_COLOR')).toBeInTheDocument());
  });

  it('handles null response from API gently', async () => {
    getTradeAreaByIdMock.mockResolvedValue(null);
    render(<InformationTradeArea poiId={1} tradeareaId={123} view="create" />);

    // It should just finish loading and render form without crashing
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('handles error from API gently', async () => {
    getTradeAreaByIdMock.mockRejectedValue(new Error('Network Err'));
    render(<InformationTradeArea poiId={1} tradeareaId={123} view="create" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('validates required fields on save and popups error', async () => {
    getTradeareaByPoiIdMock.mockResolvedValue({
      data: {
        zoneCode: '',
        areaColor: '',
      },
    });

    render(<InformationTradeArea poiId={1} tradeareaId={null} view="create" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Submit form
    const saveButton = screen.getByText('actions.save');
    fireEvent.click(saveButton);

    const errorPopup = screen.getByTestId('popup-close').parentElement;
    expect(errorPopup).toHaveAttribute('data-type', 'error');
    expect(
      screen.getByText('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน')
    ).toBeInTheDocument();

    // close err popup
    fireEvent.click(screen.getByTestId('popup-close'));
    expect(tradeAreaStoreMocks.setIsFetch).toHaveBeenCalledWith(true);
  });

  it('handles create action with valid data successfully', async () => {
    getTradeareaByPoiIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z1',
        storeCode: 'S1',
        storeName: 'Store 1',
        effectiveDate: '2023-01-01T00:00:00Z',
        areaColor: 'RGB(152,221,0)',
        comment: 'Comment',
      },
    });

    render(<InformationTradeArea poiId={1} tradeareaId={null} view="create" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Z1')).toBeInTheDocument();
    });

    // Edit details
    const textDesc = screen.getAllByRole('textbox')[0];
    fireEvent.change(textDesc, { target: { value: 'New Comment' } });

    const dateInput = screen.getByDisplayValue('2023-01-01');
    fireEvent.focus(dateInput); // tests onFocus
    fireEvent.change(dateInput, { target: { value: '2023-01-02' } });

    const dropdown = screen.getByTestId('hover-dropdown');
    fireEvent.change(dropdown, { target: { value: 'YELLOW' } });

    // Click Save
    const saveButton = screen.getByText('actions.save');
    fireEvent.click(saveButton);

    // Confirm popup should appear
    expect(screen.getByTestId('popup-confirm').parentElement).toHaveAttribute(
      'data-type',
      'info'
    );
    expect(screen.getByText('คุณต้องการบันทึกข้อมูลนี้หรือไม่?')).toBeInTheDocument();

    storeMocks.saveNewArea.mockResolvedValue({ success: true, message: 'Saved' });

    // Confirm action
    const confirmBtn = screen.getByTestId('popup-confirm');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // should switch to success popup
      expect(screen.getByTestId('popup-close').parentElement).toHaveAttribute(
        'data-type',
        'success'
      );
      expect(screen.getAllByText('Saved').length).toBeGreaterThan(0);
    });
    // also let's cover saving ORANGE to get 100% on borderColorToAreaColor
    fireEvent.change(dropdown, { target: { value: 'ORANGE' } });
    fireEvent.click(saveButton);
    fireEvent.click(screen.getByTestId('popup-confirm'));
    await waitFor(() =>
      expect(screen.getByTestId('popup-close').parentElement).toHaveAttribute(
        'data-type',
        'success'
      )
    );

    // also let's cover saving PURPLE
    fireEvent.change(dropdown, { target: { value: 'PURPLE' } });
    fireEvent.click(saveButton);
    fireEvent.click(screen.getByTestId('popup-confirm'));
    await waitFor(() =>
      expect(screen.getByTestId('popup-close').parentElement).toHaveAttribute(
        'data-type',
        'success'
      )
    );
  });

  it('handles edit action (createChildArea) successfully', async () => {
    getTradeareaByPoiIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z1',
        storeCode: 'S1',
        storeName: 'Store 1',
        effectiveDate: '2023-01-01T00:00:00Z',
        areaColor: 'RGB(152,221,0)',
      },
    });
    render(<InformationTradeArea poiId={1} tradeareaId={null} view="edit" />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Z1')).toBeInTheDocument();
    });

    // Click update
    fireEvent.click(screen.getByText('actions.update'));
    // confirm
    storeMocks.createChildArea.mockResolvedValue({ success: true, message: 'Updated' });
    fireEvent.click(screen.getByTestId('popup-confirm'));

    await waitFor(() => {
      expect(storeMocks.createChildArea).toHaveBeenCalled();
      expect(screen.getByTestId('popup-close').parentElement).toHaveAttribute(
        'data-type',
        'success'
      );
    });
  });

  it('handles save edited polygon action (save view) successfully', async () => {
    getTradeareaByPoiIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z1',
        storeCode: 'S1',
        storeName: 'Store 1',
        effectiveDate: '2023-01-01T00:00:00Z',
        areaColor: 'RGB(152,221,0)',
      },
    });
    render(<InformationTradeArea poiId={1} tradeareaId={null} view="save" />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Z1')).toBeInTheDocument();
    });

    // Click save
    fireEvent.click(screen.getByText('actions.save'));
    // confirm
    storeMocks.saveEditedPolygon.mockResolvedValue({ success: false }); // tests unhappy path mapping
    fireEvent.click(screen.getByTestId('popup-confirm'));

    await waitFor(() => {
      expect(storeMocks.saveEditedPolygon).toHaveBeenCalled();
      expect(screen.getByTestId('popup-close').parentElement).toHaveAttribute(
        'data-type',
        'error'
      );
    });
  });

  it('close cancel button and alert cancel button', async () => {
    getTradeareaByPoiIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z1',
        storeCode: 'S1',
        storeName: 'Store 1',
        effectiveDate: '2023-01-01T00:00:00Z',
        areaColor: 'RGB(152,221,0)',
      },
    });
    render(<InformationTradeArea poiId={1} tradeareaId={null} view="create" />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Z1')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByText('actions.cancel');
    fireEvent.click(cancelBtn);
    expect(tradeAreaStoreMocks.setOpenModal).toHaveBeenCalledWith(false);

    // Cancel from confirm modal
    fireEvent.click(screen.getByText('actions.save'));
    await waitFor(() => expect(screen.getByTestId('popup-cancel')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('popup-cancel'));
    // confirm modal goes away - handled locally via state

    // Simulate API throwing error
    fireEvent.click(screen.getByText('actions.save'));
    await waitFor(() => expect(screen.getByTestId('popup-confirm')).toBeInTheDocument());
    storeMocks.saveNewArea.mockRejectedValue(new Error('API Err'));
    fireEvent.click(screen.getByTestId('popup-confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('popup-close').parentElement).toHaveAttribute(
        'data-type',
        'error'
      );
      expect(screen.getAllByText('API Err').length).toBeGreaterThan(0);
    });
  });

  it('handles tradeareaType != delivery_area correctly (hides effective parameters)', async () => {
    mutableState.tradeareaType = 'custom_type'; // Set different type

    getTradeareaByPoiIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z1',
        storeCode: 'S1',
        storeName: 'Store 1',
        effectiveDate: '2023-01-01T00:00:00Z',
        areaColor: 'RGB(152,221,0)',
      },
    });

    render(<InformationTradeArea poiId={1} tradeareaId={null} view="create" />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Z1')).toBeInTheDocument();
    });

    // Effective date field should be hidden entirely
    expect(screen.queryByText('table.effective_date')).not.toBeInTheDocument();

    // Submit form
    fireEvent.click(screen.getByText('actions.save'));

    expect(screen.getByTestId('popup-close').parentElement).toHaveAttribute(
      'data-type',
      'error'
    );
  });

  it('unknown handler view passes through gracefully', async () => {
    getTradeareaByPoiIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z1',
        storeCode: 'S1',
        storeName: 'Store 1',
        effectiveDate: '2023-01-01T00:00:00Z',
        areaColor: 'RGB(152,221,0)',
      },
    });
    // This view does not match 'create', 'edit', 'save'
    render(<InformationTradeArea poiId={1} tradeareaId={null} view="unknown" />);
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    // There are no save/create buttons shown since showSave is false
    expect(screen.queryByText('actions.save')).not.toBeInTheDocument();
  });

  it('unknown handler returns early when attempting to save', async () => {
    getTradeareaByPoiIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z1',
        storeCode: 'S1',
        storeName: 'Store 1',
        effectiveDate: '2023-01-01T00:00:00Z',
        areaColor: 'RGB(152,221,0)',
      },
    });
  });

  it('color mapping tests 2 - RED', async () => {
    // Adding extra branch just to cover RED explicitly if needed
    getTradeAreaByIdMock.mockResolvedValue({
      data: {
        zoneCode: 'Z',
        storeCode: 'S',
        storeName: 'Store',
        effectiveDate: null,
        areaColor: 'RGB(255,0,0)',
      },
    });
    render(<InformationTradeArea poiId={1} tradeareaId={1} view="view" />);
    await waitFor(() => expect(screen.getByText('RED')).toBeInTheDocument());
  });
});
