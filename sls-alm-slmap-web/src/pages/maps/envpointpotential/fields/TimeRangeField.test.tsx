import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import TimeRangeField from './TimeRangeField';

describe('TimeRangeField', () => {
  // Verifies the component renders the label, required marker, and both time inputs.
  it('renders label and both time inputs', () => {
    const { container } = render(
      <TimeRangeField
        label="Business Hours"
        value={{ start: '09:00', end: '18:00' }}
        required
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Business Hours')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(container.querySelectorAll('input[type="time"]')).toHaveLength(2);
  });

  // Verifies changing the start time sends the updated value without an error when the range is still valid.
  it('calls onChange with the updated start time', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimeRangeField
        label="Business Hours"
        value={{ start: '09:00', end: '18:00' }}
        onChange={onChange}
      />
    );

    const [startInput] = Array.from(container.querySelectorAll('input[type="time"]'));
    fireEvent.change(startInput, { target: { value: '10:00' } });

    expect(onChange).toHaveBeenCalledWith({ start: '10:00', end: '18:00' }, undefined);
  });

  // Verifies an end time earlier than the start time returns a local error and displays it on screen.
  it('returns and shows a validation error when end time is earlier than start time', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <TimeRangeField
        label="Business Hours"
        value={{ start: '12:00', end: '13:00' }}
        onChange={onChange}
        showError
      />
    );

    const [, endInput] = Array.from(container.querySelectorAll('input[type="time"]'));
    fireEvent.change(endInput, { target: { value: '11:00' } });

    expect(onChange).toHaveBeenCalledWith(
      { start: '12:00', end: '11:00' },
      'เวลาสิ้นสุดต้องมากกว่าหรือเท่ากับเวลาเริ่ม'
    );

    rerender(
      <TimeRangeField
        label="Business Hours"
        value={{ start: '12:00', end: '11:00' }}
        onChange={onChange}
        showError
      />
    );

    expect(
      screen.getByText('เวลาสิ้นสุดต้องมากกว่าหรือเท่ากับเวลาเริ่ม')
    ).toBeInTheDocument();
  });

  // Verifies the disabled state is reflected by the wrapper styles.
  it('adds disabled styles to the wrapper', () => {
    const { container } = render(
      <TimeRangeField
        label="Business Hours"
        value={{ start: '09:00', end: '18:00' }}
        onChange={vi.fn()}
        disabled
      />
    );

    expect(container.firstChild).toHaveClass('opacity-50');
    expect(container.firstChild).toHaveClass('pointer-events-none');
  });
});
