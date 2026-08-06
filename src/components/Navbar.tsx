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
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('sns')}
          className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-amber-100 shadow-2xs group-hover:bg-stone-800 transition-colors">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-serif font-bold text-lg text-stone-900 tracking-tight whitespace-nowrap">
            WaveLog
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-200/50 p-1 rounded-full border border-stone-300/40 shrink-0">
          <button
            id="nav-tab-sns"
            onClick={() => setActiveTab('sns')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sns'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-stone-600" />
            タイムライン
          </button>

          <button
            id="nav-tab-moments"
            onClick={() => setActiveTab('moments')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'moments'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-600" />
            きょうの記録
            {hasMomentsToday && (
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse absolute top-1.5 right-1.5" />
            )}
          </button>

          <button
            id="nav-tab-calendar"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-stone-600" />
            カレンダー
          </button>

          <button
            id="nav-tab-mypage"
            onClick={() => setActiveTab('mypage')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'mypage'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <User className="w-3.5 h-3.5 text-stone-600" />
            マイページ
          </button>
        </nav>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="btn-new-post-nav"
            onClick={onNewPostClick}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title="きょうの出来事・気持ちをつぶやく"
          >
            <PenLine className="w-4 h-4 text-amber-200" />
            <span>つぶやく</span>
          </button>

          {user ? (
            <button
              id="btn-profile-menu"
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-200/60 transition-colors border border-stone-200"
              title="プロフィール・設定"
            >
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                alt={user.displayName}
                className="w-8 h-8 rounded-lg object-cover bg-stone-100"
                referrerPolicy="no-referrer"
              />
            </button>
          ) : (
            <button
              id="btn-login-nav"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300/80 shadow-2xs transition-all"
            >
              <LogIn className="w-4 h-4 text-stone-500" />
              ログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
