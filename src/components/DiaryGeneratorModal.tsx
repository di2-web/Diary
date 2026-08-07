import React, { useState } from 'react';
import { Sparkles, Check, Loader2, Volume2, Globe, Lock, X, RefreshCw, Wand2, Activity } from 'lucide-react';
import { Moment, DiaryStyle, UserProfile, WavePoint } from '../types';
import { apiGenerateDiary, apiGenerateCover, apiGenerateTTS } from '../lib/geminiApi';
import { addDoc, collection, db } from '../firebase';
import { WaveCanvas } from './WaveCanvas';

interface DiaryGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moments: Moment[];
  selectedDate: string;
  user: UserProfile | null;
  onDiaryCreated: () => void;
  wavePoints?: WavePoint[];
}

export const DiaryGeneratorModal: React.FC<DiaryGeneratorModalProps> = ({
  isOpen,
  onClose,
  moments,
  selectedDate,
  user,
  onDiaryCreated,
  wavePoints,
}) => {
  const [style, setStyle] = useState<DiaryStyle>(user?.diaryStyle || 'natural');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [generateTTSOption, setGenerateTTSOption] = useState<boolean>(true);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Default', 'All']);
  const [showWavePreview, setShowWavePreview] = useState<boolean>(true);
  const [currentWavePoints, setCurrentWavePoints] = useState<WavePoint[] | undefined>(wavePoints);

  if (!isOpen) return null;

  const availableCategories = [
    { id: 'Default', label: 'Default', desc: '基本共有枠（登録した友達限定）' },
    { id: 'All', label: 'All', desc: 'すべての友達（追加済み友達限定）' },
    { id: 'WORLD', label: '全体公開 (WORLD)', desc: '友達以外も含めて全ユーザーに公開' },
    ...(user?.customShareCategories || []).map((c) => ({ id: c, label: c, desc: 'カスタムグループ（対象の友達限定）' })),
  ];

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) {
        alert('少なくとも1つの共有カテゴリを選択してください。');
        return;
      }
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleGenerate = async () => {
    if (!moments || moments.length === 0) {
      console.warn('日記を生成するための投稿がありません。先につぶやきを投稿してください。');
      return;
    }

    try {
      setIsGenerating(true);

      // Step 1: Writing Diary with Gemini
      setCurrentStep('投稿メッセージと気分の波を整理し、日記文章を作成中...');
      const diaryResult = await apiGenerateDiary({
        moments,
        date: selectedDate,
        diaryStyle: style,
        userDisplayName: user?.displayName || 'ユーザー',
        wavePoints: currentWavePoints || wavePoints,
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
        userId: user?.uid || '',
        userDisplayName: user?.displayName || 'LifeLogユーザー',
        userPhotoURL: user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || 'user'}`,
        date: selectedDate,
        title: diaryResult.title,
        content: diaryResult.content,
        summary: diaryResult.summary,
        coverImageUrl,
        audioNarrationUrl,
        isPublic,
        shareCategories: isPublic ? selectedCategories : [],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#f8f5f0] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-[#e2d9eb] shadow-xl p-5 sm:p-6 relative">
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8e859b] hover:text-[#3d3546] hover:bg-[#eae3f2] transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#9880be] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#3d3546]">
              {selectedDate} の日記作成
            </h3>
            <p className="text-[#6e637c] text-xs flex items-center gap-1.5 flex-wrap">
              <span>本日投稿された <span className="font-bold text-[#3d3546]">{moments.length}件</span> の記録からまとめます</span>
              {wavePoints && wavePoints.length > 0 && (
                <span className="bg-[#f3eff8] text-[#8572a7] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#ded5e8]">
                  ⚡ 気分の波連携あり
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Loading Overlay State */}
        {isGenerating ? (
          <div className="py-8 px-4 text-center space-y-6 bg-white rounded-3xl border border-[#e8e2f0] shadow-2xs">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#f0ebf7] border-t-[#9880be] animate-spin" />
              <div className="absolute inset-2 rounded-full bg-[#f8f5f0] flex items-center justify-center text-[#9880be]">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-base text-[#3d3546] mb-1">
                AIが1日の思い出をまとめています...
              </h4>
              <p className="text-xs text-[#8572a7] font-medium">
                {currentStep}
              </p>
            </div>

            {/* Checklist progress bar simulation */}
            <div className="space-y-2 text-left bg-[#f8f5f0]/80 p-4 rounded-2xl border border-[#ded5e8]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#3d3546]">
                <div className="w-4 h-4 rounded-full bg-[#9880be] text-white flex items-center justify-center text-[10px]">✓</div>
                <span>出来事やつぶやきを整理中...</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#3d3546]">
                <div className="w-4 h-4 rounded-full bg-[#9880be] text-white flex items-center justify-center text-[10px]">✓</div>
                <span>今日を象徴するAIカバー画像を生成中...</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#3d3546]">
                <div className="w-4 h-4 rounded-full bg-[#9880be] text-white flex items-center justify-center text-[10px]">✓</div>
                <span>タイトルと心あたたまるストーリーを執筆中...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Embedded Mood Wave Graph Section */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#e8e2f0] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#9880be]" />
                  <span className="text-xs font-bold text-[#3d3546]">
                    本日の気分の波 (WaveLog)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWavePreview(!showWavePreview)}
                  className="text-[11px] text-[#8572a7] font-semibold hover:underline cursor-pointer"
                >
                  {showWavePreview ? '波形を非表示' : '波形を表示・調整'}
                </button>
              </div>

              {showWavePreview && (
                <div className="pt-1 animate-fade-in">
                  <WaveCanvas
                    date={selectedDate}
                    moments={moments}
                    savedPoints={currentWavePoints || wavePoints}
                    onPointsChange={(pts) => setCurrentWavePoints(pts)}
                    isCompact={true}
                  />
                </div>
              )}
            </div>

            {/* Style Selector */}
            <div>
              <label className="text-xs font-bold text-[#3d3546] block mb-2">
                日記のまとめ方（文章の雰囲気）:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStyle(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      style === opt.id
                        ? 'bg-white border-[#9880be] ring-2 ring-[#9880be]/20 shadow-2xs font-bold'
                        : 'bg-white/60 border-[#ded5e8] hover:bg-white text-[#6e637c]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#3d3546] mb-0.5">
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </div>
                    <p className="text-[10px] text-[#8e859b] line-clamp-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2.5 pt-2 border-t border-[#ded5e8]">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#e8e2f0] cursor-pointer hover:bg-[#f8f5f0]/50">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#8572a7]" />
                  <div>
                    <span className="text-xs font-semibold text-[#3d3546] block">朗読音声を生成</span>
                    <span className="text-[10px] text-[#8e859b]">音声で日記を聴けるようにする</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={generateTTSOption}
                  onChange={(e) => setGenerateTTSOption(e.target.checked)}
                  className="w-4 h-4 accent-[#9880be] rounded cursor-pointer"
                />
              </label>

              <div className="space-y-2.5 p-3 rounded-2xl bg-white border border-[#e8e2f0]">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#8572a7]" />
                    <div>
                      <span className="text-xs font-semibold text-[#3d3546] block">タイムラインに共有</span>
                      <span className="text-[10px] text-[#8e859b]">公開またはグループ限定で共有</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 accent-[#9880be] rounded cursor-pointer"
                  />
                </label>

                {isPublic && (
                  <div className="pt-2 border-t border-[#f0ebf7] space-y-1.5">
                    <span className="text-[11px] font-bold text-[#6e637c] block">
                      共有するカテゴリを選択 (複数選択可能):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {availableCategories.map((cat) => {
                        const isChecked = selectedCategories.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-[#f3eff8] border-[#9880be] font-bold text-[#3d3546]'
                                : 'bg-[#f8f5f0]/50 border-[#ded5e8] text-[#6e637c] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded text-[#9880be] focus:ring-[#9880be] h-3.5 w-3.5"
                              />
                              <span className="truncate">{cat.label}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action button */}
            <button
              id="btn-confirm-generate-diary"
              onClick={handleGenerate}
              className="w-full py-3.5 rounded-2xl bg-[#9880be] hover:bg-[#8871b0] text-white font-bold text-xs sm:text-sm shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white/80" />
              日記を作成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
