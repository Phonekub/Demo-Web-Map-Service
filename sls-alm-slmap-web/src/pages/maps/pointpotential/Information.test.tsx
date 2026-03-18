import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Hoist mocks to avoid reference errors
const serviceMocks = vi.hoisted(() => ({
  createPoiPotential: vi.fn(),
  updatePOIPotential: vi.fn(),
  fetchPotentialByPoiId: vi.fn(),
  sendApprove: vi.fn(),
}));

const storeMocks = vi.hoisted(() => ({
  setCreatedPoiId: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../services/location.service', () => ({
  createPoiPotential: (...args: unknown[]) => serviceMocks.createPoiPotential(...args),
  updatePOIPotential: (...args: unknown[]) => serviceMocks.updatePOIPotential(...args),
  fetchPotentialByPoiId: (...args: unknown[]) =>
    serviceMocks.fetchPotentialByPoiId(...args),
}));

vi.mock('@/services/potential.service', () => ({
  sendApprove: (...args: unknown[]) => serviceMocks.sendApprove(...args),
}));

vi.mock('@/stores/mapStore', () => ({
  useMapStore: (selector: any) =>
    selector({ setCreatedPoiId: storeMocks.setCreatedPoiId }),
}));

vi.mock('../pointpotential/TabInformation/Potential', () => ({
  default: (props: any) => (
    <div data-testid="potential-component">
      <span>potential:{props.formData?.name || ''}</span>
      <button
        onClick={() =>
          props.onDataChange({
            ...props.formData,
            name: 'Potential Ready',
            address: 'สุขุมวิท',
            cigaretteSale: 1,
            alcoholSale: 0,
            locationType: 'LOC1',
            areaType: 'AREA1',
            grade: 'A',
            tradeType: 'T1',
          })
        }
      >
        set-potential
      </button>
    </div>
  ),
}));

vi.mock('../pointpotential/TabInformation/Seven', () => ({
  default: (props: any) => (
    <div data-testid="seven-component">
      <span>seven:{props.formData?.storeCode || ''}</span>
      <button onClick={() => props.setShowForm?.(true)}>show-seven</button>
      <button onClick={() => props.onDataChange({ ...props.formData, storeCode: 'NEW' })}>
        update-seven
      </button>
    </div>
  ),
}));

vi.mock('../pointpotential/TabInformation/VendingMachine', () => ({
  default: (props: any) => (
    <div data-testid="vending-component">
      <span>vending:{props.formData?.vendingCode || ''}</span>
      <button onClick={() => props.setShowForm?.(true)}>show-vending</button>
    </div>
  ),
}));

vi.mock('../pointpotential/TabInformation/SevenInfo', () => ({
  default: (props: any) => <div data-testid="seven-info">seven-info:{props.poiId}</div>,
}));

vi.mock('../../../components/base/PopupAlert', () => ({
  default: (props: any) =>
    props.open ? (
      <div data-testid="popup-alert">
        <span>{props.title}</span>
        <span>{props.message}</span>
        {props.onConfirm && (
          <button onClick={props.onConfirm}>{props.confirmText || 'confirm'}</button>
        )}
        {props.onCancel && (
          <button onClick={props.onCancel}>{props.cancelText || 'cancel'}</button>
        )}
        {props.onClose && <button onClick={props.onClose}>close</button>}
      </div>
    ) : null,
}));

import Information, { type BasicInfoRef } from './Information';

