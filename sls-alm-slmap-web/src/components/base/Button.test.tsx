import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  // Section: default rendering
  it('renders children with default classes and triggers clicks', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Save changes</Button>);

    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('btn', 'btn-md', 'btn-primary', 'rounded-lg');
    expect(button).toBeEnabled();

    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Section: icon placement and tooltip wrapper
  it('renders icons on the requested side and exposes tooltip metadata', () => {
    render(
      <Button
        variant="success"
        size="lg"
        tooltip="Save tooltip"
        tooltipPosition="bottom"
        icon={<span data-testid="left-icon">L</span>}
      >
        Save
      </Button>
    );

    const button = screen.getByRole('button', { name: 'LSave' });
    const wrapper = button.parentElement;

    expect(button).toHaveClass('btn-lg', 'btn-success', 'gap-2');
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(wrapper).toHaveClass('tooltip', 'tooltip-bottom');
    expect(wrapper).toHaveAttribute('data-tip', 'Save tooltip');
  });

  // Section: icon-only rendering
  it('renders icon-only buttons with circle styling and disabled state', () => {
    render(
      <Button
        iconOnly
        icon={<span data-testid="only-icon">+</span>}
        disabled
        className="extra"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn', 'btn-sm', 'btn-circle', 'btn-primary', 'extra');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('only-icon')).toBeInTheDocument();
    expect(screen.queryByText('+')).toBeInTheDocument();
  });
});
