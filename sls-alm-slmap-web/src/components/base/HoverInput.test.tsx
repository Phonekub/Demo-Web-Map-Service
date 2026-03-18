import { act, fireEvent, render, screen } from '@testing-library/react';
import HoverInput from './HoverInput';

afterEach(() => {
  vi.useRealTimers();
});

describe('HoverInput', () => {
  // Section: base render and change events
  it('renders with base classes and forwards input changes', () => {
    const handleChange = vi.fn();

    render(
      <HoverInput
        placeholder="Type here"
        value="abc"
        onChange={handleChange}
        variant="primary"
        size="lg"
      />
    );

    const input = screen.getByPlaceholderText('Type here');
    expect(input).toHaveValue('abc');
    expect(input).toHaveClass('px-4', 'py-3', 'text-lg', 'border-blue-300', 'shadow-sm');

    fireEvent.change(input, { target: { value: 'next' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  // Section: hover-driven icon tooltip and autofocus
  it('shows hover UI after the delay and focuses the input when autoFocusOnHover is enabled', () => {
    vi.useFakeTimers();

    render(
      <HoverInput
        placeholder="Hover me"
        value="hello"
        onChange={vi.fn()}
        hoverDelay={150}
        hoverIcon={<span data-testid="hover-icon">H</span>}
        tooltip="Hover tooltip"
        autoFocusOnHover
      />
    );

    const input = screen.getByPlaceholderText('Hover me');
    const wrapper = input.parentElement as HTMLElement;

    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByTestId('hover-icon')).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input).toHaveClass('shadow-md', 'pl-10');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText('Hover tooltip')).toBeInTheDocument();
  });

  // Section: clear-button behavior
  it('shows the clear button on hover and uses onClear or onChange fallback', () => {
    vi.useFakeTimers();

    const handleClear = vi.fn();
    const handleChange = vi.fn();
    const { rerender } = render(
      <HoverInput
        value="filled"
        onChange={vi.fn()}
        showClearOnHover
        onClear={handleClear}
      />
    );

    const firstInput = screen.getByDisplayValue('filled');
    fireEvent.mouseEnter(firstInput.parentElement as HTMLElement);
    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.click(screen.getByRole('button'));
    expect(handleClear).toHaveBeenCalledTimes(1);

    rerender(
      <HoverInput
        value="filled"
        showClearOnHover
        onChange={handleChange}
        placeholder="Fallback clear"
      />
    );

    const secondInput = screen.getByDisplayValue('filled');
    fireEvent.mouseEnter(secondInput.parentElement as HTMLElement);
    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.click(screen.getByRole('button'));
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: '' } })
    );
  });
});
