import OpenAI from "openai";

let _openrouter: OpenAI | null = null;

export const openrouter = new Proxy({} as OpenAI, {
  get: (target, prop) => {
    if (!_openrouter) {
      const baseURL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || 'mock-api-key';
      _openrouter = new OpenAI({ baseURL, apiKey });
    }
    return (_openrouter as any)[prop];
  }
});
