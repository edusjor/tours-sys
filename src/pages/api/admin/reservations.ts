import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAdminSession } from '../../../lib/adminAuth';

type SortBy = 'createdAt' | 'date';
type SortOrder = 'asc' | 'desc';

function normalizeSortBy(value: unknown): SortBy {
  return String(value ?? '').trim() === 'date' ? 'date' : 'createdAt';
}

function normalizeSortOrder(value: unknown): SortOrder {
  return String(value ?? '').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
}

const SINPE_PAYMENT_METHOD = 'SINPE Movil';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdminSession(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  const sortBy = normalizeSortBy(req.query.sortBy);
  const order = normalizeSortOrder(req.query.order);

  try {
    const orderBy = sortBy === 'createdAt' ? { id: order } : { date: order };

    const reservations = await prisma.reservation.findMany({
      orderBy,
      where: {
        OR: [
          { paid: true },
          { paymentMethod: SINPE_PAYMENT_METHOD },
        ],
      },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const normalizedReservations = reservations.map((reservation) => {
      const entry = reservation as Record<string, unknown>;
      const createdAt =
        typeof entry.createdAt === 'string'
          ? entry.createdAt
          : entry.createdAt instanceof Date
            ? entry.createdAt.toISOString()
            : reservation.date.toISOString();

      return {
        ...reservation,
        createdAt,
        sinpeReceiptUrl: typeof entry.sinpeReceiptUrl === 'string' ? entry.sinpeReceiptUrl : null,
      };
    });

    return res.status(200).json({ reservations: normalizedReservations, sortBy, order });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: 'No se pudieron cargar las reservas.', detail });
  }
}
