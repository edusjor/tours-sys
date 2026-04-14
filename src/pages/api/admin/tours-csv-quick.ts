import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { requireAdminSession } from '../../../lib/adminAuth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

type CsvRow = Record<string, string>;

type CsvQuickPackage = {
  packageId: string;
  packageName: string;
  packageDescription: string;
  prices: {
    nacionalesCRC: number | null;
    extranjerosUSD: number | null;
    estudiantesNacionalesCRC: number | null;
    estudiantesExtranjerosUSD: number | null;
    ninosNacionalesCRC: number | null;
    ninosExtranjerosUSD: number | null;
  };
};

type CsvQuickTourGroup = {
  externalId: string;
  title: string;
  description: string;
  featuredImageUrl: string;
  photosUrlsRaw: string;
  minPeople: number;
  packages: CsvQuickPackage[];
};

type ExistingPriceOption = {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
  isBase: boolean;
};

type ExistingTourPackage = {
  id: string;
  title: string;
  description: string;
  priceOptions: ExistingPriceOption[];
};

const CSV_HEADERS = [
  'tour_external_id',
  'tour_nombre',
  'tour_descripcion',
  'foto_destacada_url',
  'fotos_urls',
  'paquete_external_id',
  'paquete_nombre',
  'paquete_descripcion',
  'min_personas',
  'precio_nacionales_crc',
  'precio_extranjeros_usd',
  'precio_estudiantes_nacionales_crc',
  'precio_estudiantes_extranjeros_usd',
  'precio_ninos_nacionales_crc',
  'precio_ninos_extranjeros_usd',
] as const;

