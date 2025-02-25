import { ProviderConfig } from '../../shared/types/provider';
import { openAIProvider } from './openai';
import { googleProvider } from './google';
import { anthropicProvider } from './anthropic';
import { localProvider } from './local';

export const providers = {
  openAI: openAIProvider,
  google: googleProvider,
  anthropic: anthropicProvider,
  local: localProvider
} as const;

export type ProviderName = keyof typeof providers;

export function getProvider(name: ProviderName) {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unsupported provider: ${name}`);
  }
  return provider;
}

export async function translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
  const provider = getProvider(config.provider as ProviderName);
  return provider.translate(text, config, isArticle);
}

export * from './config';
