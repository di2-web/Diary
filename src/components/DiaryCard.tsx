import React, { useState, useEffect, useRef } from 'react';
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
  Palette,
  Type,
  Sticker,
  Edit3,
  Save,
  X,
  RotateCcw,
} from 'lucide-react';
import { Diary, DiaryComment, DiaryStamp, ReactionType, UserProfile } from '../types';
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

const STAMP_PRESETS = [
  { icon: '💮', label: 'たいへんよくできました' },
  { icon: '🌸', label: '満点スマイル' },
  { icon: '☕️', label: 'ほっと一息' },
  { icon: '🌟', label: 'きらめき' },
  { icon: '👊', label: '踏ん張った' },
  { icon: '☀️', label: '快晴' },
  { icon: '🌧️', label: '雨のち晴れ' },
  { icon: '🎵', label: 'お気に入りBGM' },
  { icon: '🍰', label: 'ごほうびスイーツ' },
  { icon: '📌', label: '重要メモ' },
  { icon: '🎀', label: '記念日' },
  { icon: '🐾', label: 'ほっこり足跡' },
];

const PAPER_BG_CLASSES: Record<string, { label: string; class: string; badgeClass: string }> = {
  'paper-washi': { label: '和紙風', class: 'bg-[#fdfbf7] border-amber-200/90 shadow-sm', badgeClass: 'bg-amber-100 text-amber-800' },
  'paper-craft': { label: 'クラフト紙', class: 'bg-[#f4ebd9] border-[#d4c3a3] shadow-sm', badgeClass: 'bg-[#e2d3b7] text-stone-800' },
  'paper-grid': { label: '方眼ノート', class: 'bg-[#f8fafc] border-slate-300 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]', badgeClass: 'bg-slate-200 text-slate-800' },
  'paper-dots': { label: 'ドット方眼', class: 'bg-[#fffefb] border-amber-200 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px]', badgeClass: 'bg-amber-100 text-amber-900' },
  'paper-cafe': { label: 'カフェレトロ', class: 'bg-[#faf6ed] border-[#e2d8be]', badgeClass: 'bg-[#e8dec3] text-stone-800' },
  'paper-white': { label: 'クリーン白紙', class: 'bg-white border-stone-200', badgeClass: 'bg-stone-100 text-stone-700' },
};

