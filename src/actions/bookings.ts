'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

import { createClient } from '@/lib/supabase/server';
import {
  buildPaymentProofPath,
  isPastBookingDate,
  parseCreateBookingForm,
  validatePaymentProofFile,
  type BookingActionState,
} from './bookings-utils';

export async function createBookingAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Silakan login terlebih dahulu untuk membuat booking.' };
  }

  const parsed = parseCreateBookingForm(formData);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const booking = parsed.data;
  if (isPastBookingDate(booking.bookingDate)) {
    return { ok: false, error: 'Tanggal booking tidak boleh sebelum hari ini.' };
  }

  const { data: field, error: fieldError } = await supabase
    .from('fields')
    .select('id, status')
    .eq('id', booking.fieldId)
    .maybeSingle();

  if (fieldError || !field || field.status !== 'active') {
    return { ok: false, error: 'Lapangan tidak tersedia untuk booking online.' };
  }

  const { data: insertedBooking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      field_id: booking.fieldId,
      booking_date: booking.bookingDate,
      start_time: booking.startTime,
      end_time: booking.endTime,
      price: booking.total,
      dp_amount: booking.dp,
      status: 'pending',
    })
    .select('id')
    .single();

  if (bookingError || !insertedBooking) {
    return {
      ok: false,
      error: bookingError?.message.includes('DoubleBookingException')
        ? 'Slot ini sudah dipesan pelanggan lain. Pilih jam lain.'
        : 'Booking belum bisa dibuat. Coba lagi beberapa saat lagi.',
    };
  }

  const bookingId = Number(insertedBooking.id);
  const proofPath = buildPaymentProofPath({
    userId: user.id,
    bookingFolder: String(bookingId),
    paymentType: 'dp',
    fileName: booking.paymentProof.name,
  });

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(proofPath, booking.paymentProof, {
      contentType: booking.paymentProof.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    await cleanupBooking(supabase, bookingId);
    return { ok: false, error: 'Bukti DP gagal diunggah. Booking dibatalkan otomatis.' };
  }

  const { error: paymentError } = await supabase.from('payments').insert({
    booking_id: bookingId,
    amount: booking.dp,
    payment_type: 'dp',
    receipt_url: proofPath,
    status: 'pending',
  });

  if (paymentError) {
    await supabase.storage.from('payment-proofs').remove([proofPath]);
    await cleanupBooking(supabase, bookingId);
    return { ok: false, error: 'Data pembayaran DP gagal disimpan. Booking dibatalkan otomatis.' };
  }

  revalidatePath('/customer');
  revalidatePath('/customer/history');

  return {
    ok: true,
    bookingId,
    message: 'Booking terkirim. Tim HAM akan memeriksa bukti DP kamu.',
  };
}

export async function submitPelunasanAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Silakan login terlebih dahulu untuk mengunggah pelunasan.' };
  }

  const bookingId = Number(formData.get('bookingId'));
  const proof = validatePaymentProofFile(formData.get('paymentProof'), 'Unggah bukti pelunasan terlebih dahulu.');

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return { ok: false, error: 'Booking tidak valid.' };
  }

  if (!proof.ok) {
    return { ok: false, error: proof.error };
  }

  const paymentProof = proof.file;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, price, dp_amount, status')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (bookingError || !booking) {
    return { ok: false, error: 'Booking tidak ditemukan atau bukan milik akun ini.' };
  }

  if (isFinalPaymentAlreadySubmitted(booking.status)) {
    return { ok: false, error: 'Pelunasan sudah dikirim atau booking sudah selesai diproses.' };
  }

  if (booking.status !== 'dp_paid') {
    return { ok: false, error: 'Pelunasan hanya bisa dikirim setelah DP disetujui.' };
  }

  const finalAmount = Math.max(Number(booking.price) - Number(booking.dp_amount), 0);
  const { data: claimedBooking, error: claimError } = await supabase
    .from('bookings')
    .update({ status: 'payment_2_pending' })
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .eq('status', 'dp_paid')
    .select('id')
    .maybeSingle();

  if (claimError) {
    return { ok: false, error: 'Status booking gagal diperbarui. Coba lagi.' };
  }

  if (!claimedBooking) {
    return { ok: false, error: 'Pelunasan sudah dikirim atau booking sudah selesai diproses.' };
  }

  const proofPath = buildPaymentProofPath({
    userId: user.id,
    bookingFolder: String(bookingId),
    paymentType: 'final',
    fileName: paymentProof.name,
  });

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(proofPath, paymentProof, {
      contentType: paymentProof.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    await revertFinalPaymentAttempt(supabase, bookingId);
    return { ok: false, error: 'Bukti pelunasan gagal diunggah. Coba lagi.' };
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      booking_id: bookingId,
      amount: finalAmount,
      payment_type: 'final',
      receipt_url: proofPath,
      status: 'pending',
    })
    .select('id')
    .single();

  if (paymentError || !payment) {
    await revertFinalPaymentAttempt(supabase, bookingId, proofPath);
    return { ok: false, error: 'Data pelunasan gagal disimpan. Coba lagi.' };
  }

  revalidatePath('/customer');
  revalidatePath('/customer/history');
  revalidatePath(`/customer/booking/${bookingId}/pelunasan`);

  return {
    ok: true,
    bookingId,
    message: 'Bukti pelunasan terkirim. Tim HAM akan memverifikasi pembayaran akhir.',
  };
}

