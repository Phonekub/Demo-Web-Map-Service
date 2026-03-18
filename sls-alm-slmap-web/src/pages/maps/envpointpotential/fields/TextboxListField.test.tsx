import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Input used by the percent and total displays as a plain HTML input.
vi.mock('@/components', () => ({
  Input: ({ className, ...props }: any) => <input className={className} {...props} />,
}));

import TextboxListField from './TextboxListField';

describe('TextboxListField', () => {
  // Verifies the field renders the main label, item labels, and initial values for the requested count.
  it('renders the requested number of inputs with item labels', () => {
    render(
      <TextboxListField
        label="Population"
        value={['10', '20']}
        count={2}
        itemLabels={['Male', 'Female']}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Population')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  // Verifies numeric inputs keep the entered numeric value and emit local values on blur.
  it('filters numeric input and emits local values on blur', () => {
    const onChange = vi.fn();

    render(
      <TextboxListField
        label="Population"
        value={['', '']}
        count={2}
        onChange={onChange}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '05' } });
    fireEvent.blur(inputs[0]);

    expect(inputs[0]).toHaveValue(5);
    expect(onChange).toHaveBeenCalledWith(['05', '']);
  });

  // Verifies regex validation filters the value down to matching characters before blur emits it.
  it('filters characters by validateRegex before blur', () => {
    const onChange = vi.fn();

    render(
      <TextboxListField
        label="Code"
        value={['']}
        count={1}
        type="string"
        validateRegex="^[0-9]+$"
        onChange={onChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a1b2' } });
    fireEvent.blur(input);

    expect(input).toHaveValue('12');
    expect(onChange).toHaveBeenCalledWith(['12']);
  });

  // Verifies percentage and total calculations, including the total-range validation message.
  it('shows computed percentages, total, and total validation errors', () => {
    render(
      <TextboxListField
        label="Share"
        value={['20', '30']}
        count={2}
        itemLabels={['A', 'B']}
        isShowPercent
        isShowTotal
        totalTitle="Sum"
        validateTotalMax={40}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('40.00%')).toBeInTheDocument();
    expect(screen.getByDisplayValue('60.00%')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByText('Sum')).toBeInTheDocument();
    expect(screen.getByText('Total ต้องไม่เกิน 40')).toBeInTheDocument();
  });

  // Verifies min/max validation messages are shown with the matching item label when showError is enabled.
  it('shows min/max validation messages for numeric items', () => {
    render(
      <TextboxListField
        label="Score"
        value={['6']}
        count={1}
        itemLabels={['Branch A']}
        validateMax={5}
        showError
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('ค่า Branch A ต้องไม่เกิน 5')).toBeInTheDocument();
  });
});
