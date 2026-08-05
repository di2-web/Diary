import React, { useState } from 'react';
import { Moment } from '../types';
import { Sparkles, Trash2, Clock, Image, Mic, Music, Smile, MessageSquare, Plus, Pin, ShieldCheck, Eraser } from 'lucide-react';
import { deleteDoc, doc, updateDoc, db } from '../firebase';

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
  const [isPurging, setIsPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'moments', id));
      onMomentsUpdated();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleTogglePin = async (id: string, currentPinStatus?: boolean) => {
    try {
      await updateDoc(doc(db, 'moments', id), {
        isPinned: !currentPinStatus,
      });
      onMomentsUpdated();
    } catch (err) {
      console.error('Pin toggle error:', err);
    }
  };

  // Auto-purge unpinned moments for current date (Phase 5 Requirement)
  const handlePurgeUnpinned = async () => {
    const unpinnedMoments = moments.filter((m) => !m.isPinned);
    if (unpinnedMoments.length === 0) {
      setPurgeMessage('保護されていない素材はありません（すべて保護オンです）。');
      setTimeout(() => setPurgeMessage(null), 3000);
      return;
    }

    if (!window.confirm(`保護（ピン留め）されていないつぶやきメモ ${unpinnedMoments.length}件 を整理・消去しますか？`)) {
      return;
    }

    try {
      setIsPurging(true);
      for (const m of unpinnedMoments) {
        await deleteDoc(doc(db, 'moments', m.id));
      }
      setPurgeMessage(`${unpinnedMoments.length}件の未保護素材を正常に自動クリーンアップしました。`);
      setTimeout(() => setPurgeMessage(null), 4000);
      onMomentsUpdated();
    } catch (err) {
      console.error('Purge error:', err);
    } finally {
      setIsPurging(false);
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

  const unpinnedCount = moments.filter((m) => !m.isPinned).length;
  const pinnedCount = moments.length - unpinnedCount;

  return (
    <div className="space-y-4">
      {/* Purge Notification */}
      {purgeMessage && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{purgeMessage}</span>
        </div>
      )}

      {/* Generate Diary Banner & Purge Controls */}
      <div className="bg-amber-100/80 rounded-2xl p-4 sm:p-5 border border-amber-200/90 text-stone-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-serif font-bold text-base sm:text-lg text-amber-950">
              {moments.length}件のつぶやきが集まりました
            </span>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              📌 保護: {pinnedCount}件 / 未保護: {unpinnedCount}件
            </span>
          </div>
          <p className="text-stone-600 text-xs">
            日記作成後、不要な未保護素材はクリーンアップ（自動パージ）可能です。
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {unpinnedCount > 0 && (
            <button
              onClick={handlePurgeUnpinned}
              disabled={isPurging}
              className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-medium text-xs px-3 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              title="保護されていない素材を消去・クリーンアップ"
            >
              <Eraser className="w-3.5 h-3.5 text-amber-700" />
              <span>{isPurging ? '消去中...' : '未保護を整理'}</span>
            </button>
          )}

          <button
            id="btn-generate-from-list"
            onClick={onGenerateDiaryClick}
            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-100" />
            日記を作成する
          </button>
        </div>
      </div>

      {/* Moments Stream */}
      <div className="space-y-3">
        {moments.map((m) => {
          const timeStr = m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
            : '';

          // Allow deletion if currentUserId matches or if user is owner
          const canDelete = !currentUserId || currentUserId === m.userId;

          return (
            <div
              key={m.id}
              className={`bg-white rounded-2xl p-4 border transition-all relative ${
                m.isPinned
                  ? 'border-amber-400 bg-amber-50/20 shadow-xs'
                  : 'border-stone-200/80 shadow-2xs hover:shadow-xs'
              }`}
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

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePin(m.id, m.isPinned)}
                    className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      m.isPinned
                        ? 'bg-amber-500 text-white font-bold shadow-2xs'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                    title={m.isPinned ? '保護オン（自動消去されません）' : '保護オフ（クリーンアップ対象）'}
                  >
                    <Pin className="w-3 h-3" />
                    <span className="text-[10px]">{m.isPinned ? '保護中' : '未保護'}</span>
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                      title="この投稿を削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
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
