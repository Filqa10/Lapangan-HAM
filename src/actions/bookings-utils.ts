import { calculateBookingPrice } from '@/config/pricing';

type PaymentType = 'dp' | 'final';

const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024;
const ALLOWED_PAYMENT_PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type BookingActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  bookingId?: number;
};

type ParsedCreateBooking = {
  fieldId: number;
  bookingDate: string;
  startHour: number;
  endHour: number;
  startTime: string;
  endTime: string;
  total: number;
  dp: number;
  paymentProof: File;
};

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const BOOKING_ACTION_INITIAL_STATE: BookingActionState = { ok: false };

export function parseCreateBookingForm(formData: FormData): ParseResult<ParsedCreateBooking> {
  const fieldId = Number(formData.get('fieldId'));
  const bookingDate = String(formData.get('bookingDate') ?? '');
  const startHour = Number(formData.get('startHour'));
  const endHour = Number(formData.get('endHour'));
  const paymentProof = formData.get('paymentProof');
  const paymentOption = String(formData.get('paymentOption') ?? 'dp');

  if (!Number.isInteger(fieldId) || fieldId <= 0) {
    return { ok: false, error: 'Pilih lapangan terlebih dahulu.' };
  }

  const date = parseLocalDate(bookingDate);
  if (!date) {
    return { ok: false, error: 'Pilih tanggal booking yang valid.' };
  }

  if (!isValidBookingSlot(startHour, endHour)) {
    return { ok: false, error: 'Pilih jam mulai dan selesai yang valid.' };
  }

  const proof = validatePaymentProofFile(paymentProof, 'Unggah bukti pembayaran terlebih dahulu.');
  if (!proof.ok) {
    return { ok: false, error: proof.error };
  }

  const { total, dp: calculatedDp } = calculateBookingPrice(date, startHour, endHour);
  if (total <= 0) {
    return { ok: false, error: 'Slot yang dipilih belum tersedia untuk booking online.' };
  }

  // Adjust DP amount depending on payment option choice
  const dp = paymentOption === 'full' ? total : calculatedDp;

  return {
    ok: true,
    data: {
      fieldId,
      bookingDate,
      startHour,
      endHour,
      startTime: formatHour(startHour),
      endTime: formatHour(endHour),
      total,
      dp,
      paymentProof: proof.file,
    },
  };
}

export function isPastBookingDate(value: string, now = new Date()) {
  const date = parseLocalDate(value);
  if (!date) return false;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date < today;
}

export function buildPaymentProofPath({
  userId,
  bookingFolder,
  paymentType,
  fileName,
  now = new Date(),
  nonce = crypto.randomUUID(),
}: {
  userId: string;
  bookingFolder: string;
  paymentType: PaymentType;
  fileName: string;
  now?: Date;
  nonce?: string;
}) {
  const timestamp = now.toISOString().replaceAll(':', '-').replaceAll('.', '-');
  return `${userId}/${bookingFolder}/${timestamp}-${paymentType}-${sanitizePathSegment(nonce)}-${sanitizeFileName(fileName)}`;
}

function isValidBookingSlot(startHour: number, endHour: number) {
  return (
    Number.isInteger(startHour) &&
    Number.isInteger(endHour) &&
    startHour >= 6 &&
    endHour <= 22 &&
    startHour < endHour &&
    startHour % 2 === 0 &&
    endHour % 2 === 0
  );
}

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function isUsableFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export function validatePaymentProofFile(
  value: FormDataEntryValue | null,
  requiredError: string,
): { ok: true; file: File } | { ok: false; error: string } {
  if (!isUsableFile(value)) {
    return { ok: false, error: requiredError };
  }

  if (!ALLOWED_PAYMENT_PROOF_TYPES.has(value.type)) {
    return { ok: false, error: 'Bukti pembayaran harus berupa JPG, PNG, atau WebP.' };
  }

  if (value.size > MAX_PAYMENT_PROOF_SIZE) {
    return { ok: false, error: 'Ukuran bukti pembayaran maksimal 5MB.' };
  }

  return { ok: true, file: value };
}

function sanitizeFileName(fileName: string) {
  const normalized = fileName.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const collapsed = normalized.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return collapsed || 'payment-proof';
}

function sanitizePathSegment(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, 'x');
}
