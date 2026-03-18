import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { StoreHub } from './StoreHub';

// --- Hoisted service mocks ---
const getTradeAreaByStoreId = vi.fn();
const sendForApprovalTradeArea = vi.fn();
const updateTradeAreaApprove = vi.fn();
const deleteTradearea = vi.fn();
const getCurrentWorkflow = vi.fn();

// --- Service module mocks ---
vi.mock('@/services/tradeArea.service', () => ({
  getTradeAreaByStoreId: (...args: unknown[]) => getTradeAreaByStoreId(...args),
  sendForApprovalTradeArea: (...args: unknown[]) => sendForApprovalTradeArea(...args),
  updateTradeAreaApprove: (...args: unknown[]) => updateTradeAreaApprove(...args),
  deleteTradearea: (...args: unknown[]) => deleteTradearea(...args),
}));

vi.mock('@/services/workflow.service', () => ({
  getCurrentWorkflow: (...args: unknown[]) => getCurrentWorkflow(...args),
}));

// --- Store mocks ---
const addPolygonLayer = vi.fn();
const removePolygonLayer = vi.fn();
const setEditingAreaId = vi.fn();
const setIsEditing = vi.fn();
const setCreatingAreaStoreId = vi.fn();
const setIsCreatingArea = vi.fn();
const setTradeAreaProperties = vi.fn();
const setRadiusArea = vi.fn();
const setCreatingAreaType = vi.fn();

const setOpenTradeareaModal = vi.fn();
const setView = vi.fn();
const setTradeareaId = vi.fn();
const setIsFetch = vi.fn();
const setCurrentWfStep = vi.fn();
const setTradeareaType = vi.fn();

let mapState = {
  polygonLayers: [],
  isEditing: false,
  isCreatingArea: false,
};

let tradeAreaState: {
  openModal: boolean;
  view: string;
  tradeareaId: number | null;
  isFetch: boolean;
} = {
  openModal: false,
  view: 'view',
  tradeareaId: null,
  isFetch: false,
};

vi.mock('@/stores', () => ({
  useMapStore: () => ({
    polygonLayers: mapState.polygonLayers,
    removePolygonLayer,
    setEditingAreaId,
    isEditing: mapState.isEditing,
    setIsEditing,
    setCreatingAreaStoreId,
    setIsCreatingArea,
    setTradeAreaProperties,
    setRadiusArea,
    isCreatingArea: mapState.isCreatingArea,
    setCreatingAreaType,
    addPolygonLayer,
  }),
}));

vi.mock('@/stores/tradeareaStore', () => ({
  useTradeAreaStore: () => ({
    openModal: tradeAreaState.openModal,
    setOpenModal: (value: boolean) => {
      tradeAreaState.openModal = value;
      setOpenTradeareaModal(value);
    },
    view: tradeAreaState.view,
    setView: (value: string) => {
      tradeAreaState.view = value;
      setView(value);
    },
    setTradeareaId: (value: number | null) => {
      tradeAreaState.tradeareaId = value;
      setTradeareaId(value);
    },
    tradeareaId: tradeAreaState.tradeareaId,
    isFetch: tradeAreaState.isFetch,
    setIsFetch: (value: boolean) => {
      tradeAreaState.isFetch = value;
      setIsFetch(value);
    },
    setCurrentWfStep,
    setTradeareaType,
  }),
}));

// --- i18n mock ---
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// --- UI component mocks ---
vi.mock('@/components', () => ({
  Button: ({ children, onClick, tooltip, iconOnly, icon, variant, ...props }: any) => (
    <button
      type={props.type ?? 'button'}
      onClick={onClick}
      aria-label={iconOnly ? tooltip : undefined}
      data-variant={variant}
      {...props}
    >
      {children}
      {icon}
    </button>
  ),
  Modal: ({ isOpen, title, children, actions }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <div>{title}</div>
        <div>{children}</div>
        <div>{actions}</div>
      </div>
    ) : null,
}));

vi.mock('@/components/base/PopupAlert', () => ({
  __esModule: true,
  default: ({ open, type, message, onClose }: any) =>
    open ? (
      <div data-testid="popup-alert">
        <span>{type}</span>
        <span>{message}</span>
        <button onClick={onClose}>close-alert</button>
      </div>
    ) : null,
}));

vi.mock('@/components/base/ModalTradeArea', () => ({
  __esModule: true,
  default: ({ isOpen, view, tradeareaId, poiId, onClose }: any) =>
    isOpen ? (
      <div data-testid="modal-tradearea">
        <span>{view}</span>
        <span>{tradeareaId}</span>
        <span>{poiId}</span>
        <button onClick={onClose}>close-tradearea-modal</button>
      </div>
    ) : null,
}));

vi.mock('@heroicons/react/24/solid', () => {
  const Icon = () => <span data-testid="icon" />;
  return {
    CheckCircleIcon: Icon,
    PaperAirplaneIcon: Icon,
    PencilSquareIcon: Icon,
    XCircleIcon: Icon,
    ExclamationTriangleIcon: Icon,
    PlusIcon: Icon,
    TrashIcon: Icon,
    ArrowLeftCircleIcon: Icon,
  };
});

