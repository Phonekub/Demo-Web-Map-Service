import { fireEvent, render, screen } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  // Section: legend, description, and left icon rendering
  it('renders title metadata, children, and a left icon with padding classes', () => {
    render(
      <Input
        type="text"
        title="Branch name"
        required
        description="Enter the branch display name"
        placeholder="Branch"
        value="Central"
        icon={<span data-testid="left-icon">L</span>}
      >
        <span>Helper content</span>
      </Input>
    );

    const input = screen.getByPlaceholderText('Branch');

    expect(screen.getByText('Branch name')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('Enter the branch display name')).toBeInTheDocument();
    expect(screen.getByText('Helper content')).toBeInTheDocument();
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(input).toHaveValue('Central');
    expect(input).toHaveClass('input', 'input-md', 'pl-10');
  });

  // Section: right icon attributes and event forwarding
  it('applies right-icon classes and forwards input events and attributes', () => {
    const handleFocus = vi.fn();
    const handleChange = vi.fn();
    const handleKeyDown = vi.fn();
    const handleBlur = vi.fn();

    render(
      <Input
        type="number"
        placeholder="Amount"
        value={12}
        onFocus={handleFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        inputmode="numeric"
        icon={<span data-testid="right-icon">R</span>}
        iconPosition="right"
        size="lg"
        step={5}
        min={10}
        max={50}
        pattern="[0-9]+"
      />
    );

    const input = screen.getByPlaceholderText('Amount');

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(input).toHaveClass('input-lg', 'pr-10');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('step', '5');
    expect(input).toHaveAttribute('min', '10');
    expect(input).toHaveAttribute('max', '50');
    expect(input).toHaveAttribute('pattern', '[0-9]+');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    fireEvent.blur(input);

    expect(handleFocus).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  // Section: disabled and read-only state
  it('supports disabled, read-only, and custom class names', () => {
    render(
      <Input
        type="email"
        value="locked@example.com"
        disabled
        readOnly
        className="extra-class"
      />
    );

    const input = screen.getByDisplayValue('locked@example.com');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveClass(
      'disabled:bg-gray-100',
      'disabled:cursor-not-allowed',
      'extra-class'
    );
  });
});
