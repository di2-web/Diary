import React from 'react';
import { PenLine, BookOpen, Calendar, Globe, User, LogIn } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'sns' | 'moments' | 'mypage' | 'calendar';
  setActiveTab: (tab: 'sns' | 'moments' | 'mypage' | 'calendar') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onNewPostClick: () => void;
  hasMomentsToday: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onOpenProfile,
  onNewPostClick,
  hasMomentsToday,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#f8f5f0]/90 backdrop-blur-md border-b border-[#e8e2f0]/80 shadow-2xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-10 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('sns')}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-6.5 h-6.5 sm:w-9 sm:h-9 rounded-lg sm:rounded-2xl bg-[#9880be] flex items-center justify-center text-white shadow-2xs group-hover:bg-[#8871b0] transition-all shrink-0">
            <BookOpen className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs sm:text-lg text-[#3d3546] tracking-tight whitespace-nowrap leading-none sm:leading-tight">
              WaveLog
            </span>
            <span className="hidden lg:block text-[10px] text-[#8572a7] font-medium tracking-wide">AI手帳 & 静かなつながり</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#eae3f2]/60 p-1 rounded-full border border-[#ded5e8] shrink">
          <button
            id="nav-tab-sns"
            onClick={() => setActiveTab('sns')}
            className={`flex items-center gap-1.5 px-3 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sns'
                ? 'bg-white text-[#3d3546] shadow-2xs'
                : 'text-[#6e637c] hover:text-[#3d3546] hover:bg-white/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#9880be]" />
            タイムライン
          </button>

          <button
            id="nav-tab-moments"
            onClick={() => setActiveTab('moments')}
            className={`flex items-center gap-1.5 px-3 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'moments'
                ? 'bg-white text-[#3d3546] shadow-2xs'
                : 'text-[#6e637c] hover:text-[#3d3546] hover:bg-white/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#9880be]" />
            きょうの記録
            {hasMomentsToday && (
              <span className="w-2 h-2 rounded-full bg-[#e07a5f] animate-pulse absolute top-1.5 right-2" />
            )}
          </button>

          <button
            id="nav-tab-calendar"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-white text-[#3d3546] shadow-2xs'
                : 'text-[#6e637c] hover:text-[#3d3546] hover:bg-white/40'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#9880be]" />
            カレンダー
          </button>

          <button
            id="nav-tab-mypage"
            onClick={() => setActiveTab('mypage')}
            className={`flex items-center gap-1.5 px-3 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'mypage'
                ? 'bg-white text-[#3d3546] shadow-2xs'
                : 'text-[#6e637c] hover:text-[#3d3546] hover:bg-white/40'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#9880be]" />
            マイページ
          </button>
        </nav>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-new-post-nav"
            onClick={onNewPostClick}
            className="hidden md:flex items-center gap-1.5 bg-[#9880be] hover:bg-[#8871b0] text-white font-medium text-xs sm:text-sm px-3.5 lg:px-4 py-2 rounded-2xl shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title="きょうの出来事・気持ちをつぶやく"
          >
            <PenLine className="w-4 h-4 text-white/80" />
            <span>つぶやく</span>
          </button>

          {user ? (
            <button
              id="btn-profile-menu"
              onClick={onOpenProfile}
              className="flex items-center p-0.5 sm:p-1 rounded-lg sm:rounded-2xl hover:bg-[#eae3f2]/60 transition-colors border border-[#ded5e8] bg-white shrink-0"
              title="プロフィール・設定"
            >
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                alt={user.displayName}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-xl object-cover bg-[#f3eff8]"
                referrerPolicy="no-referrer"
              />
            </button>
          ) : (
            <button
              id="btn-login-nav"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-medium text-[#3d3546] bg-white hover:bg-[#f3eff8] border border-[#ded5e8] shadow-2xs transition-all shrink-0 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9880be]" />
              ログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