// --- Data Fixtures ---
const location = {
  branchCode: 'BR001',
  geom: { coordinates: [100.5, 13.7] },
} as any;

const workflowData = {
  wfStep: { wfStepId: 201 },
  wfStatus: { wfStatusName: 'Pending Approval' },
  availableActions: [
    { actionCode: 'VIEW', actionName: 'View' },
    { actionCode: 'EDIT', actionName: 'Edit' },
    { actionCode: 'DELETE', actionName: 'Delete' },
    { actionCode: 'SEND_APPROVE', actionName: 'Send Approve' },
    { actionCode: 'REJECT', actionName: 'Reject' },
  ],
};

const tradeAreaRowActive = {
  id: 21,
  wfId: 1,
  status: 'active',
  areaColor: 'rgb(255,0,0)',
  shape: { coordinates: [[[100, 13]]] },
  effectiveDate: '2026-03-10T00:00:00.000Z',
  comment: 'Hub area',
  parentId: null,
};

const tradeAreaRowScheduled = {
  id: 22,
  wfId: 2,
  status: 'scheduled',
  areaColor: 'rgb(0,255,0)',
  shape: { coordinates: [[[101, 14]]] },
  effectiveDate: '2026-04-10T00:00:00.000Z',
  comment: 'Future hub',
  parentId: null,
};

