import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Heart,
  Sparkles,
  MessageCircle,
  Volume2,
  Globe,
  Lock,
  Share2,
  Trash2,
  Send,
  User,
  Coffee,
  Sun,
  Bot,
  Bookmark,
  Check,
} from 'lucide-react';
import { Diary, DiaryComment, ReactionType, UserProfile } from '../types';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  db,
  setDoc,
  getDoc,
} from '../firebase';
import { apiGenerateAiComment } from '../lib/geminiApi';

interface DiaryCardProps {
  diary: Diary;
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
  onDeleteDiary?: (id: string) => void;
  isSingleView?: boolean;
}

const REACTIONS: { type: ReactionType; icon: string; label: string; activeColor: string }[] = [
  { type: 'heart', icon: '❤️', label: 'スキ', activeColor: 'bg-rose-100 text-rose-700 border-rose-300' },
  { type: 'inspire', icon: '🌟', label: '素敵', activeColor: 'bg-amber-100 text-amber-800 border-amber-300' },
  { type: 'cozy', icon: '☕', label: 'ほっこり', activeColor: 'bg-orange-100 text-orange-800 border-orange-300' },
  { type: 'support', icon: '🫂', label: '応援', activeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
];

export const DiaryCard: React.FC<DiaryCardProps> = ({
  diary,
  currentUser,
  onRequireAuth,
  onDeleteDiary,
  isSingleView = false,
}) => {
  const [comments, setComments] = useState<DiaryComment[]>([]);
  const [showComments, setShowComments] = useState(isSingleView);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isGeneratingAiComment, setIsGeneratingAiComment] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = currentUser?.uid === diary.userId;

  // Real-time listen for comments on this diary
  useEffect(() => {
    if (!diary.id) return;
    const q = query(
      collection(db, 'diary_comments'),
      where('diaryId', '==', diary.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DiaryComment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DiaryComment);
      });
      // Sort in memory by createdAt
      list.sort((a, b) => (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()));
      setComments(list);
    });

    return () => unsubscribe();
  }, [diary.id]);

  // Real-time listen for user's reaction
  useEffect(() => {
    if (!diary.id || !currentUser?.uid) return;
    const likeDocId = `${diary.id}_${currentUser.uid}`;
    const docRef = doc(db, 'diary_likes', likeDocId);

    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        setUserReaction(snap.data().reaction as ReactionType);
      } else {
        setUserReaction(null);
      }
    });
  }, [diary.id, currentUser?.uid]);

  const handleToggleReaction = async (reaction: ReactionType) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const likeDocId = `${diary.id}_${currentUser.uid}`;
    const likeRef = doc(db, 'diary_likes', likeDocId);
    const diaryRef = doc(db, 'diaries', diary.id);

    try {
      if (userReaction === reaction) {
        // Remove reaction
        await deleteDoc(likeRef);
        await updateDoc(diaryRef, { likesCount: increment(-1) });
        setUserReaction(null);
      } else {
        // Add or change reaction
        const isNew = !userReaction;
        await setDoc(likeRef, {
          diaryId: diary.id,
          userId: currentUser.uid,
          reaction,
          createdAt: new Date().toISOString(),
        });

        if (isNew) {
          await updateDoc(diaryRef, { likesCount: increment(1) });
        }
        setUserReaction(reaction);
      }
    } catch (err) {
      console.error('Reaction error:', err);
    }
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

      await addDoc(collection(db, 'diary_comments'), {
        diaryId: diary.id,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL || '',
        content: newComment.trim(),
        isAiComment: false,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'diaries', diary.id), {
        commentsCount: increment(1),
      });

      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleGenerateAiComment = async () => {
    try {
      setIsGeneratingAiComment(true);
      const aiResponse = await apiGenerateAiComment(
        diary.title,
        diary.content,
        diary.userDisplayName
      );

      await addDoc(collection(db, 'diary_comments'), {
        diaryId: diary.id,
        userId: 'ai_bot_kokoro',
        userDisplayName: 'AIフレンド ココロ 🤖',
        userPhotoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=kokoro',
        content: aiResponse,
        isAiComment: true,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'diaries', diary.id), {
        commentsCount: increment(1),
      });
    } catch (err) {
      console.error('AI comment error:', err);
      alert('AIコメントの生成に失敗しました。');
    } finally {
      setIsGeneratingAiComment(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'diaries', diary.id), {
        isPublic: !diary.isPublic,
      });
    } catch (err) {
      console.error('Toggle visibility error:', err);
    }
  };

  const handleShare = () => {
    const text = `【LifeLog AI 日記】 ${diary.title} (${diary.date})\n${diary.summary}\n#LifeLogAI #AI日記`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Cover Header Image */}
      {diary.coverImageUrl && (
        <div className="relative w-full h-48 sm:h-64 overflow-hidden bg-stone-100">
          <img
            src={diary.coverImageUrl}
            alt={diary.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between">
            <span className="bg-white/90 backdrop-blur-md text-stone-800 font-serif font-semibold text-xs px-3 py-1 rounded-full shadow-2xs">
              📅 {diary.date}
            </span>

            <div className="flex items-center gap-2">
              <span className="bg-amber-500/90 backdrop-blur-md text-white font-medium text-xs px-2.5 py-1 rounded-full shadow-2xs">
                ✨ {diary.mood || '穏やか'}
              </span>

              {isOwner && (
                <button
                  onClick={handleToggleVisibility}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                    diary.isPublic
                      ? 'bg-emerald-600/90 text-white border-emerald-400'
                      : 'bg-stone-800/90 text-stone-200 border-stone-600'
                  }`}
                  title="公開状態を切り替え"
                >
                  {diary.isPublic ? (
                    <>
                      <Globe className="w-3 h-3" /> 公開中
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" /> 非公開
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Title on cover */}
          <div className="absolute bottom-4 inset-x-4">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight drop-shadow-md">
              {diary.title}
            </h2>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Author Info */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <img
              src={diary.userPhotoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${diary.userId}`}
              alt={diary.userDisplayName}
              className="w-9 h-9 rounded-xl object-cover bg-stone-100 border border-stone-200"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="font-bold text-stone-800 text-sm block -mb-0.5">
                {diary.userDisplayName}
              </span>
              <span className="text-[11px] text-stone-400">AIが紡いだ日記</span>
            </div>
          </div>

          {isOwner && onDeleteDiary && (
            <button
              onClick={() => onDeleteDiary(diary.id)}
              className="p-2 text-stone-400 hover:text-rose-600 transition-colors"
              title="日記を削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Audio Narration Player if available */}
        {diary.audioNarrationUrl && (
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-amber-900 block">AI朗読音声（音声で聴く）</span>
              <audio src={diary.audioNarrationUrl} controls className="w-full h-8 mt-1" />
            </div>
          </div>
        )}

        {/* Markdown Content */}
        <div className="prose prose-stone max-w-none text-stone-800 text-sm leading-relaxed font-sans">
          <div className="markdown-body space-y-3">
            <Markdown>{diary.content}</Markdown>
          </div>
        </div>

        {/* AI Reflection Message Box */}
        {diary.aiReflection && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 text-sm shadow-2xs mt-0.5">
              ✨
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 block mb-0.5">
                AIパートナーからのひとことメッセージ
              </span>
              <p className="text-xs text-stone-700 italic leading-relaxed">
                "{diary.aiReflection}"
              </p>
            </div>
          </div>
        )}

        {/* Tags */}
        {diary.tags && diary.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {diary.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full border border-stone-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Reactions & Interaction Controls */}
        <div className="pt-3 border-t border-stone-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Reaction buttons */}
            <div className="flex items-center gap-1">
              {REACTIONS.map((r) => {
                const isActive = userReaction === r.type;
                return (
                  <button
                    key={r.type}
                    onClick={() => handleToggleReaction(r.type)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                      isActive
                        ? `${r.activeColor} font-bold scale-105 shadow-2xs`
                        : 'bg-stone-50 border-stone-200/80 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Comment Count & Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>コメント ({comments.length})</span>
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                title="文章をコピーしてシェア"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Comment Drawer */}
          {showComments && (
            <div className="pt-3 border-t border-dashed border-stone-200 space-y-3">
              {/* Generate AI Comment button */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-stone-700">みんなのコメント</span>
                <button
                  onClick={handleGenerateAiComment}
                  disabled={isGeneratingAiComment}
                  className="flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-100/80 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Bot className="w-3.5 h-3.5" />
                  {isGeneratingAiComment ? 'AIコメントを作成中...' : 'AI読者の感想を聞く'}
                </button>
              </div>

              {/* List of comments */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-2">
                    まだコメントはありません。一番乗りのコメントを残しましょう！
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl text-xs space-y-1 ${
                        c.isAiComment
                          ? 'bg-amber-50/90 border border-amber-200 text-amber-950'
                          : 'bg-stone-50 border border-stone-200 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="flex items-center gap-1 text-stone-700">
                          {c.isAiComment && '🤖 '}
                          {c.userDisplayName}
                        </span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="温かいコメントを書く..."
                  className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 bg-stone-50"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
