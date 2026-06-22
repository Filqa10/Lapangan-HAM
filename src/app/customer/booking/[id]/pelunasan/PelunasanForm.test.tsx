import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/lib/i18n';
import { PelunasanForm } from './PelunasanForm';

const useActionStateMock = vi.hoisted(() => vi.fn());

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

vi.mock('@/actions/bookings', () => ({
  submitPelunasanAction: vi.fn(),
}));

describe('PelunasanForm', () => {
  const mockStorage = () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  };

  it('shows updated upload file formats without pdf claims before submit', () => {
    useActionStateMock.mockReturnValue([{ ok: false }, vi.fn(), false]);
    mockStorage();

    render(
      <I18nProvider>
        <PelunasanForm bookingId={42} remainingAmount={1610000} />
      </I18nProvider>,
    );

    expect(screen.getByText('JPG, PNG, WebP • Max 5MB')).toBeInTheDocument();
    expect(screen.queryByText(/pdf/i)).not.toBeInTheDocument();
  });

  it('shows a final payment success panel with history cta', () => {
    useActionStateMock.mockReturnValue([
      { ok: true, message: 'Final payment proof submitted.', bookingId: 42 },
      vi.fn(),
      false,
    ]);
    mockStorage();

    render(
      <I18nProvider>
        <PelunasanForm bookingId={42} remainingAmount={1610000} />
      </I18nProvider>,
    );

    expect(screen.getByText('Booking #42')).toBeInTheDocument();
    expect(screen.getByText('Final payment proof submitted.')).toBeInTheDocument();
    expect(screen.getByText(/wait for final payment verification in your history/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open history/i })).toHaveAttribute('href', '/customer/history');
  });
});
