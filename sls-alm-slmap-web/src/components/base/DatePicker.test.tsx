import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatePicker from './DatePicker';

describe('DatePicker', () => {
  beforeEach(() => {
    (HTMLInputElement.prototype as any).showPicker = vi.fn();
  });

  // Section: formatted display rendering
  it('renders the formatted display value and forwards date constraints to the hidden picker input', () => {
    const { container } = render(
      <DatePicker
        title="Start date"
        value={new Date('2026-03-13T00:00:00.000Z')}
        onChange={vi.fn()}
        minDate="2026-03-01"
        maxDate="2026-03-31"
        className="wrapper-class"
      />
    );

    const visibleInput = screen.getByDisplayValue('13/03/2026');
    const hiddenDateInput = container.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;

    expect(screen.getByText('Start date')).toBeInTheDocument();
    expect(visibleInput).toHaveAttribute('type', 'text');
    expect(visibleInput).toHaveAttribute('readonly');
    expect(hiddenDateInput).toHaveAttribute('type', 'date');
    expect(hiddenDateInput).toHaveAttribute('min', '2026-03-01');
    expect(hiddenDateInput).toHaveAttribute('max', '2026-03-31');
    expect(hiddenDateInput.parentElement).toHaveClass(
      'relative',
      'w-full',
      'wrapper-class'
    );
  });

  // Section: picker interactions
  it('opens the native picker on click and emits selected dates through onChange', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { container } = render(
      <DatePicker value={null} onChange={handleChange} placeholder="pick a day" />
    );

    const hiddenDateInput = container.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;

    await user.click(hiddenDateInput);
    expect((HTMLInputElement.prototype as any).showPicker).toHaveBeenCalledTimes(1);

    fireEvent.change(hiddenDateInput, { target: { value: '2026-04-05' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(new Date('2026-04-05'));
  });

  // Section: disabled behavior
  it('prevents picker opening and keeps inputs disabled when the control is disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { container } = render(
      <DatePicker value={null} onChange={handleChange} disabled />
    );

    const textInput = screen.getByRole('textbox');
    const hiddenDateInput = container.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;

    expect(textInput).toBeDisabled();
    expect(hiddenDateInput).toBeDisabled();
    expect(hiddenDateInput).toHaveClass('cursor-not-allowed');

    await user.click(hiddenDateInput);

    expect((HTMLInputElement.prototype as any).showPicker).not.toHaveBeenCalled();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
