import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { I18nProvider } from '@/lib/i18n';
import { HistoryClient } from './HistoryClient';

describe('HistoryClient', () => {
  const mockStorage = () => {
    const storage = {
      getItem: () => null,
      setItem: () => undefined,
    };
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  };

  it('renders the final verification wording for payment_2_pending bookings', () => {
    mockStorage();

    render(
      <I18nProvider>
        <HistoryClient
          bookings={[
            {
              id: 7,
              fieldName: 'Lapangan A',
              booking_date: '2026-06-25',
              start_time: '09:00:00',
              end_time: '10:00:00',
              price: 250000,
              dp_amount: 100000,
              status: 'payment_2_pending',
            },
          ]}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('Waiting Final Verification')).toBeInTheDocument();
  });
});
