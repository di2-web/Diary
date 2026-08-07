import React, { useState, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Mic,
  Video,
  Smile,
  X,
  Play,
  Square,
  CheckCircle2,
  Sparkles,
  Camera,
  Music,
  Pin,
  Globe,
  Lock,
  Users,
} from 'lucide-react';
import { MomentType, UserProfile } from '../types';
import { addDoc, collection, db } from '../firebase';

interface MomentPostFormProps {
  user: UserProfile | null;
  selectedDate: string; // YYYY-MM-DD
  onMomentAdded: () => void;
  onRequireAuth: () => void;
}

const PRESET_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80', label: 'カフェで一息 ☕' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80', label: '美しい自然と空 🌿' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80', label: '街歩きスナップ 📷' },
  { url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80', label: 'ヘルシーなランチ 🥗' },
  { url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80', label: '夜の読書タイム 📖' },
];

export const MomentPostForm: React.FC<MomentPostFormProps> = ({
  user,
  selectedDate,
  onMomentAdded,
  onRequireAuth,
}) => {
  const [content, setContent] = useState('');
  const [momentType, setMomentType] = useState<MomentType>('text');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Sharing & Category State
  const [isPublic, setIsPublic] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Default', 'All']);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const availableCategories = [
    { id: 'Default', label: 'Default', desc: '基本共有枠' },
    { id: 'All', label: 'All', desc: 'すべての友達（追加済み限定）' },
    ...(user?.customShareCategories || []).map((catName) => ({
      id: catName,
      label: catName,
      desc: 'カスタムグループ',
    })),
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

  // Handle local image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
        setMomentType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle local audio file upload
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
        setMomentType('audio');
        if (!content) setContent(`🎵 音声ファイル: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaUrl(reader.result as string);
          setMomentType('audio');
          if (!content) setContent('🎤 6秒間のボイスメッセージメモ');
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }

    if (!content.trim() && !mediaUrl) {
      return;
    }

    try {
      setIsSubmitting(true);

      const newMoment = {
        userId: user.uid,
        userDisplayName: user.displayName,
        userPhotoURL: user.photoURL || '',
        date: selectedDate,
        type: momentType,
        content: content.trim() || (momentType === 'image' ? '📷 写真を投稿しました' : 'メモ投稿'),
        mediaUrl: mediaUrl || '',
        isPinned: isPinned,
        isPublic: isPublic,
        shareCategories: isPublic ? selectedCategories : [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'moments'), newMoment);

      // Reset Form
      setContent('');
      setMediaUrl(null);
      setMomentType('text');
      setShowPhotoPicker(false);
      onMomentAdded();
    } catch (error) {
      console.error('Error posting moment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#e8e2f0] shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#9880be] animate-pulse" />
          <h3 className="font-bold text-[#3d3546] text-sm sm:text-base">
            {selectedDate} の出来事・気持ちをメモ
          </h3>
        </div>
        <span className="text-xs text-[#8572a7] font-semibold bg-[#f3eff8] px-3 py-1 rounded-full border border-[#ded5e8]">
          静かな記録
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input Area */}
        <div className="relative">
          <textarea
            id="input-moment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今どこで何してる？ どんな気持ち？（短い言葉や写真1枚でOK！）"
            rows={3}
            className="w-full rounded-2xl border border-[#ded5e8] p-3.5 text-[#3d3546] placeholder-[#a298b0] focus:outline-hidden focus:ring-2 focus:ring-[#9880be]/30 focus:border-[#9880be] text-sm resize-none bg-[#f8f5f0]/60 font-medium"
          />
        </div>

        {/* Media Preview Box */}
        {mediaUrl && (
          <div className="relative rounded-xl border border-amber-200 overflow-hidden bg-amber-50/40 p-3 flex items-center justify-between">
            {momentType === 'image' && (
              <div className="flex items-center gap-3">
                <img
                  src={mediaUrl}
                  alt="添付写真"
                  className="w-16 h-16 object-cover rounded-lg shadow-2xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-xs font-semibold text-stone-700 block">写真が添付されました</span>
                  <span className="text-[11px] text-stone-600">AIが画像から情景を読み取ります</span>
                </div>
              </div>
            )}

            {momentType === 'audio' && (
              <div className="flex items-center gap-3 w-full pr-8">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Music className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-stone-700 block">音声メモを保存</span>
                  <audio src={mediaUrl} controls className="w-full h-8 mt-1" />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMediaUrl(null);
                setMomentType('text');
              }}
              className="absolute top-2 right-2 p-1 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Audio Recording UI in progress */}
        {isRecording && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold">録音中... ({recordingTime}秒)</span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1 bg-rose-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-xs hover:bg-rose-700"
            >
              <Square className="w-3.5 h-3.5" /> 停止して保存
            </button>
          </div>
        )}

        {/* Preset Photos Gallery Picker */}
        {showPhotoPicker && (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-medium text-stone-700">
              <span>サンプル写真から選択</span>
              <button
                type="button"
                onClick={() => setShowPhotoPicker(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                閉じる
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESET_PHOTOS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setMediaUrl(p.url);
                    setMomentType('image');
                    if (!content) setContent(`📷 ${p.label}`);
                    setShowPhotoPicker(false);
                  }}
                  className="group relative rounded-lg overflow-hidden border border-stone-300 hover:border-amber-500 focus:outline-hidden"
                >
                  <img
                    src={p.url}
                    alt={p.label}
                    className="w-full h-16 object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-stone-900/70 text-[9px] text-white p-0.5 text-center truncate">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Tools & Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1 shrink-0">
            {/* Image File Upload Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Audio File Upload Hidden Input */}
            <input
              type="file"
              ref={audioFileInputRef}
              accept="audio/*"
              onChange={handleAudioFileChange}
              className="hidden"
            />

            <button
              id="btn-upload-photo"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:p-2 rounded-xl text-purple-600/80 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              title="写真をアップロード"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <button
              id="btn-upload-audio"
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
              className="p-1.5 sm:p-2 rounded-xl text-purple-600/80 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              title="音ファイルをアップロード"
            >
              <Music className="w-5 h-5" />
            </button>

            <button
              id="btn-sample-photos"
              type="button"
              onClick={() => setShowPhotoPicker(!showPhotoPicker)}
              className="p-1.5 sm:p-2 rounded-xl text-purple-600/80 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              title="サンプル写真を選ぶ"
            >
              <Camera className="w-5 h-5" />
            </button>

            <button
              id="btn-mic-record"
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                isRecording
                  ? 'bg-rose-100 text-rose-600 animate-pulse'
                  : 'text-purple-600/80 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="マイクでボイスメモ録音"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto relative">
            {/* Share Category Selector Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  !isPublic
                    ? 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                    : 'bg-purple-50 text-purple-900 border-purple-200 font-bold hover:bg-purple-100 shadow-2xs'
                }`}
                title="共有範囲・カテゴリ設定"
              >
                {!isPublic ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>非公開</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>共有 ({selectedCategories.length})</span>
                  </>
                )}
              </button>

              {/* Popover Menu */}
              {showCategoryMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30 bg-black/20 sm:bg-transparent"
                    onClick={() => setShowCategoryMenu(false)}
                  />
                  <div className="fixed sm:absolute left-4 right-4 bottom-16 sm:left-auto sm:right-0 sm:bottom-9 z-40 bg-white border border-purple-100 rounded-3xl sm:rounded-2xl shadow-xl p-4 sm:p-3.5 w-auto sm:w-64 max-w-[calc(100vw-2rem)] text-left space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between pb-1.5 border-b border-purple-100">
                      <span className="text-xs font-bold text-purple-950">共有設定・グループ選択</span>
                      <button
                        type="button"
                        onClick={() => setShowCategoryMenu(false)}
                        className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Public Toggle Switch */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/50 border border-purple-100">
                      <div className="flex items-center gap-1.5">
                        {isPublic ? <Globe className="w-4 h-4 text-purple-600" /> : <Lock className="w-4 h-4 text-stone-500" />}
                        <span className="text-xs font-bold text-purple-950">
                          {isPublic ? 'みんなの誌に公開' : '自分のみ非公開'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPublic(!isPublic)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          isPublic ? 'bg-purple-600' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            isPublic ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Category Selection Checkboxes */}
                    {isPublic && (
                      <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto">
                        <span className="text-[11px] font-bold text-stone-500 block">
                          共有先カテゴリ (複数選択可能):
                        </span>
                        {availableCategories.map((cat) => {
                          const isChecked = selectedCategories.includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              onClick={() => toggleCategory(cat.id)}
                              className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-purple-50 border-purple-300 font-bold text-purple-900'
                                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 cursor-pointer"
                                />
                                <span>{cat.label}</span>
                              </div>
                              <span className="text-[10px] text-stone-400 font-normal">{cat.desc}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isPinned
                  ? 'bg-purple-600 text-white border-purple-700 font-bold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
              }`}
              title="保護（ピン留め）すると自動消去から除外されます"
            >
              <Pin className="w-3.5 h-3.5 shrink-0" />
              <span>{isPinned ? '保護オン' : '保護オフ'}</span>
            </button>

            <button
              id="btn-submit-moment"
              type="submit"
              disabled={isSubmitting || (!content.trim() && !mediaUrl)}
              className="flex items-center gap-1.5 bg-[#9880be] hover:bg-[#8871b0] text-white text-xs sm:text-sm font-semibold px-4.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4 shrink-0" />
              投稿する
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
