import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Input as a plain HTML input so the field logic can be tested more directly.
vi.mock('../../../../components', () => ({
  Input: ({ className, ...props }: any) => <input className={className} {...props} />,
}));

import InputField from './InputField';

describe('InputField', () => {
  // Verifies the component renders the label and forwards the main input props.
  it('renders label and forwards core input props', () => {
    const onKeyDown = vi.fn();

    render(
      <InputField
        label="Radius"
        value="10"
        required
        type="number"
        min={1}
        max={99}
        step={1}
        pattern="[0-9]+"
        onChange={vi.fn()}
        onKeyDown={onKeyDown}
        disabled
      />
    );

    const input = screen.getByRole('spinbutton');
    expect(screen.getByText('Radius')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '99');
    expect(input).toHaveAttribute('step', '1');
    expect(input).toBeDisabled();
  });

  // Verifies leading zeroes are trimmed before the value is sent through onChange.
  it('removes leading zeroes for number inputs', () => {
    const onChange = vi.fn();

    render(<InputField label="Radius" value="" type="number" onChange={onChange} />);

    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '007' },
    });

    expect(onChange.mock.calls[0][0].target.value).toBe('7');
  });

  // Verifies values below one are normalized to one and any local error is cleared.
  it('normalizes numbers below one and clears error state', () => {
    const onChange = vi.fn();
    const onError = vi.fn();

    render(
      <InputField
        label="Radius"
        value=""
        type="number"
        onChange={onChange}
        onError={onError}
      />
    );

    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '0' },
    });

    expect(onChange.mock.calls[0][0].target.value).toBe('1');
    expect(onError).toHaveBeenCalledWith('');
  });

  // Verifies min/max validation and the error message produced by the component state.
  it('shows range validation errors for out-of-range values', () => {
    const onChange = vi.fn();
    const onError = vi.fn();

    render(
      <InputField
        label="Radius"
        value=""
        type="number"
        min={2}
        max={5}
        onChange={onChange}
        onError={onError}
        showError
      />
    );

    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '9' },
    });

    expect(onError).toHaveBeenLastCalledWith('ค่าที่สามารถใส่ได้ 2 - 5');
    expect(screen.getByText('ค่าที่สามารถใส่ได้ 2 - 5')).toBeInTheDocument();
  });

  // Verifies an external errorMsg is rendered directly when showError is enabled.
  it('prefers external errorMsg when provided', () => {
    render(
      <InputField
        label="Radius"
        value=""
        onChange={vi.fn()}
        showError
        errorMsg="Required field"
      />
    );

    expect(screen.getByText('Required field')).toBeInTheDocument();
  });
});
