import React, { useState, useEffect, useMemo } from 'react';
import { Diary, Moment, UserProfile } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, BookOpen, Clock, Search, ShieldCheck, Tag, FileText } from 'lucide-react';
import { collection, query, where, onSnapshot, db, deleteDoc, doc } from '../firebase';
import { DiaryCard } from './DiaryCard';

interface CalendarViewProps {
  currentUser: UserProfile | null;
  onSelectDate: (dateStr: string) => void;
  onRequireAuth: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentUser,
  onSelectDate,
  onRequireAuth,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userDiaries, setUserDiaries] = useState<Record<string, Diary>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteDiary = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'diaries', id));
      setSelectedDiary(null);
    } catch (err) {
      console.error('Delete diary error:', err);
    }
  };

  // Listen to user's diaries
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'diaries'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, Diary> = {};
      snapshot.forEach((docSnap) => {
        const d = { id: docSnap.id, ...docSnap.data() } as Diary;
        if (d.date) {
          map[d.date] = d;
        }
      });
      setUserDiaries(map);
      if (selectedDate && map[selectedDate]) {
        setSelectedDiary(map[selectedDate]);
      } else if (selectedDate && !map[selectedDate]) {
        setSelectedDiary(null);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, selectedDate]);

  // Full-text Search Filtered Diaries
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return Object.values(userDiaries).filter((d) => {
      const titleMatch = d.title?.toLowerCase().includes(q);
      const contentMatch = d.content?.toLowerCase().includes(q);
      const dateMatch = d.date?.includes(q);
      return titleMatch || contentMatch || dateMatch;
    });
  }, [searchQuery, userDiaries]);

  // Calendar Days calculation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dayNum: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    setSelectedDate(dateStr);
    onSelectDate(dateStr);
    if (userDiaries[dateStr]) {
      setSelectedDiary(userDiaries[dateStr]);
    } else {
      setSelectedDiary(null);
    }
  };

  const weeks = [];
  let dayCounter = 1;

  for (let i = 0; i < 6; i++) {
    const weekDays = [];
    for (let j = 0; j < 7; j++) {
      if ((i === 0 && j < startDayOfWeek) || dayCounter > totalDays) {
        weekDays.push(null);
      } else {
        weekDays.push(dayCounter);
        dayCounter++;
      }
    }
    weeks.push(weekDays);
    if (dayCounter > totalDays) break;
  }

  const monthLabel = `${year}年 ${month + 1}月`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search & Archive Filter Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e8e2f0] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#9880be] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="過去の日記をキーワード・本文検索..."
              className="w-full pl-10 pr-4 py-2 bg-[#f8f5f0]/50 border border-[#ded5e8] rounded-2xl text-xs text-[#3d3546] placeholder-[#a298b0] focus:outline-hidden focus:ring-2 focus:ring-[#9880be]/30 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8e859b] hover:text-[#3d3546]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search Results Drawer */}
        {searchQuery.trim() && (
          <div className="bg-[#f3eff8] rounded-2xl p-3 border border-[#ded5e8] space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-[#3d3546] font-bold border-b border-[#e8e2f0] pb-1.5">
              <span>検索結果: {searchResults.length}件ヒット</span>
              <span className="text-[10px] text-[#8572a7]">（タップしてその日の日記を表示）</span>
            </div>

            {searchResults.length === 0 ? (
              <p className="text-xs text-[#8e859b] py-2 text-center">
                「{searchQuery}」に一致する日記は見つかりませんでした。
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {searchResults.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDate(d.date);
                      setSelectedDiary(d);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-[#f8f5f0] border border-[#e8e2f0] transition-all flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-white bg-[#9880be] px-2 py-0.5 rounded-lg text-[10px] shrink-0">
                        {d.date}
                      </span>
                      <span className="font-semibold text-[#3d3546] truncate">{d.title}</span>
                    </div>
                    <span className="text-[10px] text-[#8572a7] shrink-0 font-medium">表示 →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar Header Card */}
      <div className="bg-white rounded-3xl p-3 sm:p-6 border border-[#e8e2f0] shadow-2xs">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#9880be]" />
            <h2 className="font-bold text-base sm:text-xl text-[#3d3546]">
              {monthLabel} のダイアリーログ
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-[#f3eff8] hover:bg-[#eae3f2] text-[#3d3546] transition-colors cursor-pointer border border-[#ded5e8]"
              title="前月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-[#f3eff8] hover:bg-[#eae3f2] text-[#3d3546] transition-colors cursor-pointer border border-[#ded5e8]"
              title="翌月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center font-bold text-[11px] sm:text-xs text-[#8e859b] mb-1.5 sm:mb-2">
          <span className="text-rose-500">日</span>
          <span>月</span>
          <span>火</span>
          <span>水</span>
          <span>木</span>
          <span>金</span>
          <span className="text-sky-500">土</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weeks.map((week, wIdx) =>
            week.map((day, dIdx) => {
              if (day === null) {
                return <div key={`empty-${wIdx}-${dIdx}`} className="h-13 sm:h-16 rounded-xl sm:rounded-2xl bg-[#f8f5f0]/30" />;
              }

              const formattedMonth = String(month + 1).padStart(2, '0');
              const formattedDay = String(day).padStart(2, '0');
              const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
              const diaryForDay = userDiaries[dateStr];
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(day)}
                  className={`h-13 sm:h-16 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 flex flex-col justify-between items-start transition-all cursor-pointer border text-left relative overflow-hidden ${
                    isSelected
                      ? 'border-[#9880be] bg-[#f3eff8] ring-2 ring-[#9880be]/30 shadow-2xs'
                      : diaryForDay
                      ? 'border-[#ded5e8] bg-[#f8f5f0] hover:bg-[#f0ebf7]'
                      : 'border-[#f0ebf7] bg-white hover:bg-[#f8f5f0]'
                  }`}
                >
                  <span
                    className={`text-[11px] sm:text-xs font-bold leading-none ${
                      dIdx === 0 ? 'text-rose-500' : dIdx === 6 ? 'text-sky-500' : 'text-[#3d3546]'
                    }`}
                  >
                    {day}
                  </span>

                  {diaryForDay && (
                    <div className="w-full">
                      <span className="block text-[8px] sm:text-[9px] font-semibold text-[#3d3546] bg-[#eae3f2] px-0.5 sm:px-1 rounded-sm sm:rounded-md truncate leading-tight">
                        {diaryForDay.title}
                      </span>
                    </div>
                  )}

                  {diaryForDay && (
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#9880be] absolute top-1 sm:top-1.5 right-1 sm:right-1.5" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Day Detail */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[#3d3546] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9880be]" />
            {selectedDate} の記録
          </h3>

          <button
            onClick={() => onSelectDate(selectedDate)}
            className="text-xs font-semibold text-[#8572a7] hover:text-[#3d3546] bg-[#f3eff8] px-3.5 py-1.5 rounded-2xl transition-colors border border-[#ded5e8]"
          >
            この日の投稿ページへ移動 →
          </button>
        </div>

        {selectedDiary ? (
          <DiaryCard
            diary={selectedDiary}
            currentUser={currentUser}
            onRequireAuth={onRequireAuth}
            onDeleteDiary={handleDeleteDiary}
            isSingleView={true}
          />
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-[#ded5e8] text-center space-y-3">
            <p className="text-[#6e637c] text-xs font-medium">
              {selectedDate} の日記はまだ作成されていません。
            </p>
            <button
              onClick={() => onSelectDate(selectedDate)}
              className="bg-[#9880be] hover:bg-[#8871b0] text-white font-semibold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-xs cursor-pointer"
            >
              この日のつぶやきを記録・日記を作成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
