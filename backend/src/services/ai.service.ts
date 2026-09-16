import OpenAI from 'openai';
import { config } from '../config/env';
import { AI_SETTINGS, getSettings } from './settings.service';

export interface AiRuntimeConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  source: 'database' | 'none';
}

/**
 * Resolves the AI provider configuration for the current request.
 * The API key is read only from database site settings managed through the
 * Admin Dashboard. Any OpenAI-compatible provider is supported by pointing
 * baseUrl at it (e.g. OpenRouter, Together, Azure OpenAI, Ollama).
 */
export async function resolveAiConfig(): Promise<AiRuntimeConfig> {
  const stored = await getSettings(Object.values(AI_SETTINGS));
  const apiKey = stored[AI_SETTINGS.apiKey]?.trim() || '';

  return {
    baseUrl: stored[AI_SETTINGS.baseUrl]?.trim() || 'https://api.openai.com/v1',
    apiKey,
    model: stored[AI_SETTINGS.model]?.trim() || config.openaiModel || 'gpt-4o-mini',
    source: apiKey ? 'database' : 'none',
  };
}

export interface GenerateDescriptionParams {
  productName: string;
  categoryName?: string;
  keywords?: string[];
  department?: string | null;
}

/**
 * Generates an engaging, professional e-commerce product description using the
 * configured OpenAI-compatible AI provider.
 */
export async function generateProductDescription(params: GenerateDescriptionParams): Promise<string> {
  const { productName, categoryName, keywords, department } = params;
  const ai = await resolveAiConfig();

  if (!ai.apiKey) {
    // Graceful fallback description when no AI provider is configured
    const deptNote = department ? ` Proudly representing the ${department} department.` : '';
    const catNote = categoryName ? ` within our ${categoryName} collection` : '';
    return `Official premium ${productName}${catNote}, crafted with high-quality durable materials featuring official university branding.${deptNote} Perfect for campus life, academic events, and everyday university spirit.`;
  }

  try {
    const client = new OpenAI({ apiKey: ai.apiKey, baseURL: ai.baseUrl });

    const prompt = `You are a professional copywriter for a premium Smart University Merchandise Store.
Write an appealing, concise, and professional product description (2 to 4 sentences, under 80 words) for:
Product Name: ${productName}
${categoryName ? `Category: ${categoryName}` : ''}
${department ? `Department Special: ${department}` : ''}
${keywords && keywords.length > 0 ? `Key Features: ${keywords.join(', ')}` : ''}

The description should highlight university pride, comfort/utility, and premium quality. Output only the finished description without commentary.`;

    const callAi = (maxTokens: number) =>
      client.chat.completions.create({
        model: ai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: maxTokens,
      });

    // Reasoning models spend hidden tokens on chain-of-thought before the final
    // answer; a tight budget can end with finish_reason "length" and empty
    // content, so start generous and retry once with more headroom.
    let response = await callAi(1000);
    let choice = response.choices[0];
    if (!choice?.message?.content?.trim() || choice?.finish_reason === 'length') {
      response = await callAi(2000);
      choice = response.choices[0];
    }

    const description = choice?.message?.content?.trim();
    return description || `Official university merchandise: ${productName}. High quality and built for university pride.`;
  } catch (error) {
    console.error(`⚠️ AI generation error via ${ai.baseUrl} (model ${ai.model}), using fallback:`, (error as Error).message);
    return `Official premium ${productName}, designed for durability and campus style with authentic university branding.`;
  }
}
