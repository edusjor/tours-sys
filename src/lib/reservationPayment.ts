import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { getOnvoPaymentIntent } from './onvo';
import { getReservationCheckoutDetailsById } from './reservationDetails';
import { DEFAULT_USD_TO_CRC_EXCHANGE_RATE, getUsdToCrcExchangeRate } from './exchangeRate';
import { phoneCountryOptions } from './phoneCountryOptions';

const APPROVED_PAYMENT_STATUSES = new Set(['succeeded', 'paid', 'approved']);
const DEFAULT_RESERVATION_ADMIN_EMAIL = 'reservaciones@guapileslineatours.com';
const SUPPORT_EMAIL = 'atencionalcliente@guapileslineatours.com';
const SUPPORT_WHATSAPP = '+506 6015-9782';
const SUPPORT_LOCATION = 'Costa Rica, Limón, Pococí, La Colonia';
const SINPE_PHONE_NUMBER = '6015 9782';

type FinalizeReservationResult =
  | { ok: true; alreadyPaid: boolean; message: string }
  | { ok: false; status: number; pending?: boolean; error: string; message?: string };

function formatDateEs(date: Date): string {
  const day = new Intl.DateTimeFormat('es-CR', { day: 'numeric', timeZone: 'UTC' }).format(date);
  const month = new Intl.DateTimeFormat('es-CR', { month: 'long', timeZone: 'UTC' }).format(date);
  const year = new Intl.DateTimeFormat('es-CR', { year: 'numeric', timeZone: 'UTC' }).format(date);
  return `${day} ${month}, ${year}`;
}

