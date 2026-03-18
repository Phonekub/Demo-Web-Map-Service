import React from 'react';
import { useUserStore } from '@/stores';
import { useLanguageStore } from '@/stores/languageStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import { NavLink } from 'react-router-dom';
interface HeaderProps {
  className?: string;
}

const languages = [
  { code: 'th' as const, label: 'ไทย', flag: '🇹🇭' },
  { code: 'en' as const, label: 'Eng', flag: '🇺🇸' },
  { code: 'km' as const, label: 'ខ្មែរ', flag: '🇰🇭' },
];

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const { user, logout } = useUserStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation('navigation');

  const handleLogout = async () => {
    await logout();
  };

  const handleLanguageChange = (langCode: 'en' | 'th' | 'km') => {
    setLanguage(langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <header className={cn('bg-white border-b border-gray-200 px-4 py-3', className)}>
      <div className="container max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">DEMO</span>
          </div>
        </NavLink>
        {/* Navigation */}
        <nav className="hidden md:flex items-end space-x-6">
          <NavLink to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            {t('location_maps')}
          </NavLink>
        </nav>

        {/* User Info & Language Switcher */}
        <div className="flex items-center space-x-4">
          {/* Language Switcher Dropdown */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn flex items-center space-x-2">
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.label}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-30 mt-1 p-1 shadow-lg border border-gray-200"
            >
              {languages.map(lang => (
                <li key={lang.code}>
                  <button
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(
                      'flex items-center space-x-2',
                      language === lang.code && 'active bg-primary text-primary-content'
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                    {language === lang.code && (
                      <svg
                        className="w-4 h-4 ml-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* User Dropdown */}
          {user && (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar bg-primary-600"
              >
                <span className="text-white font-medium text-sm">
                  {user.fullName?.[0]}
                  {user.fullName?.split(' ')[1]?.[0]}
                </span>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] mt-2 w-56 p-0 shadow-lg border border-gray-200"
              >
                <li className="menu-title px-4 py-3 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                    {user.employeeId && (
                      <p className="text-xs text-gray-500 mt-1 font-normal">
                        ID: {user.employeeId}
                      </p>
                    )}
                  </div>
                </li>
                <li>
                  <button onClick={handleLogout} className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>{t('logout')}</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
