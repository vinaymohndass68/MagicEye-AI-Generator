
export enum TextureMode {
  NOISE = 'NOISE',
  COLOR_NOISE = 'COLOR_NOISE',
  AI_GENERATED = 'AI_GENERATED'
}

export type SourceType = 'TEXT' | 'IMAGE';

export interface GenerationParams {
  sourceType: SourceType;
  text: string;
  fontSize: number;
  depth: number;
  mode: TextureMode;
  aiPrompt?: string;
  patternScale: number;
  depthImage?: string; // base64
}

export interface StereoSettings {
  contrast: number;
  patternScale: number;
}
