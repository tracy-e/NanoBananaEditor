export type ProviderType = 'openrouter' | 'gemini' | 'custom';

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AllSettings {
  activeProvider: ProviderType;
  providers: Record<ProviderType, ProviderConfig>;
}

/** Flat view returned by getApiSettings() — active provider resolved */
export interface ApiSettings {
  provider: ProviderType;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const STORAGE_KEY = 'nano-banana-api-settings';

const PROVIDER_DEFAULTS: Record<ProviderType, ProviderConfig> = {
  gemini: {
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash-preview-05-20',
  },
  openrouter: {
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.5-flash-image-preview',
  },
  custom: {
    apiKey: '',
    baseUrl: '',
    model: '',
  },
};

const DEFAULT_ALL_SETTINGS: AllSettings = {
  activeProvider: 'gemini',
  providers: structuredClone(PROVIDER_DEFAULTS),
};

let _cached: AllSettings | null = null;

function hasElectronAPI(): boolean {
  return !!(window as any).electronAPI;
}

/** Migrate old flat format to per-provider format */
function migrateOldSettings(data: any): AllSettings | null {
  if (data && data.provider && data.apiKey && !data.providers) {
    const migrated = structuredClone(DEFAULT_ALL_SETTINGS);
    migrated.activeProvider = data.provider;
    migrated.providers[data.provider as ProviderType] = {
      apiKey: data.apiKey,
      baseUrl: data.baseUrl || PROVIDER_DEFAULTS[data.provider as ProviderType].baseUrl,
      model: data.model || PROVIDER_DEFAULTS[data.provider as ProviderType].model,
    };
    return migrated;
  }
  return null;
}

function loadFromStorage(): AllSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.providers) return data as AllSettings;
      const migrated = migrateOldSettings(data);
      if (migrated) return migrated;
    }
  } catch { /* ignore */ }
  return structuredClone(DEFAULT_ALL_SETTINGS);
}

function resolveFlat(all: AllSettings): ApiSettings {
  const cfg = all.providers[all.activeProvider];
  return { provider: all.activeProvider, ...cfg };
}

export async function initApiSettings(): Promise<ApiSettings> {
  if (hasElectronAPI()) {
    const data = await (window as any).electronAPI.loadSettings();
    if (data) {
      let all: AllSettings;
      if (data.providers) {
        all = data as AllSettings;
      } else {
        all = migrateOldSettings(data) || structuredClone(DEFAULT_ALL_SETTINGS);
      }
      _cached = all;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return resolveFlat(all);
    }
  }
  _cached = loadFromStorage();
  return resolveFlat(_cached);
}

export function getApiSettings(): ApiSettings {
  if (!_cached) _cached = loadFromStorage();
  return resolveFlat(_cached);
}

export function getAllSettings(): AllSettings {
  if (!_cached) _cached = loadFromStorage();
  return _cached;
}

export function saveAllSettings(all: AllSettings) {
  _cached = all;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  if (hasElectronAPI()) {
    (window as any).electronAPI.saveSettings(all);
  }
  window.dispatchEvent(new Event('api-settings-changed'));
}

/** @deprecated use saveAllSettings */
export function saveApiSettings(settings: ApiSettings) {
  const all = getAllSettings();
  all.activeProvider = settings.provider;
  all.providers[settings.provider] = {
    apiKey: settings.apiKey,
    baseUrl: settings.baseUrl,
    model: settings.model,
  };
  saveAllSettings(all);
}

export function getProviderDefaults(provider: string) {
  return PROVIDER_DEFAULTS[provider as ProviderType] || PROVIDER_DEFAULTS.custom;
}

export interface GenerationRequest {
  prompt: string;
  referenceImages?: string[];
  temperature?: number;
  seed?: number;
  imageSize?: string;
}

export interface EditRequest {
  instruction: string;
  originalImage: string;
  referenceImages?: string[];
  maskImage?: string;
  temperature?: number;
  seed?: number;
  imageSize?: string;
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

function convertToGeminiParts(
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>,
): Array<Record<string, unknown>> {
  if (typeof content === 'string') return [{ text: content }];
  return content.map((part) => {
    if (part.type === 'text') return { text: part.text };
    if (part.type === 'image_url' && part.image_url?.url) {
      const match = part.image_url.url.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) return { inlineData: { mimeType: match[1], data: match[2] } };
    }
    return { text: '' };
  });
}

async function callGeminiNativeApi(
  settings: ApiSettings,
  messages: OpenRouterMessage[],
  modalities: string[],
  temperature?: number,
  seed?: number,
  imageSize?: string,
): Promise<OpenRouterResponse> {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: convertToGeminiParts(m.content),
  }));

  const generationConfig: Record<string, unknown> = {
    responseModalities: modalities.map((m) => m.toUpperCase()),
  };
  if (temperature !== undefined) generationConfig.temperature = temperature;
  if (seed !== undefined) generationConfig.seed = seed;
  if (imageSize) generationConfig.imageConfig = { imageSize };

  const baseUrl = settings.baseUrl.replace(/\/openai\/?$/, '').replace(/\/+$/, '');
  const url = `${baseUrl}/models/${settings.model}:generateContent?key=${settings.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  const images: Array<{ type: string; image_url: { url: string } }> = [];
  let textContent = '';

  for (const part of parts) {
    if (part.inlineData) {
      const mime = part.inlineData.mimeType || 'image/png';
      images.push({
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${part.inlineData.data}` },
      });
    } else if (part.text) {
      textContent += part.text;
    }
  }

  return {
    choices: [{
      message: {
        role: 'assistant',
        content: textContent || null,
        ...(images.length > 0 ? { images } : {}),
      },
    }],
  };
}

async function callApi(
  messages: OpenRouterMessage[],
  modalities: string[] = ['image', 'text'],
  temperature?: number,
  seed?: number,
  imageSize?: string,
): Promise<OpenRouterResponse> {
  const settings = getApiSettings();
  if (!settings.apiKey) throw new Error('API Key not configured. Open Settings to add your key.');

  if (settings.provider === 'gemini') {
    return callGeminiNativeApi(settings, messages, modalities, temperature, seed, imageSize);
  }

  const body: Record<string, unknown> = {
    model: settings.model,
    messages,
    modalities,
  };
  if (temperature !== undefined) body.temperature = temperature;
  if (seed !== undefined) body.seed = seed;
  if (imageSize) body.image_size = imageSize;

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
        request.imageSize,
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
        request.imageSize,
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
