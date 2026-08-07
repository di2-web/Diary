import React from 'react';
import { Globe, BookOpen, Calendar, PenLine, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'sns' | 'moments' | 'mypage' | 'calendar';
  setActiveTab: (tab: 'sns' | 'moments' | 'mypage' | 'calendar') => void;
  onNewPostClick: () => void;
  hasMomentsToday: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onNewPostClick,
  hasMomentsToday,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e8e2f0] text-[#6e637c] shadow-lg px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* Tab 1: SNS */}
        <button
          onClick={() => setActiveTab('sns')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[50px] min-h-[48px] rounded-2xl transition-all cursor-pointer ${
            activeTab === 'sns'
              ? 'text-[#8572a7] font-bold bg-[#f0ebf7]'
              : 'text-[#9e95a9] hover:text-[#8572a7]'
          }`}
        >
          <Globe className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight whitespace-nowrap">タイムライン</span>
        </button>

        {/* Tab 2: Moments */}
        <button
          onClick={() => setActiveTab('moments')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[50px] min-h-[48px] rounded-2xl transition-all relative cursor-pointer ${
            activeTab === 'moments'
              ? 'text-[#8572a7] font-bold bg-[#f0ebf7]'
              : 'text-[#9e95a9] hover:text-[#8572a7]'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight whitespace-nowrap">今日の記録</span>
          {hasMomentsToday && (
            <span className="w-2 h-2 rounded-full bg-[#e07a5f] animate-pulse absolute top-1.5 right-2 border border-white" />
          )}
        </button>

        {/* Center Floating New Post Button */}
        <div className="relative -top-3 shrink-0">
          <button
            onClick={onNewPostClick}
            className="w-12 h-12 rounded-full bg-[#9880be] hover:bg-[#8572a7] text-white flex flex-col items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer border-2 border-white"
            title="きょうの出来事・つぶやきを投稿"
          >
            <PenLine className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tab 3: MyPage */}
        <button
          onClick={() => setActiveTab('mypage')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[50px] min-h-[48px] rounded-2xl transition-all cursor-pointer ${
            activeTab === 'mypage'
              ? 'text-[#8572a7] font-bold bg-[#f0ebf7]'
              : 'text-[#9e95a9] hover:text-[#8572a7]'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight whitespace-nowrap">マイページ</span>
        </button>

        {/* Tab 4: Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[50px] min-h-[48px] rounded-2xl transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'text-[#8572a7] font-bold bg-[#f0ebf7]'
              : 'text-[#9e95a9] hover:text-[#8572a7]'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight whitespace-nowrap">カレンダー</span>
        </button>
      </div>
    </div>
  );
};
