export type ClipSuggestion = {
  startTime: string; // "HH:MM:SS" or "MM:SS", matching the transcript's format
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  title: string; // short label for the clip
  reason: string; // why this segment works as short-form content
  confidence: number; // 0..1
};

export type HookOption = {
  hookText: string;
  viralScore: number; // 0-100
  emotionalType: string; // e.g. 'FOMO', 'Curiosity', 'Pattern Interrupt'
};

export type UppercasePlatform = "TIKTOK" | "REELS" | "YOUTUBE";

export type Platform =
  | "youtube_shorts"
  | "instagram_reels"
  | "tiktok"
  | "x"
  | "linkedin";

export type SinglePlatformAdaptation = {
  title: string;
  description: string;
  hashtags: string[];
};

export type PlatformAdaptation = {
  platform: Platform;
  caption: string;
  hashtags: string[];
  hook: string;
  aspectRatio: "9:16" | "1:1" | "16:9";
  maxDurationSeconds: number;
  postingTip: string;
};

export type ScriptFootageMatch = {
  scriptBeat: string;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  matchScore: number; // 0..1
  note: string;
};

export type EditDecisionItem = {
  id: string;
  type: "clip" | "caption" | "hook_overlay";
  startSeconds: number;
  endSeconds: number;
  text?: string;
  sourceClipIndex?: number;
  editable: true;
};

export type EditDecisionList = {
  version: 1;
  platform?: Platform;
  items: EditDecisionItem[];
};

export type ContentStat = {
  title: string;
  platform: Platform | string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  durationSeconds: number;
  publishedAt: string;
};

export type CreatorInsights = {
  summary: string;
  topPerformers: string[];
  patterns: string[];
  recommendations: string[];
  bestPostingWindow?: string;
};

export type VideoScene = {
  startSeconds: number;
  endSeconds: number;
  startTime: string;
  endTime: string;
  description: string;
  visualTags: string[];
};

export type VideoAnalysis = {
  transcript: string;
  scenes: VideoScene[];
  durationSeconds?: number;
};

export type VideoAnalysisInput = {
  fileUri?: string;
  filePath?: string;
  mimeType: string;
};

export type PipelineInput = {
  script: string;
  video?: VideoAnalysisInput;
  transcript?: string;
  platforms?: Platform[];
};

export type PipelineResult = {
  hooks: HookOption[] | string[];
  clips: ClipSuggestion[];
  matches: ScriptFootageMatch[];
  edl: EditDecisionList;
  adaptations: PlatformAdaptation[];
  transcript: string;
  scenes?: VideoScene[];
  warnings: string[];
};
