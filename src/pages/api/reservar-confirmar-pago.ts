import type { NextApiRequest, NextApiResponse } from 'next';
import { finalizeReservationPayment } from '../../lib/reservationPayment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const reservationId = Number(req.body?.reservationId);
  const paymentIntentId = String(req.body?.paymentIntentId ?? '').trim();

  if (!Number.isFinite(reservationId) || reservationId <= 0 || !paymentIntentId) {
    return res.status(400).json({ error: 'Datos de confirmacion invalidos' });
  }

  const result = await finalizeReservationPayment({ paymentIntentId, reservationId });
  if (!result.ok) {
    if (result.pending) {
      return res.status(202).json({ pending: true, message: result.message || result.error });
    }

    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({
    ok: true,
    message: result.message,
  });
}
