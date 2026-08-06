import React, { useState, useEffect } from 'react';
import { Diary, Moment, UserProfile } from '../types';
import { DiaryCard } from './DiaryCard';
import { MomentCard } from './MomentCard';
import { Globe, Search, Sparkles, Filter, RefreshCw, BookOpen, MessageSquare, Users } from 'lucide-react';
import { collection, query, where, onSnapshot, db, deleteDoc, doc } from '../firebase';

interface SnsTimelineProps {
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
  onNavigateToMoments: () => void;
}

type TimelineItem =
  | { itemType: 'diary'; data: Diary; dateSort: string }
  | { itemType: 'moment'; data: Moment; dateSort: string };

export const SnsTimeline: React.FC<SnsTimelineProps> = ({
  currentUser,
  onRequireAuth,
  onNavigateToMoments,
}) => {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loadingDiaries, setLoadingDiaries] = useState(true);
  const [loadingMoments, setLoadingMoments] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'diaries' | 'moments'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL_CATS');

  // Available Category Filter Options
  const categoryFilterOptions = [
    { id: 'ALL_CATS', label: 'すべてのカテゴリ' },
    { id: 'Default', label: 'Default' },
    { id: 'All', label: 'All (すべての友達)' },
    ...(currentUser?.customShareCategories || []).map((c) => ({ id: c, label: c })),
  ];

  // Fetch public diaries
  useEffect(() => {
    const q = query(
      collection(db, 'diaries'),
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Diary[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Diary);
        });
        setDiaries(list);
        setLoadingDiaries(false);
      },
      (error) => {
        console.error('Diaries fetch error:', error);
        setLoadingDiaries(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch public moments
  useEffect(() => {
    const q = query(
      collection(db, 'moments'),
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Moment[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Moment);
        });
        setMoments(list);
        setLoadingMoments(false);
      },
      (error) => {
        console.error('Moments fetch error:', error);
        setLoadingMoments(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDeleteDiary = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'diaries', id));
    } catch (err) {
      console.error('Delete diary error:', err);
    }
  };

  const handleDeleteMoment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'moments', id));
    } catch (err) {
      console.error('Delete moment error:', err);
    }
  };

  // Combine and filter feed items
  const combinedItems: TimelineItem[] = [];

  if (contentTypeFilter === 'all' || contentTypeFilter === 'diaries') {
    diaries.forEach((d) => {
      combinedItems.push({
        itemType: 'diary',
        data: d,
        dateSort: d.createdAt || d.date,
      });
    });
  }

  if (contentTypeFilter === 'all' || contentTypeFilter === 'moments') {
    moments.forEach((m) => {
      combinedItems.push({
        itemType: 'moment',
        data: m,
        dateSort: m.createdAt || m.date,
      });
    });
  }

  // Sort descending
  combinedItems.sort((a, b) => new Date(b.dateSort).getTime() - new Date(a.dateSort).getTime());

  // Apply Search & Category Filters
  const filteredItems = combinedItems.filter((item) => {
    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (item.itemType === 'diary') {
        const matches =
          item.data.title.toLowerCase().includes(q) ||
          item.data.content.toLowerCase().includes(q) ||
          item.data.userDisplayName.toLowerCase().includes(q);
        if (!matches) return false;
      } else {
        const matches =
          item.data.content.toLowerCase().includes(q) ||
          (item.data.userDisplayName && item.data.userDisplayName.toLowerCase().includes(q));
        if (!matches) return false;
      }
    }

    // 2. Category Filter
    if (categoryFilter !== 'ALL_CATS') {
      const itemCats = item.data.shareCategories || ['Default', 'All'];
      if (!itemCats.includes(categoryFilter)) {

        return false;
      }
    }

    return true;
  });

  const isLoading = loadingDiaries || loadingMoments;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-stone-800 text-stone-100 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-stone-700 text-amber-200 text-xs font-medium px-3 py-1 rounded-full mb-3">
            <Globe className="w-3.5 h-3.5" /> みんなの誌（タイムライン）
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight leading-snug mb-2">
            日々のつぶやきとAI手帳日記。
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-4">
            公開された日々の記録やつぶやきがリアルタイムで共有されます。共有カテゴリごとに見たい投稿を絞り込み表示できます。
          </p>

          <button
            onClick={onNavigateToMoments}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            自分の記録を付ける
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-3">
        {/* Top Control Bar: Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="キーワードや名前で検索..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 bg-stone-50"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
          {/* Content Type Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setContentTypeFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                contentTypeFilter === 'all'
                  ? 'bg-white text-stone-900 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              すべて ({diaries.length + moments.length})
            </button>
            <button
              onClick={() => setContentTypeFilter('diaries')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                contentTypeFilter === 'diaries'
                  ? 'bg-white text-amber-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>手帳日記 ({diaries.length})</span>
            </button>
            <button
              onClick={() => setContentTypeFilter('moments')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                contentTypeFilter === 'moments'
                  ? 'bg-white text-amber-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>つぶやき ({moments.length})</span>
            </button>
          </div>

          {/* Category Filter Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <Users className="w-4 h-4 text-amber-600 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-1.5 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-medium cursor-pointer"
            >
              {categoryFilterOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Feed */}
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-stone-500 text-xs">タイムラインを読み込んでいます...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-amber-50/50 rounded-2xl p-10 border border-dashed border-amber-300 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-serif font-bold text-stone-800 text-lg">
            該当する投稿が見つかりませんでした
          </h3>
          <p className="text-stone-600 text-xs max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'ALL_CATS'
              ? '条件に一致する公開投稿がありません。フィルターや検索ワードを変更してみてください。'
              : 'まだ公開された投稿がありません。最初の投稿やつぶやきを記録してみましょう！'}
          </p>
          <button
            onClick={onNavigateToMoments}
            className="mt-2 bg-amber-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-xs hover:bg-amber-700 cursor-pointer"
          >
            きょうの投稿をはじめる
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredItems.map((item) => {
            if (item.itemType === 'diary') {
              return (
                <DiaryCard
                  key={`diary-${item.data.id}`}
                  diary={item.data}
                  currentUser={currentUser}
                  onRequireAuth={onRequireAuth}
                  onDeleteDiary={handleDeleteDiary}
                />
              );
            } else {
              return (
                <MomentCard
                  key={`moment-${item.data.id}`}
                  moment={item.data}
                  currentUser={currentUser}
                  onRequireAuth={onRequireAuth}
                  onDeleteMoment={handleDeleteMoment}
                />
              );
            }
          })}
        </div>
      )}
    </div>
  );
};
