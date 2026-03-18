import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import CheckboxField from './CheckboxField';

describe('CheckboxField', () => {
  const options = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  // Verifies the component renders the label, required marker, and checked state from the provided value.
  it('renders label, required marker, and checked values', () => {
    render(
      <CheckboxField
        label="Choose options"
        value={['yes']}
        required
        options={options}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Choose options')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Yes' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'No' })).not.toBeChecked();
  });

  // Verifies clicking a checkbox sends the clicked option value to the change handler.
  it('calls onChange with the clicked option value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CheckboxField
        label="Choose options"
        value={[]}
        options={options}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('checkbox', { name: 'No' }));

    expect(onChange).toHaveBeenCalledWith('no');
  });

  // Verifies the component shows the validation message and error styling when showError is enabled.
  it('shows validation error styling and message', () => {
    render(
      <CheckboxField
        label="Choose options"
        value={[]}
        options={options}
        onChange={vi.fn()}
        showError
        errorMsg="Please select at least one"
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Yes' });
    expect(checkbox).toHaveClass('border-red-500');
    expect(screen.getByText('Please select at least one')).toBeInTheDocument();
  });

  // Verifies disabled styles are applied to the wrapper when the field is disabled.
  it('adds disabled styles to the wrapper', () => {
    const { container } = render(
      <CheckboxField
        label="Choose options"
        value={[]}
        options={options}
        onChange={vi.fn()}
        disabled
      />
    );

    expect(container.firstChild).toHaveClass('opacity-50');
    expect(container.firstChild).toHaveClass('pointer-events-none');
  });
});
