import React, { useState, useEffect } from 'react';
import { Diary, Moment, UserProfile } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, BookOpen, Clock } from 'lucide-react';
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
      {/* Calendar Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="font-serif font-bold text-xl text-stone-800">
              {monthLabel} のダイアリーログ
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center font-bold text-xs text-stone-400 mb-2">
          <span className="text-rose-500">日</span>
          <span>月</span>
          <span>火</span>
          <span>水</span>
          <span>木</span>
          <span>金</span>
          <span className="text-sky-500">土</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weeks.map((week, wIdx) =>
            week.map((day, dIdx) => {
              if (day === null) {
                return <div key={`empty-${wIdx}-${dIdx}`} className="h-14 sm:h-16 rounded-xl bg-stone-50/40" />;
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
                  className={`h-14 sm:h-16 rounded-xl p-1.5 flex flex-col justify-between items-start transition-all cursor-pointer border text-left relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/30 shadow-2xs'
                      : diaryForDay
                      ? 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/60'
                      : 'border-stone-100 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      dIdx === 0 ? 'text-rose-500' : dIdx === 6 ? 'text-sky-500' : 'text-stone-700'
                    }`}
                  >
                    {day}
                  </span>

                  {diaryForDay && (
                    <div className="w-full">
                      <span className="block text-[9px] font-semibold text-amber-900 bg-amber-200/80 px-1 rounded-sm truncate">
                        {diaryForDay.title}
                      </span>
                    </div>
                  )}

                  {diaryForDay && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5" />
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
          <h3 className="font-serif font-bold text-lg text-stone-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {selectedDate} の記録
          </h3>

          <button
            onClick={() => onSelectDate(selectedDate)}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 px-3 py-1.5 rounded-full transition-colors"
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
          <div className="bg-stone-50 rounded-2xl p-8 border border-dashed border-stone-200 text-center space-y-2">
            <p className="text-stone-500 text-xs">
              {selectedDate} の日記はまだ作成されていません。
            </p>
            <button
              onClick={() => onSelectDate(selectedDate)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-2xs"
            >
              この日のつぶやきを記録・日記を作成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
