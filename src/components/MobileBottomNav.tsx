import React from 'react';
import { Globe, BookOpen, Activity, Calendar, Sparkles } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'sns' | 'moments' | 'wave' | 'calendar';
  setActiveTab: (tab: 'sns' | 'moments' | 'wave' | 'calendar') => void;
  onGenerateDiaryClick: () => void;
  hasMomentsToday: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onGenerateDiaryClick,
  hasMomentsToday,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-stone-900/90 backdrop-blur-xl border-t border-stone-800/80 text-stone-300 shadow-2xl px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* Tab 1: SNS */}
        <button
          onClick={() => setActiveTab('sns')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[50px] min-h-[48px] rounded-2xl transition-all cursor-pointer ${
            activeTab === 'sns'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Globe className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight whitespace-nowrap">みんなの誌</span>
        </button>

        {/* Tab 2: Moments */}
        <button
          onClick={() => setActiveTab('moments')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[50px] min-h-[48px] rounded-2xl transition-all relative cursor-pointer ${
            activeTab === 'moments'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight whitespace-nowrap">今日の記録</span>
          {hasMomentsToday && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse absolute top-1.5 right-2 border border-stone-900" />
          )}
        </button>

        {/* Center Floating AI Diary Generator Button */}
        <div className="relative -top-3 shrink-0">
          <button
            onClick={onGenerateDiaryClick}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-900 flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer border-2 border-stone-900"
            title="つぶやきからAI日記を作成"
          >
            <Sparkles className="w-5 h-5 text-stone-950" />
          </button>
        </div>

        {/* Tab 3: Wave */}
        <button
          onClick={() => setActiveTab('wave')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[50px] min-h-[48px] rounded-2xl transition-all cursor-pointer ${
            activeTab === 'wave'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight whitespace-nowrap">気分の波</span>
        </button>

        {/* Tab 4: Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[50px] min-h-[48px] rounded-2xl transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight whitespace-nowrap">カレンダー</span>
        </button>
      </div>
    </div>
  );
};
