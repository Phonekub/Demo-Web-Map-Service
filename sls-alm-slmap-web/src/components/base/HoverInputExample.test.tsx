import { act, fireEvent, render, screen, within } from '@testing-library/react';
import HoverInputExample from './HoverInputExample';

afterEach(() => {
  vi.useRealTimers();
});

const getSummaryRow = (label: string) =>
  screen.getByText(`${label}:`, { selector: 'strong' }).parentElement as HTMLElement;

describe('HoverInputExample', () => {
  // Section: initial example rendering
  it('renders the example sections and empty value summaries', () => {
    render(<HoverInputExample />);

    expect(screen.getByText('HoverInput Examples')).toBeInTheDocument();
    expect(screen.getByText('Basic Hover Input')).toBeInTheDocument();
    expect(screen.getByText('Search Input')).toBeInTheDocument();
    expect(screen.getByText('Email Input')).toBeInTheDocument();
    expect(screen.getByText('Number Input')).toBeInTheDocument();
    expect(screen.getByText('Advanced Search Bar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(getSummaryRow('Basic')).toHaveTextContent('Basic: empty');
    expect(getSummaryRow('Search')).toHaveTextContent('Search: empty');
    expect(getSummaryRow('Email')).toHaveTextContent('Email: empty');
    expect(getSummaryRow('Number')).toHaveTextContent('Number: empty');
  });

  // Section: controlled input updates
  it('updates the displayed values when each controlled input changes', () => {
    render(<HoverInputExample />);

    fireEvent.change(screen.getByPlaceholderText('Hover me for effects...'), {
      target: { value: 'hello hover' },
    });
    fireEvent.change(screen.getByPlaceholderText('Search with hover icon...'), {
      target: { value: 'stores' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your email...'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter a number...'), {
      target: { value: '24' },
    });

    expect(getSummaryRow('Basic')).toHaveTextContent('Basic: hello hover');
    expect(getSummaryRow('Search')).toHaveTextContent('Search: stores');
    expect(getSummaryRow('Email')).toHaveTextContent('Email: user@example.com');
    expect(getSummaryRow('Number')).toHaveTextContent('Number: 24');
    expect(
      screen.getByPlaceholderText('Advanced search with all features...')
    ).toHaveValue('stores');
  });

  // Section: shared search state and hover clear action
  it('clears the shared search value from the hover clear button', () => {
    vi.useFakeTimers();

    render(<HoverInputExample />);

    const searchInput = screen.getByPlaceholderText('Search with hover icon...');
    fireEvent.change(searchInput, { target: { value: 'query text' } });

    const wrapper = searchInput.parentElement as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.click(within(wrapper).getByRole('button'));

    expect(searchInput).toHaveValue('');
    expect(
      screen.getByPlaceholderText('Advanced search with all features...')
    ).toHaveValue('');
    expect(getSummaryRow('Search')).toHaveTextContent('Search: empty');
  });
});