function formatUsd(value: number | null | undefined): string {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'N/D';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCrc(value: number | null | undefined): string {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'N/D';
  return `₡ ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function resolveCountryFromPhone(phone: string | null | undefined): string {
  const normalizedPhone = String(phone ?? '').trim().replace(/\s+/g, '');
  if (!normalizedPhone.startsWith('+')) return 'No indicado';

  const match = [...phoneCountryOptions]
    .sort((left, right) => right.dialCode.length - left.dialCode.length)
    .find((option) => normalizedPhone.startsWith(String(option.dialCode).replace(/\s+/g, '')));

  return match?.name || 'No indicado';
}

async function sendReservationConfirmationEmail(input: {
  reservationId: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  tourTitle: string;
  people: number;
  date: Date;
  scheduleTime: string | null;
  paymentMethod: string | null;
  hotel: string | null;
  packageTitle: string | null;
  totalAmount: number | null;
  priceBreakdown: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  const notifyTo = process.env.RESERVATION_TO_EMAIL || process.env.CONTACT_TO_EMAIL || DEFAULT_RESERVATION_ADMIN_EMAIL;

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
  const paymentMethodText = String(input.paymentMethod ?? '').trim() || 'No indicado';
  const hotelText = String(input.hotel ?? '').trim() || 'No indicado';
  const customerPhoneText = String(input.customerPhone ?? '').trim() || 'No indicado';
  const customerCountryText = resolveCountryFromPhone(input.customerPhone);
  const packageTitleText = String(input.packageTitle ?? '').trim() || 'No indicado';
  const hasBreakdown = input.priceBreakdown.length > 0;
  const totalAmountText = formatUsd(input.totalAmount);
  const usdToCrcRate = await getUsdToCrcExchangeRate().catch(() => DEFAULT_USD_TO_CRC_EXCHANGE_RATE);
  const totalAmountCrc = Number.isFinite(Number(input.totalAmount)) ? Number(input.totalAmount) * usdToCrcRate : NaN;
  const totalAmountCrcText = formatCrc(totalAmountCrc);
  const priceBreakdownText = hasBreakdown
    ? input.priceBreakdown.map((item) => `- ${item.name}: ${item.quantity}`).join('\n')
    : '- No detallado';
  const priceBreakdownHtml = hasBreakdown
    ? input.priceBreakdown.map((item) => `<li><strong>${item.name}:</strong> ${item.quantity}</li>`).join('')
    : '<li>No detallado</li>';
  const customerSubject = `Reserva confirmada #${input.reservationId} - ${input.tourTitle}`;
  const customerText = [
    `Hola ${input.customerName},`,
    '',
    'Tu pago fue aprobado y tu reserva quedó confirmada.',
    '',
    'Resumen de compra:',
    `Reserva: #${input.reservationId}`,
    `Tour: ${input.tourTitle}`,
    `Fecha: ${dateText}`,
    `Horario: ${timeText}`,
    `Personas: ${input.people}`,
    `Cliente: ${input.customerName}`,
    `Correo: ${input.customerEmail}`,
    `Teléfono: ${customerPhoneText}`,
    `País: ${customerCountryText}`,
    `Total pagado: ${totalAmountText}`,
    `Paquete: ${packageTitleText}`,
    `Detalle de selección:\n${priceBreakdownText}`,
    `Hospedaje: ${hotelText}`,
    `Método de pago: ${paymentMethodText}`,
    '',
    'Si necesitas ayuda, contáctanos:',
    `Correo: ${SUPPORT_EMAIL}`,
    `WhatsApp: ${SUPPORT_WHATSAPP}`,
    `Ubicación: ${SUPPORT_LOCATION}`,
    '',
    'Gracias por reservar con nosotros.',
  ].join('\n');

  const customerHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#065f46,#0f766e);padding:22px 24px;color:#ffffff;">
          <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Guapiles Linea Tours</p>
          <h2 style="margin:8px 0 0;font-size:28px;line-height:1.2;">Reserva confirmada</h2>
        </div>

        <div style="padding:22px 24px;">
          <p style="margin:0 0 12px;font-size:15px;">Hola <strong>${input.customerName}</strong>,</p>
          <p style="margin:0 0 16px;font-size:15px;color:#334155;">Tu pago fue aprobado y tu reserva quedó confirmada. Aquí tienes el resumen de tu compra:</p>

          <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tbody>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;width:42%;">Reserva</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">#${input.reservationId}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Tour</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.tourTitle}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Fecha</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${dateText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Horario</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${timeText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Personas</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.people}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Cliente</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.customerName}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Correo</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.customerEmail}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Teléfono</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${customerPhoneText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">País</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${customerCountryText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Total pagado</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${totalAmountText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Paquete</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${packageTitleText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Hospedaje</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${hotelText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;font-weight:700;">Método de pago</td><td style="padding:10px 12px;">${paymentMethodText}</td></tr>
            </tbody>
          </table>

          <div style="margin-top:12px;padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0f172a;">Seleccion de personas / tarifas</p>
            <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;">
              ${priceBreakdownHtml}
            </ul>
          </div>

          <div style="margin-top:16px;padding:14px;border:1px solid #bae6fd;background:#f0f9ff;border-radius:10px;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0c4a6e;">Atención al cliente</p>
            <p style="margin:0;font-size:14px;color:#0f172a;"><strong>Correo:</strong> ${SUPPORT_EMAIL}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#0f172a;"><strong>WhatsApp:</strong> ${SUPPORT_WHATSAPP}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#0f172a;"><strong>Ubicación:</strong> ${SUPPORT_LOCATION}</p>
          </div>

          <p style="margin:16px 0 0;font-size:14px;color:#334155;">Gracias por reservar con nosotros.</p>
        </div>
      </div>
    </div>
  `;

  const adminSubject = `Nueva reserva confirmada #${input.reservationId} - ${input.tourTitle}`;
  const adminText = [
    'Nueva reserva creada y confirmada.',
    '',
    'Detalle de la reserva:',
    `Reserva: #${input.reservationId}`,
    `Tour: ${input.tourTitle}`,
    `Fecha: ${dateText}`,
    `Horario: ${timeText}`,
    `Personas: ${input.people}`,
    `Cliente: ${input.customerName}`,
    `Correo: ${input.customerEmail}`,
    `Teléfono: ${customerPhoneText}`,
    `País: ${customerCountryText}`,
    `Total pagado: ${totalAmountText}`,
    `Paquete: ${packageTitleText}`,
    `Detalle de selección:\n${priceBreakdownText}`,
    `Hospedaje: ${hotelText}`,
    `Método de pago: ${paymentMethodText}`,
  ].join('\n');

  const adminHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0f172a,#334155);padding:22px 24px;color:#ffffff;">
          <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Guapiles Linea Tours</p>
          <h2 style="margin:8px 0 0;font-size:28px;line-height:1.2;">Nueva reserva confirmada</h2>
        </div>

        <div style="padding:22px 24px;">
          <p style="margin:0 0 12px;font-size:15px;"><strong>Se creó una nueva reserva confirmada.</strong></p>

          <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tbody>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;width:42%;">Reserva</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">#${input.reservationId}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Tour</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.tourTitle}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Fecha</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${dateText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Horario</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${timeText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Personas</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.people}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Cliente</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.customerName}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Correo</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.customerEmail}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Teléfono</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${customerPhoneText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">País</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${customerCountryText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Total pagado</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${totalAmountText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Paquete</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${packageTitleText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;">Hospedaje</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${hotelText}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;font-weight:700;">Método de pago</td><td style="padding:10px 12px;">${paymentMethodText}</td></tr>
            </tbody>
          </table>

          <div style="margin-top:12px;padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0f172a;">Selección de personas / tarifas</p>
            <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;">
              ${priceBreakdownHtml}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  const customerRecipient = String(input.customerEmail ?? '').trim();
  const adminRecipient = String(notifyTo ?? '').trim();
  if (customerRecipient) {
    await transporter.sendMail({
      from: smtpFrom,
      to: customerRecipient,
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    });
  }

  if (adminRecipient) {
    await transporter.sendMail({
      from: smtpFrom,
      to: adminRecipient,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    });
  }
}

async function sendReservationPendingValidationEmail(input: {
  reservationId: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  tourTitle: string;
  people: number;
  date: Date;
  scheduleTime: string | null;
  paymentMethod: string | null;
  hotel: string | null;
  packageTitle: string | null;
  totalAmount: number | null;
  priceBreakdown: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  const notifyTo = process.env.RESERVATION_TO_EMAIL || process.env.CONTACT_TO_EMAIL || DEFAULT_RESERVATION_ADMIN_EMAIL;

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
  const paymentMethodText = String(input.paymentMethod ?? '').trim() || 'No indicado';
  const hotelText = String(input.hotel ?? '').trim() || 'No indicado';
  const customerPhoneText = String(input.customerPhone ?? '').trim() || 'No indicado';
  const customerCountryText = resolveCountryFromPhone(input.customerPhone);
  const packageTitleText = String(input.packageTitle ?? '').trim() || 'No indicado';
  const hasBreakdown = input.priceBreakdown.length > 0;
  const totalAmountText = formatUsd(input.totalAmount);
  const priceBreakdownText = hasBreakdown
    ? input.priceBreakdown.map((item) => `- ${item.name}: ${item.quantity}`).join('\n')
    : '- No detallado';
  const priceBreakdownHtml = hasBreakdown
    ? input.priceBreakdown.map((item) => `<li><strong>${item.name}:</strong> ${item.quantity}</li>`).join('')
    : '<li>No detallado</li>';
  const customerSubject = `Reserva por confirmar #${input.reservationId} - ${input.tourTitle}`;
  const customerText = [
    `Hola ${input.customerName},`,
    '',
    'Recibimos tu solicitud de reserva y el comprobante SINPE.',
    'Estado actual: Pendiente por validar pago.',
    'Nuestro equipo revisará manualmente la transferencia y, una vez validada, te enviaremos un nuevo correo con tu reserva confirmada.',
    '',
    'Recordatorio de pago SINPE Móvil:',
    `Número SINPE: ${SINPE_PHONE_NUMBER}`,
    `Total en colones por transferir: ${totalAmountCrcText}`,
    `Detalle: Reserva #${input.reservationId}`,
    '',
    'Resumen de la solicitud:',
    `Reserva: #${input.reservationId}`,
    `Tour: ${input.tourTitle}`,
    `Fecha: ${dateText}`,
    `Horario: ${timeText}`,
    `Personas: ${input.people}`,
    `Cliente: ${input.customerName}`,
    `Correo: ${input.customerEmail}`,
    `Teléfono: ${customerPhoneText}`,
    `País: ${customerCountryText}`,
    `Total de la reserva: ${totalAmountText}`,
    `Paquete: ${packageTitleText}`,
    `Detalle de selección (Reserva #${input.reservationId}):\n${priceBreakdownText}`,
    `Hospedaje: ${hotelText}`,
    `Método de pago: ${paymentMethodText}`,
    `Estado: Pendiente por validar`,
    '',
    'Si necesitas ayuda, contáctanos:',
    `Correo: ${SUPPORT_EMAIL}`,
    `WhatsApp: ${SUPPORT_WHATSAPP}`,
    `Ubicación: ${SUPPORT_LOCATION}`,
  ].join('\n');

  const customerHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#9a3412,#ea580c);padding:22px 24px;color:#ffffff;">
          <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Guapiles Linea Tours</p>
          <h2 style="margin:8px 0 0;font-size:28px;line-height:1.2;">Reserva por confirmar</h2>
        </div>

        <div style="padding:22px 24px;">
          <p style="margin:0 0 12px;font-size:15px;">Hola <strong>${input.customerName}</strong>,</p>
          <p style="margin:0 0 10px;font-size:15px;color:#334155;">Recibimos tu solicitud de reserva y el comprobante SINPE.</p>
          <p style="margin:0 0 16px;font-size:15px;color:#7c2d12;"><strong>Estado actual:</strong> Pendiente por validar pago.</p>
          <p style="margin:0 0 16px;font-size:14px;color:#334155;">Apenas validemos manualmente la transferencia, te enviaremos un nuevo correo con la confirmación exitosa de tu reserva.</p>

          <div style="margin:0 0 16px;padding:12px;border:1px solid #fed7aa;border-radius:10px;background:#fff7ed;">
            <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#7c2d12;">Recordatorio de pago SINPE Móvil</p>
            <p style="margin:0;font-size:14px;color:#9a3412;"><strong>Número SINPE:</strong> ${SINPE_PHONE_NUMBER}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#9a3412;"><strong>Total en colones por transferir:</strong> ${totalAmountCrcText}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#9a3412;"><strong>Detalle:</strong> Reserva #${input.reservationId}</p>
          </div>

          <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tbody>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;width:42%;">Reserva</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">#${input.reservationId}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Tour</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.tourTitle}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Fecha</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${dateText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Horario</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${timeText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Personas</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.people}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Cliente</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.customerName}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Correo</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.customerEmail}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Teléfono</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${customerPhoneText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">País</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${customerCountryText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Total de la reserva</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${totalAmountText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Paquete</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${packageTitleText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Hospedaje</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${hotelText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Método de pago</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${paymentMethodText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;font-weight:700;">Estado</td><td style="padding:10px 12px;color:#9a3412;font-weight:700;">Pendiente por validar</td></tr>
            </tbody>
          </table>

          <div style="margin-top:12px;padding:12px;border:1px solid #fed7aa;border-radius:10px;background:#fff7ed;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#7c2d12;">Selección de personas / tarifas (Reserva #${input.reservationId})</p>
            <ul style="margin:0;padding-left:18px;color:#9a3412;font-size:14px;">
              ${priceBreakdownHtml}
            </ul>
          </div>

          <div style="margin-top:16px;padding:14px;border:1px solid #bae6fd;background:#f0f9ff;border-radius:10px;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0c4a6e;">Atención al cliente</p>
            <p style="margin:0;font-size:14px;color:#0f172a;"><strong>Correo:</strong> ${SUPPORT_EMAIL}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#0f172a;"><strong>WhatsApp:</strong> ${SUPPORT_WHATSAPP}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#0f172a;"><strong>Ubicación:</strong> ${SUPPORT_LOCATION}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const adminSubject = `Nueva reserva por validar #${input.reservationId} - ${input.tourTitle}`;
  const adminText = [
    'Nueva reserva creada y pendiente por validar pago.',
    '',
    'Detalle de la reserva:',
    `Reserva: #${input.reservationId}`,
    `Tour: ${input.tourTitle}`,
    `Fecha: ${dateText}`,
    `Horario: ${timeText}`,
    `Personas: ${input.people}`,
    `Cliente: ${input.customerName}`,
    `Correo: ${input.customerEmail}`,
    `Teléfono: ${customerPhoneText}`,
    `País: ${customerCountryText}`,
    `Total de la reserva: ${totalAmountText}`,
    `Paquete: ${packageTitleText}`,
    `Detalle de selección:\n${priceBreakdownText}`,
    `Hospedaje: ${hotelText}`,
    `Método de pago: ${paymentMethodText}`,
    'Estado: Pendiente por validar',
  ].join('\n');

  const adminHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#9a3412,#ea580c);padding:22px 24px;color:#ffffff;">
          <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Guapiles Linea Tours</p>
          <h2 style="margin:8px 0 0;font-size:28px;line-height:1.2;">Nueva reserva por validar</h2>
        </div>

        <div style="padding:22px 24px;">
          <p style="margin:0 0 12px;font-size:15px;"><strong>Se creó una nueva reserva pendiente por validar pago.</strong></p>

          <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tbody>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;width:42%;">Reserva</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">#${input.reservationId}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Tour</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.tourTitle}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Fecha</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${dateText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Horario</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${timeText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Personas</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.people}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Cliente</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.customerName}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Correo</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${input.customerEmail}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Teléfono</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${customerPhoneText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">País</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${customerCountryText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Total de la reserva</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${totalAmountText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Paquete</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${packageTitleText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Hospedaje</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${hotelText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;border-bottom:1px solid #e2e8f0;font-weight:700;">Método de pago</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${paymentMethodText}</td></tr>
              <tr><td style="padding:10px 12px;background:#fff7ed;font-weight:700;">Estado</td><td style="padding:10px 12px;color:#9a3412;font-weight:700;">Pendiente por validar</td></tr>
            </tbody>
          </table>

          <div style="margin-top:12px;padding:12px;border:1px solid #fed7aa;border-radius:10px;background:#fff7ed;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#7c2d12;">Selección de personas / tarifas</p>
            <ul style="margin:0;padding-left:18px;color:#9a3412;font-size:14px;">
              ${priceBreakdownHtml}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  const customerRecipient = String(input.customerEmail ?? '').trim();
  const adminRecipient = String(notifyTo ?? '').trim();
  if (customerRecipient) {
    await transporter.sendMail({
      from: smtpFrom,
      to: customerRecipient,
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    });
  }

  if (adminRecipient) {
    await transporter.sendMail({
      from: smtpFrom,
      to: adminRecipient,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    });
  }
}

export async function sendReservationConfirmationEmailByReservationId(reservationId: number): Promise<void> {
  const normalizedReservationId = Number(reservationId);
  if (!Number.isFinite(normalizedReservationId) || normalizedReservationId <= 0) return;

  const reservation = await prisma.reservation.findUnique({
    where: { id: normalizedReservationId },
    include: {
      tour: {
        select: { title: true },
      },
    },
  });

  if (!reservation || !reservation.email) return;

  const details = await getReservationCheckoutDetailsById(reservation.id);

  await sendReservationConfirmationEmail({
    reservationId: reservation.id,
    customerEmail: reservation.email,
    customerName: [reservation.name, reservation.lastName].filter(Boolean).join(' ').trim() || reservation.name,
    customerPhone: reservation.phone,
    tourTitle: reservation.tour?.title || 'Tour',
    people: reservation.people,
    date: reservation.date,
    scheduleTime: reservation.scheduleTime,
    paymentMethod: reservation.paymentMethod,
    hotel: reservation.hotel,
    packageTitle: details.packageTitle,
    totalAmount: details.totalAmount,
    priceBreakdown: details.priceBreakdown,
  });
}

export async function sendReservationPendingValidationEmailByReservationId(reservationId: number): Promise<void> {
  const normalizedReservationId = Number(reservationId);
  if (!Number.isFinite(normalizedReservationId) || normalizedReservationId <= 0) return;

  const reservation = await prisma.reservation.findUnique({
    where: { id: normalizedReservationId },
    include: {
      tour: {
        select: { title: true },
      },
    },
  });

  if (!reservation || !reservation.email) return;

  const details = await getReservationCheckoutDetailsById(reservation.id);

  await sendReservationPendingValidationEmail({
    reservationId: reservation.id,
    customerEmail: reservation.email,
    customerName: [reservation.name, reservation.lastName].filter(Boolean).join(' ').trim() || reservation.name,
    customerPhone: reservation.phone,
    tourTitle: reservation.tour?.title || 'Tour',
    people: reservation.people,
    date: reservation.date,
    scheduleTime: reservation.scheduleTime,
    paymentMethod: reservation.paymentMethod,
    hotel: reservation.hotel,
    packageTitle: details.packageTitle,
    totalAmount: details.totalAmount,
    priceBreakdown: details.priceBreakdown,
  });
}

export async function finalizeReservationPayment(input: {
  paymentIntentId: string;
  reservationId?: number;
}): Promise<FinalizeReservationResult> {
  const paymentIntentId = String(input.paymentIntentId ?? '').trim();
  const expectedReservationId = Number(input.reservationId);

  if (!paymentIntentId) {
    return { ok: false, status: 400, error: 'Datos de confirmación inválidos' };
  }

  try {
    const paymentIntent = await getOnvoPaymentIntent(paymentIntentId);
    const normalizedPaymentStatus = String(paymentIntent.status ?? '').toLowerCase();

    if (!APPROVED_PAYMENT_STATUSES.has(normalizedPaymentStatus)) {
      return {
        ok: false,
        status: 202,
        pending: true,
        error: 'Pago pendiente de confirmación',
        message: 'Pago recibido, en espera de confirmación final.',
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
            reservationId: reservation.id,
            sendEmail: false,
          };
        }

        const updatedReservation = await tx.reservation.update({
          where: { id: reservation.id },
          data: { paid: true },
        });

        return {
          ok: true as const,
          alreadyPaid: false,
          reservationId: updatedReservation.id,
          sendEmail: true,
        };
      },
      {
        isolationLevel: 'Serializable',
      },
    );

    if (!result.ok) {
      return { ok: false, status: result.status, error: result.error };
    }

    if (!result.alreadyPaid && result.sendEmail) {
      await sendReservationConfirmationEmailByReservationId(result.reservationId).catch(() => null);
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
