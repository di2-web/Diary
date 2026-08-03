import React, { useState } from 'react';
import { Sparkles, Check, Loader2, Volume2, Globe, Lock, X, RefreshCw, Wand2 } from 'lucide-react';
import { Moment, DiaryStyle, UserProfile } from '../types';
import { apiGenerateDiary, apiGenerateCover, apiGenerateTTS } from '../lib/geminiApi';
import { addDoc, collection, db } from '../firebase';

interface DiaryGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moments: Moment[];
  selectedDate: string;
  user: UserProfile | null;
  onDiaryCreated: () => void;
}

export const DiaryGeneratorModal: React.FC<DiaryGeneratorModalProps> = ({
  isOpen,
  onClose,
  moments,
  selectedDate,
  user,
  onDiaryCreated,
}) => {
  const [style, setStyle] = useState<DiaryStyle>(user?.diaryStyle || 'poetic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [generateTTSOption, setGenerateTTSOption] = useState<boolean>(true);
  const [isPublic, setIsPublic] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!moments || moments.length === 0) {
      alert('日記を生成するための投稿（モーメント）がありません。先につぶやきを投稿してください。');
      return;
    }

    try {
      setIsGenerating(true);

      // Step 1: Writing Diary with Gemini 3.6 Flash
      setCurrentStep('投稿メッセージと写真を解析し、AI日記を執筆中...');
      const diaryResult = await apiGenerateDiary({
        moments,
        date: selectedDate,
        diaryStyle: style,
        userDisplayName: user?.displayName || 'ユーザー',
      });

      // Step 2: Generating Cover Image with Gemini Image Generation
      setCurrentStep('今日の一日を象徴するカバーアートを生成中...');
      let coverImageUrl = '';
      try {
        coverImageUrl = await apiGenerateCover(diaryResult.imagePrompt);
      } catch (err) {
        console.warn('Cover image generation fallback:', err);
        coverImageUrl = `https://picsum.photos/seed/${encodeURIComponent(selectedDate)}/1200/675`;
      }

      // Step 3: Optional Gemini TTS Voice Narration
      let audioNarrationUrl = '';
      if (generateTTSOption) {
        setCurrentStep('AI朗読ボイス（Gemini TTS）を作成中...');
        try {
          audioNarrationUrl = await apiGenerateTTS(
            `${diaryResult.title}。${diaryResult.summary}`,
            'Kore'
          );
        } catch (err) {
          console.warn('TTS audio generation fallback:', err);
        }
      }

      // Step 4: Save to Firestore
      setCurrentStep('日記データを保存中...');
      const momentIds = moments.map((m) => m.id);

      const newDiaryData = {
        userId: user?.uid || 'guest',
        userDisplayName: user?.displayName || 'ゲストユーザー',
        userPhotoURL: user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || 'guest'}`,
        date: selectedDate,
        title: diaryResult.title,
        content: diaryResult.content,
        summary: diaryResult.summary,
        mood: diaryResult.mood,
        tags: diaryResult.tags || ['日常', 'AI日記'],
        aiReflection: diaryResult.aiReflection,
        coverImageUrl,
        audioNarrationUrl,
        isPublic,
        likesCount: 0,
        commentsCount: 0,
        momentIds,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'diaries'), newDiaryData);

      onDiaryCreated();
      onClose();
    } catch (error: any) {
      console.error('Error in handleGenerate:', error);
      alert(`生成エラー: ${error?.message || 'AI日記の生成に失敗しました'}`);
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const styleOptions: { id: DiaryStyle; label: string; desc: string; icon: string }[] = [
    { id: 'poetic', label: 'ポエティック', desc: '叙形的で美しい表現。言葉の響きを大切に', icon: '🌸' },
    { id: 'warm', label: '温かい語り', desc: '親しい友人に語りかけるような心和む文脈', icon: '☕' },
    { id: 'novelist', label: '短編小説風', desc: 'ドラマチックな情景と心理描写で魅せる', icon: '📖' },
    { id: 'funny', label: 'ユーモア', desc: 'くすっと笑えて親しみやすいカジュアルスタイル', icon: '🎈' },
    { id: 'concise', label: 'シンプル', desc: 'ポイントを押さえたすっきり読みやすい文体', icon: '✨' },
    { id: 'empathic', label: '寄り添い系', desc: '自己肯定感が高まる優しい言葉のリスナー', icon: '🫂' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-amber-50 rounded-2xl max-w-lg w-full border border-amber-200 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-rose-500 to-amber-400 flex items-center justify-center text-white shadow-md">
            <Wand2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-800">
              {selectedDate} のAI日記を作成
            </h3>
            <p className="text-stone-600 text-xs">
              本日投稿された <span className="font-bold text-amber-700">{moments.length}件</span> のつぶやきから執筆します
            </p>
          </div>
        </div>

        {/* Loading Overlay State */}
        {isGenerating ? (
          <div className="py-10 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
              <div className="absolute inset-2 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <h4 className="font-serif font-bold text-lg text-stone-800">
              AIが日記を書いています...
            </h4>
            <p className="text-amber-800 text-xs font-medium bg-amber-100/80 px-4 py-2 rounded-xl inline-block border border-amber-300 animate-pulse">
              {currentStep}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Style Selector */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-2">
                執筆スタイル（文章の雰囲気）:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStyle(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      style === opt.id
                        ? 'bg-white border-amber-500 ring-2 ring-amber-500/30 shadow-2xs'
                        : 'bg-amber-100/30 border-amber-200/60 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800 mb-0.5">
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </div>
                    <p className="text-[10px] text-stone-500 line-clamp-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2 border-t border-amber-200/60">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-stone-50">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-rose-500" />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">AI朗読ボイスを同時生成</span>
                    <span className="text-[10px] text-stone-500">Gemini Voiceで日記を朗読</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={generateTTSOption}
                  onChange={(e) => setGenerateTTSOption(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-stone-50">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">みんなのSNSタイムラインに公開</span>
                    <span className="text-[10px] text-stone-500">他のユーザーと共有してリアクションをもらう</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Action button */}
            <button
              id="btn-confirm-generate-diary"
              onClick={handleGenerate}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-500 to-amber-500 text-white font-bold text-sm shadow-md hover:shadow-lg hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
              AI日記の生成を開始する
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
