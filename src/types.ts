export type DiaryStyle = 'natural' | 'neat' | 'casual' | 'concise' | 'poetic' | 'warm' | 'novelist' | 'funny' | 'empathic';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  diaryStyle?: DiaryStyle;
  customShareCategories?: string[]; // 最大3つのカスタム共有カテゴリ
  createdAt?: any;
}

export type MomentType = 'text' | 'image' | 'audio' | 'video';

export interface WavePoint {
  hour: number; // 0 to 24 (float supported)
  score: number; // -100 (低) to +100 (高)
}

export interface MoodWave {
  date: string; // YYYY-MM-DD
  points: WavePoint[];
  updatedAt?: any;
}

export interface Moment {
  id: string;
  userId: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  date: string; // YYYY-MM-DD
  type: MomentType;
  content: string; // Text or caption/transcription
  mediaUrl?: string; // base64 or photo URL
  isPinned?: boolean; // 保護（ピン留め）スイッチ - 自動消去から保護
  isPublic?: boolean; // 公開設定
  shareCategories?: string[]; // 共有グループ ('All' | 'Default' | カスタム名)
  likesCount?: number;
  commentsCount?: number;
  createdAt: any;
}

export interface DiaryStamp {
  id: string;
  icon: string;
  label: string;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  rotation?: number; // degrees
}

export interface Diary {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string; // Markdown
  summary: string;
  coverImageUrl?: string;
  audioNarrationUrl?: string;
  aiReflection?: string;
  isPublic: boolean;
  shareCategories?: string[]; // 共有グループ ('All' | 'Default' | カスタム名)
  likesCount: number;
  commentsCount: number;
  momentIds?: string[];
  // Decoration properties
  bgStyle?: 'paper-craft' | 'paper-washi' | 'paper-grid' | 'paper-dots' | 'paper-cafe' | 'paper-white';
  fontStyle?: 'serif' | 'handwriting' | 'sans' | 'mono';
  stamps?: DiaryStamp[];
  createdAt: any;
  updatedAt?: any;
}

export type ReactionType = 'heart' | 'inspire' | 'cozy' | 'support' | string;

export interface DiaryLike {
  id: string;
  diaryId: string;
  userId: string;
  reaction: ReactionType;
  createdAt: any;
}

export interface DiaryComment {
  id: string;
  diaryId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  content: string;
  isAiComment?: boolean;
  createdAt: any;
}

export interface GenerationProgressStep {
  step: 'analyzing' | 'writing' | 'drawing' | 'tts' | 'completed';
  label: string;
  description: string;
}

export interface FriendRelation {
  id: string; // ドキュメントID
  userId: string; // 設定しているユーザーのUID
  friendUid: string; // 友達のUID
  friendDisplayName: string;
  friendPhotoURL?: string;
  friendBio?: string;
  assignedCategories: string[]; // 割り振った共有カテゴリ (['Default', '家族'] 等)
  createdAt: any;
}

