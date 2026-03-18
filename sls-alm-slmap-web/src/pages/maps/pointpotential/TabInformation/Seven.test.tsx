import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const useQueryMock = vi.fn();
const fetchCommonCodes = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock('../../../../services/master.service', () => ({
  fetchCommonCodes: (...args: unknown[]) => fetchCommonCodes(...args),
}));

vi.mock('../../../../components', () => ({
  Button: ({ children, icon, iconPosition, variant, size, ...props }: any) => (
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

import Seven from './Seven';

describe('Seven', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCommonCodes.mockResolvedValue([{ value: 'OPT1', text: 'Option 1' }]);
    useQueryMock.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'storeFranchise') {
        return { data: [{ value: 'FR1', label: 'Franchise A' }] };
      }
      if (queryKey[0] === 'impactSize') {
        return { data: [{ value: 'IM1', label: 'High Impact' }] };
      }
      if (queryKey[0] === 'storeBuildingType') {
        return { data: [{ value: 'BL1', label: 'Standalone' }] };
      }
      return { data: [] };
    });
  });

  const baseFormData = {
    name: 'Seven A',
    storeCode: '7001',
    standardLayout: 'A',
    estimateDateOpen: '2026-01',
    impactType: '',
    impactDetail: '',
    investmentType: '',
    storeBuildingType: '',
    dimension: {
      width: '',
      length: '',
      saleArea: '',
      stockArea: '',
      storeArea: '',
    },
    parkingCount: '',
  } as any;

  // --- Header actions and query configuration ---
  // Configures the three common-code queries and toggles the add button through setShowForm.
  it('configures dropdown queries and opens the form from the add button', async () => {
    const setShowForm = vi.fn();
    const user = userEvent.setup();

    render(
      <Seven
        poiId="POI-1"
        formData={baseFormData}
        showForm={false}
        setShowForm={setShowForm}
      />
    );

    expect(useQueryMock).toHaveBeenCalledTimes(3);
    await useQueryMock.mock.calls[0][0].queryFn();
    await useQueryMock.mock.calls[1][0].queryFn();
    await useQueryMock.mock.calls[2][0].queryFn();
    expect(fetchCommonCodes).toHaveBeenCalledWith('STORE_FRANCHISE');
    expect(fetchCommonCodes).toHaveBeenCalledWith('IMPACT_TYPE_SITE');
    expect(fetchCommonCodes).toHaveBeenCalledWith('STORE_BUILDING_TYPE');

    await user.click(screen.getByRole('button', { name: 'เพิ่ม' }));
    expect(setShowForm).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'ลบ' })).toBeDisabled();
  });

  // --- Form updates and validation messaging ---
  // Renders the form, surfaces validation messages, and sanitizes nested numeric inputs before sending updates.
  it('updates form fields and sanitizes numeric dimension values', () => {
    const onDataChange = vi.fn();

    render(
      <Seven
        poiId="POI-1"
        onDataChange={onDataChange}
        formData={baseFormData}
        showForm={true}
        invalidFields={['name', 'dimension.width', 'parkingCount']}
      />
    );

    expect(screen.getByText('seven_store_name_required')).toBeInTheDocument();
    expect(screen.getByText('seven_width_required')).toBeInTheDocument();
    expect(screen.getByText('seven_parking_count_required')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('seven_store_name'), {
      target: { value: 'Seven Updated' },
    });
    fireEvent.change(screen.getByPlaceholderText('seven_width'), {
      target: { value: '12,3a.4' },
    });
    fireEvent.change(screen.getByPlaceholderText('seven_parking_count'), {
      target: { value: '1a2b' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'IM1' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[1], {
      target: { value: 'BL1' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[2], {
      target: { value: 'FR1' },
    });

    fireEvent.change(screen.getByPlaceholderText('seven_store_code'), {
      target: { value: 'SC001' },
    });
    fireEvent.change(screen.getByPlaceholderText('seven_standard_type'), {
      target: { value: 'Std A' },
    });
    fireEvent.change(screen.getByPlaceholderText('seven_open_month'), {
      target: { value: '2026-12' },
    });

    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Seven Updated' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dimension: expect.objectContaining({ width: '12.34' }),
      })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ parkingCount: '12' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ impactType: 'IM1' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ storeBuildingType: 'BL1' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ investmentType: 'FR1' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ storeCode: 'SC001' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ standardLayout: 'Std A' })
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ estimateDateOpen: '2026-12' })
    );
  });

  // --- Delete confirmation flow ---
  // Opens the delete popup, confirms deletion, resets the form payload, and hides the form.
  it('confirms deletion and resets the seven form state', async () => {
    const onDataChange = vi.fn();
    const setShowForm = vi.fn();
    const user = userEvent.setup();

    render(
      <Seven
        poiId="POI-1"
        onDataChange={onDataChange}
        formData={baseFormData}
        showForm={true}
        setShowForm={setShowForm}
      />
    );

    await user.click(screen.getByRole('button', { name: 'ลบ' }));
    expect(screen.getByTestId('popup-alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ยืนยัน' }));

    expect(setShowForm).toHaveBeenCalledWith(false);
    expect(onDataChange).toHaveBeenCalledWith({
      name: '',
      storeCode: '',
      standardLayout: '',
      estimateDateOpen: '',
      impactType: '',
      impactDetail: '',
      investmentType: '',
      storeBuildingType: '',
      dimension: {
        width: '',
        length: '',
        saleArea: '',
        stockArea: '',
        storeArea: '',
      },
      parkingCount: '',
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchCommonCodes.mockRejectedValue(new Error('API Error'));

    let franchiseFetcher: any;
    let impactFetcher: any;
    let buildingFetcher: any;

    useQueryMock.mockImplementation(({ queryKey, queryFn }: any) => {
      if (queryKey[0] === 'storeFranchise') franchiseFetcher = queryFn;
      if (queryKey[0] === 'impactSize') impactFetcher = queryFn;
      if (queryKey[0] === 'storeBuildingType') buildingFetcher = queryFn;
      return { data: [] };
    });

    render(<Seven poiId="POI-1" formData={baseFormData} />);

    await franchiseFetcher();
    await impactFetcher();
    await buildingFetcher();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch storeFranchise:',
      expect.any(Error)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch impactSize:',
      expect.any(Error)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch storeBuildingType:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('handles input parsing for dimensions and parking count', () => {
    const onDataChange = vi.fn();
    render(
      <Seven
        poiId="POI-1"
        onDataChange={onDataChange}
        formData={baseFormData}
        showForm={true}
      />
    );

    // Dimension fields with multiple dots and commas
    const dimensionInputs = [
      { placeholder: 'seven_width', field: 'width' },
      { placeholder: 'seven_length', field: 'length' },
      { placeholder: 'seven_sale_area', field: 'saleArea' },
      { placeholder: 'seven_stock_area', field: 'stockArea' },
      { placeholder: 'seven_total_area', field: 'storeArea' },
    ];

    dimensionInputs.forEach(({ placeholder, field }) => {
      fireEvent.change(screen.getByPlaceholderText(placeholder), {
        target: { value: '12.3.4,5' }, // Should become 12.345
      });
      expect(onDataChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dimension: expect.objectContaining({ [field]: '12.345' }),
        })
      );
    });

    // Parking count (integers only)
    fireEvent.change(screen.getByPlaceholderText('seven_parking_count'), {
      target: { value: '12a3' },
    });
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ parkingCount: '123' })
    );
  });

  it('does not crash if onDataChange is missing', () => {
    render(<Seven poiId="POI-1" formData={baseFormData} showForm={true} />);
    fireEvent.change(screen.getByPlaceholderText('seven_store_name'), {
      target: { value: 'New Name' },
    });
    // No error thrown
  });

  it('handles delete cancel', async () => {
    const user = userEvent.setup();
    render(<Seven poiId="POI-1" formData={baseFormData} showForm={true} />);

    await user.click(screen.getByRole('button', { name: 'ลบ' }));
    expect(screen.getByTestId('popup-alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(screen.queryByTestId('popup-alert')).not.toBeInTheDocument();
  });

  it('handles delete confirm when setShowForm is undefined', async () => {
    const onDataChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Seven
        poiId="POI-1"
        formData={baseFormData}
        showForm={true}
        onDataChange={onDataChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'ลบ' }));
    await user.click(screen.getByRole('button', { name: 'ยืนยัน' }));

    // Should call resetFormData -> setFormData -> onDataChange with empty object
    expect(onDataChange).toHaveBeenCalledWith(expect.objectContaining({ name: '' }));
  });

  it('handles add button click when setShowForm is undefined (noop)', async () => {
    const user = userEvent.setup();
    render(<Seven poiId="POI-1" formData={baseFormData} showForm={false} />);
    await user.click(screen.getByRole('button', { name: 'เพิ่ม' }));
  });
});
