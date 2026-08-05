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
  const [style, setStyle] = useState<DiaryStyle>(user?.diaryStyle || 'natural');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [generateTTSOption, setGenerateTTSOption] = useState<boolean>(true);
  const [isPublic, setIsPublic] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!moments || moments.length === 0) {
      console.warn('日記を生成するための投稿がありません。先につぶやきを投稿してください。');
      return;
    }

    try {
      setIsGenerating(true);

      // Step 1: Writing Diary with Gemini 3.6 Flash
      setCurrentStep('投稿メッセージを整理し、日記文章を作成中...');
      const diaryResult = await apiGenerateDiary({
        moments,
        date: selectedDate,
        diaryStyle: style,
        userDisplayName: user?.displayName || 'ユーザー',
      });

      // Step 2: Generating Cover Image
      setCurrentStep('今日の一日を表すカバー写真を生成中...');
      let coverImageUrl = '';
      try {
        coverImageUrl = await apiGenerateCover(diaryResult.imagePrompt);
      } catch (err) {
        console.warn('Cover image generation fallback:', err);
        coverImageUrl = `https://picsum.photos/seed/${encodeURIComponent(selectedDate)}/1200/675`;
      }

      // Step 3: Optional TTS Voice Narration
      let audioNarrationUrl = '';
      if (generateTTSOption) {
        setCurrentStep('朗読音声を作成中...');
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
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const styleOptions: { id: DiaryStyle; label: string; desc: string; icon: string }[] = [
    { id: 'natural', label: '言葉をそのまま活かす', desc: '自分の話し言葉や投稿の雰囲気をそのまま尊重', icon: '🍃' },
    { id: 'neat', label: 'すっきり整理', desc: '出来事の流れをわかりやすく丁寧にまとめる', icon: '✍️' },
    { id: 'casual', label: 'カジュアル', desc: '親しみやすく素直な日誌スタイル', icon: '☕' },
    { id: 'concise', label: 'シンプル', desc: '出来事と感想をコンパクトに整理', icon: '📝' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-stone-50 rounded-2xl max-w-lg w-full border border-stone-200 shadow-xl p-6 relative">
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-amber-100 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              {selectedDate} の日記を作成
            </h3>
            <p className="text-stone-500 text-xs">
              本日投稿された <span className="font-bold text-stone-800">{moments.length}件</span> のつぶやきから整理します
            </p>
          </div>
        </div>

        {/* Loading Overlay State */}
        {isGenerating ? (
          <div className="py-10 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-3 border-stone-200 border-t-amber-600 animate-spin" />
              <div className="absolute inset-2 rounded-full bg-stone-100 flex items-center justify-center text-amber-600">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <h4 className="font-serif font-bold text-base text-stone-800">
              日記を作成しています...
            </h4>
            <p className="text-stone-700 text-xs font-medium bg-stone-200/70 px-4 py-2 rounded-xl inline-block border border-stone-300">
              {currentStep}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Style Selector */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-2">
                日記のまとめ方（文章の雰囲気）:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStyle(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      style === opt.id
                        ? 'bg-white border-stone-800 ring-2 ring-stone-800/10 shadow-2xs'
                        : 'bg-stone-100/60 border-stone-200 hover:bg-white'
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
            <div className="space-y-2.5 pt-2 border-t border-stone-200">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-stone-50">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-stone-600" />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">朗読音声を生成</span>
                    <span className="text-[10px] text-stone-500">音声で日記を聴けるようにする</span>
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
                  <Globe className="w-4 h-4 text-stone-600" />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">みんなのタイムラインに公開</span>
                    <span className="text-[10px] text-stone-500">他のユーザーに共有する</span>
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
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-2xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-100" />
              日記を作成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
