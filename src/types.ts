export type DiaryStyle = 'natural' | 'neat' | 'casual' | 'concise' | 'poetic' | 'warm' | 'novelist' | 'funny' | 'empathic';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  diaryStyle?: DiaryStyle;
  createdAt?: any;
}

export type MomentType = 'text' | 'image' | 'audio' | 'video';

export interface Moment {
  id: string;
  userId: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  date: string; // YYYY-MM-DD
  type: MomentType;
  content: string; // Text or caption/transcription
  mediaUrl?: string; // base64 or photo URL
  createdAt: any;
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
  likesCount: number;
  commentsCount: number;
  momentIds?: string[];
  createdAt: any;
  updatedAt?: any;
}

export type ReactionType = 'heart' | 'inspire' | 'cozy' | 'support';

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
