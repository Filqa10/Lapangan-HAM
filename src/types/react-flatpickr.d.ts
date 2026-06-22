declare module 'react-flatpickr' {
  import type { ComponentType, InputHTMLAttributes } from 'react';

  type DateValue = Date | string | number | Array<Date | string | number>;

  type DateTimePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
    value?: DateValue;
    options?: Record<string, unknown>;
    onChange?: (selectedDates: Date[], dateStr: string, instance: unknown) => void;
  };

  const DateTimePicker: ComponentType<DateTimePickerProps>;

  export default DateTimePicker;
}
