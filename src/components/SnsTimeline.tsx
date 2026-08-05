import React, { useState, useEffect } from 'react';
import { Diary, UserProfile } from '../types';
import { DiaryCard } from './DiaryCard';
import { Globe, Search, Sparkles, Filter, RefreshCw, BookOpen } from 'lucide-react';
import { collection, query, where, onSnapshot, db, deleteDoc, doc } from '../firebase';

interface SnsTimelineProps {
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
  onNavigateToMoments: () => void;
}

export const SnsTimeline: React.FC<SnsTimelineProps> = ({
  currentUser,
  onRequireAuth,
  onNavigateToMoments,
}) => {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch public diaries
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
        // Sort by date or createdAt descending
        list.sort(
          (a, b) =>
            new Date(b.createdAt || b.date).getTime() -
            new Date(a.createdAt || a.date).getTime()
        );
        setDiaries(list);
        setLoading(false);
      },
      (error) => {
        console.error('Timeline fetch error:', error);
        setLoading(false);
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

  const filteredDiaries = diaries.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.userDisplayName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-stone-800 text-stone-100 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-stone-700 text-amber-200 text-xs font-medium px-3 py-1 rounded-full mb-3">
            <Globe className="w-3.5 h-3.5" /> みんなの記録手帖
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight leading-snug mb-2">
            それぞれの今日が、静かに紡ぐ日常。
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-4">
            日々のつぶやきからまとめた公開日記のタイムラインです。温かいコメントで互いの記録に寄り添いましょう。
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
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="キーワードやタグで検索..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 bg-stone-50"
          />
        </div>
      </div>

      {/* Timeline Feed */}
      {loading ? (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-stone-500 text-xs">タイムラインを読み込んでいます...</p>
        </div>
      ) : filteredDiaries.length === 0 ? (
        <div className="bg-amber-50/50 rounded-2xl p-10 border border-dashed border-amber-300 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-serif font-bold text-stone-800 text-lg">
            日記が見つかりませんでした
          </h3>
          <p className="text-stone-600 text-xs max-w-sm mx-auto">
            {searchQuery
              ? '検索条件に一致する公開日記がありません。'
              : 'まだ公開された日記がありません。最初の日記を作成して共有してみましょう！'}
          </p>
          <button
            onClick={onNavigateToMoments}
            className="mt-2 bg-amber-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-xs hover:bg-amber-700"
          >
            きょうの投稿をはじめる
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDiaries.map((diary) => (
            <DiaryCard
              key={diary.id}
              diary={diary}
              currentUser={currentUser}
              onRequireAuth={onRequireAuth}
              onDeleteDiary={handleDeleteDiary}
            />
          ))}
        </div>
      )}
    </div>
  );
};
