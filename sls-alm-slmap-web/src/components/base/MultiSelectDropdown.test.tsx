import { act, fireEvent, render, screen } from '@testing-library/react';
import MultiSelectDropdown from './MultiSelectDropdown';

afterEach(() => {
  vi.useRealTimers();
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('MultiSelectDropdown', () => {
  const options = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
    { value: 'gamma', label: 'Gamma', disabled: true },
  ];

  // Section: single-select rendering and clear flow
  it('opens on click, selects a single option, and clears the current value', () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <MultiSelectDropdown
        options={options}
        value=""
        onChange={handleChange}
        multiple={false}
        placeholder="Pick one"
      />
    );

    fireEvent.click(screen.getByText('Pick one'));
    fireEvent.click(screen.getByText('Beta'));

    expect(handleChange).toHaveBeenCalledWith('beta', options[1]);

    rerender(
      <MultiSelectDropdown
        options={options}
        value="beta"
        onChange={handleChange}
        multiple={false}
        placeholder="Pick one"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(handleChange).toHaveBeenCalledWith('', { value: '', label: '' });
  });

  // Section: multi-select searching and clear flow
  it('handles multiple selection, search filtering, and clearing selected values', () => {
    const handleMultipleChange = vi.fn();
    const multiOptions = [
      { value: 'react', label: 'React' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'docker', label: 'Docker' },
    ];

    render(
      <MultiSelectDropdown
        options={multiOptions}
        multiple
        searchable
        selectedValues={['react']}
        onMultipleChange={handleMultipleChange}
        placeholder="Choose skills"
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'clear' }).parentElement as HTMLElement
    );
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

  // Section: hover open and outside click behavior
  it('opens on hover after the delay, shows a tooltip, and closes on outside click', async () => {
    vi.useFakeTimers();

    render(
      <MultiSelectDropdown
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