function slugifyTourValue(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function buildUniqueTourSlug(value: unknown, excludeId?: number): Promise<string> {
  const baseSlug = slugifyTourValue(value) || 'tour';
  let suffix = 2;
  let candidate = baseSlug;

  while (
    await prisma.tour.findFirst({
      where: {
        slug: candidate,
        ...(Number.isFinite(excludeId) ? { id: { not: excludeId as number } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix++}`;
  }

  return candidate;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((item) => item.trim());
}

function parseCsvRows(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const headers = splitCsvLine(lines[0]).map((item) => item.toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const rawCells = splitCsvLine(lines[i]);
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = rawCells[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function toCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  if (!raw.includes(',') && !raw.includes('"') && !raw.includes('\n')) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

function parseMoney(value: string): number | null {
  const input = String(value ?? '').trim();
  if (!input) return null;

  const clean = input.replace(/[₡$\s]/g, '');
  if (!clean) return null;

  const hasDot = clean.includes('.');
  const hasComma = clean.includes(',');

  let normalized = clean;
  if (hasDot && hasComma) {
    normalized = clean.replace(/,/g, '');
  } else if (!hasDot && hasComma) {
    normalized = clean.replace(/,/g, '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeImages(featuredImage: string, photosRaw: string): string[] {
  const featured = String(featuredImage || '').trim();
  const rest = String(photosRaw || '')
    .split(/[|;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const all = featured ? [featured, ...rest] : rest;
  return Array.from(new Set(all));
}

function resolveCategoryIdFromTour(tour: { categoryId: number } | null, fallbackCategoryId: number): number {
  return tour?.categoryId ?? fallbackCategoryId;
}

function buildPackagePriceOptions(pkg: CsvQuickPackage): Array<Record<string, unknown>> {
  const options = [
    { id: `${pkg.packageId}-nacionales`, name: 'Nacionales', price: pkg.prices.nacionalesCRC },
    { id: `${pkg.packageId}-extranjeros`, name: 'Extranjeros', price: pkg.prices.extranjerosUSD },
    { id: `${pkg.packageId}-est-nacionales`, name: 'Estudiantes nacionales', price: pkg.prices.estudiantesNacionalesCRC },
    { id: `${pkg.packageId}-est-extranjeros`, name: 'Estudiantes Extranjeros', price: pkg.prices.estudiantesExtranjerosUSD },
    { id: `${pkg.packageId}-ninos-nacionales`, name: 'Ninos nacionales', price: pkg.prices.ninosNacionalesCRC },
    { id: `${pkg.packageId}-ninos-extranjeros`, name: 'Ninos extranjeros', price: pkg.prices.ninosExtranjerosUSD },
  ]
    .filter((item) => item.price !== null)
    .map((item, idx) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      isFree: Number(item.price) === 0,
      isBase: idx === 0,
    }));

  if (!options.length) {
    return [
      {
        id: `${pkg.packageId}-general`,
        name: 'General',
        price: 0,
        isFree: true,
        isBase: true,
      },
    ];
  }

  return options;
}

function buildTourGroups(rows: CsvRow[]): CsvQuickTourGroup[] {
  const grouped = new Map<string, CsvQuickTourGroup>();

  rows.forEach((row, index) => {
    const externalId = String(row.tour_external_id ?? '').trim();
    if (!externalId) return;

    const packageName = String(row.paquete_nombre ?? '').trim();
    if (!packageName) return;

    const packageId = String(row.paquete_external_id ?? '').trim() || `${externalId}-pkg-${index + 1}`;
    const minPeople = Number(row.min_personas || 1);

    const pkg: CsvQuickPackage = {
      packageId,
      packageName,
      packageDescription: String(row.paquete_descripcion ?? '').trim(),
      prices: {
        nacionalesCRC: parseMoney(row.precio_nacionales_crc ?? ''),
        extranjerosUSD: parseMoney(row.precio_extranjeros_usd ?? ''),
        estudiantesNacionalesCRC: parseMoney(row.precio_estudiantes_nacionales_crc ?? ''),
        estudiantesExtranjerosUSD: parseMoney(row.precio_estudiantes_extranjeros_usd ?? ''),
        ninosNacionalesCRC: parseMoney(row.precio_ninos_nacionales_crc ?? ''),
        ninosExtranjerosUSD: parseMoney(row.precio_ninos_extranjeros_usd ?? ''),
      },
    };

    const current = grouped.get(externalId);
    if (!current) {
      grouped.set(externalId, {
        externalId,
        title: String(row.tour_nombre ?? '').trim(),
        description: String(row.tour_descripcion ?? '').trim(),
        featuredImageUrl: String(row.foto_destacada_url ?? '').trim(),
        photosUrlsRaw: String(row.fotos_urls ?? '').trim(),
        minPeople: Number.isFinite(minPeople) && minPeople > 0 ? Math.floor(minPeople) : 1,
        packages: [pkg],
      });
      return;
    }

    if (!current.title && row.tour_nombre) current.title = String(row.tour_nombre).trim();
    if (!current.description && row.tour_descripcion) current.description = String(row.tour_descripcion).trim();
    if (!current.featuredImageUrl && row.foto_destacada_url) current.featuredImageUrl = String(row.foto_destacada_url).trim();
    if (!current.photosUrlsRaw && row.fotos_urls) current.photosUrlsRaw = String(row.fotos_urls).trim();
    current.packages.push(pkg);
  });

  return Array.from(grouped.values()).filter((group) => group.title && group.packages.length > 0);
}

function normalizeExistingTourPackages(input: unknown): ExistingTourPackage[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, idx) => {
      const source = item as { id?: unknown; title?: unknown; description?: unknown; priceOptions?: unknown };
      const title = String(source?.title ?? '').trim();
      const priceOptionsRaw = Array.isArray(source?.priceOptions) ? source.priceOptions : [];
      if (!title || priceOptionsRaw.length === 0) return null;

      const normalizedPriceOptions = priceOptionsRaw
        .map((price, pidx) => {
          const ps = price as { id?: unknown; name?: unknown; price?: unknown; isFree?: unknown; isBase?: unknown };
          const name = String(ps?.name ?? '').trim();
          const parsedPrice = Number(ps?.price);
          if (!name || !Number.isFinite(parsedPrice)) return null;
          return {
            id: String(ps?.id ?? `${idx + 1}-${pidx + 1}`),
            name,
            price: parsedPrice,
            isFree: Boolean(ps?.isFree),
            isBase: Boolean(ps?.isBase),
          };
        })
        .filter((x): x is ExistingPriceOption => x !== null);

      if (!normalizedPriceOptions.length) return null;

      return {
        id: String(source?.id ?? `package-${idx + 1}`),
        title,
        description: String(source?.description ?? '').trim(),
        priceOptions: normalizedPriceOptions,
      };
    })
    .filter((x): x is ExistingTourPackage => x !== null);
}

function getPriceByLabel(priceOptions: ExistingPriceOption[], labels: string[]): number | '' {
  const labelsSet = new Set(labels.map((item) => item.toLowerCase()));
  const found = priceOptions.find((option) => labelsSet.has(String(option.name ?? '').trim().toLowerCase()));
  if (!found) return '';
  const parsed = Number(found.price);
  return Number.isFinite(parsed) ? parsed : '';
}

function buildQuickCsvFromTours(
  tours: Array<{
    id: number;
    title: string;
    description: string;
    images: string[];
    minPeople: number;
    tourPackages: unknown;
  }>,
): string {
  const header = CSV_HEADERS.join(',');
  const rows: string[] = [header];

  tours.forEach((tour) => {
    const images = Array.isArray(tour.images) ? tour.images.filter(Boolean) : [];
    const featuredImage = images[0] || '';
    const photos = images.slice(1).join('|');
    const packages = normalizeExistingTourPackages(tour.tourPackages);

    if (!packages.length) {
      rows.push(
        [
          tour.id,
          toCsvCell(tour.title),
          toCsvCell(tour.description),
          toCsvCell(featuredImage),
          toCsvCell(photos),
          `${tour.id}-pkg-1`,
          toCsvCell('Paquete principal'),
          toCsvCell(''),
          tour.minPeople,
          '',
          '',
          '',
          '',
          '',
          '',
        ].join(','),
      );
      return;
    }

    packages.forEach((pkg, idx) => {
      const priceOptions = Array.isArray(pkg.priceOptions) ? pkg.priceOptions : [];

      rows.push(
        [
          tour.id,
          toCsvCell(tour.title),
          toCsvCell(tour.description),
          toCsvCell(featuredImage),
          toCsvCell(photos),
          toCsvCell(String(pkg.id ?? `${tour.id}-pkg-${idx + 1}`)),
          toCsvCell(String(pkg.title ?? `Paquete ${idx + 1}`)),
          toCsvCell(String(pkg.description ?? '')),
          tour.minPeople,
          getPriceByLabel(priceOptions, ['Nacionales']),
          getPriceByLabel(priceOptions, ['Extranjeros']),
          getPriceByLabel(priceOptions, ['Estudiantes nacionales']),
          getPriceByLabel(priceOptions, ['Estudiantes Extranjeros']),
          getPriceByLabel(priceOptions, ['Ninos nacionales', 'Niños nacionales']),
          getPriceByLabel(priceOptions, ['Ninos extranjeros', 'Niños extranjeros']),
        ].join(','),
      );
    });
  });

  return rows.join('\n');
}

async function importQuickCsv(csvText: string) {
  const rows = parseCsvRows(csvText);
  const groups = buildTourGroups(rows);

  if (!groups.length) {
    return { created: 0, updated: 0, skipped: rows.length };
  }

  const fallbackCategory = await prisma.category.upsert({
    where: { name: 'Sin categoría' },
    update: {},
    create: { name: 'Sin categoría' },
    select: { id: true },
  });

  let created = 0;
  let updated = 0;

  for (const group of groups) {
    const externalNumericId = Number(group.externalId);
    const existingTour = Number.isFinite(externalNumericId) && externalNumericId > 0
      ? await prisma.tour.findUnique({
          where: { id: Math.floor(externalNumericId) },
          select: { id: true, categoryId: true },
        })
      : null;

    const nextImages = normalizeImages(group.featuredImageUrl, group.photosUrlsRaw);
    const tourPackages = group.packages.map((pkg, idx) => ({
      id: pkg.packageId || `${group.externalId}-pkg-${idx + 1}`,
      title: pkg.packageName,
      description: pkg.packageDescription,
      priceOptions: buildPackagePriceOptions(pkg),
    }));
    const tourPackagesJson = tourPackages as unknown as Prisma.InputJsonValue;

    const firstBasePrice = Number((tourPackages[0]?.priceOptions?.[0] as { price?: unknown } | undefined)?.price ?? 0);
    const effectivePrice = Number.isFinite(firstBasePrice) ? firstBasePrice : 0;

    if (existingTour) {
      const nextSlug = await buildUniqueTourSlug(group.title, existingTour.id);
      await prisma.tour.update({
        where: { id: existingTour.id },
        data: {
          title: group.title,
          slug: nextSlug,
          description: group.description || group.title,
          minPeople: group.minPeople,
          images: nextImages,
          price: effectivePrice,
          categoryId: resolveCategoryIdFromTour(existingTour, fallbackCategory.id),
          tourPackages: tourPackagesJson,
          priceOptions: Prisma.JsonNull,
        },
      });
      updated += 1;
      continue;
    }

    const nextSlug = await buildUniqueTourSlug(group.title);
    await prisma.tour.create({
      data: {
        title: group.title,
        slug: nextSlug,
        description: group.description || group.title,
        minPeople: group.minPeople,
        images: nextImages,
        price: effectivePrice,
        categoryId: fallbackCategory.id,
        status: 'BORRADOR',
        tourPackages: tourPackagesJson,
        priceOptions: Prisma.JsonNull,
      },
    });
    created += 1;
  }

  return { created, updated, skipped: Math.max(0, rows.length - groups.length) };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdminSession(req, res)) return;

  if (req.method === 'GET') {
    try {
      const tours = await prisma.tour.findMany({
        where: { isDeleted: false },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          images: true,
          minPeople: true,
          tourPackages: true,
        },
      });

      const csv = buildQuickCsvFromTours(tours);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="tours-quick-format.csv"');
      return res.status(200).send(csv);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      return res.status(500).json({ error: 'No se pudo exportar el CSV rápido.', detail });
    }
  }

  if (req.method === 'POST') {
    const csvText = String(req.body?.csvText ?? '').trim();
    if (!csvText) {
      return res.status(400).json({ error: 'Debes enviar csvText en el body.' });
    }

    try {
      const summary = await importQuickCsv(csvText);
      return res.status(200).json({ ok: true, ...summary });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      return res.status(500).json({ error: 'No se pudo importar el CSV rápido.', detail });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
