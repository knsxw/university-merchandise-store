import prisma from '../config/db';

/**
 * Site settings are stored as key/value rows in the database and managed by
 * Administrators from the Admin Dashboard (Site Settings tab).
 */
export const AI_SETTINGS = {
  baseUrl: 'ai.baseUrl',
  apiKey: 'ai.apiKey',
  model: 'ai.model',
} as const;

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
