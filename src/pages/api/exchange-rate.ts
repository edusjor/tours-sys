import type { NextApiRequest, NextApiResponse } from 'next';
import { getUsdToCrcExchangeRate } from '../../lib/exchangeRate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const usdToCrc = await getUsdToCrcExchangeRate();
    return res.status(200).json({ usdToCrc });
  } catch {
    return res.status(500).json({ error: 'No se pudo obtener el tipo de cambio' });
  }
}
