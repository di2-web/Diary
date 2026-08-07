import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Safe parsing of YYYY-MM-DD
  const parts = (value || new Date().toISOString().split('T')[0]).split('-');
  const yearNum = parseInt(parts[0], 10) || new Date().getFullYear();
  const monthNum = parseInt(parts[1], 10) || (new Date().getMonth() + 1);
  const dayNum = parseInt(parts[2], 10) || new Date().getDate();

  const selectedDateObj = new Date(yearNum, monthNum - 1, dayNum);

  // Month state for popover grid view
  const [viewYear, setViewYear] = useState(yearNum);
  const [viewMonth, setViewMonth] = useState(monthNum - 1); // 0-indexed

  useEffect(() => {
    setViewYear(yearNum);
    setViewMonth(monthNum - 1);
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dayOfWeekNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeekStr = dayOfWeekNames[selectedDateObj.getDay()] || '日';
  const formattedDisplay = `${yearNum}年${monthNum}月${dayNum}日 (${dayOfWeekStr})`;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Quick Prev / Next Day buttons
  const handlePrevDay = () => {
    const d = new Date(yearNum, monthNum - 1, dayNum - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(yearNum, monthNum - 1, dayNum + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${day}`);
  };

  // Month navigation in calendar popup
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1.5 max-w-full">
      {/* Quick Day Controls - Unified Background Container */}
      <div className="flex items-center bg-[#f3eff8] p-0.5 rounded-2xl border border-[#ded5e8] shadow-2xs">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-1.5 rounded-xl hover:bg-white text-[#8572a7] hover:text-[#3d3546] transition-all cursor-pointer"
          title="前日"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Date Display Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl hover:bg-white text-xs font-bold text-[#3d3546] transition-all cursor-pointer whitespace-nowrap"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#9880be] shrink-0" />
          <span>{formattedDisplay}</span>
        </button>

        <button
          type="button"
          onClick={handleNextDay}
          className="p-1.5 rounded-xl hover:bg-white text-[#8572a7] hover:text-[#3d3546] transition-all cursor-pointer"
          title="翌日"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Today Quick Button */}
      {value !== todayStr && (
        <button
          type="button"
          onClick={() => {
            onChange(todayStr);
            setIsOpen(false);
          }}
          className="text-[11px] font-bold text-[#8572a7] bg-[#f3eff8] hover:bg-[#eae3f2] px-2.5 py-1.5 rounded-xl border border-[#ded5e8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          今日
        </button>
      )}

      {/* Custom Styled Calendar Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed sm:absolute left-4 right-4 sm:left-0 sm:right-auto top-20 sm:top-10 z-50 bg-white border border-[#ded5e8] rounded-3xl shadow-xl p-4 w-auto sm:w-72 max-w-[calc(100vw-2rem)] text-left space-y-3 animate-fade-in">
            {/* Header Month Nav */}
            <div className="flex items-center justify-between border-b border-[#f0ebf7] pb-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-[#f3eff8] text-[#9880be] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-[#3d3546]">
                {viewYear}年 {viewMonth + 1}月
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-[#f3eff8] text-[#9880be] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold">
              <span className="text-rose-500">日</span>
              <span className="text-[#6e637c]">月</span>
              <span className="text-[#6e637c]">火</span>
              <span className="text-[#6e637c]">水</span>
              <span className="text-[#6e637c]">木</span>
              <span className="text-[#6e637c]">金</span>
              <span className="text-sky-500">土</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty_${idx}`} className="h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dateString = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = dateString === value;
                const isToday = dateString === todayStr;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                      isSelected
                        ? 'bg-[#9880be] text-white shadow-2xs scale-105 z-10'
                        : isToday
                        ? 'bg-[#f3eff8] text-[#9880be] border border-[#ded5e8]'
                        : 'hover:bg-[#f8f5f0] text-[#3d3546]'
                    }`}
                  >
                    {day}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#9880be]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Quick Action */}
            <div className="pt-2 border-t border-[#f0ebf7] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  onChange(todayStr);
                  setIsOpen(false);
                }}
                className="text-[#9880be] font-bold hover:underline cursor-pointer"
              >
                今日へ移動
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#8e859b] hover:text-[#3d3546] font-medium cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
