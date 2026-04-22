import { prisma } from './prisma';

const USD_TO_CRC_KEY = 'usd_to_crc';
export const DEFAULT_USD_TO_CRC_EXCHANGE_RATE = 520;

export async function getUsdToCrcExchangeRate(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: USD_TO_CRC_KEY },
    select: { numberValue: true },
  });

  const rate = Number(setting?.numberValue ?? NaN);
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

  await prisma.systemSetting.upsert({
    where: { key: USD_TO_CRC_KEY },
    update: { numberValue: rate },
    create: { key: USD_TO_CRC_KEY, numberValue: rate },
  });

  return rate;
}
