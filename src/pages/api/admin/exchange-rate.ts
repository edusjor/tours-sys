import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../lib/adminAuth';
import { getUsdToCrcExchangeRate, setUsdToCrcExchangeRate } from '../../../lib/exchangeRate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).end();
  }

  if (!requireAdminSession(req, res)) return;

  try {
    if (req.method === 'GET') {
      const usdToCrc = await getUsdToCrcExchangeRate();
      return res.status(200).json({ usdToCrc });
    }

    const parsedRate = Number(req.body?.usdToCrc);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      return res.status(400).json({ error: 'Tipo de cambio inválido' });
    }

    const usdToCrc = await setUsdToCrcExchangeRate(parsedRate);
    return res.status(200).json({ ok: true, usdToCrc });
  } catch {
    return res.status(500).json({ error: 'No se pudo guardar el tipo de cambio' });
  }
}
