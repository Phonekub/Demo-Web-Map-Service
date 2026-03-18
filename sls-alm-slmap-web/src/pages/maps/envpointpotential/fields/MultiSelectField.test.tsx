import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const mockSelect = vi.fn();

// Mock react-select so the tests can inspect passed props and trigger onChange easily.
vi.mock('react-select', () => {
  const Option = ({ children }: any) => <div>{children}</div>;
  const Select = (props: any) => {
    mockSelect(props);
    return (
      <div data-testid="react-select">
        <span>{props.placeholder}</span>
        <button type="button" onClick={() => props.onChange([props.options[0]])}>
          select-first
        </button>
      </div>
    );
  };

  return {
    __esModule: true,
    default: Select,
    components: { Option },
  };
});

import MultiSelectField from './MultiSelectField';

describe('MultiSelectField', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Verifies string array values are mapped into react-select option objects and the required marker is shown.
  it('maps string array values to option objects', () => {
    render(
      <MultiSelectField
        label="Category"
        value={['a']}
        required
        options={options}
        onChange={vi.fn()}
      />
    );

    const props = mockSelect.mock.calls.at(-1)?.[0];
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(props.value).toEqual([{ value: 'a', label: 'Alpha' }]);
  });

  // Verifies a PostgreSQL-style array string is parsed and mapped into option objects.
  it('parses PostgreSQL array strings into selected options', () => {
    render(
      <MultiSelectField
        label="Category"
        value={'{"a","b"}' as any}
        options={options}
        onChange={vi.fn()}
      />
    );

    const props = mockSelect.mock.calls.at(-1)?.[0];
    expect(props.value).toEqual([
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ]);
  });

  // Verifies the selected option objects are forwarded from react-select through onChange.
  it('forwards selected option objects from react-select', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MultiSelectField
        label="Category"
        value={[]}
        options={options}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'select-first' }));

    expect(onChange).toHaveBeenCalledWith([{ value: 'a', label: 'Alpha' }]);
  });

  // Verifies error and disabled states are forwarded to react-select and reflected on the wrapper.
  it('shows error text and disables the select when requested', () => {
    const { container } = render(
      <MultiSelectField
        label="Category"
        value={['unknown']}
        options={options}
        onChange={vi.fn()}
        showError
        errorMsg="Please select category"
        disabled
      />
    );

    const props = mockSelect.mock.calls.at(-1)?.[0];
    expect(props.isDisabled).toBe(true);
    expect(props.value).toEqual([{ value: 'unknown', label: 'unknown' }]);
    expect(screen.getByText('Please select category')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('opacity-50');
  });
});
