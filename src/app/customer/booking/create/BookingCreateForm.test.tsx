import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/lib/i18n';
import { BookingCreateForm } from './BookingCreateForm';

const useActionStateMock = vi.hoisted(() => vi.fn());
const flatpickrProps: Array<{ value?: unknown; onChange?: (dates: Date[]) => void }> = [];

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

vi.mock('react-flatpickr', () => ({
  default: (props: { value?: unknown; placeholder?: string; className?: string; onChange?: (dates: Date[]) => void }) => {
    flatpickrProps.push(props);
    return (
      <input
        data-testid="booking-date"
        value={String(props.value ?? '')}
        readOnly
        onClick={() => props.onChange?.([new Date('2026-06-25T00:00:00')])}
      />
    );
  },
}));

vi.mock('@/actions/bookings', () => ({
  createBookingAction: vi.fn(),
}));

describe('BookingCreateForm', () => {
  const mockStorage = () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  };

  const renderForm = () => render(
    <I18nProvider>
      <BookingCreateForm fields={[{ id: 1, name: 'Lapangan HAM', address: null }]} />
    </I18nProvider>,
  );

  it('keeps the Flatpickr input controlled before a date is selected', () => {
    flatpickrProps.length = 0;
    useActionStateMock.mockReturnValue([{ ok: false }, vi.fn(), false]);
    mockStorage();

    renderForm();

    expect(flatpickrProps[0]?.value).toBe('');
  });

  it('shows updated upload file formats without pdf claims on the payment step', () => {
    useActionStateMock.mockReturnValue([{ ok: false }, vi.fn(), false]);
    mockStorage();

    renderForm();

    fireEvent.click(screen.getByTestId('booking-date'));
    fireEvent.click(screen.getByRole('button', { name: /payment/i }));

    expect(screen.getByText('JPG, PNG, WebP • Max 5MB')).toBeInTheDocument();
    expect(screen.getByText(/format: jpg, png, or webp/i)).toBeInTheDocument();
    expect(screen.queryByText(/pdf/i)).not.toBeInTheDocument();
  });

  it('shows a booking success panel with booking id, next-step copy, and history cta', () => {
    useActionStateMock.mockReturnValue([
      { ok: true, message: 'Booking sent.', bookingId: 321 },
      vi.fn(),
      false,
    ]);
    mockStorage();

    renderForm();

    fireEvent.click(screen.getByTestId('booking-date'));
    fireEvent.click(screen.getByRole('button', { name: /payment/i }));

    expect(screen.getByText('Booking #321')).toBeInTheDocument();
    expect(screen.getByText('Booking sent.')).toBeInTheDocument();
    expect(screen.getByText(/check history for dp verification/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open history/i })).toHaveAttribute('href', '/customer/history');
  });

  it('automatically sets end hour to start hour + 2 when start hour changes', () => {
    useActionStateMock.mockReturnValue([{ ok: false }, vi.fn(), false]);
    mockStorage();

    renderForm();

    const startTimeSelect = screen.getByLabelText(/start time/i) as HTMLSelectElement;
    const endTimeSelect = screen.getByLabelText(/end time/i) as HTMLSelectElement;

    expect(startTimeSelect.value).toBe('18');
    expect(endTimeSelect.value).toBe('20');

    fireEvent.change(startTimeSelect, { target: { value: '14' } });

    expect(startTimeSelect.value).toBe('14');
    expect(endTimeSelect.value).toBe('16');
  });
});
