import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

const mockLogout = vi.fn();
const mockSetLanguage = vi.fn();
let mockUser: any = {
  fullName: 'Jane Doe',
  employeeId: '1001',
  permissions: ['USER_MANAGEMENT'],
};
let mockLanguage: 'th' | 'en' | 'km' = 'th';

vi.mock('@/stores', () => ({
  useUserStore: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

vi.mock('@/stores/languageStore', () => ({
  useLanguageStore: () => ({
    language: mockLanguage,
    setLanguage: mockSetLanguage,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ to, children, onClick, className }: any) => (
    <a
      href={to}
      onClick={event => {
        event.preventDefault();
        onClick?.(event);
      }}
      className={className}
    >
      {children}
    </a>
  ),
}));

vi.mock('./RequirePermission', () => ({
  RequirePermission: ({ children }: any) => <>{children}</>,
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLanguage = 'th';
    mockUser = {
      fullName: 'Jane Doe',
      employeeId: '1001',
      permissions: ['USER_MANAGEMENT'],
    };
  });

  // Section: render and navigation shell
  it('renders the logo, navigation links, language selector, and user info', () => {
    const { container } = render(<Header className="custom-shell" />);

    expect(screen.getByText('Map Platform')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'dashboard' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'location_maps' })).toHaveAttribute(
      'href',
      '/maps'
    );
    expect(screen.getByText('quota_management')).toBeInTheDocument();
    expect(screen.getByText('managedata')).toBeInTheDocument();
    expect(screen.getAllByText('ไทย')).toHaveLength(2);
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('ID: 1001')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('custom-shell');
  });

  // Section: language and logout actions
  it('changes language and triggers logout from the user menu', async () => {
    const user = userEvent.setup();

    render(<Header />);

    await user.click(screen.getByRole('button', { name: /🇺🇸/i }));
    expect(mockSetLanguage).toHaveBeenCalledWith('en');

    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  // Section: dropdown close behavior
  it('blurs the active element when a dropdown nav item is clicked', async () => {
    const user = userEvent.setup();

    render(<Header />);

    const quotaLink = screen.getByRole('link', { name: 'quota_searching' });
    quotaLink.focus();

    expect(document.activeElement).toBe(quotaLink);

    await user.click(quotaLink);

    expect(document.activeElement).not.toBe(quotaLink);
  });

  // Section: userless state
  it('omits the user dropdown when no user is available', () => {
    mockUser = null;

    render(<Header />);

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });
});
