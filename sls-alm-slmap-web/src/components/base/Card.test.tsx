import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  // Section: basic content rendering
  it('renders title, body content, and action area', () => {
    render(
      <Card title="Profile" actions={<button>Open</button>}>
        <p>Card body</p>
      </Card>
    );

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Card body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    expect(screen.getByText('Open').closest('div')).toHaveClass(
      'card-actions',
      'justify-end'
    );
  });

  // Section: image rendering
  it('renders the card image with the title as alt text when provided', () => {
    render(
      <Card title="Hero" image="/hero.png">
        <span>Image card</span>
      </Card>
    );

    const image = screen.getByRole('img', { name: 'Hero' });
    expect(image).toHaveAttribute('src', '/hero.png');
    expect(screen.getByText('Image card')).toBeInTheDocument();
  });

  // Section: compact and fallback alt behavior
  it('applies compact styling and uses a fallback image alt when there is no title', () => {
    const { container } = render(
      <Card compact className="custom-card" image="/fallback.png">
        <span>Compact card</span>
      </Card>
    );

    expect(container.firstChild).toHaveClass(
      'card',
      'bg-base-100',
      'shadow-xl',
      'card-compact',
      'custom-card'
    );
    expect(screen.getByRole('img', { name: 'Card image' })).toHaveAttribute(
      'src',
      '/fallback.png'
    );
    expect(screen.getByText('Compact card')).toBeInTheDocument();
  });
});
