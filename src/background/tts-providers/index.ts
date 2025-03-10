/**
 * TTS provider index
 */
import { ttsProviderRegistry } from './registry';
export * from './registry';

// Import all providers to register them
import './browser';
import './google';

/**
 * Get all TTS provider metadata
 * @returns Object mapping provider IDs to metadata
 */
export function getTTSProvidersMetadata() {
  return ttsProviderRegistry.getAllMetadata();
}
