import { prisma } from './prisma';

const SETTINGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "SystemSetting" (
  "key" TEXT PRIMARY KEY,
  "number_value" DOUBLE PRECISION NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
`;

const USD_TO_CRC_KEY = 'usd_to_crc';
export const DEFAULT_USD_TO_CRC_EXCHANGE_RATE = 520;

async function ensureSystemSettingTable(): Promise<void> {
  await prisma.$executeRawUnsafe(SETTINGS_TABLE_SQL);
}

export async function getUsdToCrcExchangeRate(): Promise<number> {
  await ensureSystemSettingTable();

  const rows = await prisma.$queryRaw<Array<{ number_value: number }>>`
    SELECT "number_value"
    FROM "SystemSetting"
    WHERE "key" = ${USD_TO_CRC_KEY}
    LIMIT 1
  `;

  const rate = Number(rows[0]?.number_value ?? NaN);
  if (Number.isFinite(rate) && rate > 0) {
    return rate;
  }

  return DEFAULT_USD_TO_CRC_EXCHANGE_RATE;
}

export async function setUsdToCrcExchangeRate(input: number): Promise<number> {
  const rate = Number(input);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Tipo de cambio inválido');
  }

  await ensureSystemSettingTable();

  await prisma.$executeRaw`
    INSERT INTO "SystemSetting" ("key", "number_value", "updated_at")
    VALUES (${USD_TO_CRC_KEY}, ${rate}, NOW())
    ON CONFLICT ("key")
    DO UPDATE SET "number_value" = EXCLUDED."number_value", "updated_at" = NOW()
  `;

  return rate;
}
