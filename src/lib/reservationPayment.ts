import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { getOnvoPaymentIntent } from './onvo';

const APPROVED_PAYMENT_STATUSES = new Set(['succeeded', 'paid', 'approved']);

type FinalizeReservationResult =
  | { ok: true; alreadyPaid: boolean; message: string }
  | { ok: false; status: number; pending?: boolean; error: string; message?: string };

function formatDateEs(date: Date): string {
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

async function sendReservationConfirmationEmail(input: {
  reservationId: number;
  customerEmail: string;
  customerName: string;
  tourTitle: string;
  people: number;
  date: Date;
  scheduleTime: string | null;
}): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  const notifyTo = process.env.RESERVATION_TO_EMAIL || process.env.CONTACT_TO_EMAIL || '';

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom || !Number.isFinite(smtpPort)) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const dateText = formatDateEs(input.date);
  const timeText = input.scheduleTime?.trim() || 'Por coordinar';
  const subject = `Reserva confirmada #${input.reservationId} - ${input.tourTitle}`;
  const text = [
    `Hola ${input.customerName},`,
    '',
    'Tu pago fue aprobado y tu reserva quedo confirmada.',
    '',
    `Reserva: #${input.reservationId}`,
    `Tour: ${input.tourTitle}`,
    `Fecha: ${dateText}`,
    `Horario: ${timeText}`,
    `Personas: ${input.people}`,
    '',
    'Gracias por reservar con nosotros.',
  ].join('\n');

  const html = `
    <h2>Reserva confirmada</h2>
    <p>Hola <strong>${input.customerName}</strong>,</p>
    <p>Tu pago fue aprobado y tu reserva quedo confirmada.</p>
    <ul>
      <li><strong>Reserva:</strong> #${input.reservationId}</li>
      <li><strong>Tour:</strong> ${input.tourTitle}</li>
      <li><strong>Fecha:</strong> ${dateText}</li>
      <li><strong>Horario:</strong> ${timeText}</li>
      <li><strong>Personas:</strong> ${input.people}</li>
    </ul>
    <p>Gracias por reservar con nosotros.</p>
  `;

  const recipients = [input.customerEmail, notifyTo].filter((item) => Boolean(item));
  await transporter.sendMail({
    from: smtpFrom,
    to: recipients,
    subject,
    text,
    html,
  });
}

export async function finalizeReservationPayment(input: {
  paymentIntentId: string;
  reservationId?: number;
}): Promise<FinalizeReservationResult> {
  const paymentIntentId = String(input.paymentIntentId ?? '').trim();
  const expectedReservationId = Number(input.reservationId);

  if (!paymentIntentId) {
    return { ok: false, status: 400, error: 'Datos de confirmacion invalidos' };
  }

  try {
    const paymentIntent = await getOnvoPaymentIntent(paymentIntentId);
    const normalizedPaymentStatus = String(paymentIntent.status ?? '').toLowerCase();

    if (!APPROVED_PAYMENT_STATUSES.has(normalizedPaymentStatus)) {
      return {
        ok: false,
        status: 202,
        pending: true,
        error: 'Pago pendiente de confirmacion',
        message: 'Pago recibido, en espera de confirmacion final.',
      };
    }

    const metadataReservationId = Number(paymentIntent.metadata?.reservationId ?? '');
    if (!Number.isFinite(metadataReservationId) || metadataReservationId <= 0) {
      return { ok: false, status: 400, error: 'El pago no contiene una reserva valida asociada' };
    }

    if (Number.isFinite(expectedReservationId) && expectedReservationId > 0 && metadataReservationId !== expectedReservationId) {
      return { ok: false, status: 400, error: 'El pago no coincide con la reserva indicada' };
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const reservation = await tx.reservation.findUnique({
          where: { id: metadataReservationId },
        });

        if (!reservation) {
          return { ok: false as const, status: 404, error: 'Reserva no encontrada' };
        }

        if (reservation.paid) {
          return {
            ok: true as const,
            alreadyPaid: true,
            sendEmail: false,
          };
        }

        const updatedReservation = await tx.reservation.update({
          where: { id: reservation.id },
          data: { paid: true },
        });

        const tour = await tx.tour.findUnique({
          where: { id: updatedReservation.tourId },
          select: { title: true },
        });

        return {
          ok: true as const,
          alreadyPaid: false,
          sendEmail: true,
          emailData: {
            reservationId: updatedReservation.id,
            customerEmail: updatedReservation.email,
            customerName: [updatedReservation.name, updatedReservation.lastName].filter(Boolean).join(' ').trim() || updatedReservation.name,
            tourTitle: tour?.title || 'Tour',
            people: updatedReservation.people,
            date: updatedReservation.date,
            scheduleTime: updatedReservation.scheduleTime,
          },
        };
      },
      {
        isolationLevel: 'Serializable',
      },
    );

    if (!result.ok) {
      return { ok: false, status: result.status, error: result.error };
    }

    if (!result.alreadyPaid && result.sendEmail && result.emailData) {
      await sendReservationConfirmationEmail(result.emailData).catch(() => null);
    }

    return {
      ok: true,
      alreadyPaid: result.alreadyPaid,
      message: result.alreadyPaid
        ? 'La reserva ya estaba confirmada previamente.'
        : 'Pago validado y reserva confirmada.',
    };
  } catch {
    return { ok: false, status: 500, error: 'No se pudo confirmar el estado del pago' };
  }
}
