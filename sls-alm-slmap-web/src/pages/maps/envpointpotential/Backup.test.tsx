import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const fetchCommonCodes = vi.fn();
const createDynamicForm = vi.fn();
const fetchDynamicBlankFormBySubzone = vi.fn();
const fetchDynamicForm = vi.fn();
const updateDynamicForm = vi.fn();
const setPopulation = vi.fn();

vi.mock('@/services/master.service', () => ({
  fetchCommonCodes: (...args: unknown[]) => fetchCommonCodes(...args),
}));

vi.mock('@/services/backup.service', () => ({
  createDynamicForm: (...args: unknown[]) => createDynamicForm(...args),
  fetchDynamicBlankFormBySubzone: (...args: unknown[]) =>
    fetchDynamicBlankFormBySubzone(...args),
  fetchDynamicForm: (...args: unknown[]) => fetchDynamicForm(...args),
  updateDynamicForm: (...args: unknown[]) => updateDynamicForm(...args),
}));

vi.mock('@/stores/backupProfileStore', () => ({
  useBackupFlowStore: () => ({ step: 'layer-selection' }),
  usePopulationStore: (
    selector: (state: { setPopulation: typeof setPopulation }) => unknown
  ) => selector({ setPopulation }),
}));

vi.mock('@/components', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
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

vi.mock('./fields/LabelField', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <div>{value}</div>,
}));

vi.mock('./fields/InputField', () => ({
  __esModule: true,
  default: ({ label, value, onChange, disabled }: any) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  ),
}));