describe('Information', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- SevenInfo mode ---
  // Renders the readonly SevenInfo view instead of editable sidebars when the layer id uses the seven-info path.
  it('renders SevenInfo only when layerId is 1', () => {
    render(<Information poiId="55" isUpdateForm={false} layerId={1} />);

    expect(screen.getByTestId('seven-info')).toBeInTheDocument();
    expect(screen.queryByTestId('potential-component')).not.toBeInTheDocument();
  });

  // --- Update-mode fetch and sidebar switching ---
  // Loads existing POI data in update mode, hydrates child tab props, and propagates form visibility changes.
  it('hydrates fetched update data and switches sidebar tabs', async () => {
    const onFormStateChange = vi.fn();
    const user = userEvent.setup();
    serviceMocks.fetchPotentialByPoiId.mockResolvedValue({
      poi: {
        name: 'Fetched POI',
        locationT: 'สุขุมวิท',
        shape: { coordinates: [100.5, 13.7] },
        zoneCode: 'Z1',
        subzoneCode: 'SZ1',
      },
      potentialStore: {
        locationType: 'LOC1',
        areaType: 'AREA1',
        canSaleAlcohol: 'Y',
        canSaleCigarette: 'N',
        status: 'Draft',
        approveStatus: 'Pending',
        grade: 'A',
        tradeType: 'T1',
      },
      sevenEleven: {
        name: 'Seven A',
        storeCode: '7001',
        standardLayout: 'A',
        estimateDateOpen: '2026-01',
        impactTypeSite: 1,
        storeFranchise: 2,
        storeWidth: 5,
        storeLength: 10,
        saleArea: 30,
        stockArea: 20,
        storeArea: 50,
        parkingCount: 4,
      },
      vendingMachine: {
        businessTypeCode: 'VB1',
        storecode: '7001',
        motherStoreName: 'Seven A',
        name: 'Vend A',
        machineId: '9001',
        serialNumber: 'SN-1',
        vendingModel: 'TCN',
        vendingType: '2',
        targetPoint: 3,
        floor: '2',
        locationAddress: 'สุขุมวิท',
        contractStartDate: '2025-01-01',
        contractFinishDate: '2025-12-31',
        contractCancelDate: '2025-06-01',
        openDate: '2025-02-01',
        closeDate: '2025-12-01',
      },
    });

    render(
      <Information poiId="55" isUpdateForm={true} onFormStateChange={onFormStateChange} />
    );

    await waitFor(() =>
      expect(serviceMocks.fetchPotentialByPoiId).toHaveBeenCalledWith(55)
    );
    await waitFor(() =>
      expect(screen.getByText('potential:Fetched POI')).toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: 'sidebar_seven' }));
    expect(screen.getByText('seven:7001')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'show-seven' }));
    expect(onFormStateChange).toHaveBeenCalledWith({
      showSevenForm: true,
      showVendingForm: true,
    });

    await user.click(screen.getByRole('button', { name: 'sidebar_vending' }));
    expect(screen.getByText('vending:9001')).toBeInTheDocument();
  });

  // --- Imperative save flow ---
  // Exposes handleSave through the ref, validates using current child state, and auto-closes after successful creation.
  it('creates a new potential record through the imperative save handler', async () => {
    const ref = createRef<BasicInfoRef>();
    const onSavedAndClose = vi.fn();
    const onSaveSuccess = vi.fn();
    serviceMocks.createPoiPotential.mockResolvedValue({ poiId: 123 });

    render(
      <Information
        ref={ref}
        poiId=""
        isUpdateForm={false}
        coordinateBasicInfo={
          { latitude: 13.7, longitude: 100.5, zone: 'Z1', subzone: 'SZ1' } as any
        }
        onSavedAndClose={onSavedAndClose}
        onSaveSuccess={onSaveSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-potential' }));
    await act(async () => {
      await ref.current?.handleSave();
    });

    await waitFor(() =>
      expect(serviceMocks.createPoiPotential).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'POTENTIAL',
          latitude: 13.7,
          longitude: 100.5,
          potential: expect.objectContaining({
            name: 'Potential Ready',
            cigaretteSale: 1,
            alcoholSale: 0,
          }),
        })
      )
    );

    await waitFor(() => {
      const closeBtn = screen.getByRole('button', { name: 'close' });
      expect(closeBtn).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(storeMocks.setCreatedPoiId).toHaveBeenCalledWith('123');
    expect(onSaveSuccess).toHaveBeenCalledWith(123);
    expect(onSavedAndClose).toHaveBeenCalled();
  });

  // --- Imperative approval flow ---
  // Opens the approval confirmation popup through the ref and submits approval after confirmation.
  it('confirms and sends the approval request through the imperative handler', async () => {
    const ref = createRef<BasicInfoRef>();
    serviceMocks.sendApprove.mockResolvedValue({ success: true });

    render(<Information ref={ref} poiId="55" isUpdateForm={false} />);

    await act(async () => {
      await ref.current?.handleSendRequestApprove();
    });
    await waitFor(() =>
      expect(screen.getByText('confirm_send_approval_message')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: 'confirm_button' }));

    await waitFor(() => expect(serviceMocks.sendApprove).toHaveBeenCalledWith(55));
    expect(screen.getByText('send_approval_success')).toBeInTheDocument();
  });

  it('updates an existing potential record through the imperative save handler', async () => {
    const ref = createRef<BasicInfoRef>();
    const onSavedAndClose = vi.fn();
    const onSaveSuccess = vi.fn();
    serviceMocks.updatePOIPotential.mockResolvedValue({ success: true });

    serviceMocks.fetchPotentialByPoiId.mockResolvedValue({
      poi: { name: 'Old Name' },
      potentialStore: {
        name: 'Old Name',
        tradeType: 'T1',
        canSaleCigarette: 'Y',
        canSaleAlcohol: 'N',
      },
      sevenEleven: null,
      vendingMachine: null,
    });

    render(
      <Information
        ref={ref}
        poiId="55"
        isUpdateForm={true}
        onSavedAndClose={onSavedAndClose}
        onSaveSuccess={onSaveSuccess}
      />
    );

    await waitFor(() =>
      expect(serviceMocks.fetchPotentialByPoiId).toHaveBeenCalledWith(55)
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-potential' }));

    await act(async () => {
      await ref.current?.handleUpdate();
    });

    await waitFor(() =>
      expect(serviceMocks.updatePOIPotential).toHaveBeenCalledWith(
        55,
        expect.objectContaining({
          type: 'POTENTIAL',
          potential: expect.objectContaining({
            name: 'Potential Ready',
          }),
        })
      )
    );
  });

  it('validates required fields and shows error when saving invalid form', async () => {
    const ref = createRef<BasicInfoRef>();
    serviceMocks.fetchPotentialByPoiId.mockResolvedValue({
      poi: {},
      potentialStore: { name: '' },
      sevenEleven: {},
      vendingMachine: {},
    });

    render(<Information ref={ref} poiId="55" isUpdateForm={true} />);
    await waitFor(() => expect(serviceMocks.fetchPotentialByPoiId).toHaveBeenCalled());

    await act(async () => {
      await ref.current?.handleSave();
    });

    expect(serviceMocks.updatePOIPotential).not.toHaveBeenCalled();
  });

  it('detects unsaved changes correctly', async () => {
    const ref = createRef<BasicInfoRef>();

    // Use create mode to ensure clean initial state
    render(<Information ref={ref} poiId="" isUpdateForm={false} />);

    expect(ref.current?.hasUnsavedChanges()).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'set-potential' }));

    await waitFor(() => {
      expect(ref.current?.hasUnsavedChanges()).toBe(true);
    });
  });

  it('detects unsaved changes in nested objects (Seven)', async () => {
    const ref = createRef<BasicInfoRef>();
    render(<Information ref={ref} poiId="" isUpdateForm={false} />);

    expect(ref.current?.hasUnsavedChanges()).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'sidebar_seven' }));
    fireEvent.click(screen.getByRole('button', { name: 'update-seven' }));

    await waitFor(() => {
      expect(ref.current?.hasUnsavedChanges()).toBe(true);
    });
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    serviceMocks.fetchPotentialByPoiId.mockRejectedValue(new Error('Fetch failed'));

    render(<Information poiId="55" isUpdateForm={true} />);

    await waitFor(() => expect(serviceMocks.fetchPotentialByPoiId).toHaveBeenCalled());
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles unsaved changes popup - save (update mode)', async () => {
    const ref = createRef<BasicInfoRef>();
    const onSavedAndClose = vi.fn();
    serviceMocks.updatePOIPotential.mockResolvedValue({ success: true });
    // Minimal mock for validation pass
    serviceMocks.fetchPotentialByPoiId.mockResolvedValue({
      poi: { name: 'Valid' },
      potentialStore: {
        name: 'Valid',
        tradeType: 'T1',
        canSaleCigarette: 'Y',
        canSaleAlcohol: 'N',
      },
      sevenEleven: null,
      vendingMachine: null,
    });

    render(
      <Information
        ref={ref}
        poiId="55"
        isUpdateForm={true}
        onSavedAndClose={onSavedAndClose}
      />
    );
    await waitFor(() => screen.getByText('potential:Valid'));

    // Trigger popup
    await act(async () => {
      ref.current?.showUnsavedPopup();
    });

    expect(screen.getByText('unsaved_changes_message')).toBeInTheDocument();

    // Confirm save
    fireEvent.click(screen.getByRole('button', { name: 'save_button' }));

    await waitFor(() => expect(serviceMocks.updatePOIPotential).toHaveBeenCalled());
  });

  it('handles unsaved changes popup - save (create mode)', async () => {
    const ref = createRef<BasicInfoRef>();
    serviceMocks.createPoiPotential.mockResolvedValue({ poiId: 123 });

    render(
      <Information
        ref={ref}
        poiId="" // Empty ID for create mode
        isUpdateForm={false}
        // Provide enough info for validation
        coordinateBasicInfo={
          { latitude: 13.7, longitude: 100.5, zone: 'Z1', subzone: 'SZ1' } as any
        }
      />
    );

    // Set some valid data via the potential component mock button to ensure validation passes
    fireEvent.click(screen.getByRole('button', { name: 'set-potential' }));

    // Trigger popup
    await act(async () => {
      ref.current?.showUnsavedPopup();
    });

    // Confirm save
    fireEvent.click(screen.getByRole('button', { name: 'save_button' }));

    await waitFor(() => expect(serviceMocks.createPoiPotential).toHaveBeenCalled());
  });

  it('handles unsaved changes popup - discard', async () => {
    const ref = createRef<BasicInfoRef>();
    const onSavedAndClose = vi.fn();

    render(
      <Information
        ref={ref}
        poiId="55"
        isUpdateForm={true}
        onSavedAndClose={onSavedAndClose}
      />
    );

    // Trigger popup
    await act(async () => {
      ref.current?.showUnsavedPopup();
    });

    // Discard
    fireEvent.click(screen.getByRole('button', { name: 'dont_save_button' }));

    expect(onSavedAndClose).toHaveBeenCalled();
  });

  it('toggles vending form visibility', async () => {
    const onFormStateChange = vi.fn();
    const user = userEvent.setup();
    serviceMocks.fetchPotentialByPoiId.mockResolvedValue({
      poi: { name: 'Vending POI' },
      potentialStore: { name: 'Vending POI' },
      sevenEleven: null,
      vendingMachine: { machineId: 'VM001' },
    });

    render(
      <Information poiId="55" isUpdateForm={true} onFormStateChange={onFormStateChange} />
    );

    await waitFor(() => screen.getByText('potential:Vending POI'));

    await user.click(screen.getByRole('button', { name: 'sidebar_vending' }));
    await user.click(screen.getByRole('button', { name: 'show-vending' }));

    expect(onFormStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ showVendingForm: true })
    );
  });

  it('handles approval failure response', async () => {
    const ref = createRef<BasicInfoRef>();
    serviceMocks.sendApprove.mockResolvedValue({
      success: false,
      message: 'Approval failed',
    });

    render(<Information ref={ref} poiId="55" isUpdateForm={false} />);

    await act(async () => {
      ref.current?.handleSendRequestApprove();
    });

    fireEvent.click(screen.getByRole('button', { name: 'confirm_button' }));

    await waitFor(() => expect(screen.getByText('Approval failed')).toBeInTheDocument());
  });

  it('handles approval exception', async () => {
    const ref = createRef<BasicInfoRef>();
    serviceMocks.sendApprove.mockRejectedValue(new Error('Network error'));

    render(<Information ref={ref} poiId="55" isUpdateForm={false} />);

    await act(async () => {
      ref.current?.handleSendRequestApprove();
    });

    fireEvent.click(screen.getByRole('button', { name: 'confirm_button' }));

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('handles cancel approval confirmation', async () => {
    const ref = createRef<BasicInfoRef>();
    render(<Information ref={ref} poiId="55" isUpdateForm={false} />);

    await act(async () => {
      ref.current?.handleSendRequestApprove();
    });

    expect(screen.getByText('confirm_send_approval_message')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'cancel_button' }));

    expect(screen.queryByText('confirm_send_approval_message')).not.toBeInTheDocument();
    expect(serviceMocks.sendApprove).not.toHaveBeenCalled();
  });
});
