import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const fetchCommonCodes = vi.fn();
const selectorMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/master.service', () => ({
  fetchCommonCodes: (...args: unknown[]) => fetchCommonCodes(...args),
}));

vi.mock('@/components', () => ({
  Button: ({ children, icon, variant, size, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  Input: ({ title, children, ...props }: any) => (
    <label>
      <span>{title}</span>
      <input {...props} />
      {children}
    </label>
  ),
  Select: ({ title, options = [], placeholder, ...props }: any) => (
    <label>
      <span>{title}</span>
      <select {...props}>
        <option value="">{placeholder}</option>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
  DatePicker: ({ title, value, onChange }: any) => (
    <button
      data-testid={`datepicker-${title}`}
      onClick={() => onChange?.(new Date('2026-03-10T00:00:00.000Z'))}
    >
      {title}:{value ? 'set' : 'empty'}
    </button>
  ),
}));

vi.mock('../../../../components/base/PopupAlert', () => ({
  default: (props: any) =>
    props.open ? (
      <div data-testid="popup-alert">
        <span>{props.message}</span>
        <button onClick={props.onConfirm}>{props.confirmText}</button>
        <button onClick={props.onCancel}>{props.cancelText}</button>
      </div>
    ) : null,
}));

vi.mock('./sevenElevenSelector', () => ({
  default: (props: any) => {
    selectorMock(props);
    return props.isOpen ? (
      <div data-testid="seven-selector">
        <button
          onClick={() =>
            props.onSelect({ branchCode: '7009', branchName: 'Seven Parent' })
          }
        >
          choose-seven
        </button>
        <button onClick={props.onClose}>close-seven</button>
      </div>
    ) : null;
  },
}));

import Vending from './VendingMachine';

describe('VendingMachine', () => {
  const baseFormData = {
    businessTypeCode: 'VB-1',
    status: 'Draft',
    parentBranchCode: '',
    motherStoreName: '',
    name: 'Machine A',
    vendingCode: '123',
    machineId: '123',
    serialNumber: 'SN-1',
    model: '',
    installationType: '',
    vendingType: undefined,
    position: '',
    floor: '',
    address: '',
    contractStartDate: '2025-01-01',
    contractEndDate: '2025-12-31',
    contractCancelDate: '2025-06-01',
    serviceStartDate: '',
    serviceEndDate: '',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchCommonCodes.mockResolvedValue([
      { value: '1', text: 'Indoor' },
      { value: '2', text: 'Outdoor' },
    ]);
  });

  // --- Mount effects and header buttons ---
  // Loads vending type options on mount and exposes add/delete button behavior based on showForm.
  it('loads vending types on mount and toggles header actions', async () => {
    const setShowForm = vi.fn();
    const user = userEvent.setup();

    render(
      <Vending
        poiId="POI-1"
        formData={baseFormData}
        showForm={false}
        setShowForm={setShowForm}
        lat={13.7}
        long={100.5}
      />
    );

    await waitFor(() => expect(fetchCommonCodes).toHaveBeenCalledWith('VENDING_TYPE'));

    await user.click(screen.getByRole('button', { name: 'common:add' }));
    expect(setShowForm).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'common:delete' })).toBeDisabled();
  });

  // --- Form updates, selector integration, and date mapping ---
  // Opens the seven selector, maps the selected parent branch, sanitizes field updates, and converts picker dates to ISO strings.
  it('updates vending fields, maps selected seven data, and sends date changes', async () => {
    const onDataChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Vending
        poiId="POI-1"
        onDataChange={onDataChange}
        formData={baseFormData}
        showForm={true}
        invalidFields={['parentBranchCode', 'floor']}
        lat={13.7}
        long={100.5}
      />
    );

    expect(
      screen.getByText('maps:vending_parent_branch_code_required')
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button')[2]);
    expect(screen.getByTestId('seven-selector')).toBeInTheDocument();
    expect(selectorMock).toHaveBeenCalledWith(
      expect.objectContaining({ isOpen: true, lat: 13.7, long: 100.5 })
    );

    await user.click(screen.getByRole('button', { name: 'choose-seven' }));
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        parentBranchCode: '7009',
        motherStoreName: 'Seven Parent',
      })
    );

    fireEvent.change(screen.getByPlaceholderText('maps:vending_code'), {
      target: { value: '12a3b' },
    });
    fireEvent.change(screen.getByPlaceholderText('maps:vending_floor'), {
      target: { value: '2a' },
    });
    fireEvent.change(screen.getByPlaceholderText('maps:vending_floor'), {
      target: { value: '23' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[1], {
      target: { value: '2' },
    });

    await user.click(screen.getByTestId('datepicker-maps:vending_service_start_date'));
    await user.click(screen.getByTestId('datepicker-maps:vending_service_end_date'));

    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ vendingCode: '123', machineId: '123' })
    );
    expect(onDataChange).toHaveBeenCalledWith(expect.objectContaining({ floor: '23' }));
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ installationType: '2', vendingType: 2 })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ serviceStartDate: '2026-03-10T00:00:00.000Z' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ serviceEndDate: '2026-03-10T00:00:00.000Z' })
    );
  });

  // --- Delete confirmation flow ---
  // Confirms deletion, hides the form, and resets vending-specific fields through the normalized setter.
  it('confirms vending deletion and resets the form payload', async () => {
    const onDataChange = vi.fn();
    const setShowForm = vi.fn();
    const user = userEvent.setup();

    render(
      <Vending
        poiId="POI-1"
        onDataChange={onDataChange}
        formData={baseFormData}
        showForm={true}
        setShowForm={setShowForm}
        lat={13.7}
        long={100.5}
      />
    );

    await user.click(screen.getByRole('button', { name: 'common:delete' }));
    expect(screen.getByTestId('popup-alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ยืนยัน' }));

    expect(setShowForm).toHaveBeenCalledWith(false);
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        businessTypeCode: '',
        status: '',
        parentBranchCode: '',
        motherStoreName: '',
        name: '',
        vendingCode: '',
        machineId: '123',
        installationType: '',
        vendingType: undefined,
        floor: '',
        serviceStartDate: '',
        serviceEndDate: '',
        contractCancelDate: '2025-06-01',
      })
    );
  });
});
