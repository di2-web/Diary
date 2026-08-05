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
    try {
      await deleteDoc(doc(db, 'moments', id));
      onMomentsUpdated();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (moments.length === 0) {
    return (
      <div className="bg-stone-50 rounded-2xl p-8 border border-dashed border-stone-200 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h4 className="font-serif font-bold text-stone-800 text-lg">
          {selectedDate} の記録はまだありません
        </h4>
        <p className="text-stone-600 text-xs max-w-sm mx-auto leading-relaxed">
          上の入力欄から、今日の出来事やメモをつぶやいてみましょう。つぶやきが集まったら日記を作成できます。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Generate Diary Banner */}
      <div className="bg-amber-100/80 rounded-2xl p-4 sm:p-5 border border-amber-200/90 text-stone-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-serif font-bold text-base sm:text-lg text-amber-950">
              {moments.length}件のつぶやきが集まりました
            </span>
          </div>
          <p className="text-stone-600 text-xs">
            今日の記録から自然な1日の日記をまとめます。
          </p>
        </div>

        <button
          id="btn-generate-from-list"
          onClick={onGenerateDiaryClick}
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-100" />
          日記を作成する
        </button>
      </div>

      {/* Moments Stream */}
      <div className="space-y-3">
        {moments.map((m) => {
          const timeStr = m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
            : '';

          // Allow deletion if currentUserId matches, or if current user is guest or owner
          const canDelete = !currentUserId || currentUserId === m.userId || m.userId === 'guest' || currentUserId === 'guest';

          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs hover:shadow-xs transition-shadow relative"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="font-medium text-stone-800">{m.userDisplayName || '投稿メモ'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {timeStr}
                  </span>
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                    title="この投稿を削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] text-stone-500">削除</span>
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
