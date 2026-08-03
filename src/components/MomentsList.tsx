import React from 'react';
import { Moment } from '../types';
import { Sparkles, Trash2, Clock, Image, Mic, Music, Smile, MessageSquare, Plus } from 'lucide-react';
import { deleteDoc, doc, db } from '../firebase';

interface MomentsListProps {
  moments: Moment[];
  selectedDate: string;
  currentUserId: string | null;
  onMomentsUpdated: () => void;
  onGenerateDiaryClick: () => void;
}

export const MomentsList: React.FC<MomentsListProps> = ({
  moments,
  selectedDate,
  currentUserId,
  onMomentsUpdated,
  onGenerateDiaryClick,
}) => {
  const handleDelete = async (id: string) => {
    if (!confirm('このモーメントを削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'moments', id));
      onMomentsUpdated();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (moments.length === 0) {
    return (
      <div className="bg-amber-50/50 rounded-2xl p-8 border border-dashed border-amber-300 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h4 className="font-serif font-bold text-stone-800 text-lg">
          {selectedDate} の投稿はまだありません
        </h4>
        <p className="text-stone-600 text-xs max-w-sm mx-auto leading-relaxed">
          上の入力欄から、今日のちょっとした出来事や写真、ボイスメモをつぶやいてみましょう。2〜3つの投稿が集まると素敵なAI日記が生まれます！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Generate AI Diary Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-200 animate-spin" />
            <span className="font-serif font-bold text-lg">
              {moments.length}件のモーメントが集まりました！
            </span>
          </div>
          <p className="text-amber-100 text-xs">
            AIがこれらのつぶやき・写真から一日の美しい日記を執筆します。
          </p>
        </div>

        <button
          id="btn-generate-from-list"
          onClick={onGenerateDiaryClick}
          className="w-full sm:w-auto bg-white text-stone-900 hover:bg-amber-50 font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          AI日記を今すぐ生成
        </button>
      </div>

      {/* Moments Stream */}
      <div className="space-y-3">
        {moments.map((m) => {
          const timeStr = m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs hover:shadow-xs transition-shadow relative group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5">
                  <span className="font-medium text-stone-800">{m.userDisplayName || '匿名'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {timeStr}
                  </span>
                  {m.mood && (
                    <span className="bg-amber-100/80 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                      {m.mood}
                    </span>
                  )}
                </div>

                {currentUserId === m.userId && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition-opacity"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content text */}
              <p className="text-stone-800 text-sm whitespace-pre-wrap leading-relaxed">
                {m.content}
              </p>

              {/* Media attachments */}
              {m.mediaUrl && m.type === 'image' && (
                <div className="mt-3 rounded-xl overflow-hidden border border-stone-200 max-h-60 bg-stone-100">
                  <img
                    src={m.mediaUrl}
                    alt="投稿写真"
                    className="w-full h-full object-cover max-h-60"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {m.mediaUrl && m.type === 'audio' && (
                <div className="mt-3 bg-rose-50/60 rounded-xl p-2.5 border border-rose-200 flex items-center gap-3">
                  <Music className="w-5 h-5 text-rose-500 shrink-0" />
                  <audio src={m.mediaUrl} controls className="w-full h-8" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
