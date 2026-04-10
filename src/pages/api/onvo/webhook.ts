import type { NextApiRequest, NextApiResponse } from 'next';
import { finalizeReservationPayment } from '../../../lib/reservationPayment';

function findStringValue(input: unknown, candidateKeys: string[]): string {
  if (!input || typeof input !== 'object') return '';

  const source = input as Record<string, unknown>;
  for (const key of candidateKeys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  for (const value of Object.values(source)) {
    const nested = findStringValue(value, candidateKeys);
    if (nested) return nested;
  }

  return '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  const paymentIntentId = findStringValue(req.body, ['paymentIntentId', 'payment_intent_id', 'id', 'paymentIntent']);
  if (!paymentIntentId) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const result = await finalizeReservationPayment({ paymentIntentId });
  if (!result.ok && result.pending) {
    return res.status(200).json({ ok: true, pending: true });
  }

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ ok: true, message: result.message });
}
