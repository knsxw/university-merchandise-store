import { Request, Response } from 'express';
import { resolveAiConfig } from '../services/ai.service';
import { AI_SETTINGS, upsertSetting } from '../services/settings.service';

const maskKey = (key: string): string => (key.length > 8 ? `••••••••••••${key.slice(-4)}` : '••••••••');

const buildSettingsPayload = async () => {
  const ai = await resolveAiConfig();
  return {
    ai: {
      baseUrl: ai.baseUrl,
      model: ai.model,
      apiKeySet: Boolean(ai.apiKey),
      apiKeyMasked: ai.apiKey ? maskKey(ai.apiKey) : null,
      source: ai.source,
    },
  };
};

/**
 * Get site settings (Admin only).
 * The API key is never returned in clear text — only a masked preview.
 */
export const getSiteSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ settings: await buildSettingsPayload() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load site settings', details: (error as Error).message });
  }
};

/**
 * Update site settings (Admin only).
 * Blank/omitted values keep the currently stored setting, so the API key can
 * be left untouched when only changing the model or base URL.
 */
export const updateSiteSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { aiBaseUrl, aiModel, aiApiKey } = req.body;

    const updates: Array<[string, string]> = [];
    if (typeof aiBaseUrl === 'string' && aiBaseUrl.trim() !== '') {
      updates.push([AI_SETTINGS.baseUrl, aiBaseUrl.trim()]);
    }
    if (typeof aiModel === 'string' && aiModel.trim() !== '') {
      updates.push([AI_SETTINGS.model, aiModel.trim()]);
    }
    if (typeof aiApiKey === 'string' && aiApiKey.trim() !== '') {
      updates.push([AI_SETTINGS.apiKey, aiApiKey.trim()]);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No settings provided. Fields left blank keep their current values.' });
      return;
    }

    for (const [key, value] of updates) {
      await upsertSetting(key, value);
    }

    res.json({
      message: 'Site settings saved successfully',
      settings: await buildSettingsPayload(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save site settings', details: (error as Error).message });
  }
};
