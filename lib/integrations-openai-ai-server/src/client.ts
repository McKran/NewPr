import OpenAI from "openai";

let _openai: OpenAI | null = null;

export const openai = new Proxy({} as OpenAI, {
  get: (target, prop) => {
    if (!_openai) {
      const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || 'mock-api-key';
      _openai = new OpenAI({ baseURL, apiKey });
    }
    return (_openai as any)[prop];
  }
});