const FONT_CLASSES: Record<string, { label: string; class: string }> = {
  serif: { label: '明朝・和風', class: 'font-serif' },
  handwriting: { label: '手書き風', class: 'font-sans tracking-wide leading-relaxed' },
  sans: { label: 'ゴシック・標準', class: 'font-sans' },
  mono: { label: 'タイプライター', class: 'font-mono text-xs' },
};
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
  const [copied, setCopied] = useState(false);

  // Decoration & Rewrite States
  const [bgStyle, setBgStyle] = useState<string>(diary.bgStyle || 'paper-washi');
  const [fontStyle, setFontStyle] = useState<string>(diary.fontStyle || 'serif');
  const [stamps, setStamps] = useState<DiaryStamp[]>(diary.stamps || []);
  const [isDecoOpen, setIsDecoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(diary.title);
  const [editedContent, setEditedContent] = useState(diary.content);
  const [isSavingDeco, setIsSavingDeco] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);

  const isOwner = !currentUser?.uid || currentUser?.uid === diary.userId;

  // Sync props if changed
  useEffect(() => {
    setBgStyle(diary.bgStyle || 'paper-washi');
    setFontStyle(diary.fontStyle || 'serif');
    setStamps(diary.stamps || []);
    setEditedTitle(diary.title);
    setEditedContent(diary.content);
  }, [diary]);

  // Save decoration & edits to Firestore
  const handleSaveDecoAndContent = async () => {
    if (!isOwner) return;
    try {
      setIsSavingDeco(true);
      await updateDoc(doc(db, 'diaries', diary.id), {
        bgStyle,
        fontStyle,
        stamps,
        title: editedTitle,
        content: editedContent,
        updatedAt: new Date().toISOString(),
      });
      setIsDecoOpen(false);
      setIsEditOpen(false);
    } catch (err) {
      console.error('Save decoration error:', err);
    } finally {
      setIsSavingDeco(false);
    }
  };

  // Add a stamp preset to stamps list
  const handleAddStamp = (icon: string, label: string) => {
    const newStamp: DiaryStamp = {
      id: `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      icon,
      label,
      x: Math.round(15 + Math.random() * 65), // 15% to 80%
      y: Math.round(15 + Math.random() * 65),
      rotation: Math.round(-15 + Math.random() * 30), // -15 to +15 deg
    };
    setStamps((prev) => [...prev, newStamp]);
  };

  // Remove a stamp
  const handleRemoveStamp = (id: string) => {
    setStamps((prev) => prev.filter((s) => s.id !== id));
  };

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

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'diary_comments', commentId));
      await updateDoc(doc(db, 'diaries', diary.id), {
        commentsCount: increment(-1),
      });
    } catch (err) {
      console.error('Delete comment error:', err);
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
    const text = `【LifeLog 日記】 ${diary.title} (${diary.date})\n${diary.summary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paperInfo = PAPER_BG_CLASSES[bgStyle] || PAPER_BG_CLASSES['paper-washi'];
  const fontInfo = FONT_CLASSES[fontStyle] || FONT_CLASSES['serif'];

  return (
    <article
      ref={cardRef}
      className={`rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md relative ${paperInfo.class}`}
    >
      {/* Absolute Stamps Overlay */}
      {stamps.map((s) => (
        <div
          key={s.id}
          style={{
            top: `${s.y}%`,
            left: `${s.x}%`,
            transform: `rotate(${s.rotation || 0}deg)`,
          }}
          className="absolute z-20 pointer-events-auto cursor-pointer group animate-fade-in select-none"
          title={`${s.label} (クリックで削除)`}
          onClick={() => isOwner && handleRemoveStamp(s.id)}
        >
          <div className="relative flex items-center justify-center p-1.5 bg-white/90 backdrop-blur-xs rounded-2xl shadow-md border border-stone-200/80 hover:scale-110 transition-transform">
            <span className="text-2xl sm:text-3xl leading-none">{s.icon}</span>
            {isOwner && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        </div>
      ))}

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
            <div className="flex items-center gap-2">
              <span className="bg-white/90 backdrop-blur-md text-stone-800 font-serif font-semibold text-xs px-3 py-1 rounded-full shadow-2xs">
                📅 {diary.date}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs ${paperInfo.badgeClass}`}>
                {paperInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
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
            <h2 className={`font-bold text-xl sm:text-2xl text-white tracking-tight drop-shadow-md ${fontInfo.class}`}>
              {editedTitle || diary.title}
            </h2>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Author Info & Deco Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 flex-wrap gap-2">
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
              <span className="text-[11px] text-stone-400">{diary.date} の日記</span>
            </div>
          </div>

          {/* Owner Deco Tools Toggles */}
          {isOwner && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsDecoOpen(!isDecoOpen);
                  setIsEditOpen(false);
                }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                  isDecoOpen
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-white/80 text-stone-700 border-stone-300 hover:bg-amber-50'
                }`}
                title="手帳デコパレットを開く"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>手帳デコ</span>
              </button>

              <button
                onClick={() => {
                  setIsEditOpen(!isEditOpen);
                  setIsDecoOpen(false);
                }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                  isEditOpen
                    ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                    : 'bg-white/80 text-stone-700 border-stone-300 hover:bg-amber-50'
                }`}
                title="本文を手動リライト・編集"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>リライト</span>
              </button>

              {onDeleteDiary && (
                <button
                  onClick={() => onDeleteDiary(diary.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-stone-200"
                  title="日記を削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Decoration Toolbar Drawer */}
        {isDecoOpen && isOwner && (
          <div className="bg-amber-100/70 rounded-xl p-4 border border-amber-300 space-y-4 animate-fade-in text-xs text-stone-800">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <Palette className="w-4 h-4 text-amber-700" />
                手帳デコレーションパレット
              </span>
              <button
                onClick={handleSaveDecoAndContent}
                disabled={isSavingDeco}
                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1 rounded-lg shadow-2xs cursor-pointer transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingDeco ? '保存中...' : 'デコを保存'}</span>
              </button>
            </div>

            {/* 1. Paper Background Selector */}
            <div className="space-y-1.5">
              <span className="font-semibold text-stone-700 block">① 背景紙テクスチャ:</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {Object.entries(PAPER_BG_CLASSES).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setBgStyle(key)}
                    className={`p-2 rounded-xl border text-[11px] font-medium transition-all text-center cursor-pointer ${
                      bgStyle === key
                        ? 'border-amber-600 bg-amber-500 text-white font-bold shadow-2xs scale-102'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Font Style Selector */}
            <div className="space-y-1.5">
              <span className="font-semibold text-stone-700 block">② 書体・フォント:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {Object.entries(FONT_CLASSES).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setFontStyle(key)}
                    className={`p-2 rounded-xl border text-[11px] font-medium transition-all text-center cursor-pointer ${
                      fontStyle === key
                        ? 'border-amber-600 bg-amber-500 text-white font-bold shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Stamp & Sticker Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700">③ 手帳スタンプ・シールペタペタ (タップで追加):</span>
                {stamps.length > 0 && (
                  <button
                    onClick={() => setStamps([])}
                    className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5"
                  >
                    <RotateCcw className="w-3 h-3" /> スタンプ全消去
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {STAMP_PRESETS.map((st) => (
                  <button
                    key={st.label}
                    onClick={() => handleAddStamp(st.icon, st.label)}
                    className="flex items-center gap-1 bg-white hover:bg-amber-200/60 border border-amber-300/80 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-xs shrink-0 active:scale-95 shadow-2xs"
                    title={st.label}
                  >
                    <span className="text-base">{st.icon}</span>
                    <span className="text-[10px] font-medium text-stone-700">{st.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rewrite / Content Edit Drawer */}
        {isEditOpen && isOwner && (
          <div className="bg-amber-50/90 rounded-xl p-4 border border-amber-300 space-y-3 animate-fade-in text-xs text-stone-800">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <Edit3 className="w-4 h-4 text-amber-700" />
                日記本文のリライト・手動修正
              </span>
              <button
                onClick={handleSaveDecoAndContent}
                disabled={isSavingDeco}
                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1 rounded-lg shadow-2xs cursor-pointer transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingDeco ? '保存中...' : '文章変更を保存'}</span>
              </button>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">タイトル:</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 bg-white text-stone-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">本文 (Markdown形式):</label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-stone-300 p-3 bg-white text-stone-800 leading-relaxed font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* Audio Narration Player if available */}
        {diary.audioNarrationUrl && (
          <div className="bg-stone-50/80 rounded-xl p-3 border border-stone-200/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-stone-700 block">朗読音声</span>
              <audio src={diary.audioNarrationUrl} controls className="w-full h-8 mt-1" />
            </div>
          </div>
        )}

        {/* Markdown Content Display */}
        <div className={`prose prose-stone max-w-none text-stone-800 text-sm leading-relaxed ${fontInfo.class}`}>
          <div className="markdown-body space-y-3">
            <Markdown>{editedContent || diary.content}</Markdown>
          </div>
        </div>

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
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
                title="文章をコピーしてシェア"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Comment Drawer */}
          {showComments && (
            <div className="pt-3 border-t border-dashed border-stone-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-stone-700">コメント ({comments.length})</span>
              </div>

              {/* List of comments */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-2">
                    まだコメントはありません。
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl text-xs bg-stone-50 border border-stone-200/80 text-stone-800 space-y-1 relative group"
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="text-stone-700">{c.userDisplayName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400 font-normal">
                            {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {(c.userId === currentUser?.uid || isOwner) && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-stone-400 hover:text-rose-600 transition-colors p-0.5"
                              title="コメントを削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap text-stone-700">{c.content}</p>
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
                  placeholder="コメントを書く..."
                  className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-400 bg-stone-50"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="bg-stone-800 hover:bg-stone-900 text-white text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40"
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
