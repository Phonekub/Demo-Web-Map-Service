import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequirePermission } from './RequirePermission';

// Mock the user store
const mockUseUserStore = vi.fn();

vi.mock('@/stores', () => ({
  useUserStore: () => mockUseUserStore(),
}));

describe('RequirePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user has the required permission (single string)', () => {
    mockUseUserStore.mockReturnValue({
      user: {
        permissions: ['READ_DATA', 'WRITE_DATA'],
      },
    });

    render(
      <RequirePermission permission="READ_DATA">
        <div>Protected Content</div>
      </RequirePermission>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not render children when user misses the required permission (single string)', () => {
    mockUseUserStore.mockReturnValue({
      user: {
        permissions: ['READ_DATA'],
      },
    });

    render(
      <RequirePermission permission="DELETE_DATA">
        <div>Protected Content</div>
      </RequirePermission>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user has at least one of the required permissions (array)', () => {
    mockUseUserStore.mockReturnValue({
      user: {
        permissions: ['READ_DATA'],
      },
    });

    render(
      <RequirePermission permission={['DELETE_DATA', 'READ_DATA']}>
        <div>Protected Content</div>
      </RequirePermission>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not render children when user has none of the required permissions (array)', () => {
    mockUseUserStore.mockReturnValue({
      user: {
        permissions: ['READ_DATA'],
      },
    });

    render(
      <RequirePermission permission={['DELETE_DATA', 'WRITE_DATA']}>
        <div>Protected Content</div>
      </RequirePermission>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('does not render children when user is null', () => {
    mockUseUserStore.mockReturnValue({
      user: null,
    });

    render(
      <RequirePermission permission="READ_DATA">
        <div>Protected Content</div>
      </RequirePermission>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('does not render children when user permissions are empty', () => {
    mockUseUserStore.mockReturnValue({
      user: {
        permissions: [],
      },
    });

    render(
      <RequirePermission permission="READ_DATA">
        <div>Protected Content</div>
      </RequirePermission>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
