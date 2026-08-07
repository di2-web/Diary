import React, { useState, useEffect } from 'react';
import { Diary, Moment, UserProfile } from '../types';
import { DiaryCard } from './DiaryCard';
import { MomentCard } from './MomentCard';
import { Globe, Search, Sparkles, Filter, RefreshCw, BookOpen, MessageSquare, Users, ChevronDown } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
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
    if (!currentUser) return;
    const target = diaries.find((d) => d.id === id);
    if (!target || target.userId !== currentUser.uid) return;
    try {
      await deleteDoc(doc(db, 'diaries', id));
    } catch (err) {
      console.error('Delete diary error:', err);
    }
  };

  const handleDeleteMoment = async (id: string) => {
    if (!currentUser) return;
    const target = moments.find((m) => m.id === id);
    if (!target || target.userId !== currentUser.uid) return;
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
      <div className="bg-gradient-to-br from-[#f3eff8] via-[#e9e2f2] to-[#f8f5f0] text-[#3d3546] rounded-3xl p-6 sm:p-8 border border-[#e2d9eb] shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-[#9880be]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-white/80 border border-[#ded5e8] text-[#8572a7] text-xs font-semibold px-3.5 py-1 rounded-full mb-3 shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-[#9880be]" /> 静かなつながりタイムライン
          </div>
          <h1 className="font-bold text-2xl sm:text-3xl text-[#3d3546] tracking-tight leading-snug mb-2">
            何気ない毎日を残して、大切な人とつながる。
          </h1>
          <p className="text-[#6e637c] text-xs sm:text-sm leading-relaxed mb-5">
            日々のちょっとしたつぶやきや、AIがまとめた素敵な手帳アルバムが静かに届きます。
          </p>

          <button
            onClick={onNavigateToMoments}
            className="inline-flex items-center gap-2 bg-[#9880be] hover:bg-[#8871b0] text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white/80" />
            自分の記録をつける
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-[#e8e2f0] shadow-2xs space-y-3">
        {/* Top Control Bar: Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#9880be] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="キーワードや名前で検索..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-[#ded5e8] text-xs text-[#3d3546] placeholder-[#a298b0] focus:outline-hidden focus:ring-2 focus:ring-[#9880be]/30 bg-[#f8f5f0]/50 font-medium"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#f0ebf7]">
          {/* Content Type Tabs */}
          <div className="flex items-center gap-1 bg-[#f3eff8] p-1 rounded-2xl border border-[#e8e2f0] overflow-x-auto max-w-full">
            <button
              onClick={() => setContentTypeFilter('all')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                contentTypeFilter === 'all'
                  ? 'bg-white text-[#3d3546] shadow-2xs font-bold'
                  : 'text-[#6e637c] hover:text-[#3d3546]'
              }`}
            >
              すべて ({diaries.length + moments.length})
            </button>
            <button
              onClick={() => setContentTypeFilter('diaries')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                contentTypeFilter === 'diaries'
                  ? 'bg-white text-[#3d3546] shadow-2xs font-bold'
                  : 'text-[#6e637c] hover:text-[#3d3546]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#9880be]" />
              <span>手帳日記 ({diaries.length})</span>
            </button>
            <button
              onClick={() => setContentTypeFilter('moments')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                contentTypeFilter === 'moments'
                  ? 'bg-white text-[#3d3546] shadow-2xs font-bold'
                  : 'text-[#6e637c] hover:text-[#3d3546]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#9880be]" />
              <span>つぶやき ({moments.length})</span>
            </button>
          </div>

          {/* Category Filter Selector */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto max-w-full">
            <Users className="w-4 h-4 text-[#9880be] shrink-0" />
            <CustomSelect
              value={categoryFilter}
              options={categoryFilterOptions}
              onChange={setCategoryFilter}
            />
          </div>
        </div>
      </div>

      {/* Timeline Feed */}
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#9880be] animate-spin mx-auto" />
          <p className="text-[#6e637c] text-xs font-medium">タイムラインを読み込んでいます...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-dashed border-[#ded5e8] text-center space-y-3 shadow-2xs">
          <BookOpen className="w-10 h-10 text-[#9880be] mx-auto" />
          <h3 className="font-bold text-[#3d3546] text-lg">
            該当する投稿が見つかりませんでした
          </h3>
          <p className="text-[#6e637c] text-xs max-w-sm mx-auto leading-relaxed">
            {searchQuery || categoryFilter !== 'ALL_CATS'
              ? '条件に一致する公開投稿がありません。フィルターや検索ワードを変更してみてください。'
              : 'まだ公開された投稿がありません。最初の投稿やつぶやきを記録してみましょう！'}
          </p>
          <button
            onClick={onNavigateToMoments}
            className="mt-2 bg-[#9880be] hover:bg-[#8871b0] text-white font-semibold text-xs px-5 py-2.5 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
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
