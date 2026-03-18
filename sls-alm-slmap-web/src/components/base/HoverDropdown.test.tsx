import { act, fireEvent, render, screen } from '@testing-library/react';
import { HoverDropdown } from './HoverDropdown';

afterEach(() => {
  vi.useRealTimers();
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('HoverDropdown', () => {
  const options = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
    { value: 'gamma', label: 'Gamma', disabled: true },
  ];

  // Section: single select and clear behavior
  it('opens on click, selects an option, and clears the selection', async () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <HoverDropdown
        options={options}
        value=""
        onChange={handleChange}
        placeholder="Choose item"
      />
    );

    fireEvent.click(screen.getByText('Choose item'));
    fireEvent.click(screen.getByText('Beta'));

    expect(handleChange).toHaveBeenCalledWith('beta', options[1]);

    rerender(
      <HoverDropdown
        options={options}
        value="beta"
        onChange={handleChange}
        placeholder="Choose item"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));

    expect(handleChange).toHaveBeenCalledWith('', { value: '', label: '' });
  });

  // Section: searchable multiple selection
  it('filters options, reports empty search results, and emits multiple selection updates', async () => {
    const handleMultipleChange = vi.fn();
    const multiOptions = [
      { value: 'react', label: 'React' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'docker', label: 'Docker' },
    ];

    render(
      <HoverDropdown
        options={multiOptions}
        multiple
        searchable
        selectedValues={['react']}
        onMultipleChange={handleMultipleChange}
        placeholder="Choose skills"
      />
    );

    const openSelectedDropdown = () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'clear' }).parentElement as HTMLElement
      );
    };

    openSelectedDropdown();
    fireEvent.click(screen.getByText('TypeScript'));

    expect(handleMultipleChange).toHaveBeenCalledWith(
      ['react', 'typescript'],
      [multiOptions[0], multiOptions[1]]
    );
    fireEvent.change(screen.getByPlaceholderText('maps:search_option'), {
      target: { value: 'zzz' },
    });

    expect(screen.getByText('maps:no_options_found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(handleMultipleChange).toHaveBeenCalledWith([], []);
  });

  // Section: hover-open tooltip and outside click
  it('opens on hover after the configured delay, shows the tooltip, and closes on outside click', async () => {
    vi.useFakeTimers();

    render(
      <HoverDropdown
        options={options}
        openOnHover
        hoverDelay={150}
        closeDelay={200}
        tooltip="Helpful tooltip"
        placeholder="Hover here"
      />
    );

    const trigger = screen
      .getByText('Hover here')
      .closest('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByText('Alpha')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText('Helpful tooltip')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });
});
