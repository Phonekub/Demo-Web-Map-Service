import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import SelectField from './SelectField';

describe('SelectField', () => {
  const options = [
    { value: 'retail', label: 'Retail' },
    { value: 'service', label: 'Service' },
  ];

  // Verifies the component renders the label, required marker, and all select options.
  it('renders label, required marker, and select options', () => {
    render(
      <SelectField
        label="Business Type"
        value=""
        required
        options={options}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Business Type')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '-กรุณาเลือก-' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Retail' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Service' })).toBeInTheDocument();
  });

  // Verifies changing the selected option triggers onChange with the updated value.
  it('calls onChange when a new option is selected', () => {
    let receivedValue = '';
    const onChange = vi.fn(e => {
      receivedValue = e.target.value;
    });

    render(
      <SelectField label="Business Type" value="" options={options} onChange={onChange} />
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'service' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(receivedValue).toBe('service');
  });

  // Verifies the component shows the error message and disabled state.
  it('shows error message and disabled state', () => {
    render(
      <SelectField
        label="Business Type"
        value=""
        options={options}
        onChange={vi.fn()}
        showError
        errorMsg="Please choose one"
        disabled
      />
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByText('Please choose one')).toBeInTheDocument();
  });
});
