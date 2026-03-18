import { forwardRef, useImperativeHandle } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const fetchPoiByPoiId = vi.fn();
const checkPOIHasPendingApproval = vi.fn();
const getPotentialStatus = vi.fn();
const setCurrentTap = vi.fn();

const basicInfoRefState = {
  handleSave: vi.fn(),
  handleUpdate: vi.fn(),
  handleSendRequestApprove: vi.fn(),
  hasUnsavedChanges: vi.fn(() => false),
  showUnsavedPopup: vi.fn(),
};

const backupRefState = {
  handleSave: vi.fn(),
  handleUpdate: vi.fn(),
  handleEditBackup: vi.fn(),
};

// --- Child component mocks ---
// Replace lazy-loaded tabs with tiny ref-aware components so the panel orchestration can be tested in isolation.
vi.mock('./BasicInfo', () => {
  return {
    BasicInfo: forwardRef((props: any, ref: any) => {
      useImperativeHandle(ref, () => basicInfoRefState);
      return <div data-testid="basic-info">basic-{props.poiId}</div>;
    }),
  };
});

vi.mock('./BackupProfile', () => {
  return {
    BackupProfile: forwardRef((props: any, ref: any) => {
      useImperativeHandle(ref, () => backupRefState);
      return <div data-testid="backup-profile">backup-{props.poiId}</div>;
    }),
  };
});

vi.mock('./Images', () => ({
  Images: ({ poiId }: any) => <div data-testid="images-tab">images-{poiId}</div>,
}));

vi.mock('./tradeArea/TradeArea', () => ({
  TradeArea: ({ poiId }: any) => (
    <div data-testid="trade-area-tab">tradearea-{poiId}</div>
  ),
}));

vi.mock('./POIApprovalModal', () => ({
  POIApprovalModal: ({ poiId }: any) => (
    <div data-testid="poi-approval-modal">approval-{poiId}</div>
  ),
}));

vi.mock('../../../components', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../components/base/Card', () => ({
  __esModule: true,
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// --- Service and store mocks ---
// Keep fetched tab definitions and approval state fully deterministic.
vi.mock('@/services/location.service', () => ({
  fetchPoiByPoiId: (...args: unknown[]) => fetchPoiByPoiId(...args),
}));

vi.mock('@/services/poi.service', () => ({
  checkPOIHasPendingApproval: (...args: unknown[]) => checkPOIHasPendingApproval(...args),
}));

vi.mock('@/services/potential.service', () => ({
  getPotentialStatus: (...args: unknown[]) => getPotentialStatus(...args),
}));

vi.mock('@/stores/backupProfileStore', () => ({
  useBackupProfileStore: (selector: any) => selector({ haveBackupProfile: true }),
}));

vi.mock('@/stores/infoPanelStore', () => ({
  useInfoPanelStore: () => ({
    currentTap: 'INFORMATION',
    setCurrentTap,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { InfoPanel } from './InfoPanel';

describe('InfoPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    basicInfoRefState.handleSave.mockClear();
    basicInfoRefState.handleUpdate.mockClear();
    basicInfoRefState.handleSendRequestApprove.mockClear();
    basicInfoRefState.hasUnsavedChanges.mockReturnValue(false);
    basicInfoRefState.showUnsavedPopup.mockClear();
    backupRefState.handleSave.mockClear();
    backupRefState.handleEditBackup.mockClear();

    fetchPoiByPoiId.mockResolvedValue({
      layerId: 22,
      layerProperties: ['BACKUP_PROFILE', 'TRADE_AREA'],
    });
    getPotentialStatus.mockResolvedValue({ data: { canAction: true } });
    checkPOIHasPendingApproval.mockResolvedValue(true);
  });

  const renderPanel = (props: Partial<React.ComponentProps<typeof InfoPanel>> = {}) => {
    const onClose = vi.fn();
    render(
      <InfoPanel
        poiId="101"
        uid="uid-101"
        storeCode="B101"
        onClose={onClose}
        {...props}
      />
    );
    return { onClose };
  };

  // --- Null render branch ---
  // Returns nothing when the panel is being replaced by the create-backup-area flow.
  it('renders nothing when create-backup-area mode is active', () => {
    const { container } = render(
      <InfoPanel
        poiId="101"
        uid="uid-101"
        storeCode="B101"
        onClose={vi.fn()}
        isCreateBackupArea
      />
    );

    expect(container.firstChild).toBeNull();
  });

  // --- Tab initialization ---
  // Loads POI metadata and renders the default Information tab with the fetched tab list.
  it('loads poi metadata and renders tab headers', async () => {
    renderPanel();

    expect(await screen.findByTestId('basic-info')).toBeInTheDocument();
    expect(fetchPoiByPoiId).toHaveBeenCalledWith(101);
    expect(screen.getByRole('tab', { name: 'Information' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Backup Profile' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Trade Area' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Images' })).toBeInTheDocument();
    expect(screen.getByTestId('poi-approval-modal')).toBeInTheDocument();
  });

  // --- Close handling ---
  // Shows the unsaved-changes popup instead of closing immediately when the basic form is dirty.
  it('blocks close and shows the unsaved popup when the basic form has pending changes', async () => {
    basicInfoRefState.hasUnsavedChanges.mockReturnValue(true);
    const { onClose } = renderPanel();
    const user = userEvent.setup();

    await screen.findByTestId('basic-info');
    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(basicInfoRefState.showUnsavedPopup).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  // --- Information actions ---
  // Uses the update action and allows sending approval from the Information tab.
  it('updates the information tab and sends approval when the action buttons are clicked', async () => {
    const user = userEvent.setup();
    renderPanel({ isUpdateForm: true });

    await screen.findByTestId('basic-info');
    await user.click(screen.getByRole('button', { name: 'save' }));
    await user.click(screen.getByRole('button', { name: 'ส่งขออนุมัติ' }));

    expect(basicInfoRefState.handleUpdate).toHaveBeenCalledTimes(1);
    expect(basicInfoRefState.handleSendRequestApprove).toHaveBeenCalledTimes(1);
  });

  // --- Backup tab actions ---
  // Switches to the backup tab and wires save/edit actions to the backup ref.
  it('switches to the backup tab and uses backup actions', async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByTestId('basic-info');
    await screen.findByRole('tab', { name: 'Backup Profile' });
    await user.click(screen.getByRole('tab', { name: 'Backup Profile' }));

    expect(await screen.findByTestId('backup-profile')).toBeInTheDocument();
    expect(setCurrentTap).toHaveBeenCalledWith('BACKUP_PROFILE');

    await user.click(screen.getByRole('button', { name: 'save' }));
    await user.click(screen.getByRole('button', { name: 'แก้ไข Backup' }));

    expect(backupRefState.handleSave).toHaveBeenCalledTimes(1);
    expect(backupRefState.handleEditBackup).toHaveBeenCalledTimes(1);
  });

  // --- Env backup buttons ---
  // Uses the env-specific footer labels when the env backup tab is active.
  it('renders the env backup footer buttons on the env backup tab', async () => {
    const user = userEvent.setup();
    renderPanel({ type: 'env' });

    await screen.findByTestId('basic-info');
    await screen.findByRole('tab', { name: 'Backup Profile' });
    await user.click(screen.getByRole('tab', { name: 'Backup Profile' }));

    expect(await screen.findByTestId('backup-profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'บันทึก' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'แก้ไข Backup' })).toBeInTheDocument();
  });
});
