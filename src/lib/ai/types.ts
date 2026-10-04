export type ClipSuggestion = {
  startTime: string; // "HH:MM:SS" or "MM:SS", matching the transcript's format
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  title: string; // short label for the clip
  reason: string; // why this segment works as short-form content
  confidence: number; // 0..1
};

export type Platform =
  | "youtube_shorts"
  | "instagram_reels"
  | "tiktok"
  | "x"
  | "linkedin";

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
