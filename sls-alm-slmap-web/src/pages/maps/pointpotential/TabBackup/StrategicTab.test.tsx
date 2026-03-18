import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const fetchCommonCodes = vi.fn();
const useQueryMock = vi.fn();
const backupHeaderMock = vi.fn();
const hoverDropdownMock = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock('@/services/master.service', () => ({
  fetchCommonCodes: (...args: unknown[]) => fetchCommonCodes(...args),
}));

vi.mock('./BackupHeader', () => ({
  BackupHeader: (props: any) => {
    backupHeaderMock(props);
    return <div data-testid="backup-header">backup-header</div>;
  },
}));

vi.mock('@/components/base/HoverDropdown', () => ({
  HoverDropdown: (props: any) => {
    hoverDropdownMock(props);
    return (
      <button
        data-testid={
          props.placeholder
            ? `dropdown-${props.value || 'empty'}`
            : `dropdown-${props.value || 'empty'}`
        }
        onClick={() => props.onChange?.(props.options?.[0]?.value ?? 'picked-value')}
      >
        {props.value || props.placeholder || 'dropdown'}
      </button>
    );
  },
}));

vi.mock('@/components', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
}));

import StrategicTab, { type StrategicTabRef } from './StrategicTab';

describe('StrategicTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCommonCodes.mockResolvedValue([
      { value: 'SL1', text: 'Strategic A' },
      { value: 'SL2', text: 'Strategic B' },
    ]);
    useQueryMock.mockReturnValue({
      data: [
        { value: 'SL1', label: 'Strategic A' },
        { value: 'SL2', label: 'Strategic B' },
      ],
    });
  });

  // --- Query configuration and backup hydration ---
  // Requests strategic common codes, hydrates backup values into the form, and exposes them through getData().
  it('configures the strategic query and hydrates backup data into the form state', async () => {
    const ref = createRef<StrategicTabRef>();

    render(
      <StrategicTab
        ref={ref}
        location={{ branchName: 'Branch 101' } as any}
        formLocNumber="FL-100"
        backupData={
          {
            strategicLocation: 'SL2',
            strategicSupport: 'SL1',
            strategicPlace: 'PLACE-9',
            strategicPlaceName: 'Mall Central',
            strategicPosition: 'POS-8',
            strategicFloor: 'Floor 3',
          } as any
        }
      />
    );

    expect(screen.getByTestId('backup-header')).toBeInTheDocument();
    expect(backupHeaderMock).toHaveBeenCalledWith(
      expect.objectContaining({ formLocNumber: 'FL-100' })
    );
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['commonCodes', 'STRATEGIC_LOCATION'],
      })
    );

    const queryConfig = useQueryMock.mock.calls[0][0] as any;
    await queryConfig.queryFn();
    expect(fetchCommonCodes).toHaveBeenCalledWith('STRATEGIC_LOCATION');

    expect(screen.getByDisplayValue('Mall Central')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Floor 3')).toBeInTheDocument();
    expect(ref.current?.getData()).toEqual({
      strategicLocation: 'SL2',
      strategicSupport: 'SL1',
      strategicPlace: 'PLACE-9',
      strategicPlaceName: 'Mall Central',
      strategicPosition: 'POS-8',
      strategicFloor: 'Floor 3',
    });
  });

  // --- Local state updates ---
  // Updates dropdown and input-backed local state, then returns the edited values through getData().
  it('updates strategic fields from dropdown and input interactions', async () => {
    const user = userEvent.setup();
    const ref = createRef<StrategicTabRef>();

    render(<StrategicTab ref={ref} location={null} formLocNumber="FL-100" />);

    const dropdowns = screen.getAllByRole('button');
    await user.click(dropdowns[0]);
    await user.click(dropdowns[1]);
    await user.click(dropdowns[2]);
    await user.click(dropdowns[3]);

    const textInputs = screen.getAllByRole('textbox');
    fireEvent.change(textInputs[0], { target: { value: 'Edited Place Name' } });
    fireEvent.change(textInputs[1], { target: { value: 'Edited Floor Name' } });

    expect(ref.current?.getData()).toEqual({
      strategicLocation: 'SL1',
      strategicSupport: 'SL1',
      strategicPlace: 'picked-value',
      strategicPlaceName: 'Edited Place Name',
      strategicPosition: 'picked-value',
      strategicFloor: 'Edited Floor Name',
    });
    expect(hoverDropdownMock).toHaveBeenCalled();
  });
});