vi.mock('./fields/SelectField', () => ({
  __esModule: true,
  default: ({ label, value, options, onChange, disabled }: any) => (
    <label>
      <span>{label}</span>
      <select
        aria-label={label}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">--</option>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock('./fields/CheckboxField', () => ({
  __esModule: true,
  default: ({ label, value, onChange, disabled }: any) => (
    <div>
      <span>{label}</span>
      <button type="button" disabled={disabled} onClick={() => onChange(['Y'])}>
        {Array.isArray(value) && value.includes('Y') ? 'checked-yes' : 'yes'}
      </button>
      <button type="button" disabled={disabled} onClick={() => onChange(['N'])}>
        {Array.isArray(value) && value.includes('N') ? 'checked-no' : 'no'}
      </button>
    </div>
  ),
}));

vi.mock('./fields/MultiSelectField', () => ({
  __esModule: true,
  default: ({ label }: any) => <div>{label}</div>,
}));

vi.mock('./fields/TextboxListField', () => ({
  __esModule: true,
  default: ({ label, value, onChange, count, disabled }: any) => (
    <div>
      <span>{label}</span>
      {Array.from({ length: count }).map((_, index) => (
        <input
          key={index}
          aria-label={`${label}-${index + 1}`}
          value={value?.[index] ?? ''}
          disabled={disabled}
          onChange={e => {
            const next = [...(value ?? [])];
            next[index] = e.target.value;
            onChange(next);
          }}
        />
      ))}
    </div>
  ),
}));

vi.mock('./fields/TimeRangeField', () => ({
  __esModule: true,
  default: ({ label, value, onChange, disabled }: any) => (
    <div>
      <span>{label}</span>
      <input
        aria-label={`${label}-start`}
        value={value?.start ?? ''}
        disabled={disabled}
        onChange={e => onChange({ ...(value ?? {}), start: e.target.value })}
      />
      <input
        aria-label={`${label}-end`}
        value={value?.end ?? ''}
        disabled={disabled}
        onChange={e => onChange({ ...(value ?? {}), end: e.target.value })}
      />
    </div>
  ),
}));

import EnvBackup from './Backup';

const poiId = 101;
const layersData = [
  {
    subCategories: [
      {
        pois: [{ id: poiId, provCode: '10', provGrade: 'A' }],
      },
    ],
  },
];

const buildField = (overrides: Record<string, any>) => ({
  FIELD_ID: 'field-1',
  FIELD_NAME: 'TEXT_FIELD',
  TITLE: 'Field 1',
  INPUT_TYPE: 'Text',
  DATA_TYPE: 'STRING',
  VALUE: '',
  SEQ: 1,
  IS_REQUIRED: false,
  IS_LOCKED: false,
  ...overrides,
});

const renderComponent = (props: Partial<React.ComponentProps<typeof EnvBackup>> = {}) =>
  render(<EnvBackup poiId={poiId} subCode="SUB-A" layersData={layersData} {...props} />);

describe('EnvBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCommonCodes.mockResolvedValue([]);
  });

  it('loads existing form data and renders POI-derived province fields', async () => {
    fetchDynamicForm.mockResolvedValueOnce({
      FORM_TITLE: 'Env Form',
      FORM_VERSION_ID: 9,
      CREATED_USER: 'tester',
      form: { FORM_ID: 44 },
      fields: [
        buildField({
          FIELD_ID: 'prov-code',
          FIELD_NAME: 'PROV_CODE',
          TITLE: 'Province Code',
        }),
        buildField({
          FIELD_ID: 'prov-rate',
          FIELD_NAME: 'PROV_RATE',
          TITLE: 'Province Rate',
          SEQ: 2,
        }),
      ],
    });

    renderComponent();

    expect(await screen.findByText('Env Form')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByLabelText('Province Code')).toHaveValue('10');
    expect(screen.getByLabelText('Province Rate')).toHaveValue('A');
    expect(fetchDynamicForm).toHaveBeenCalledWith('poi', '101');
    expect(fetchDynamicBlankFormBySubzone).not.toHaveBeenCalled();
  });

  it('falls back to blank form and shows required validation popup before save', async () => {
    fetchDynamicForm.mockResolvedValueOnce({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูล' },
    });
    fetchDynamicBlankFormBySubzone.mockResolvedValueOnce({
      form: { FORM_TITLE: 'Blank Form', FORM_VERSION_ID: 3 },
      fields: [
        buildField({
          FIELD_ID: 'required-field',
          TITLE: 'Required Name',
          IS_REQUIRED: true,
        }),
      ],
    });

    renderComponent();

    const confirmButton = await screen.findByRole('button', { name: 'ยืนยันข้อมูล' });
    await userEvent.click(confirmButton);

    expect(await screen.findByTestId('popup-alert')).toBeInTheDocument();
    expect(screen.getByTestId('popup-type')).toHaveTextContent('error');
    expect(screen.getByTestId('popup-message')).toHaveTextContent(
      'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน'
    );
    expect(createDynamicForm).not.toHaveBeenCalled();
    expect(fetchDynamicBlankFormBySubzone).toHaveBeenCalledWith('SUB-A');
  });

  it('creates a new form successfully and refetches latest population values', async () => {
    fetchDynamicForm
      .mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูล' },
      })
      .mockResolvedValueOnce({
        form: { FORM_ID: 55 },
        fields: [
          buildField({
            FIELD_ID: 'pop-id',
            FIELD_NAME: 'TOTAL_POPULATION',
            TITLE: 'Population',
            VALUE: '1200',
          }),
          buildField({
            FIELD_ID: 'pct-id',
            FIELD_NAME: 'EXPECTED_CUSTOMER_PCT',
            TITLE: 'Percent',
            VALUE: '15',
            SEQ: 2,
          }),
        ],
      });
    fetchDynamicBlankFormBySubzone.mockResolvedValueOnce({
      form: { FORM_TITLE: 'Blank Form', FORM_VERSION_ID: 7, CREATED_USER: 'creator' },
      fields: [
        buildField({
          FIELD_ID: 'pop-id',
          FIELD_NAME: 'TOTAL_POPULATION',
          TITLE: 'Population',
          VALUE: '1200',
        }),
        buildField({
          FIELD_ID: 'pct-id',
          FIELD_NAME: 'EXPECTED_CUSTOMER_PCT',
          TITLE: 'Percent',
          VALUE: '15',
          SEQ: 2,
        }),
      ],
    });
    createDynamicForm.mockResolvedValueOnce({ success: true });

    renderComponent();

    const confirmButton = await screen.findByRole('button', { name: 'ยืนยันข้อมูล' });
    await userEvent.click(confirmButton);

    await waitFor(() => expect(createDynamicForm).toHaveBeenCalledTimes(1));
    expect(createDynamicForm).toHaveBeenCalledWith(
      expect.objectContaining({
        formVersionId: 7,
        poiId: '101',
        referenceObj: 'poi',
        referenceKey: '101',
        createdUser: 'creator',
      })
    );
    expect(await screen.findByTestId('popup-message')).toHaveTextContent(
      'บันทึกข้อมูลสำเร็จ'
    );
    await waitFor(() => expect(setPopulation).toHaveBeenCalledWith(101, '1200', '15'));
  });

  it('updates an existing form when form id is present', async () => {
    fetchDynamicForm.mockResolvedValueOnce({
      FORM_TITLE: 'Existing Form',
      FORM_VERSION_ID: 5,
      CREATED_USER: 'editor',
      form: { FORM_ID: 999 },
      fields: [
        buildField({ FIELD_ID: 'editable', TITLE: 'Editable', VALUE: 'old value' }),
      ],
    });
    updateDynamicForm.mockResolvedValueOnce({ success: true });

    renderComponent();

    const input = await screen.findByLabelText('Editable');
    await userEvent.clear(input);
    await userEvent.type(input, 'new value');
    await userEvent.click(screen.getByRole('button', { name: 'ยืนยันข้อมูล' }));

    await waitFor(() => expect(updateDynamicForm).toHaveBeenCalledTimes(1));
    expect(updateDynamicForm).toHaveBeenCalledWith(
      999,
      expect.objectContaining({
        formVersionId: 5,
        poiId: '101',
        referenceObj: 'poi',
        referenceKey: '101',
        LastEditsUser: 'editor',
      })
    );
    expect(screen.getByTestId('popup-message')).toHaveTextContent('อัปเดตข้อมูลสำเร็จ');
  });

  it('blocks save when time range end is missing', async () => {
    fetchDynamicForm.mockResolvedValueOnce({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูล' },
    });
    fetchDynamicBlankFormBySubzone.mockResolvedValueOnce({
      form: { FORM_TITLE: 'Blank Form', FORM_VERSION_ID: 3 },
      fields: [
        buildField({
          FIELD_ID: 'time-1',
          TITLE: 'Open Time',
          INPUT_TYPE: 'TimeRange',
          VALUE: { start: '08:00', end: '' },
        }),
      ],
    });

    renderComponent();

    await userEvent.click(await screen.findByRole('button', { name: 'ยืนยันข้อมูล' }));

    expect(await screen.findByTestId('popup-message')).toHaveTextContent(
      'Open Time: กรุณาเลือกเวลาสิ้นสุด'
    );
    expect(createDynamicForm).not.toHaveBeenCalled();
  });
});
