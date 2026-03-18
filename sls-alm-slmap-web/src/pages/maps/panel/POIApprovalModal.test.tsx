import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const buttonMock = vi.fn();
const fetchPotentialByPoiId = vi.fn();
const getWorkflowTransaction = vi.fn();
const getCurrentWorkflow = vi.fn();
const updatePOIApprove = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components', () => ({
  Button: ({ children, onClick, icon, variant, size, ...props }: any) => {
    const label =
      typeof children === 'string' && children.trim() ? children : icon?.type?.name;
    buttonMock({ children, onClick, icon, variant, size, ...props });
    return (
      <button onClick={onClick} aria-label={label} {...props}>
        {children}
      </button>
    );
  },
  Modal: ({ isOpen, title, children, actions }: any) =>
    isOpen ? (
      <div data-testid="confirm-modal">
        <h2>{title}</h2>
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

vi.mock('@/services/location.service', () => ({
  fetchPotentialByPoiId: (...args: unknown[]) => fetchPotentialByPoiId(...args),
}));

vi.mock('@/services/workflow.service', () => ({
  getCurrentWorkflow: (...args: unknown[]) => getCurrentWorkflow(...args),
  getWorkflowTransaction: (...args: unknown[]) => getWorkflowTransaction(...args),
}));

vi.mock('@/services/poi.service', () => ({
  updatePOIApprove: (...args: unknown[]) => updatePOIApprove(...args),
}));

import { POIApprovalModal } from './POIApprovalModal';

describe('POIApprovalModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPotentialByPoiId.mockResolvedValue({
      poi: { namt: 'POI 101', locationT: 'Bangkok' },
      potentialStore: { id: 44, wfTransactionId: 55 },
    });
    getWorkflowTransaction.mockResolvedValue({
      data: { wfId: 99, wfName: 'Main Workflow' },
    });
    getCurrentWorkflow.mockResolvedValue({
      data: {
        wfStatus: { wfStatusName: 'Pending' },
        availableActions: [{ actionCode: 'APPROVE' }, { actionCode: 'REJECT' }],
      },
    });
    updatePOIApprove.mockResolvedValue({ success: true });
  });

  function assignDialogMethods() {
    const dialog = document.getElementById('poi_modal_6') as HTMLDialogElement & {
      showModal?: import("vitest").Mock;
      close?: import("vitest").Mock;
    };
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    return dialog;
  }

  function getActionButtons() {
    return buttonMock.mock.calls
      .map(call => call[0])
      .filter(props => props.children === '');
  }

  // --- Open and data loading ---
  // Fetches POI and workflow details before opening the approval dialog.
  it('loads poi details and workflow state when opened', async () => {
    const user = userEvent.setup();
    render(<POIApprovalModal poiId="123" />);
    const dialog = assignDialogMethods();

    await user.click(screen.getByRole('button', { name: 'approve' }));

    await waitFor(() => {
      expect(fetchPotentialByPoiId).toHaveBeenCalledWith(123);
      expect(getWorkflowTransaction).toHaveBeenCalledWith(55);
      expect(getCurrentWorkflow).toHaveBeenCalledWith(44, 99);
    });

    expect(await screen.findByText('POI 101')).toBeInTheDocument();
    expect(screen.getByText('Bangkok')).toBeInTheDocument();
    expect(screen.getByText('Main Workflow')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(dialog.showModal).toHaveBeenCalledTimes(1);
  });

  // --- Approve confirmation flow ---
  // Opens the confirm modal, submits an approval action, and reports success on alert close.
  it('submits the approve action and calls back after a successful alert close', async () => {
    const onApprovalSuccess = vi.fn();
    const user = userEvent.setup();

    render(<POIApprovalModal poiId="123" onApprovalSuccess={onApprovalSuccess} />);
    const dialog = assignDialogMethods();

    await user.click(screen.getByRole('button', { name: 'approve' }));
    await screen.findByText('POI 101');
    await waitFor(() => {
      expect(getActionButtons()).toHaveLength(2);
    });

    await act(async () => {
      getActionButtons()[0].onClick();
    });

    const confirmModal = screen.getByTestId('confirm-modal');
    expect(confirmModal).toBeInTheDocument();
    expect(within(confirmModal).getByText('approve_confirm')).toBeInTheDocument();

    await user.click(within(confirmModal).getByText('confirm'));

    await waitFor(() => {
      expect(updatePOIApprove).toHaveBeenCalledWith(123, 'APPROVE');
    });
    expect(screen.getByTestId('popup-alert')).toBeInTheDocument();
    expect(screen.getByText('ดำเนินการสำเร็จ')).toBeInTheDocument();

    await user.click(screen.getByText('close-alert'));

    expect(dialog.close).toHaveBeenCalled();
    expect(onApprovalSuccess).toHaveBeenCalledTimes(1);
  });

  // --- Remark validation flow ---
  // Requires a remark for reject actions before submitting the request.
  it('validates the remark before submitting a reject action', async () => {
    const user = userEvent.setup();

    render(<POIApprovalModal poiId="123" />);
    assignDialogMethods();

    await user.click(screen.getByRole('button', { name: 'approve' }));
    await screen.findByText('POI 101');
    await waitFor(() => {
      expect(getActionButtons()).toHaveLength(2);
    });

    await act(async () => {
      getActionButtons()[1].onClick();
    });

    const confirmModal = screen.getByTestId('confirm-modal');
    expect(confirmModal).toBeInTheDocument();
    expect(within(confirmModal).getByText('remark')).toBeInTheDocument();
    await user.click(within(confirmModal).getByText('confirm'));

    expect(updatePOIApprove).not.toHaveBeenCalled();
    expect(screen.getByText('remark_required')).toBeInTheDocument();

    const remarkInput = confirmModal.querySelector('textarea') as HTMLTextAreaElement;
    await user.type(remarkInput, 'Need revision');
    await user.click(within(confirmModal).getByText('confirm'));

    await waitFor(() => {
      expect(updatePOIApprove).toHaveBeenCalledWith(123, 'REJECT', 'Need revision');
    });
  });
});
