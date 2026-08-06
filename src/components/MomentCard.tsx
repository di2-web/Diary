import React, { useState, useEffect } from 'react';
import { Moment, UserProfile } from '../types';
import { Clock, Trash2, Music, Users, MessageSquare, Plus, Heart } from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  db,
} from '../firebase';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface MomentCardProps {
  moment: Moment;
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
  onDeleteMoment?: (id: string) => void;
}

const PRESET_EMOJIS = ['❤️', '🌟', '☕', '🫂', '😊', '🎉', '👍', '👏', '🍀', '🔥'];

export const MomentCard: React.FC<MomentCardProps> = React.memo(({
  moment,
  currentUser,
  onRequireAuth,
  onDeleteMoment,
}) => {
  const [likes, setLikes] = useState<{ id: string; userId: string; reaction: string }[]>([]);
  const [comments, setComments] = useState<{ id: string; userId: string; userDisplayName: string; content: string; createdAt: string }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch likes & reactions
  useEffect(() => {
    const q = query(
      collection(db, 'moment_likes'),
      where('momentId', '==', moment.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLikes(list);
    });
    return () => unsub();
  }, [moment.id]);

  // Fetch comments
  useEffect(() => {
    if (!showComments) return;
    const q = query(
      collection(db, 'moment_comments'),
      where('momentId', '==', moment.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setComments(list);
    });
    return () => unsub();
  }, [moment.id, showComments]);

  const handleToggleReaction = async (emoji: string) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const existing = likes.find((l) => l.userId === currentUser.uid && l.reaction === emoji);
    try {
      if (existing) {
        await deleteDoc(doc(db, 'moment_likes', existing.id));
      } else {
        await addDoc(collection(db, 'moment_likes'), {
          momentId: moment.id,
          userId: currentUser.uid,
          reaction: emoji,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Reaction toggle error:', err);
    }
  };

  const handleCustomEmojiClick = (emojiData: EmojiClickData) => {
    setShowEmojiPicker(false);
    handleToggleReaction(emojiData.emoji);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      await addDoc(collection(db, 'moment_comments'), {
        momentId: moment.id,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL || '',
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewComment('');
    } catch (err) {
      console.error('Add comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Group reactions count
  const reactionCounts: { [emoji: string]: number } = {};
  likes.forEach((l) => {
    reactionCounts[l.reaction] = (reactionCounts[l.reaction] || 0) + 1;
  });

  const timeStr = moment.createdAt
    ? new Date(moment.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    : '';

  const canDelete = currentUser && currentUser.uid === moment.userId;

  const categories = moment.shareCategories && moment.shareCategories.length > 0
    ? moment.shareCategories
    : ['Default'];

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all space-y-3">
      {/* User Info Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={moment.userPhotoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${moment.userId}`}
            alt={moment.userDisplayName || 'ユーザー'}
            className="w-9 h-9 rounded-xl object-cover bg-amber-50 border border-stone-200"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-stone-800">
                {moment.userDisplayName || '匿名のLifeLogユーザー'}
              </span>
              <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                日々のつぶやき
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
              <span>{moment.date}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeStr}
              </span>
            </div>
          </div>
        </div>

        {/* Categories Badges */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {categories.map((cat, i) => {
            const label = cat === 'All' ? 'All' : cat === 'Default' ? 'Default' : cat;
            return (
              <span
                key={i}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  cat === 'All'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : cat === 'Default'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {label}
              </span>
            );
          })}

          {canDelete && onDeleteMoment && (
            <button
              onClick={() => onDeleteMoment(moment.id)}
              className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
              title="投稿を削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Moment Content */}
      <p className="text-stone-800 text-sm whitespace-pre-wrap leading-relaxed">
        {moment.content}
      </p>

      {/* Media Content */}
      {moment.mediaUrl && moment.type === 'image' && (
        <div className="rounded-xl overflow-hidden border border-stone-200 max-h-72 bg-stone-100">
          <img
            src={moment.mediaUrl}
            alt="投稿画像"
            className="w-full h-full object-cover max-h-72"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {moment.mediaUrl && moment.type === 'audio' && (
        <div className="bg-rose-50/70 rounded-xl p-3 border border-rose-200 flex items-center gap-3">
          <Music className="w-5 h-5 text-rose-500 shrink-0" />
          <audio src={moment.mediaUrl} controls className="w-full h-8" />
        </div>
      )}

      {/* Reactions Bar */}
      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_EMOJIS.map((emoji) => {
            const count = reactionCounts[emoji] || 0;
            const isMyReaction = likes.some((l) => l.userId === currentUser?.uid && l.reaction === emoji);
            return (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(emoji)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all cursor-pointer ${
                  isMyReaction
                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-2xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="text-[10px] font-semibold">{count}</span>}
              </button>
            );
          })}

          {/* Plus button for any emoji */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex items-center gap-0.5 text-xs px-2 py-1 rounded-full border border-dashed border-stone-300 text-stone-500 hover:text-stone-800 hover:border-stone-400 bg-white transition-all cursor-pointer"
              title="その他の絵文字を選択"
            >
              <Plus className="w-3 h-3" />
              <span>絵文字</span>
            </button>

            {showEmojiPicker && (
              <div className="absolute left-0 bottom-8 z-40 shadow-xl rounded-2xl overflow-hidden">
                <EmojiPicker onEmojiClick={handleCustomEmojiClick} width={280} height={320} />
              </div>
            )}
          </div>
        </div>

        {/* Comment toggle button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>コメント ({comments.length})</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="pt-3 border-t border-stone-100 space-y-3 animate-fade-in">
          {comments.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 text-xs space-y-0.5">
                  <div className="flex justify-between items-center text-stone-500 font-bold text-[11px]">
                    <span>{c.userDisplayName}</span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      {new Date(c.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-stone-800">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="温かいコメントを残す..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 rounded-xl border border-stone-300 px-3 py-1.5 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !newComment.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer"
            >
              送信
            </button>
          </form>
        </div>
      )}
    </div>
  );
});
