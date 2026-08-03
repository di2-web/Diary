import { Moment, DiaryStyle } from '../types';

export interface GenerateDiaryRequest {
  moments: Moment[];
  date: string;
  diaryStyle?: DiaryStyle;
  userDisplayName?: string;
}

export interface GeneratedDiaryResponse {
  title: string;
  content: string;
  summary: string;
  mood: string;
  tags: string[];
  aiReflection: string;
  imagePrompt: string;
}

export async function apiGenerateDiary(req: GenerateDiaryRequest): Promise<GeneratedDiaryResponse> {
  const res = await fetch('/api/generate-diary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || '日記の生成に失敗しました');
  }

  return data.diary;
}

export async function apiGenerateCover(prompt: string): Promise<string> {
  const res = await fetch('/api/generate-cover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'カバー画像の生成に失敗しました');
  }

  return data.imageUrl;
}

export async function apiGenerateTTS(text: string, voiceName: string = 'Kore'): Promise<string> {
  const res = await fetch('/api/generate-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || '朗読音声の生成に失敗しました');
  }

  return data.audioUrl;
}

export async function apiGenerateAiComment(diaryTitle: string, diaryContent: string, authorName: string): Promise<string> {
  const res = await fetch('/api/generate-ai-comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ diaryTitle, diaryContent, authorName }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'AIコメントの生成に失敗しました');
  }

  return data.comment;
}
