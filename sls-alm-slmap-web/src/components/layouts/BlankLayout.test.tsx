import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BlankLayout } from './BlankLayout';

describe('BlankLayout', () => {
  it('renders children correctly and has data-theme light', () => {
    const { container } = render(
      <BlankLayout>
        <div data-testid="child-element">Test Child</div>
      </BlankLayout>
    );

    const child = screen.getByTestId('child-element');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Test Child');

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('min-h-screen');
    expect(wrapper).toHaveAttribute('data-theme', 'light');
  });
});
