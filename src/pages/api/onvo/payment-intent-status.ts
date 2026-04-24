import type { NextApiRequest, NextApiResponse } from 'next';
import { getOnvoPaymentIntent } from '../../../lib/onvo';

type StatusResponse = {
  ok: true;
  status: string;
  message: string;
};

function mapPaymentIntentStatusMessage(status: string): string {
  switch (status) {
    case 'requires_payment_method':
      return 'El pago fue rechazado por el banco o los datos de tarjeta no fueron aceptados. Intenta nuevamente o usa otra tarjeta.';
    case 'requires_action':
      return 'Tu banco requiere una verificacion adicional (3DS). Intenta otra vez y completa la autenticacion solicitada.';
    case 'processing':
      return 'Tu pago esta en proceso. Espera unos segundos e intenta confirmar nuevamente.';
    case 'canceled':
      return 'El intento de pago fue cancelado. Vuelve a intentarlo para generar un nuevo intento.';
    case 'succeeded':
    case 'paid':
    case 'approved':
      return 'El pago aparece aprobado en ONVO. Espera unos segundos mientras se confirma la reserva.';
    default:
      return `No se pudo completar el pago (estado: ${status || 'desconocido'}).`;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<StatusResponse | { error: string }>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const paymentIntentId = String(req.body?.paymentIntentId ?? '').trim();
  const reservationId = Number(req.body?.reservationId);

  if (!paymentIntentId || !Number.isFinite(reservationId) || reservationId <= 0) {
    return res.status(400).json({ error: 'Datos de consulta de pago inválidos' });
  }

  try {
    const paymentIntent = await getOnvoPaymentIntent(paymentIntentId);
    const status = String(paymentIntent.status ?? '').trim().toLowerCase();
    const metadataReservationId = Number(paymentIntent.metadata?.reservationId ?? '');

    if (!Number.isFinite(metadataReservationId) || metadataReservationId <= 0) {
      return res.status(400).json({ error: 'El pago no tiene una reserva asociada válida' });
    }

    if (metadataReservationId !== reservationId) {
      return res.status(400).json({ error: 'El pago no coincide con la reserva actual' });
    }

    return res.status(200).json({
      ok: true,
      status,
      message: mapPaymentIntentStatusMessage(status),
    });
  } catch {
    return res.status(502).json({ error: 'No se pudo consultar el estado del pago en ONVO' });
  }
}
