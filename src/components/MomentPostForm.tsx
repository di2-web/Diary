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

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif font-bold text-stone-800 text-base flex items-center gap-2">
          {selectedDate} の出来事・メモ
        </h3>
        <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
          きょうのログ
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input Area */}
        <div className="relative">
          <textarea
            id="input-moment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今どこで何してる？ どんな気持ち？（短いつぶやきやメモでOK！）"
            rows={3}
            className="w-full rounded-xl border border-stone-200 p-3 text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm resize-none bg-stone-50/50"
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
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5">
            {/* File Upload Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              id="btn-upload-photo"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="写真をアップロード"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <button
              id="btn-sample-photos"
              type="button"
              onClick={() => setShowPhotoPicker(!showPhotoPicker)}
              className="p-2 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="サンプル写真を選ぶ"
            >
              <Camera className="w-5 h-5" />
            </button>

            <button
              id="btn-mic-record"
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-rose-100 text-rose-600 animate-pulse'
                  : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="音声メモ録音"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          <button
            id="btn-submit-moment"
            type="submit"
            disabled={isSubmitting || (!content.trim() && !mediaUrl)}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-900 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            投稿する
          </button>
        </div>
      </form>
    </div>
  );
};
