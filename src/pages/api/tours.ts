import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

type TourWithOptionalAvailabilityConfig = {
  id: number;
  slug?: string | null;
  availabilityConfig?: unknown;
};

async function hydrateAvailabilityConfigForTours<T extends TourWithOptionalAvailabilityConfig>(tours: T[]): Promise<T[]> {
  return Promise.all(
    tours.map(async (tour) => {
      if (tour.availabilityConfig !== undefined && tour.availabilityConfig !== null) return tour;

      try {
        const rows = await prisma.$queryRaw<Array<{ availabilityConfig: unknown }>>`
          SELECT "availabilityConfig"
          FROM "Tour"
          WHERE "id" = ${tour.id}
          LIMIT 1
        `;

        if (!rows[0]) return tour;
        return {
          ...tour,
          availabilityConfig: rows[0].availabilityConfig,
        };
      } catch {
        return tour;
      }
    }),
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tours = await prisma.tour.findMany({
    include: { category: true, availability: true },
  });
  const toursWithAvailabilityConfig = await hydrateAvailabilityConfigForTours(tours);
  // Prisma ya incluye slug, pero si algún tour no lo tiene, lo forzamos a string vacío para evitar undefined
  const toursWithSlug = toursWithAvailabilityConfig.map((t) => ({ ...t, slug: t.slug || '' }));
  res.status(200).json(toursWithSlug);
}
