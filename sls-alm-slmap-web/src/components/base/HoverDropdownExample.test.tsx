import { act, fireEvent, render, screen } from '@testing-library/react';
import HoverDropdownExample from './HoverDropdownExample';

afterEach(() => {
  vi.useRealTimers();
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const getSummaryRow = (label: string) =>
  screen.getByText(`${label}:`, { selector: 'strong' }).parentElement as HTMLElement;

describe('HoverDropdownExample', () => {
  // Section: initial example rendering
  it('renders the example sections and initial summary state', () => {
    render(<HoverDropdownExample />);

    expect(screen.getByText('HoverDropdown Examples')).toBeInTheDocument();
    expect(screen.getByText('Basic Dropdown')).toBeInTheDocument();
    expect(screen.getByText('Searchable Dropdown')).toBeInTheDocument();
    expect(screen.getByText('Multiple Selection')).toBeInTheDocument();
    expect(screen.getByText('Open on Hover')).toBeInTheDocument();
    expect(getSummaryRow('Basic')).toHaveTextContent('Basic: Not selected');
    expect(getSummaryRow('Country')).toHaveTextContent('Country: Not selected');
    expect(getSummaryRow('Skills')).toHaveTextContent('Skills: Not selected');
    expect(getSummaryRow('Category')).toHaveTextContent('Category: Not selected');
  });

  // Section: basic and searchable interactions
  it('updates the basic and country summaries after selections', () => {
    render(<HoverDropdownExample />);

    fireEvent.click(screen.getAllByText('Select an option...')[0]);
    fireEvent.click(screen.getByText('Option 2'));

    expect(screen.getByText('Selected: option2')).toBeInTheDocument();
    expect(getSummaryRow('Basic')).toHaveTextContent('Basic: option2');

    fireEvent.click(screen.getByText('Search and select country...'));
    fireEvent.change(screen.getByPlaceholderText('maps:search_option'), {
      target: { value: 'jap' },
    });
    fireEvent.click(screen.getByText('Japan'));

    expect(screen.getByText('Selected: Japan')).toBeInTheDocument();
    expect(getSummaryRow('Country')).toHaveTextContent('Country: Japan');
  });

  // Section: multiple and hover-open interactions
  it('updates multiple-selection and hover-open category summaries', () => {
    vi.useFakeTimers();

    render(<HoverDropdownExample />);

    fireEvent.click(screen.getByText('Select your skills...'));
    fireEvent.click(screen.getByText('React'));
    fireEvent.click(screen.getByText('TypeScript'));

    expect(screen.getByText(/Selected \(2\):/)).toHaveTextContent(
      'Selected (2): react, typescript'
    );
    expect(getSummaryRow('Skills')).toHaveTextContent('Skills: 2 selected');

    fireEvent.mouseEnter(screen.getByText('Hover to open...'));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    fireEvent.click(screen.getByText('Technology'));

    expect(screen.getByText('Selected: Technology')).toBeInTheDocument();
    expect(getSummaryRow('Category')).toHaveTextContent('Category: Technology');
  });
});
