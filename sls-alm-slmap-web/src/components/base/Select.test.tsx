import { fireEvent, render, screen } from '@testing-library/react';
import Select from './Select';

describe('Select', () => {
  const options = [
    { value: 'north', label: 'North' },
    { value: 'south', label: 'South' },
  ];

  // Section: legend placeholder and option rendering
  it('renders title, description, placeholder, and options with default sizing', () => {
    render(
      <Select
        options={options}
        value=""
        onChange={vi.fn()}
        title="Region"
        description="Choose a region"
        placeholder="Select region"
      />
    );

    const select = screen.getByRole('combobox');

    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('Choose a region')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Select region' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'North' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'South' })).toBeInTheDocument();
    expect(select).toHaveClass('select', 'select-md', 'rounded-md');
    expect(select).toHaveValue('');
  });

  // Section: change events and custom sizing
  it('forwards change events and applies custom size and class names', () => {
    const observedValues: string[] = [];
    const handleChange = vi.fn(event => {
      observedValues.push(event.target.value);
    });

    render(
      <Select
        options={options}
        value="north"
        onChange={handleChange}
        size="lg"
        className="extra-select"
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('select-lg', 'rounded-lg', 'extra-select');
    expect(select).toHaveValue('north');

    fireEvent.change(select, { target: { value: 'south' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(observedValues).toEqual(['south']);
  });

  // Section: disabled state
  it('supports disabled selects without a placeholder option', () => {
    render(<Select options={options} value="south" disabled size="sm" />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveClass('select-sm', 'rounded-sm', 'disabled:bg-gray-100');
    expect(
      screen.queryByRole('option', { name: 'Select region' })
    ).not.toBeInTheDocument();
  });
});
