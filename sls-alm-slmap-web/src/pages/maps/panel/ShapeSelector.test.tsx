import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { ShapeSelector } from './ShapeSelector';

describe('ShapeSelector', () => {
  // --- Rendered shape options ---
  // Shows all supported shape buttons with their visible labels.
  it('renders all supported shape options', () => {
    render(<ShapeSelector onShapeSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'วงกลม' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'รูปหลายเหลี่ยม' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'สี่เหลี่ยม' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'วงรี' })).toBeInTheDocument();
  });

  // --- Shape callback mapping ---
  // Calls back with the correct shape key for each selector button.
  it('maps each button click to the expected shape value', async () => {
    const onShapeSelect = vi.fn();
    const user = userEvent.setup();

    render(<ShapeSelector onShapeSelect={onShapeSelect} />);

    await user.click(screen.getByRole('button', { name: 'วงกลม' }));
    await user.click(screen.getByRole('button', { name: 'รูปหลายเหลี่ยม' }));
    await user.click(screen.getByRole('button', { name: 'สี่เหลี่ยม' }));
    await user.click(screen.getByRole('button', { name: 'วงรี' }));

    expect(onShapeSelect.mock.calls).toEqual([
      ['circle'],
      ['polygon'],
      ['rectangle'],
      ['ellipse'],
    ]);
  });
});
