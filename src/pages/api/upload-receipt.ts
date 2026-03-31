import fs from 'fs/promises';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { type File as FormidableFile } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: NextApiRequest): Promise<formidable.Files> {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
    filter: ({ mimetype }) => typeof mimetype === 'string' && mimetype.startsWith('image/'),
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, _fields, files) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(files);
    });
  });
}

function getSafeExtension(file: FormidableFile): string {
  const fromName = path.extname(file.originalFilename || '').toLowerCase();
  if (fromName && /^\.[a-z0-9]+$/i.test(fromName)) return fromName;

  const mime = String(file.mimetype || '').toLowerCase();
  if (mime.includes('png')) return '.png';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('gif')) return '.gif';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  return '.jpg';
}

async function moveFileWithFallback(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    await fs.rename(sourcePath, destinationPath);
  } catch {
    await fs.copyFile(sourcePath, destinationPath);
    await fs.unlink(sourcePath).catch(() => undefined);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const files = await parseForm(req);
    const file = (Array.isArray(files.receipt) ? files.receipt[0] : files.receipt) as FormidableFile | undefined;

    if (!file?.filepath) {
      return res.status(400).json({ error: 'Debes subir una imagen valida del comprobante.' });
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = getSafeExtension(file);
    const name = `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const destination = path.join(uploadDir, name);
    await moveFileWithFallback(file.filepath, destination);

    return res.status(200).json({ url: `/uploads/receipts/${name}` });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: 'No se pudo subir el comprobante.', detail });
  }
}
