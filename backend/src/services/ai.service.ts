import OpenAI from 'openai';
import { config } from '../config/env';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openaiClient && config.openaiApiKey && config.openaiApiKey !== 'your_openai_api_key_here') {
    openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openaiClient;
}

export interface GenerateDescriptionParams {
  productName: string;
  categoryName?: string;
  keywords?: string[];
  department?: string | null;
}

/**
 * Generates an engaging, professional e-commerce product description using OpenAI
 */
export async function generateProductDescription(params: GenerateDescriptionParams): Promise<string> {
  const { productName, categoryName, keywords, department } = params;
  const client = getOpenAIClient();

  if (!client) {
    // Graceful fallback description when OpenAI key is not configured
    const deptNote = department ? ` Proudly representing the ${department} department.` : '';
    const catNote = categoryName ? ` within our ${categoryName} collection` : '';
    return `Official premium ${productName}${catNote}, crafted with high-quality durable materials featuring official university branding.${deptNote} Perfect for campus life, academic events, and everyday university spirit.`;
  }

  try {
    const prompt = `You are a professional copywriter for a premium Smart University Merchandise Store.
Write an appealing, concise, and professional product description (2 to 4 sentences) for:
Product Name: ${productName}
${categoryName ? `Category: ${categoryName}` : ''}
${department ? `Department Special: ${department}` : ''}
${keywords && keywords.length > 0 ? `Key Features: ${keywords.join(', ')}` : ''}

The description should highlight university pride, comfort/utility, and premium quality. Output only the finished description without commentary.`;

    const response = await client.chat.completions.create({
      model: config.openaiModel || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const description = response.choices[0]?.message?.content?.trim();
    return description || `Official university merchandise: ${productName}. High quality and built for university pride.`;
  } catch (error) {
    console.error('⚠️ OpenAI Generation Error, using fallback:', (error as Error).message);
    return `Official premium ${productName}, designed for durability and campus style with authentic university branding.`;
  }
}
