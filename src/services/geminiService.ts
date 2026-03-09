export interface ApiSettings {
  provider: 'openrouter' | 'gemini' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

const STORAGE_KEY = 'nano-banana-api-settings';

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.5-flash-image-preview',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash-preview-05-20',
  },
  custom: {
    baseUrl: '',
    model: '',
  },
};

export function getApiSettings(): ApiSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored) as ApiSettings;
      if (settings.apiKey) return settings;
    }
  } catch { /* ignore */ }

  // No fallback to env vars — settings must come from UI
  return {
    provider: 'custom',
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.5-flash-image-preview',
  };
}

export function saveApiSettings(settings: ApiSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('api-settings-changed'));
}

export function getProviderDefaults(provider: string) {
  return PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom;
}

export interface GenerationRequest {
  prompt: string;
  referenceImages?: string[];
  temperature?: number;
  seed?: number;
}

export interface EditRequest {
  instruction: string;
  originalImage: string;
  referenceImages?: string[];
  maskImage?: string;
  temperature?: number;
  seed?: number;
}

export interface SegmentationRequest {
  image: string;
  query: string;
}

interface OpenRouterMessage {
  role: string;
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      images?: Array<{
        type: string;
        image_url: { url: string };
      }>;
    };
  }>;
}

async function callApi(
  messages: OpenRouterMessage[],
  modalities: string[] = ['image', 'text'],
  temperature?: number,
  seed?: number,
): Promise<OpenRouterResponse> {
  const settings = getApiSettings();
  if (!settings.apiKey) throw new Error('API Key not configured. Open Settings to add your key.');

  const body: Record<string, unknown> = {
    model: settings.model,
    messages,
    modalities,
  };
  if (temperature !== undefined) body.temperature = temperature;
  if (seed !== undefined) body.seed = seed;

  const url = `${settings.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

function extractImages(response: OpenRouterResponse): string[] {
  const images: string[] = [];
  const message = response.choices?.[0]?.message;
  if (!message) return images;

  if (message.images) {
    for (const img of message.images) {
      const url = img.image_url?.url || '';
      const base64 = url.replace(/^data:image\/\w+;base64,/, '');
      if (base64) images.push(base64);
    }
  }

  return images;
}

function buildContentParts(
  text: string,
  images?: string[],
): Array<{ type: string; text?: string; image_url?: { url: string } }> {
  const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text },
  ];

  if (images) {
    for (const img of images) {
      parts.push({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${img}` },
      });
    }
  }

  return parts;
}

export class GeminiService {
  async generateImage(request: GenerationRequest): Promise<string[]> {
    try {
      const content = buildContentParts(request.prompt, request.referenceImages);
      const response = await callApi(
        [{ role: 'user', content }],
        ['image', 'text'],
        request.temperature,
        request.seed,
      );
      return extractImages(response);
    } catch (error) {
      console.error('Error generating image:', error);
      throw error instanceof Error ? error : new Error('Failed to generate image.');
    }
  }

  async editImage(request: EditRequest): Promise<string[]> {
    try {
      const images = [request.originalImage];
      if (request.referenceImages) images.push(...request.referenceImages);
      if (request.maskImage) images.push(request.maskImage);

      const content = buildContentParts(this.buildEditPrompt(request), images);
      const response = await callApi(
        [{ role: 'user', content }],
        ['image', 'text'],
        request.temperature,
        request.seed,
      );
      return extractImages(response);
    } catch (error) {
      console.error('Error editing image:', error);
      throw error instanceof Error ? error : new Error('Failed to edit image.');
    }
  }

  async segmentImage(request: SegmentationRequest): Promise<any> {
    try {
      const content = buildContentParts(
        `Analyze this image and create a segmentation mask for: ${request.query}

Return a JSON object with this exact structure:
{
  "masks": [
    {
      "label": "description of the segmented object",
      "box_2d": [x, y, width, height],
      "mask": "base64-encoded binary mask image"
    }
  ]
}

Only segment the specific object or region requested. The mask should be a binary PNG where white pixels (255) indicate the selected region and black pixels (0) indicate the background.`,
        [request.image],
      );

      const response = await callApi(
        [{ role: 'user', content }],
        ['text'],
      );

      const responseText = response.choices?.[0]?.message?.content;
      if (!responseText) throw new Error('No response from model');
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error segmenting image:', error);
      throw error instanceof Error ? error : new Error('Failed to segment image.');
    }
  }

  private buildEditPrompt(request: EditRequest): string {
    const maskInstruction = request.maskImage
      ? "\n\nIMPORTANT: Apply changes ONLY where the mask image shows white pixels (value 255). Leave all other areas completely unchanged. Respect the mask boundaries precisely and maintain seamless blending at the edges."
      : "";

    return `Edit this image according to the following instruction: ${request.instruction}

Maintain the original image's lighting, perspective, and overall composition. Make the changes look natural and seamlessly integrated.${maskInstruction}

Preserve image quality and ensure the edit looks professional and realistic.`;
  }
}

export const geminiService = new GeminiService();