export async function approveDPAction(formData: FormData): Promise<BookingActionState> {
  return approvePaymentStage(formData, {
    rpcName: 'admin_approve_dp',
    staleError: 'Booking sudah diproses atau tidak lagi menunggu DP.',
    missingPaymentError: 'Bukti pembayaran DP belum ditemukan.',
    genericError: 'DP gagal disetujui. Coba lagi.',
    successMessage: 'DP disetujui. Customer dapat mengirim bukti pelunasan.',
    emailSubject: 'DP booking lapangan HAM disetujui',
    emailIntro: 'DP booking kamu sudah disetujui. Silakan lanjutkan pelunasan dari halaman riwayat booking.',
    revalidateBookingPath: '/admin/bookings',
  });
}

export async function approveFinalPaymentAction(formData: FormData): Promise<BookingActionState> {
  return approvePaymentStage(formData, {
    rpcName: 'admin_approve_final_payment',
    staleError: 'Booking sudah diproses atau tidak lagi menunggu pelunasan.',
    missingPaymentError: 'Bukti pelunasan belum ditemukan.',
    genericError: 'Pelunasan gagal disetujui. Coba lagi.',
    successMessage: 'Pelunasan disetujui. Booking sudah terkonfirmasi.',
    emailSubject: 'Booking lapangan HAM terkonfirmasi',
    emailIntro: 'Pelunasan kamu sudah disetujui. Booking lapangan HAM kini terkonfirmasi.',
    revalidateBookingPath: '/admin/bookings',
  });
}

export async function cancelBookingAction(formData: FormData): Promise<BookingActionState> {
  const bookingId = parseBookingId(formData);
  if (!bookingId) return { ok: false, error: 'Booking tidak valid.' };

  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const { data, error } = await supabase
    .rpc('admin_cancel_booking', { p_booking_id: bookingId })
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: mapCancelRpcError(error?.message) };
  }

  revalidateAdminAndCustomerBookingPaths();

  return {
    ok: true,
    bookingId,
    message: 'Booking dibatalkan. Payment pending ditolak otomatis.',
  };
}

export async function approveDPFormAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  return approveDPAction(formData);
}

export async function approveFinalPaymentFormAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  return approveFinalPaymentAction(formData);
}

export async function cancelBookingFormAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  return cancelBookingAction(formData);
}

export async function completePaymentOfflineAction(formData: FormData): Promise<BookingActionState> {
  const bookingId = parseBookingId(formData);
  if (!bookingId) return { ok: false, error: 'Booking tidak valid.' };

  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const { data, error } = await supabase
    .rpc('admin_complete_payment_offline', { p_booking_id: bookingId })
    .maybeSingle();

  if (error || !data) {
    console.error('completePaymentOfflineAction RPC error:', error, 'data:', data);
    return { ok: false, error: 'Gagal memproses pelunasan offline. Coba lagi.' };
  }

  revalidateAdminAndCustomerBookingPaths();

  return {
    ok: true,
    bookingId,
    message: 'Pembayaran offline berhasil dicatat dan booking dikonfirmasi lunas.',
  };
}

export async function completePaymentOfflineFormAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  return completePaymentOfflineAction(formData);
}

async function cleanupBooking(supabase: Awaited<ReturnType<typeof createClient>>, bookingId: number) {
  await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('status', 'pending');
}

async function revertFinalPaymentAttempt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingId: number,
  proofPath?: string,
) {
  if (proofPath) {
    await supabase.storage.from('payment-proofs').remove([proofPath]);
  }

  await supabase
    .from('bookings')
    .update({ status: 'dp_paid' })
    .eq('id', bookingId)
    .eq('status', 'payment_2_pending');
}

function isFinalPaymentAlreadySubmitted(status: string) {
  return status === 'payment_2_pending' || status === 'paid' || status === 'confirmed';
}

type PaymentApprovalConfig = {
  rpcName: 'admin_approve_dp' | 'admin_approve_final_payment';
  staleError: string;
  missingPaymentError: string;
  genericError: string;
  successMessage: string;
  emailSubject: string;
  emailIntro: string;
  revalidateBookingPath: string;
};

type ApprovedBooking = {
  id: number;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  fields?: { name: string } | { name: string }[] | null;
};