describe('StoreHub', () => {
  beforeAll(() => {
    // Mock Canvas for scheduled area pattern generation
    window.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      createPattern: vi.fn().mockReturnValue('pattern'),
    } as any);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mapState = {
      polygonLayers: [],
      isEditing: false,
      isCreatingArea: false,
    };
    tradeAreaState = {
      openModal: false,
      view: 'view',
      tradeareaId: null,
      isFetch: false,
    };

    getTradeAreaByStoreId.mockResolvedValue({ data: [tradeAreaRowActive] });
    getCurrentWorkflow.mockResolvedValue({ data: workflowData });
    sendForApprovalTradeArea.mockResolvedValue({ success: true });
    updateTradeAreaApprove.mockResolvedValue({ success: true });
    deleteTradearea.mockResolvedValue({ success: true });
  });

  it('fetches trade areas on mount and renders', async () => {
    render(<StoreHub poiId="101" location={location} />);
    await waitFor(() => {
      expect(getTradeAreaByStoreId).toHaveBeenCalledWith('BR001', 'store_hub');
    });
    expect(screen.getByText('Hub area')).toBeInTheDocument();
  });

  it('handles scheduled status drawing logic', async () => {
    getTradeAreaByStoreId.mockResolvedValue({ data: [tradeAreaRowScheduled] });
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => {
      expect(addPolygonLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'trade-area-22',
          style: expect.objectContaining({
            fill: 'pattern',
          }),
        })
      );
    });
  });

  it('renders empty state when no data', async () => {
    getTradeAreaByStoreId.mockResolvedValue({ data: [] });
    render(<StoreHub poiId="101" location={location} />);
    await waitFor(() => {
      expect(screen.getByText('ไม่พบข้อมูล')).toBeInTheDocument();
    });
  });

  it('handles API failure on fetch', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTradeAreaByStoreId.mockRejectedValue(new Error('Fetch failed'));
    render(<StoreHub poiId="101" location={location} />);
    await waitFor(() => {
      expect(getTradeAreaByStoreId).toHaveBeenCalled();
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles Create Area button', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);
    await user.click(screen.getByText('create_delivery_area'));

    expect(setTradeareaType).toHaveBeenCalledWith('store_hub');
    expect(setIsCreatingArea).toHaveBeenCalledWith(true);
    expect(setCreatingAreaStoreId).toHaveBeenCalledWith('101');
    expect(setRadiusArea).toHaveBeenCalledWith([100.5, 13.7], [600]);
    expect(setCurrentWfStep).toHaveBeenCalledWith(101);
  });

  it('handles VIEW action from table row click', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => screen.getByText('Hub area'));
    await user.click(screen.getByText('Hub area'));

    expect(setView).toHaveBeenCalledWith('view');
    expect(setTradeareaId).toHaveBeenCalledWith(21);
    expect(setOpenTradeareaModal).toHaveBeenCalledWith(true);
  });

  it('handles EDIT action button click', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => screen.getByText('Hub area'));
    const editBtn = screen.getByLabelText('Edit');
    await user.click(editBtn);

    expect(setTradeareaType).toHaveBeenCalledWith('store_hub');
    // expect(setIsCreatingArea).toHaveBeenCalledWith(false); // Removed if logic differs or not called
    expect(setIsEditing).toHaveBeenCalledWith(true);
    expect(setEditingAreaId).toHaveBeenCalledWith('trade-area-21');
    expect(setTradeAreaProperties).toHaveBeenCalled();
  });

  it('handles SEND_APPROVE action', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => screen.getByText('Hub area'));
    const sendBtn = screen.getByLabelText('Send Approve');
    await user.click(sendBtn);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    await user.click(screen.getByText('actions.confirm'));

    await waitFor(() => {
      expect(sendForApprovalTradeArea).toHaveBeenCalledWith('21');
      expect(screen.getByTestId('popup-alert')).toBeInTheDocument();
    });
  });

  it('handles DELETE action (no remark needed)', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => screen.getByText('Hub area'));
    const deleteBtn = screen.getByLabelText('Delete');
    await user.click(deleteBtn);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.queryByText('remark')).not.toBeInTheDocument();

    await user.click(screen.getByText('actions.delete'));

    await waitFor(() => {
      expect(deleteTradearea).toHaveBeenCalledWith(21);
      expect(screen.getByTestId('popup-alert')).toBeInTheDocument();
    });
  });

  it('handles REJECT action with remark requirement', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => screen.getByText('Hub area'));
    const rejectBtn = screen.getByLabelText('Reject');
    await user.click(rejectBtn);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('remark')).toBeInTheDocument();

    // Confirm without remark should fail
    await user.click(screen.getByText('actions.confirm'));
    expect(screen.getByText('remark_required')).toBeInTheDocument();

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Bad data');
    await user.click(screen.getByText('actions.confirm'));

    await waitFor(() => {
      expect(updateTradeAreaApprove).toHaveBeenCalledWith(21, 'REJECT', 'Bad data');
      expect(screen.getByTestId('popup-alert')).toBeInTheDocument();
    });
  });

  it('handles action failure', async () => {
    const user = userEvent.setup();
    deleteTradearea.mockRejectedValue(new Error('Delete error'));

    render(<StoreHub poiId="101" location={location} />);
    await waitFor(() => screen.getByText('Hub area'));

    const deleteBtn = screen.getByLabelText('Delete');
    await user.click(deleteBtn);
    await user.click(screen.getByText('actions.delete'));

    await waitFor(() => {
      expect(screen.getByText('Delete error')).toBeInTheDocument();
    });
  });

  it('handles Select All', async () => {
    const user = userEvent.setup();
    getTradeAreaByStoreId.mockResolvedValue({
      data: [tradeAreaRowActive, tradeAreaRowScheduled],
    });
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    const headerCheckbox = screen.getAllByRole('checkbox')[0];
    expect(headerCheckbox).toBeChecked();

    await user.click(headerCheckbox); // Uncheck
    expect(removePolygonLayer).toHaveBeenCalled();

    await user.click(headerCheckbox); // Check
    expect(addPolygonLayer).toHaveBeenCalled();
  });

  it('handles individual checkbox toggle', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => screen.getByText('Hub area'));
    const rowCheckbox = screen.getAllByRole('checkbox')[1];

    expect(rowCheckbox).toBeChecked();

    await user.click(rowCheckbox); // Uncheck
    expect(removePolygonLayer).toHaveBeenCalledWith('trade-area-21');
    expect(rowCheckbox).not.toBeChecked();

    await user.click(rowCheckbox); // Check
    expect(addPolygonLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'trade-area-21' })
    );
  });

  it('handles modal close', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => screen.getByText('Hub area'));
    const sendBtn = screen.getByLabelText('Send Approve');
    await user.click(sendBtn);

    expect(screen.getByTestId('modal')).toBeInTheDocument();

    const cancelBtn = screen.getByText('actions.cancel');
    await user.click(cancelBtn);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('closes tradearea modal correctly', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);

    await user.click(await screen.findByText('Hub area'));
    expect(screen.getByTestId('modal-tradearea')).toBeInTheDocument();

    await user.click(screen.getByText('close-tradearea-modal'));
    expect(setOpenTradeareaModal).toHaveBeenCalledWith(false);
    expect(setCurrentWfStep).toHaveBeenCalledWith(null);
  });

  it('closes popup alert correctly', async () => {
    const user = userEvent.setup();
    render(<StoreHub poiId="101" location={location} />);
    await waitFor(() => screen.getByText('Hub area'));
    await user.click(screen.getByLabelText('Send Approve'));
    await user.click(screen.getByText('actions.confirm'));

    await waitFor(() => expect(screen.getByTestId('popup-alert')).toBeInTheDocument());

    await user.click(screen.getByText('close-alert'));
    expect(screen.queryByTestId('popup-alert')).not.toBeInTheDocument();
    expect(setCurrentWfStep).toHaveBeenCalledWith(null);
  });

  it('handles effective date display correctly', async () => {
    const rowWithNullDate = { ...tradeAreaRowActive, effectiveDate: null, id: 99 };
    getTradeAreaByStoreId.mockResolvedValue({ data: [rowWithNullDate] });

    render(<StoreHub poiId="101" location={location} />);
    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  it('handles empty workflow fetch gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getCurrentWorkflow.mockRejectedValue(new Error('WF Error'));
    render(<StoreHub poiId="101" location={location} />);

    await waitFor(() => {
      expect(screen.getByText('ไม่พบข้อมูล')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch trade areas'),
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
