export interface CreatorAsset {
  id: string;
  projectId: string;
  name: string;
  type: 'VIDEO' | 'AUDIO' | 'IMAGE';
  url: string;
  duration?: number;
}

export interface ScriptData {
  id: string;
  projectId: string;
  title: string;
  content: string;
  hooks: string[];
}

export interface GeneratedClip {
  id: string;
  projectId: string;
  title: string;
  videoUrl: string;
  startTime: number;
  endTime: number;
  platform: 'SHORTS' | 'REELS' | 'TIKTOK';
}
