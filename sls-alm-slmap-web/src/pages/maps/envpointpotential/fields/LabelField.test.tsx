import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import LabelField from './LabelField';

describe('LabelField', () => {
  // Verifies the component renders the provided heading text.
  it('renders the provided label text', () => {
    render(<LabelField value="Potential Analysis" />);

    expect(screen.getByText('Potential Analysis')).toBeInTheDocument();
  });
});