async function approvePaymentStage(formData: FormData, config: PaymentApprovalConfig): Promise<BookingActionState> {
  const bookingId = parseBookingId(formData);
  if (!bookingId) return { ok: false, error: 'Booking tidak valid.' };

  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const { data: approvedBooking, error: approvalError } = await supabase
    .rpc(config.rpcName, { p_booking_id: bookingId })
    .maybeSingle();

  if (approvalError || !approvedBooking) {
    return { ok: false, error: mapApprovalRpcError(approvalError?.message, config) };
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, booking_date, start_time, end_time, fields(name)')
    .eq('id', bookingId)
    .maybeSingle();

  const emailBooking = bookingError || !booking ? { id: bookingId } : (booking as ApprovedBooking);
  const emailWarning = await sendApprovalEmail(emailBooking, config);

  revalidateAdminAndCustomerBookingPaths(config.revalidateBookingPath);

  return {
    ok: true,
    bookingId,
    message: emailWarning ? `${config.successMessage} ${emailWarning}` : config.successMessage,
  };
}

function parseBookingId(formData: FormData) {
  const bookingId = Number(formData.get('bookingId'));
  return Number.isInteger(bookingId) && bookingId > 0 ? bookingId : null;
}

function mapApprovalRpcError(message: string | undefined, config: PaymentApprovalConfig) {
  if (!message) return config.genericError;
  if (message.includes('PendingDPPaymentNotFound') || message.includes('PendingFinalPaymentNotFound')) {
    return config.missingPaymentError;
  }
  if (message.includes('BookingNotPending') || message.includes('BookingFinalPaymentNotPending')) {
    return config.staleError;
  }
  if (message.includes('Forbidden')) return 'Akses admin diperlukan.';
  return config.genericError;
}

function mapCancelRpcError(message: string | undefined) {
  if (message?.includes('BookingAlreadyCancelledOrMissing')) return 'Booking sudah dibatalkan atau tidak ditemukan.';
  if (message?.includes('Forbidden')) return 'Akses admin diperlukan.';
  return 'Booking gagal dibatalkan. Coba lagi.';
}

function revalidateAdminAndCustomerBookingPaths(extraAdminPath = '/admin/bookings') {
  revalidatePath('/admin');
  revalidatePath(extraAdminPath);
  revalidatePath('/customer');
  revalidatePath('/customer/history');
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: 'Silakan login sebagai admin.' };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error || profile?.role !== 'admin') {
    return { ok: false as const, error: 'Akses admin diperlukan.' };
  }

  return { ok: true as const, userId: user.id };
}

async function sendApprovalEmail(booking: ApprovedBooking, config: PaymentApprovalConfig) {
  const email = await sendSafeEmail({
    to: process.env.BOOKING_APPROVAL_EMAIL_TO,
    subject: config.emailSubject,
    text: buildApprovalEmailText(booking, config.emailIntro),
    html: buildApprovalEmailHtml(booking, config.emailIntro),
  });

  if (!email.warning) return undefined;
  return `Email notifikasi belum terkirim: ${email.warning}`;
}

async function sendSafeEmail({
  to,
  subject,
  text,
  html,
}: {
  to?: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ ok: true; warning?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || isPlaceholderApiKey(apiKey)) return { ok: true };

  const recipient = to?.trim();
  if (!recipient) return { ok: true, warning: 'alamat tujuan email belum dikonfigurasi.' };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL?.trim() || 'HAM Futsal <onboarding@resend.dev>',
    to: recipient,
    subject,
    html,
    text,
  });

  if (error) return { ok: true, warning: error.message || 'provider email menolak pengiriman.' };
  return { ok: true };
}

function isPlaceholderApiKey(value: string) {
  const normalized = value.toLowerCase();
  return (
    !normalized.startsWith('re_') ||
    normalized.includes('placeholder') ||
    normalized.includes('changeme') ||
    normalized.includes('example') ||
    normalized.includes('dummy') ||
    normalized.includes('your_')
  );
}

function buildApprovalEmailText(booking: ApprovedBooking, intro: string) {
  return [
    intro,
    '',
    `Booking: #${booking.id}`,
    `Lapangan: ${fieldName(booking.fields)}`,
    `Tanggal: ${booking.booking_date ?? '-'}`,
    `Jam: ${formatEmailTime(booking.start_time)}-${formatEmailTime(booking.end_time)}`,
  ].join('\n');
}

function buildApprovalEmailHtml(booking: ApprovedBooking, intro: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #082014; line-height: 1.6;">
      <h1 style="margin: 0 0 12px;">Booking HAM</h1>
      <p>${escapeHtml(intro)}</p>
      <ul>
        <li><strong>Booking:</strong> #${booking.id}</li>
        <li><strong>Lapangan:</strong> ${escapeHtml(fieldName(booking.fields))}</li>
        <li><strong>Tanggal:</strong> ${escapeHtml(booking.booking_date ?? '-')}</li>
        <li><strong>Jam:</strong> ${escapeHtml(formatEmailTime(booking.start_time))}-${escapeHtml(formatEmailTime(booking.end_time))}</li>
      </ul>
    </div>
  `;
}

function fieldName(value: ApprovedBooking['fields']) {
  if (Array.isArray(value)) return value[0]?.name ?? 'Lapangan HAM';
  return value?.name ?? 'Lapangan HAM';
}

function formatEmailTime(value?: string) {
  return value?.slice(0, 5) || '-';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
