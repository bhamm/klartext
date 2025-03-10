/**
 * Type definitions for the Klartext content script
 */

/**
 * Message types for communication with background script
 */
export interface ContentMessage {
  action: ContentMessageAction;
  html?: string;
  id?: string;
  translation?: string;
  error?: string;
  settings?: ContentSettings;
  feedback?: FeedbackData;
}

/**
 * Content message action types
 */
export type ContentMessageAction = 
  | 'ping'
  | 'translateArticle'
  | 'translateSection'
  | 'startArticleMode'
  | 'startFullPageMode'
  | 'startTranslation'
  | 'showTranslation'
  | 'showError'
  | 'updateSettings'
  | 'submitFeedback';

/**
 * Content settings interface
 */
export interface ContentSettings {
  textSize?: 'normal' | 'gross' | 'sehr-gross';
  compareView?: boolean;
  excludeComments?: boolean;
  experimentalFeatures?: {
    fullPageTranslation?: boolean;
    [key: string]: boolean | undefined;
  };
  [key: string]: any;
}

/**
 * Feedback data interface
 */
export interface FeedbackData {
  rating: number;
  category: string;
  comment: string;
  details: {
    originalText: string;
    translatedText: string;
    url: string;
    provider: string;
    model: string;
  };
}

/**
 * DOM element attributes interface
 */
export interface ElementAttributes {
  className?: string;
  textContent?: string;
  innerHTML?: string;
  [key: string]: any;
}

/**
 * Section data interface
 */
export interface SectionData {
  originalSection: HTMLElement;
  content: string;
}

/**
 * Speech controller interface
 */
export interface SpeechControllerInterface {
  utterance: SpeechSynthesisUtterance | null;
  words: string[];
  isPlaying: boolean;
  button: HTMLElement | null;
  debugMode: boolean;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  rate: number;
  ttsProvider: string;
  
  setup(text: string, words: string[], button: HTMLElement): void;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  toggle(): void;
  updateButtonState(isPlaying: boolean): void;
  loadVoices(): void;
  setSettings(settings: any): void;
  getAvailableVoices(): SpeechSynthesisVoice[];
}

/**
 * Translation controls interface
 */
export interface TranslationControlsInterface {
  container: HTMLElement | null;
  progressBar: HTMLElement | null;
  progressText: HTMLElement | null;
  viewToggle: HTMLElement | null;
  ttsButton: HTMLElement | null;
  ttsStopButton: HTMLElement | null;
  minimizeButton: HTMLElement | null;
  isMinimized: boolean;
  
  setupControls(): void;
  updateProgress(current: number, total: number): void;
  toggleMinimize(): void;
  toggleView(): void;
  show(): void;
  hide(): void;
  setupTTS(text: string, words: string[]): void;
}

/**
 * Translation overlay interface
 */
export interface TranslationOverlayInterface {
  overlay: HTMLElement | null;
  backdrop: HTMLElement | null;
  content: HTMLElement | null;
  closeButton: HTMLElement | null;
  
  setupOverlay(): void;
  handlePrint(): void;
  showLoading(): void;
  show(translation: string): void;
  createFeedbackContainer(translation: string): HTMLElement;
  submitFeedback(
    stars: HTMLElement[], 
    commentInput: HTMLTextAreaElement, 
    includeCheckbox: HTMLInputElement, 
    translation: string, 
    feedbackButton: HTMLButtonElement
  ): Promise<void>;
  showError(message: string): void;
  reportError(message: string): Promise<void>;
  hide(): void;
  isVisible(): boolean;
}

/**
 * Page translator interface
 */
export interface PageTranslatorInterface {
  sections: SectionData[];
  currentSection: number;
  controls: TranslationControlsInterface | null;
  
  setControls(controls: TranslationControlsInterface): void;
  initialize(): Promise<void>;
  getContentSections(): SectionData[];
  translateNextSection(): Promise<void>;
  appendTranslation(translation: string, id: string): void;
  completeTranslation(): void;
  showError(message: string): void;
}
